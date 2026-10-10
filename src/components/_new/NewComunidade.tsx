'use client';

// Comunidade Imerso (libs/comunidade): grupo estilo WhatsApp sobre o Worker mettle-comunidade. Mesmos balões, campo,
// notas de voz, figurinhas e papel de parede do Mettle Chat (exportados de NewChat); aqui só o que é de grupo: nome e
// avatar de quem fala, menções, reações de várias pessoas, mensagens fixadas, dados do grupo e moderação.
import styled from '@emotion/styled';
import { useQueryClient } from '@tanstack/react-query';
import { COMUNIDADE_UNREAD_KEY } from 'hooks/useComunidade';
import {
    bigEmoji,
    type ChatMessage,
    type ChatQuote,
    chatRows,
    fileName,
    formatSize,
    nameHue,
    REACTIONS,
} from 'libs/chat';
import { type CMember, type CMessage, type CState, mentionParts, mentionQuery, mergeC, toChat } from 'libs/comunidade';
import { pushRecentEmoji } from 'libs/emoji';
import { isViewOnly } from 'libs/viewOnly';
import {
    Ban,
    ChevronDown,
    FileText,
    Mic,
    Pin,
    Plus,
    Reply,
    RotateCw,
    SendHorizontal,
    Smile,
    Trash2,
    X,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { CError, cfetch, cpost, cupload } from 'services/comunidadeService';
import { ChatPicker } from './ChatPicker';
import { Meta, MettleMark, QuoteBlock, Text, useNoNativeSelection, useRecorder, Voice, Wrap } from './NewChat';
import { NewPage } from './NewPage';

const ACCEPT = 'image/png,image/jpeg,image/gif,image/webp,application/pdf';
const MAX_FILE = 15 * 1024 * 1024;
const LONG_PRESS_MS = 450;
const SWIPE_REPLY_PX = 56;
const ERRORS: Record<string, string> = {
    muted: 'Você está silenciado.',
    rate: 'Muitas mensagens seguidas. Aguarde um pouco.',
    long: 'Mensagem longa demais.',
};

const initials = (name: string) =>
    name
        .replace(/\[[^\]]*\]/g, '')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join('');

/** Avatar de membro: iniciais na cor da pessoa (a mesma do nome). */
const GAvatar: React.FC<{ name: string; size?: number }> = ({ name, size = 28 }) => (
    <span
        className="gav"
        style={{ width: size, height: size, fontSize: size * 0.4, '--h': nameHue(name) } as React.CSSProperties}
        aria-hidden
    >
        {initials(name) || '·'}
    </span>
);

const quoteOf = (m: CMessage, me: string): ChatQuote => ({
    id: m.id,
    mine: m.uid === me,
    name: m.name,
    text: m.text.slice(0, 160),
    kind: m.kind,
});

const b64ToU8 = (s: string) =>
    Uint8Array.from(atob((s + '='.repeat((4 - (s.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')), (c) =>
        c.charCodeAt(0),
    );

const pushSupported = () =>
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window;

const NewComunidade: React.FC = () => {
    useNoNativeSelection();
    // área segura de baixo (como no Mettle Chat): viewport-fit=cover só enquanto a página está aberta
    useEffect(() => {
        const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
        if (!meta || meta.content.includes('viewport-fit')) return;
        const before = meta.content;
        meta.content = `${before}, viewport-fit=cover`;
        return () => {
            meta.content = before;
        };
    }, []);
    const router = useRouter();
    const params = useSearchParams();
    const queryClient = useQueryClient();
    const [st, setSt] = useState<CState | null>(null);
    const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
    const [msgs, setMsgs] = useState<CMessage[]>([]);
    const [more, setMore] = useState(false);
    const [pins, setPins] = useState<CMessage[]>([]);
    const [pinIdx, setPinIdx] = useState(0);
    const [count, setCount] = useState(0);
    const [members, setMembers] = useState<CMember[]>([]);
    const [reports, setReports] = useState<{ count: number; message: CMessage }[]>([]);
    const [olderLoading, setOlderLoading] = useState(false);
    const [text, setText] = useState('');
    const [caret, setCaret] = useState(0);
    const [file, setFile] = useState<File | null>(null);
    const [notice, setNotice] = useState('');
    const [replyTo, setReplyTo] = useState<CMessage | null>(null);
    const [menuFor, setMenuForRaw] = useState<number | null>(null);
    const [menuBelow, setMenuBelow] = useState(false);
    const [moreOpen, setMoreOpen] = useState(false);
    const [picker, setPicker] = useState<'emoji' | 'sticker' | null>(null);
    const [sheet, setSheet] = useState<'info' | null>(null);
    const [memberMenu, setMemberMenu] = useState<string | null>(null);
    const [pushOn, setPushOn] = useState<boolean | null>(null);
    const [unreadAt, setUnreadAt] = useState<{ id: number; n: number } | null>(null);
    const [flash, setFlash] = useState<number | null>(null);
    const list = useRef<HTMLDivElement>(null);
    const top = useRef<HTMLDivElement>(null);
    const input = useRef<HTMLTextAreaElement>(null);
    const fileInput = useRef<HTMLInputElement>(null);
    const stick = useRef(true);
    const keepFrom = useRef<number | null>(null);
    const tempId = useRef(-1);
    const live = useRef(false);
    const mentioned = useRef(new Map<string, string>());
    const me = st?.me;
    // impersonação: só para ver (sem escrever, reagir, responder, marcar como visto nem notificações)
    const readOnly = !!st?.readOnly || isViewOnly();

    const say = (s: string) => {
        setNotice(s);
        setTimeout(() => setNotice((n) => (n === s ? '' : n)), 4000);
    };

    const setMenuFor = (id: number | null) => {
        if (id != null && readOnly) return;
        if (id != null) {
            const el = list.current?.querySelector(`[data-id="${id}"]`);
            const t = list.current?.getBoundingClientRect().top ?? 0;
            setMenuBelow(!!el && el.getBoundingClientRect().top - t < 64);
        } else setMoreOpen(false);
        setMenuForRaw(id);
    };

    /** Estado do grupo e a página do fim; também renova o bilhete do tempo real. */
    const load = useCallback(
        async (first = false) => {
            try {
                const s = await cfetch<CState>('');
                setSt(s);
                setMsgs((cur) => mergeC(cur, s.messages));
                setPins(s.pins);
                setCount(s.members);
                if (first) {
                    setMore(s.more);
                    const at = s.messages.find((m) => m.id > s.lastRead && m.uid !== s.me.uid && !m.deleted);
                    if (at && s.unread > 0) setUnreadAt({ id: at.id, n: s.unread });
                    setState('ready');
                }
            } catch (e) {
                if (e instanceof CError && e.status === 404) router.replace('/');
                else if (first) setState('error');
            }
        },
        [router],
    );
    useEffect(() => {
        load(true);
        cfetch<{ members: CMember[] }>('/members')
            .then((r) => setMembers(r.members))
            .catch(() => {});
    }, [load]);

    // tempo real (WebSocket com bilhete curto); caiu: novo bilhete e reconexão, espaçando até 30 s
    const tries = useRef(0);
    useEffect(() => {
        if (!st?.ws) return;
        let stopped = false;
        let timer: ReturnType<typeof setTimeout> | undefined;
        const sock = new WebSocket(st.ws);
        const ping = setInterval(() => sock.readyState === 1 && sock.send('ping'), 30_000);
        sock.onopen = () => {
            live.current = true;
            tries.current = 0;
        };
        sock.onmessage = (e) => {
            if (e.data === 'pong') return;
            let ev: { t: string; message?: CMessage; pins?: CMessage[]; count?: number; ids?: number[] };
            try {
                ev = JSON.parse(e.data);
            } catch {
                return;
            }
            if ((ev.t === 'msg' || ev.t === 'upd') && ev.message) setMsgs((cur) => mergeC(cur, [ev.message!]));
            else if (ev.t === 'pins' && ev.pins) setPins(ev.pins);
            else if (ev.t === 'members' && ev.count != null) setCount(ev.count);
            else if (ev.t === 'purge' && ev.ids) setMsgs((cur) => cur.filter((m) => !ev.ids!.includes(m.id)));
        };
        sock.onclose = (e) => {
            live.current = false;
            clearInterval(ping);
            if (stopped) return;
            if (e.code === 4003) return router.replace('/');
            timer = setTimeout(() => load(), Math.min(30_000, 1000 * 2 ** tries.current++));
        };
        return () => {
            stopped = true;
            clearTimeout(timer);
            clearInterval(ping);
            sock.close();
        };
    }, [st?.ws, load, router]);
    useEffect(() => {
        const onVisible = () => document.visibilityState === 'visible' && !live.current && load();
        document.addEventListener('visibilitychange', onVisible);
        return () => document.removeEventListener('visibilitychange', onVisible);
    }, [load]);

    // lido: a última mensagem à vista, quando o aluno está no fim da conversa
    const seenSent = useRef(0);
    useEffect(() => {
        const last = [...msgs].reverse().find((m) => !m.pending);
        if (
            readOnly ||
            !last ||
            last.id <= seenSent.current ||
            !stick.current ||
            document.visibilityState !== 'visible'
        )
            return;
        const t = setTimeout(() => {
            seenSent.current = last.id;
            cpost('/seen', { id: last.id })
                .then(() => queryClient.setQueryData(COMUNIDADE_UNREAD_KEY, { unread: 0 }))
                .catch(() => {});
        }, 800);
        return () => clearTimeout(t);
    }, [msgs, queryClient, readOnly]);

    // rolagem: fica no fim enquanto o aluno está no fim; histórico mantém o ponto de leitura
    useLayoutEffect(() => {
        const el = list.current;
        if (!el) return;
        if (keepFrom.current != null) {
            el.scrollTop = el.scrollHeight - keepFrom.current;
            keepFrom.current = null;
        } else if (stick.current) el.scrollTop = el.scrollHeight;
    }, [msgs, state, picker, replyTo]);
    useEffect(() => {
        const el = list.current;
        const col = el?.firstElementChild;
        if (!el || !col || typeof ResizeObserver === 'undefined') return;
        const ro = new ResizeObserver(() => {
            if (stick.current && keepFrom.current == null) el.scrollTop = el.scrollHeight;
        });
        ro.observe(col);
        ro.observe(el);
        return () => ro.disconnect();
    }, [state]);

    const loadOlder = async (): Promise<boolean> => {
        const oldest = msgs.find((m) => !m.pending);
        if (!oldest || olderLoading) return false;
        setOlderLoading(true);
        try {
            const page = await cfetch<{ messages: CMessage[]; more: boolean }>(`?before=${oldest.id}`);
            keepFrom.current = list.current ? list.current.scrollHeight - list.current.scrollTop : null;
            setMsgs((cur) => mergeC(cur, page.messages));
            setMore(page.more);
            return page.messages.length > 0;
        } catch {
            return false;
        } finally {
            setOlderLoading(false);
        }
    };
    // histórico infinito: ao chegar perto do topo, a página anterior
    useEffect(() => {
        const el = top.current;
        if (!el || !more || state !== 'ready') return;
        const io = new IntersectionObserver(([e]) => e.isIntersecting && !olderLoading && loadOlder(), {
            root: list.current,
            rootMargin: '400px 0px 0px 0px',
        });
        io.observe(el);
        return () => io.disconnect();
    }, [more, state, olderLoading, msgs]); // eslint-disable-line react-hooks/exhaustive-deps

    const pendingJump = useRef<number | null>(null);
    const jumpTo = (id: number) => {
        const el = list.current?.querySelector<HTMLElement>(`[data-id="${id}"]`);
        if (el) {
            stick.current = false;
            el.scrollIntoView({ block: 'center', behavior: 'smooth' });
            setFlash(id);
            setTimeout(() => setFlash((f) => (f === id ? null : f)), 1400);
            return;
        }
        if (more) {
            pendingJump.current = id;
            loadOlder();
        }
    };
    useEffect(() => {
        const id = pendingJump.current;
        if (id == null) return;
        if (list.current?.querySelector(`[data-id="${id}"]`)) {
            pendingJump.current = null;
            requestAnimationFrame(() => jumpTo(id));
        } else if (more && !olderLoading) loadOlder();
        else if (!more) pendingJump.current = null;
    }, [msgs, more, olderLoading]); // eslint-disable-line react-hooks/exhaustive-deps
    // link de uma notificação de denúncia: /comunidade?m=<id>
    useEffect(() => {
        const m = Number(params?.get('m'));
        if (state === 'ready' && m > 0) jumpTo(m);
    }, [state, params]); // eslint-disable-line react-hooks/exhaustive-deps

    // ---------- enviar ----------
    type Job = { blob: Blob | null; sticker?: string; replyTo: number | null; mentions: string[] };
    const jobs = useRef(new Map<number, Job>());
    const deliver = async (m: CMessage, job: Job) => {
        try {
            const { message } = job.sticker
                ? await cpost<{ message: CMessage }>('/messages', { sticker: job.sticker, replyTo: job.replyTo })
                : job.blob
                  ? await cupload(job.blob, { text: m.text, replyTo: job.replyTo, mentions: job.mentions })
                  : await cpost<{ message: CMessage }>('/messages', {
                        text: m.text,
                        replyTo: job.replyTo,
                        mentions: job.mentions,
                    });
            setMsgs((cur) =>
                mergeC(
                    cur.filter((x) => x.id !== m.id),
                    [message],
                ),
            );
        } catch (e) {
            setMsgs((cur) => cur.map((x) => (x.id === m.id ? { ...x, pending: 'failed' } : x)));
            if (e instanceof CError && ERRORS[e.message]) say(ERRORS[e.message]);
        }
    };

    const send = (opts: { blob?: Blob | null; name?: string; sticker?: { id: string; url: string } } = {}) => {
        if (!me) return;
        const blob = opts.sticker ? null : opts.blob !== undefined ? opts.blob : file;
        const body = opts.sticker || (opts.blob && opts.blob !== file) ? '' : text.trim();
        if (!body && !blob && !opts.sticker) return;
        const local = blob ? URL.createObjectURL(blob) : (opts.sticker?.url ?? '');
        const kind: CMessage['kind'] = opts.sticker
            ? 'sticker'
            : blob?.type.startsWith('image/')
              ? 'image'
              : blob?.type.startsWith('audio/')
                ? 'audio'
                : blob
                  ? 'file'
                  : 'text';
        const mentions = [...mentioned.current].filter(([n]) => body.includes('@' + n)).map(([, uid]) => uid);
        const m: CMessage = {
            id: tempId.current--,
            at: Math.floor(Date.now() / 1000),
            uid: me.uid,
            name: me.name,
            text: body,
            kind,
            media: local
                ? {
                      url: local,
                      size: blob?.size ?? null,
                      ext: (opts.name ?? (blob as File | null)?.name ?? '').split('.').pop() ?? null,
                  }
                : null,
            reply: replyTo
                ? {
                      id: replyTo.id,
                      uid: replyTo.uid,
                      name: replyTo.name,
                      text: replyTo.text,
                      kind: replyTo.kind,
                      deleted: false,
                  }
                : null,
            mentions,
            reactions: {},
            deleted: null,
            pending: 'sending',
        };
        const job: Job = { blob, sticker: opts.sticker?.id, replyTo: replyTo?.id ?? null, mentions };
        jobs.current.set(m.id, job);
        stick.current = true;
        setMsgs((cur) => [...cur, m]);
        if (!opts.sticker && (!opts.blob || opts.blob === file)) {
            setText('');
            setFile(null);
            mentioned.current.clear();
        }
        setReplyTo(null);
        deliver(m, job);
        if (!opts.sticker) input.current?.focus();
    };
    const resend = (m: CMessage) => {
        const job = jobs.current.get(m.id);
        if (!job) return;
        setMsgs((cur) => cur.map((x) => (x.id === m.id ? { ...x, pending: 'sending' } : x)));
        deliver(m, job);
    };
    const recorder = useRecorder((blob, name) => send({ blob, name }));

    const pick = (f: File | undefined) => {
        if (!f) return;
        if (f.size > MAX_FILE) return say('Arquivo acima de 15 MB.');
        if (!ACCEPT.split(',').includes(f.type)) return say('Envie imagem ou PDF.');
        setFile(f);
        input.current?.focus();
    };

    // ---------- ações na mensagem ----------
    const mine = (m: CMessage) => !!me && m.uid === me.uid;
    const act = async <T,>(p: Promise<T>) => {
        try {
            return await p;
        } catch (e) {
            say(e instanceof CError && ERRORS[e.message] ? ERRORS[e.message] : 'Não deu certo. Tente de novo.');
            return null;
        }
    };
    const react = async (m: CMessage, emoji: string) => {
        if (!me) return;
        const current = Object.entries(m.reactions).find(([, u]) => u.includes(me.uid))?.[0];
        setMenuFor(null);
        const r = await act(
            cpost<{ message: CMessage }>('/react', { id: m.id, emoji: current === emoji ? null : emoji }),
        );
        if (r) setMsgs((cur) => mergeC(cur, [r.message]));
    };
    const startReply = (m: CMessage) => {
        setMenuFor(null);
        setReplyTo(m);
        input.current?.focus();
    };
    const remove = async (m: CMessage) => {
        setMenuFor(null);
        if (!window.confirm('Apagar para todos?')) return;
        const r = await act(cpost<{ message: CMessage }>('/delete', { id: m.id }));
        if (r) setMsgs((cur) => mergeC(cur, [r.message]));
    };
    const pin = async (m: CMessage, on: boolean) => {
        setMenuFor(null);
        const r = await act(cpost<{ pins: CMessage[] }>('/pin', { id: m.id, on }));
        if (r) {
            setPins(r.pins);
            setPinIdx(0);
        }
    };
    const report = async (m: CMessage) => {
        setMenuFor(null);
        if (!window.confirm('Denunciar esta mensagem à moderação?')) return;
        if (await act(cpost('/report', { id: m.id }))) say('Denúncia enviada.');
    };
    const copy = (m: CMessage) => {
        setMenuFor(null);
        navigator.clipboard?.writeText(m.text).catch(() => {});
    };
    const moderate = async (uid: string, body: { mute?: number; remove?: boolean }) => {
        setMemberMenu(null);
        const r = await act(cpost<{ members: CMember[] }>('/member', { uid, ...body }));
        if (r) setMembers(r.members);
    };
    // dados do grupo: membros (e denúncias, para a moderação) frescos a cada abertura
    useEffect(() => {
        if (sheet !== 'info') return;
        cfetch<{ members: CMember[] }>('/members')
            .then((r) => setMembers(r.members))
            .catch(() => {});
        if (me?.admin)
            cfetch<{ reports: { count: number; message: CMessage }[] }>('/reports')
                .then((r) => setReports(r.reports))
                .catch(() => {});
    }, [sheet, me?.admin]);

    // ---------- notificações (Web Push, aplicativo instalado) ----------
    useEffect(() => {
        if (!st || !pushSupported() || !st.vapid) return;
        navigator.serviceWorker
            .getRegistration('/comunidade')
            .then((r) => r?.pushManager.getSubscription())
            .then((s) => setPushOn(!!s && Notification.permission === 'granted' && !st.me.pushMute))
            .catch(() => setPushOn(false));
    }, [st?.vapid, st?.me.pushMute]); // eslint-disable-line react-hooks/exhaustive-deps
    const togglePush = async () => {
        if (!st?.vapid) return;
        if (pushOn) {
            if (await act(cpost('/push/mute', { on: true }))) setPushOn(false);
            return;
        }
        try {
            if ((await Notification.requestPermission()) !== 'granted')
                return say('Notificações bloqueadas no aparelho.');
            const reg = await navigator.serviceWorker.register('/comunidade-sw.js', { scope: '/comunidade' });
            const sw = reg.installing || reg.waiting;
            if (sw && !reg.active)
                await new Promise<void>((res) =>
                    sw.addEventListener('statechange', () => sw.state === 'activated' && res()),
                );
            const sub =
                (await reg.pushManager.getSubscription()) ||
                (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToU8(st.vapid) }));
            await cpost('/push', sub.toJSON());
            await cpost('/push/mute', { on: false });
            setPushOn(true);
        } catch {
            say('Não deu para ligar as notificações.');
        }
    };

    // ---------- campo ----------
    const insertEmoji = (e: string) => {
        pushRecentEmoji(e);
        const el = input.current;
        const start = el?.selectionStart ?? text.length;
        const end = el?.selectionEnd ?? text.length;
        setText(text.slice(0, start) + e + text.slice(end));
        requestAnimationFrame(() => {
            if (!el) return;
            el.focus();
            el.setSelectionRange(start + e.length, start + e.length);
        });
    };
    useLayoutEffect(() => {
        const el = input.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
    }, [text]);

    const mq = mentionQuery(text, caret);
    const suggestions = useMemo(() => {
        if (!mq || !me) return [];
        const q = mq.q.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
        return members
            .filter((m) => m.uid !== me.uid && !m.removed)
            .filter((m) => m.name.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().includes(q))
            .slice(0, 6);
    }, [mq?.q, mq != null, members, me]); // eslint-disable-line react-hooks/exhaustive-deps
    const mention = (m: CMember) => {
        if (!mq) return;
        const insert = `@${m.name} `;
        const next = text.slice(0, mq.start) + insert + text.slice(caret);
        mentioned.current.set(m.name, m.uid);
        setText(next);
        const pos = mq.start + insert.length;
        setCaret(pos);
        requestAnimationFrame(() => {
            input.current?.focus();
            input.current?.setSelectionRange(pos, pos);
        });
    };

    // fecha menus ao tocar fora; Esc fecha menu, painel e folha
    useEffect(() => {
        const close = (e: Event) => {
            if (!(e.target as HTMLElement).closest?.('.rxbar, .acts, .pill')) setMenuFor(null);
        };
        const esc = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;
            setMenuFor(null);
            setPicker(null);
            setSheet(null);
        };
        document.addEventListener('pointerdown', close);
        document.addEventListener('keydown', esc);
        return () => {
            document.removeEventListener('pointerdown', close);
            document.removeEventListener('keydown', esc);
        };
    }, []);

    // celular: arrastar para a direita responde; segurar abre reações e ações
    const touch = useRef<{
        x: number;
        y: number;
        dx: number;
        el: HTMLElement;
        timer: ReturnType<typeof setTimeout>;
    } | null>(null);
    const touchHandlers = (m: CMessage) =>
        m.pending || m.deleted || readOnly
            ? {}
            : {
                  onTouchStart: (e: React.TouchEvent<HTMLElement>) => {
                      const t = e.touches[0];
                      touch.current = {
                          x: t.clientX,
                          y: t.clientY,
                          dx: 0,
                          el: e.currentTarget,
                          timer: setTimeout(() => {
                              navigator.vibrate?.(8);
                              setMenuFor(m.id);
                              touch.current = null;
                          }, LONG_PRESS_MS),
                      };
                  },
                  onTouchMove: (e: React.TouchEvent<HTMLElement>) => {
                      const s = touch.current;
                      if (!s) return;
                      const dx = e.touches[0].clientX - s.x,
                          dy = e.touches[0].clientY - s.y;
                      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) clearTimeout(s.timer);
                      if (Math.abs(dy) > 24 && Math.abs(dy) > Math.abs(dx)) {
                          s.el.style.transform = '';
                          touch.current = null;
                          return;
                      }
                      s.dx = Math.max(0, Math.min(80, dx));
                      s.el.style.transform = s.dx ? `translateX(${s.dx}px)` : '';
                  },
                  onTouchEnd: () => {
                      const s = touch.current;
                      if (!s) return;
                      clearTimeout(s.timer);
                      s.el.style.transform = '';
                      if (s.dx >= SWIPE_REPLY_PX) startReply(m);
                      touch.current = null;
                  },
              };

    // ---------- desenho ----------
    const byId = useMemo(() => new Map(msgs.map((m) => [m.id, m])), [msgs]);
    const chat = useMemo(() => msgs.map((m) => toChat(m, me?.uid ?? '')), [msgs, me?.uid]);
    const rows = useMemo(() => chatRows(chat), [chat]);
    const nameOf = useMemo(() => new Map(members.map((m) => [m.uid, m.name])), [members]);
    const canSend = !!text.trim() || !!file;

    const body = (c: CMessage, m: ChatMessage, first: boolean, last: boolean) => {
        if (c.deleted)
            return (
                <div className={`bub del${last ? ' tail' : ''}`}>
                    <Ban size={14} strokeWidth={1.8} aria-hidden />
                    <i>
                        {mine(c)
                            ? 'Você apagou esta mensagem'
                            : c.deleted === 'admin'
                              ? 'Mensagem apagada pela moderação'
                              : 'Mensagem apagada'}
                    </i>
                    <Meta m={{ ...m, mine: false }} seen={false} />
                </div>
            );
        const f = m.files[0];
        const img = f?.kind === 'image' ? f : null;
        const audio = f?.kind === 'audio' ? f : null;
        const doc = f?.kind === 'file' ? f : null;
        const big = !m.files.length && bigEmoji(m.text);
        const quote = m.reply ? <QuoteBlock q={m.reply} me="Você" onClick={() => jumpTo(m.reply!.id)} /> : null;
        const name = first && !m.mine && (
            <span className="nm" style={{ '--h': nameHue(c.name) } as React.CSSProperties}>
                {c.name}
            </span>
        );
        if (m.sticker || big)
            return (
                <div className={`bare${big ? ' bigemo' : ''}`} {...touchHandlers(c)}>
                    {name}
                    {quote}
                    {m.sticker && img ? (
                        <img className="stkimg" src={img.url} alt="Figurinha" loading="lazy" />
                    ) : (
                        <span className="emo">{m.text}</span>
                    )}
                    <Meta m={m} seen={false} className="chip" />
                </div>
            );
        const onlyImage = !!img && !m.text;
        const names = c.mentions.map((u) => nameOf.get(u) ?? '');
        return (
            <div
                className={`bub${last ? ' tail' : ''}${onlyImage ? ' media' : ''}${audio ? ' vn' : ''}${m.reply ? ' hasq' : ''}`}
                {...touchHandlers(c)}
            >
                {name}
                {quote}
                {img && (
                    <a className="img" href={img.url} target="_blank" rel="noopener noreferrer">
                        <img src={img.url} alt="Foto" loading="lazy" />
                        {onlyImage && <Meta m={m} seen={false} className="over" />}
                    </a>
                )}
                {audio && (
                    <Voice
                        m={m}
                        url={audio.url}
                        who={{ name: c.name, avatar: null }}
                        seen={false}
                        load={() => fetch(audio.url).then((r) => r.arrayBuffer())}
                        waveKey={`comunidadeWave:${c.id}`}
                    />
                )}
                {doc && (
                    <a className="doc" href={doc.url} target="_blank" rel="noopener noreferrer">
                        <span className="dic">
                            <FileText size={22} strokeWidth={1.5} />
                            <b>{(doc.ext || '').toUpperCase().slice(0, 4)}</b>
                        </span>
                        <span className="dnm">
                            <span>{fileName(doc.url, doc.ext)}</span>
                            <small>
                                {[(doc.ext || '').toUpperCase(), formatSize(doc.size)].filter(Boolean).join(' · ')}
                            </small>
                        </span>
                    </a>
                )}
                {m.text && (
                    <p className="txt">
                        {mentionParts(m.text, names).map((p, i) =>
                            p.mention ? (
                                <span key={i} className={`mention${p.text === '@' + me?.name ? ' me' : ''}`}>
                                    {p.text}
                                </span>
                            ) : (
                                <Text key={i} text={p.text} />
                            ),
                        )}
                        <span className={`sp${m.mine ? ' me' : ''}`}>{'⁠'}</span>
                    </p>
                )}
                {!onlyImage &&
                    !audio &&
                    (m.text ? <Meta m={m} seen={false} /> : <Meta m={m} seen={false} className="blk" />)}
            </div>
        );
    };

    const reactionPill = (c: CMessage) => {
        const entries = Object.entries(c.reactions).sort((a, b) => b[1].length - a[1].length);
        const total = entries.reduce((n, [, u]) => n + u.length, 0);
        if (!total) return null;
        const who = entries
            .map(([e, u]) => `${e} ${u.map((x) => (x === me?.uid ? 'Você' : (nameOf.get(x) ?? ''))).join(', ')}`)
            .join(' · ');
        return (
            <button type="button" className="pill" title={who} aria-label={who} onClick={() => setMenuFor(c.id)}>
                {entries.slice(0, 3).map(([e]) => e)}
                {total > 1 && <span className="pn">{total}</span>}
            </button>
        );
    };

    const pinned = pins[pinIdx % Math.max(1, pins.length)];
    const muted = !!me?.muted;

    return (
        <NewPage className="lesson fill">
            <Root>
                <header className="hd">
                    <button type="button" className="hdb" onClick={() => setSheet('info')} aria-label="Dados do grupo">
                        <MettleMark />
                        <span className="ht">
                            <h1>Comunidade Imerso</h1>
                            {me?.admin && count > 0 && (
                                <small>
                                    {count} {count === 1 ? 'membro' : 'membros'}
                                </small>
                            )}
                        </span>
                    </button>
                </header>

                {pinned && (
                    <button
                        type="button"
                        className="pinbar"
                        onClick={() => {
                            jumpTo(pinned.id);
                            setPinIdx((i) => (i + 1) % pins.length);
                        }}
                    >
                        {pins.length > 1 && (
                            <span className="pdots" aria-hidden>
                                {pins.map((p, i) => (
                                    <i key={p.id} className={i === pinIdx % pins.length ? 'on' : ''} />
                                ))}
                            </span>
                        )}
                        <Pin size={15} strokeWidth={1.7} aria-hidden />
                        <span className="ptx">
                            <b>{pinned.name}: </b>
                            {pinned.text ||
                                {
                                    image: '📷 Foto',
                                    audio: '🎤 Áudio',
                                    file: '📄 Documento',
                                    sticker: 'Figurinha',
                                    text: '',
                                }[pinned.kind]}
                        </span>
                    </button>
                )}

                <div
                    className="list"
                    ref={list}
                    onScroll={(e) => {
                        const el = e.currentTarget;
                        stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
                    }}
                >
                    <div className="col" role="log" aria-live="polite" aria-label="Comunidade Imerso">
                        <div ref={top} className="top">
                            {olderLoading && <span className="spin" />}
                        </div>
                        {state === 'error' && (
                            <div className="state">
                                <button
                                    type="button"
                                    className="retry"
                                    onClick={() => load(true)}
                                    aria-label="Tentar de novo"
                                >
                                    <RotateCw size={20} strokeWidth={1.6} />
                                </button>
                            </div>
                        )}
                        {rows.map((r) => {
                            if (r.type === 'day')
                                return (
                                    <div key={r.key} className="day">
                                        <span>{r.label}</span>
                                    </div>
                                );
                            const c = byId.get(r.m.id);
                            if (!c) return null;
                            const myRx = me
                                ? Object.entries(c.reactions).find(([, u]) => u.includes(me.uid))?.[0]
                                : undefined;
                            const hasRx = Object.keys(c.reactions).length > 0;
                            const isPinned = pins.some((p) => p.id === c.id);
                            return (
                                <React.Fragment key={r.key}>
                                    {unreadAt?.id === c.id && (
                                        <div className="unread">
                                            <span>
                                                {unreadAt.n}{' '}
                                                {unreadAt.n === 1 ? 'mensagem não lida' : 'mensagens não lidas'}
                                            </span>
                                        </div>
                                    )}
                                    <div
                                        data-id={c.id}
                                        className={`msg${r.m.mine ? ' me' : ''}${r.first ? ' first' : ''}${r.last ? ' last' : ''}${hasRx ? ' rx' : ''}${flash === c.id ? ' flash' : ''}`}
                                    >
                                        <div className="line">
                                            {!r.m.mine &&
                                                (r.first ? (
                                                    <GAvatar name={c.name} />
                                                ) : (
                                                    <span className="gsp" aria-hidden />
                                                ))}
                                            {body(c, r.m, r.first, r.last)}
                                            {!c.pending && !c.deleted && !readOnly && (
                                                <span className="acts">
                                                    <button
                                                        type="button"
                                                        aria-label="Reagir"
                                                        onClick={() => setMenuFor(menuFor === c.id ? null : c.id)}
                                                    >
                                                        <Smile size={17} strokeWidth={1.7} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        aria-label="Responder"
                                                        onClick={() => startReply(c)}
                                                    >
                                                        <Reply size={17} strokeWidth={1.7} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        aria-label="Mais"
                                                        onClick={() => {
                                                            setMenuFor(c.id);
                                                            setMoreOpen(true);
                                                        }}
                                                    >
                                                        <ChevronDown size={17} strokeWidth={1.7} />
                                                    </button>
                                                </span>
                                            )}
                                            {menuFor === c.id && (
                                                <div className={`rxbar${menuBelow ? ' below' : ''}`} role="menu">
                                                    <div className="rxrow">
                                                        {REACTIONS.map((e) => (
                                                            <button
                                                                key={e}
                                                                type="button"
                                                                role="menuitem"
                                                                aria-pressed={myRx === e}
                                                                onClick={() => react(c, e)}
                                                            >
                                                                {e}
                                                            </button>
                                                        ))}
                                                        <button
                                                            type="button"
                                                            className="rr"
                                                            role="menuitem"
                                                            aria-label="Mais"
                                                            aria-expanded={moreOpen}
                                                            onClick={() => setMoreOpen(!moreOpen)}
                                                        >
                                                            <ChevronDown size={18} strokeWidth={1.8} />
                                                        </button>
                                                    </div>
                                                    {moreOpen && (
                                                        <div className="mact">
                                                            <button
                                                                type="button"
                                                                role="menuitem"
                                                                onClick={() => startReply(c)}
                                                            >
                                                                Responder
                                                            </button>
                                                            {c.text && (
                                                                <button
                                                                    type="button"
                                                                    role="menuitem"
                                                                    onClick={() => copy(c)}
                                                                >
                                                                    Copiar
                                                                </button>
                                                            )}
                                                            {me?.admin && (
                                                                <button
                                                                    type="button"
                                                                    role="menuitem"
                                                                    onClick={() => pin(c, !isPinned)}
                                                                >
                                                                    {isPinned ? 'Desafixar' : 'Fixar'}
                                                                </button>
                                                            )}
                                                            {!mine(c) && (
                                                                <button
                                                                    type="button"
                                                                    role="menuitem"
                                                                    onClick={() => report(c)}
                                                                >
                                                                    Denunciar
                                                                </button>
                                                            )}
                                                            {(mine(c) || me?.admin) && (
                                                                <button
                                                                    type="button"
                                                                    role="menuitem"
                                                                    className="danger"
                                                                    onClick={() => remove(c)}
                                                                >
                                                                    Apagar
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {!c.deleted && reactionPill(c)}
                                        {c.pending === 'failed' && (
                                            <button
                                                type="button"
                                                className="fail"
                                                onClick={() => resend(c)}
                                                aria-label="Tentar de novo"
                                            >
                                                <RotateCw size={14} strokeWidth={1.8} />
                                            </button>
                                        )}
                                    </div>
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>

                {picker && (
                    <ChatPicker
                        tab={picker}
                        onTab={setPicker}
                        onEmoji={insertEmoji}
                        loadStickers={() => cfetch('/stickers')}
                        onSticker={(id, url) => {
                            setPicker(null);
                            send({ sticker: { id, url } });
                        }}
                    />
                )}

                {readOnly ? (
                    <p className="ro" role="note">
                        Só leitura (modo visualização)
                    </p>
                ) : (
                    <form
                        className="composer"
                        onSubmit={(e) => {
                            e.preventDefault();
                            send();
                        }}
                    >
                        {suggestions.length > 0 && (
                            <div className="mlist" role="listbox" aria-label="Mencionar">
                                {suggestions.map((m) => (
                                    <button
                                        key={m.uid}
                                        type="button"
                                        role="option"
                                        aria-selected={false}
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => mention(m)}
                                    >
                                        <GAvatar name={m.name} size={26} />
                                        <span>{m.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                        {replyTo && me && (
                            <div className="replying">
                                <QuoteBlock q={quoteOf(replyTo, me.uid)} me="Você" />
                                <button
                                    type="button"
                                    className="ib"
                                    aria-label="Cancelar resposta"
                                    onClick={() => setReplyTo(null)}
                                >
                                    <X size={18} strokeWidth={1.7} />
                                </button>
                            </div>
                        )}
                        {(file || notice) && (
                            <div className="chip">
                                {file ? (
                                    <>
                                        <FileText size={16} strokeWidth={1.6} aria-hidden />
                                        <span className="nm">{file.name}</span>
                                        <span className="sz">{formatSize(file.size)}</span>
                                    </>
                                ) : (
                                    <span className="nm" role="status">
                                        {notice}
                                    </span>
                                )}
                                <button
                                    type="button"
                                    className="ib"
                                    aria-label="Fechar"
                                    onClick={() => {
                                        setFile(null);
                                        setNotice('');
                                    }}
                                >
                                    <X size={16} strokeWidth={1.6} />
                                </button>
                            </div>
                        )}
                        {muted ? (
                            <div className="mutedbar">Você está silenciado.</div>
                        ) : (
                            <div className="cbar">
                                {recorder.recording ? (
                                    <>
                                        <button
                                            type="button"
                                            className="ib plus"
                                            aria-label="Descartar áudio"
                                            onClick={() => recorder.stop(true)}
                                        >
                                            <Trash2 size={21} strokeWidth={1.6} />
                                        </button>
                                        <div className="rec" role="status">
                                            <span className="pulse" />
                                            {`${Math.floor(recorder.secs / 60)}:${String(recorder.secs % 60).padStart(2, '0')}`}
                                        </div>
                                        <button
                                            type="button"
                                            className="go"
                                            aria-label="Enviar áudio"
                                            onClick={() => recorder.stop()}
                                        >
                                            <SendHorizontal size={20} strokeWidth={2} />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            className="ib plus"
                                            aria-label="Anexar"
                                            onClick={() => fileInput.current?.click()}
                                        >
                                            <Plus size={24} strokeWidth={1.6} />
                                        </button>
                                        <input
                                            ref={fileInput}
                                            type="file"
                                            accept={ACCEPT}
                                            hidden
                                            onChange={(e) => {
                                                pick(e.target.files?.[0]);
                                                e.target.value = '';
                                            }}
                                        />
                                        <div className="pillin">
                                            <textarea
                                                ref={input}
                                                rows={1}
                                                value={text}
                                                aria-label="Mensagem"
                                                maxLength={4000}
                                                onFocus={() =>
                                                    matchMedia('(pointer: coarse)').matches && setPicker(null)
                                                }
                                                onChange={(e) => {
                                                    setText(e.target.value);
                                                    setCaret(e.target.selectionStart ?? e.target.value.length);
                                                }}
                                                onSelect={(e) => setCaret(e.currentTarget.selectionStart ?? 0)}
                                                onPaste={(e) => {
                                                    const f = [...e.clipboardData.files][0];
                                                    if (f) {
                                                        e.preventDefault();
                                                        pick(f);
                                                    }
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey && suggestions.length) {
                                                        e.preventDefault();
                                                        mention(suggestions[0]);
                                                        return;
                                                    }
                                                    if (
                                                        e.key === 'Enter' &&
                                                        !e.shiftKey &&
                                                        !e.nativeEvent.isComposing &&
                                                        matchMedia('(pointer: fine)').matches
                                                    ) {
                                                        e.preventDefault();
                                                        send();
                                                    }
                                                }}
                                            />
                                            <button
                                                type="button"
                                                className="ib"
                                                aria-label="Emojis"
                                                aria-pressed={!!picker}
                                                onClick={() => setPicker(picker ? null : 'emoji')}
                                            >
                                                <Smile size={21} strokeWidth={1.6} />
                                            </button>
                                        </div>
                                        {canSend || !recorder.supported ? (
                                            <button
                                                type="submit"
                                                className="go"
                                                aria-label="Enviar"
                                                disabled={!canSend}
                                            >
                                                <SendHorizontal size={20} strokeWidth={2} />
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                className="go"
                                                aria-label="Gravar áudio"
                                                onClick={recorder.start}
                                            >
                                                <Mic size={21} strokeWidth={2} />
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </form>
                )}

                {sheet === 'info' && st && (
                    <aside className="sheet" aria-label="Dados do grupo">
                        <div className="shd">
                            <button type="button" className="ib" aria-label="Fechar" onClick={() => setSheet(null)}>
                                <X size={20} strokeWidth={1.6} />
                            </button>
                            <h2>Dados do grupo</h2>
                        </div>
                        <div className="sbody">
                            <div className="gid">
                                <MettleMark size={84} />
                                <h3>Comunidade Imerso</h3>
                                <p>Grupo{me?.admin && ` · ${count} ${count === 1 ? 'membro' : 'membros'}`}</p>
                            </div>
                            <div className="sgroup">
                                {pushSupported() && st.vapid && pushOn != null && !readOnly && (
                                    <button
                                        type="button"
                                        className="row"
                                        role="switch"
                                        aria-checked={pushOn}
                                        onClick={togglePush}
                                    >
                                        <span>Notificações</span>
                                        <i className={`sw${pushOn ? ' on' : ''}`} aria-hidden />
                                    </button>
                                )}
                            </div>
                            {me?.admin && reports.length > 0 && (
                                <div className="sgroup">
                                    <h4>Denúncias</h4>
                                    {reports.map((r) => (
                                        <button
                                            key={r.message.id}
                                            type="button"
                                            className="row rep"
                                            onClick={() => {
                                                setSheet(null);
                                                jumpTo(r.message.id);
                                            }}
                                        >
                                            <span>
                                                <b>{r.message.name}</b>
                                                <small>
                                                    {r.message.deleted
                                                        ? 'Mensagem apagada'
                                                        : r.message.text || r.message.kind}
                                                </small>
                                            </span>
                                            <em>{r.count}</em>
                                        </button>
                                    ))}
                                </div>
                            )}
                            <div className="sgroup">
                                <h4>{me?.admin ? `${count} ${count === 1 ? 'membro' : 'membros'}` : 'Membros'}</h4>
                                {members.map((m) => (
                                    <div key={m.uid} className={`mem${m.removed ? ' out' : ''}`}>
                                        <GAvatar name={m.name} size={40} />
                                        <span className="mn">
                                            {m.uid === me?.uid ? 'Você' : m.name}
                                            {m.muted && <small>silenciado</small>}
                                            {m.removed && <small>removido</small>}
                                        </span>
                                        {m.admin && <span className="tag">Admin</span>}
                                        {me?.admin && !m.admin && (
                                            <button
                                                type="button"
                                                className="ib"
                                                aria-label={`Moderar ${m.name}`}
                                                aria-expanded={memberMenu === m.uid}
                                                onClick={() => setMemberMenu(memberMenu === m.uid ? null : m.uid)}
                                            >
                                                <ChevronDown size={18} strokeWidth={1.6} />
                                            </button>
                                        )}
                                        {memberMenu === m.uid && (
                                            <div className="mmod">
                                                {m.muted ? (
                                                    <button type="button" onClick={() => moderate(m.uid, { mute: 0 })}>
                                                        Tirar silêncio
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => moderate(m.uid, { mute: 60 })}
                                                        >
                                                            Silenciar 1 h
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => moderate(m.uid, { mute: 60 * 24 })}
                                                        >
                                                            Silenciar 24 h
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    type="button"
                                                    className="danger"
                                                    onClick={() =>
                                                        (m.removed || window.confirm(`Remover ${m.name} do grupo?`)) &&
                                                        moderate(m.uid, { remove: !m.removed })
                                                    }
                                                >
                                                    {m.removed ? 'Readmitir' : 'Remover'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </aside>
                )}
            </Root>
        </NewPage>
    );
};

export default NewComunidade;

/* O que é só de grupo, sobre o mesmo Wrap (cores, fontes, balões e campo) do Mettle Chat. */
const Root = styled(Wrap)`
    position: relative;

    .hdb {
        display: flex;
        align-items: center;
        gap: 14px;
        min-width: 0;
        padding: 0;
        border: 0;
        background: none;
        color: inherit;
        font: inherit;
        text-align: left;
        cursor: pointer;
    }
    .ht {
        display: flex;
        flex-direction: column;
        min-width: 0;
    }
    .ht small {
        font-size: 13px;
        color: var(--r-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    /* fixadas: a faixa sob o cabeçalho, como no WhatsApp */
    .pinbar {
        flex: none;
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        min-height: 44px;
        padding: 6px 16px;
        border: 0;
        border-bottom: 1px solid var(--r-line);
        background: var(--c-head);
        color: var(--r-text);
        font: inherit;
        font-size: 13.5px;
        text-align: left;
        cursor: pointer;
    }
    .pinbar svg {
        flex: none;
        color: var(--r-muted);
    }
    .ptx {
        min-width: 0;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }
    .ptx b {
        font-weight: 600;
    }
    .pdots {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }
    .pdots i {
        display: block;
        width: 3px;
        height: 8px;
        border-radius: 2px;
        background: var(--r-line);
    }
    .pdots i.on {
        background: var(--r-muted);
    }

    .top {
        display: grid;
        place-items: center;
        min-height: 1px;
    }
    .spin {
        width: 18px;
        height: 18px;
        margin: 8px;
        border: 2px solid var(--r-line);
        border-top-color: var(--r-muted);
        border-radius: 50%;
        animation: c-spin 0.8s linear infinite;
    }
    @keyframes c-spin {
        to {
            transform: rotate(360deg);
        }
    }

    /* avatar de quem fala, ao lado do primeiro balão do grupo (os demais alinham pelo espaço) */
    .line {
        align-items: flex-start;
    }
    .msg:not(.me) .line {
        max-width: calc(65% + 34px);
    }
    .gav {
        flex: none;
        display: inline-grid;
        place-items: center;
        border-radius: 50%;
        background: hsl(var(--h) 40% var(--c-name-l) / 0.22);
        color: hsl(var(--h) 52% var(--c-name-l));
        font-weight: 600;
        line-height: 1;
    }
    .line > .gav,
    .gsp {
        width: 28px;
        height: 28px;
        margin-right: 0;
    }
    .gsp {
        flex: none;
    }
    .acts {
        align-self: center;
    }
    .mention {
        color: var(--c-read);
    }
    .mention.me {
        font-weight: 600;
    }
    .bub.del {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--c-meta);
    }
    .bub.del svg {
        flex: none;
    }
    .bub.del i {
        font-style: italic;
    }
    .bub.del .tm {
        position: static;
        margin-left: 6px;
    }

    /* reações de várias pessoas: até 3 emojis e o total */
    .pill {
        display: inline-flex;
        align-items: center;
        gap: 1px;
    }
    .msg:not(.me) .pill {
        left: 42px;
    }
    .pill .pn {
        margin-left: 3px;
        font-size: 12px;
        color: var(--r-muted);
    }

    /* menu da mensagem: reações + ações */
    .rxbar {
        flex-direction: column;
        align-items: stretch;
        border-radius: 22px;
    }
    .msg:not(.me) .rxbar {
        left: 34px;
    }
    .rxrow {
        display: flex;
        align-items: center;
        gap: 2px;
    }
    .mact {
        display: flex;
        flex-direction: column;
        margin-top: 4px;
        padding-top: 4px;
        border-top: 1px solid var(--r-line);
    }
    .mact button,
    .mmod button {
        padding: 9px 12px;
        border: 0;
        border-radius: 8px;
        background: none;
        color: var(--r-text);
        font: inherit;
        font-size: 14.5px;
        text-align: left;
        cursor: pointer;
    }
    .mact button:hover,
    .mmod button:hover {
        background: var(--r-hover);
    }
    .danger {
        color: var(--r-danger) !important;
    }

    /* menções: sugestões acima do campo */
    .ro {
        flex: none;
        margin: 0;
        padding: 12px 16px calc(var(--sab) + 14px);
        text-align: center;
        font-size: 13px;
        color: var(--r-faint);
    }
    .composer {
        position: relative;
    }
    .mlist {
        position: absolute;
        left: 52px;
        right: 52px;
        bottom: 100%;
        z-index: 4;
        display: flex;
        flex-direction: column;
        max-height: 260px;
        overflow-y: auto;
        padding: 6px;
        border-radius: 12px;
        background: var(--c-in);
        box-shadow: 0 4px 18px rgba(0, 0, 0, 0.28);
    }
    .mlist button {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 6px 8px;
        border: 0;
        border-radius: 8px;
        background: none;
        color: var(--r-text);
        font: inherit;
        font-size: 14.5px;
        text-align: left;
        cursor: pointer;
    }
    .mlist button:hover,
    .mlist button:first-of-type {
        background: var(--r-hover);
    }
    .mutedbar {
        padding: 10px 14px;
        border-radius: 10px;
        background: var(--c-chip);
        color: var(--r-muted);
        font-size: 13.5px;
        text-align: center;
    }

    /* dados do grupo: painel à direita (como o do WhatsApp Web); no celular, tela inteira */
    .sheet {
        position: absolute;
        inset: 0 0 0 auto;
        z-index: 20;
        display: flex;
        flex-direction: column;
        width: min(400px, 100%);
        background: var(--c-head);
        border-left: 1px solid var(--r-line);
        box-shadow: -8px 0 24px rgba(0, 0, 0, 0.18);
        color: var(--r-text);
    }
    .shd {
        flex: none;
        display: flex;
        align-items: center;
        gap: 8px;
        height: 55px;
        padding: 0 8px;
        border-bottom: 1px solid var(--r-line);
    }
    .shd h2 {
        margin: 0;
        font-size: 16px;
        font-weight: 500;
    }
    .sbody {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        padding-bottom: calc(var(--sab) + 16px);
    }
    .gid {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        padding: 24px 16px 20px;
    }
    .gid h3 {
        margin: 10px 0 0;
        font-size: 20px;
        font-weight: 500;
    }
    .gid p {
        margin: 0;
        color: var(--r-muted);
        font-size: 14px;
    }
    .sgroup {
        border-top: 8px solid var(--c-wall);
        padding: 6px 0;
    }
    .sgroup h4 {
        margin: 10px 20px 6px;
        font-size: 14px;
        font-weight: 400;
        color: var(--r-muted);
    }
    .row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        width: 100%;
        min-height: 48px;
        padding: 8px 20px;
        border: 0;
        background: none;
        color: inherit;
        font: inherit;
        font-size: 15px;
        text-align: left;
        cursor: pointer;
    }
    .row:hover {
        background: var(--r-hover);
    }
    .row.rep span {
        display: flex;
        flex-direction: column;
        min-width: 0;
    }
    .row.rep small {
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        color: var(--r-muted);
    }
    .row.rep em {
        font-style: normal;
        color: var(--r-danger);
    }
    .sw {
        position: relative;
        flex: none;
        width: 34px;
        height: 20px;
        border-radius: 10px;
        background: var(--r-line);
        transition: background 150ms ease;
    }
    .sw::after {
        content: '';
        position: absolute;
        top: 2px;
        left: 2px;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #fff;
        transition: transform 150ms ease;
    }
    .sw.on {
        background: var(--c-accent);
    }
    .sw.on::after {
        transform: translateX(14px);
    }
    .mem {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 12px;
        padding: 8px 12px 8px 20px;
    }
    .mem.out {
        opacity: 0.5;
    }
    .mn {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-width: 0;
        font-size: 15px;
    }
    .mn small {
        color: var(--r-muted);
        font-size: 12.5px;
    }
    .tag {
        padding: 2px 8px;
        border-radius: 6px;
        background: color-mix(in srgb, var(--c-accent) 18%, transparent);
        color: var(--c-accent);
        font-size: 12px;
    }
    .mmod {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        width: 100%;
        padding-left: 52px;
    }

    @media (max-width: 600px) {
        /* nota de voz: as 41 barras (168 px) cabem no balão do iPhone; abaixo de 390 px a onda é recortada */
        .voice {
            width: min(276px, 68vw);
        }
        .bars {
            overflow: hidden;
        }
        .sheet {
            width: 100%;
            border-left: 0;
        }
        .msg:not(.me) .line {
            max-width: calc(80% + 34px);
        }
        .mlist {
            left: 8px;
            right: 8px;
        }
    }
`;
