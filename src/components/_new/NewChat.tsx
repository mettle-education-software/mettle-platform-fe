'use client';

import styled from '@emotion/styled';
import { useQueryClient } from '@tanstack/react-query';
import { auth } from 'config/firebase';
import { CHAT_UNREAD_KEY } from 'hooks/useChatUnread';
import {
    bigEmoji,
    type ChatMessage,
    type ChatPage,
    type ChatQuote,
    chatRows,
    contextPrefill,
    durationLabel,
    fileName,
    formatSize,
    linkParts,
    mergeMessages,
    nameHue,
    quoteText,
    REACTIONS,
    timeLabel,
    unreadStart,
    peaks,
    SILENCE,
    waveform,
} from 'libs/chat';
import { pushRecentEmoji } from 'libs/emoji';
import {
    CheckCheck,
    Clock,
    FileText,
    Mic,
    Pause,
    Play,
    Plus,
    Reply,
    RotateCw,
    SendHorizontal,
    Smile,
    Trash2,
    X,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { chatAudio, chatFetch, reactChat, sendChat, sendSticker } from 'services/chatService';
import { LIGHT_ROOT } from 'themes/newDesign';
import { ChatPicker } from './ChatPicker';
import { NewPage } from './NewPage';

const ACCEPT = 'image/png,image/jpeg,image/gif,image/webp,image/heic,application/pdf';
const MAX_FILE = 15 * 1024 * 1024;
const LONG_PRESS_MS = 450;
const SWIPE_REPLY_PX = 56;

const initials = (name: string) =>
    name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join('');

/** Símbolo da Mettle (mira) num círculo: o "avatar" do Suporte. */
const MettleMark: React.FC<{ size?: number }> = ({ size = 40 }) => (
    <svg className="mark" width={size} height={size} viewBox="0 0 40 40" aria-hidden>
        <circle cx="20" cy="20" r="20" fill="#1d1a17" />
        <g stroke="#c99a68" strokeWidth="1.7" fill="none" strokeLinecap="round">
            <circle cx="20" cy="20" r="8.5" />
            <path d="M20 8v6.5M20 25.5V32M8 20h6.5M25.5 20H32" />
        </g>
        <circle cx="20" cy="20" r="1.6" fill="#c99a68" />
    </svg>
);

const Avatar: React.FC<{ name: string; src: string | null; size?: number }> = ({ name, src, size = 28 }) =>
    src ? (
        <img className="av" src={src} alt="" width={size} height={size} style={{ width: size, height: size }} />
    ) : (
        <span className="av ini" style={{ width: size, height: size, fontSize: size * 0.38 }} aria-hidden>
            {initials(name) || 'M'}
        </span>
    );

const Text: React.FC<{ text: string }> = ({ text }) => (
    <>
        {linkParts(text).map((p, i) =>
            p.href ? (
                <a key={i} href={p.href} target="_blank" rel="noopener noreferrer">
                    {p.text}
                </a>
            ) : (
                <React.Fragment key={i}>{p.text}</React.Fragment>
            ),
        )}
    </>
);

/** Hora e vistos, dentro do balão (canto inferior direito), como no WhatsApp. */
const Meta: React.FC<{ m: ChatMessage; seen: boolean; className?: string }> = ({ m, seen, className }) => (
    <span className={`tm${className ? ` ${className}` : ''}`}>
        {timeLabel(m.at)}
        {m.mine &&
            (m.pending === 'sending' ? (
                <Clock size={12} strokeWidth={2} aria-label="Enviando" />
            ) : m.pending ? null : (
                <CheckCheck
                    size={15}
                    strokeWidth={2}
                    className={seen ? 'read' : ''}
                    aria-label={seen ? 'Lida' : 'Entregue'}
                />
            ))}
    </span>
);

/**
 * Forma de onda real do áudio: decodificada uma vez no navegador (WebAudio) quando a nota aparece na tela, 40 barras,
 * guardada por mensagem no sessionStorage. Sem decodificar (erro, mensagem ainda a caminho), a pseudo-onda.
 */
function useWave(id: number, el: React.RefObject<HTMLElement>, onDuration: (d: number) => void) {
    const key = `mettleChatWave:${id}`;
    const [bars, setBars] = useState<number[]>(() => {
        try {
            const v = JSON.parse(sessionStorage.getItem(key) || 'null');
            if (v && Array.isArray(v.b)) return v.b;
        } catch {
            // sem armazenamento
        }
        return waveform(id, 40);
    });
    useEffect(() => {
        if (id < 0 || !el.current) return;
        try {
            const v = JSON.parse(sessionStorage.getItem(key) || 'null');
            if (v?.d) onDuration(v.d);
            if (v) return;
        } catch {
            // segue e decodifica
        }
        let done = false;
        const io = new IntersectionObserver(([e]) => {
            if (!e.isIntersecting || done) return;
            done = true;
            io.disconnect();
            chatAudio(id)
                .then((buf) => new OfflineAudioContext(1, 1, 44100).decodeAudioData(buf))
                .then((audio) => {
                    const b = peaks(audio.getChannelData(0), 40);
                    setBars(b);
                    onDuration(audio.duration);
                    try {
                        sessionStorage.setItem(key, JSON.stringify({ b, d: audio.duration }));
                    } catch {
                        // sem armazenamento: decodifica de novo na próxima visita
                    }
                })
                .catch(() => {});
        });
        io.observe(el.current);
        return () => io.disconnect();
    }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
    return bars;
}

/** Nota de voz: avatar com microfone, play, forma de onda real, duração, hora e vistos. */
const Voice: React.FC<{ m: ChatMessage; url: string; who: { name: string; avatar: string | null }; seen: boolean }> = ({
    m,
    url,
    who,
    seen,
}) => {
    const audio = useRef<HTMLAudioElement>(null);
    const box = useRef<HTMLDivElement>(null);
    const [playing, setPlaying] = useState(false);
    const [pos, setPos] = useState(0);
    const [dur, setDur] = useState(0);
    const bars = useWave(m.id, box, (d) => isFinite(d) && d > 0 && setDur(d));
    const toggle = () => {
        const a = audio.current;
        if (!a) return;
        if (a.paused) a.play().catch(() => {});
        else a.pause();
    };
    const seek = (e: React.MouseEvent<HTMLDivElement>) => {
        const a = audio.current;
        if (!a || !isFinite(a.duration)) return;
        const r = e.currentTarget.getBoundingClientRect();
        a.currentTime = ((e.clientX - r.left) / r.width) * a.duration;
    };
    const frac = dur ? pos / dur : 0;
    return (
        <div className="voice" ref={box}>
            <audio
                ref={audio}
                src={url}
                preload="metadata"
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onEnded={() => {
                    setPlaying(false);
                    setPos(0);
                }}
                onTimeUpdate={(e) => setPos(e.currentTarget.currentTime)}
                onLoadedMetadata={(e) => {
                    const d = e.currentTarget.duration;
                    // webm do MediaRecorder chega sem duração: força o navegador a calculá-la
                    if (!isFinite(d)) {
                        e.currentTarget.currentTime = 1e7;
                        e.currentTarget.ontimeupdate = function () {
                            const a = this as HTMLAudioElement;
                            a.ontimeupdate = null;
                            setDur(a.duration);
                            a.currentTime = 0;
                        };
                    } else setDur(d);
                }}
            />
            <span className="vav">
                <Avatar name={who.name} src={who.avatar} size={46} />
                <Mic size={15} strokeWidth={2.2} className="vmic" aria-hidden />
            </span>
            <button type="button" className="play" aria-label={playing ? 'Pausar' : 'Ouvir'} onClick={toggle}>
                {playing ? (
                    <Pause size={24} fill="currentColor" strokeWidth={0} />
                ) : (
                    <Play size={24} fill="currentColor" strokeWidth={0} />
                )}
            </button>
            <div className="wv">
                <div className="bars" onClick={seek} role="presentation">
                    {bars.map((h, i) => (
                        <i
                            key={i}
                            className={`${i / bars.length < frac ? 'on' : ''}${h < SILENCE ? ' dot' : ''}`}
                            style={{ height: `${Math.round(h * 100)}%` }}
                        />
                    ))}
                    <b className="knob" style={{ left: `${frac * 100}%` }} />
                </div>
                <div className="vmeta">
                    <span>{durationLabel(playing || pos ? pos : dur)}</span>
                    <Meta m={m} seen={seen} className="inl" />
                </div>
            </div>
        </div>
    );
};

const QuoteBlock: React.FC<{ q: ChatQuote; onClick?: () => void; me: string }> = ({ q, onClick, me }) => {
    const name = q.mine ? me : q.name;
    const style = { '--h': q.mine ? 34 : nameHue(q.name) } as React.CSSProperties;
    return (
        <button type="button" className="q" style={style} onClick={onClick} tabIndex={onClick ? 0 : -1}>
            <span className="qn">{name}</span>
            <span className="qt">{quoteText(q)}</span>
        </button>
    );
};

/** Gravação de nota de voz pelo MediaRecorder do navegador (nada pago): webm/opus no Chrome, mp4 no Safari. */
function useRecorder(onDone: (blob: Blob, name: string) => void) {
    const [rec, setRec] = useState<{ started: number } | null>(null);
    const [now, setNow] = useState(0);
    const mr = useRef<MediaRecorder | null>(null);
    const cancelled = useRef(false);
    useEffect(() => {
        if (!rec) return;
        const t = setInterval(() => setNow(Date.now()), 250);
        return () => clearInterval(t);
    }, [rec]);
    const supported =
        typeof window !== 'undefined' && 'MediaRecorder' in window && !!navigator.mediaDevices?.getUserMedia;
    const start = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const type = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((t) =>
                MediaRecorder.isTypeSupported(t),
            );
            const r = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
            const chunks: Blob[] = [];
            cancelled.current = false;
            r.ondataavailable = (e) => e.data.size && chunks.push(e.data);
            r.onstop = () => {
                stream.getTracks().forEach((t) => t.stop());
                setRec(null);
                if (cancelled.current || !chunks.length) return;
                const mime = (r.mimeType || type || 'audio/webm').split(';')[0];
                onDone(new Blob(chunks, { type: mime }), mime === 'audio/mp4' ? 'audio.m4a' : 'audio.webm');
            };
            r.start();
            mr.current = r;
            setNow(Date.now());
            setRec({ started: Date.now() });
        } catch {
            setRec(null);
        }
    };
    const stop = (cancel = false) => {
        cancelled.current = cancel;
        if (mr.current?.state === 'recording') mr.current.stop();
    };
    useEffect(() => () => stop(true), []); // eslint-disable-line react-hooks/exhaustive-deps
    const secs = rec ? Math.max(0, Math.floor((now - rec.started) / 1000)) : 0;
    return { supported, recording: !!rec, secs, start, stop };
}

/** Tempo real: ActionCable do Chatwoot com o pubsub_token do próprio contato. Sem conexão, a página consulta o Worker. */
function useCable(ws: ChatPage['ws'] | null, onEvent: (event: string, data: Record<string, unknown>) => void) {
    const [open, setOpen] = useState(false);
    const handler = useRef(onEvent);
    handler.current = onEvent;
    useEffect(() => {
        if (!ws) return;
        let sock: WebSocket | null = null;
        let tries = 0;
        let timer: ReturnType<typeof setTimeout> | undefined;
        let stopped = false;
        const identifier = JSON.stringify({ channel: 'RoomChannel', pubsub_token: ws.token });
        const connect = () => {
            sock = new WebSocket(ws.url);
            sock.onmessage = (e) => {
                let msg: { type?: string; message?: { event?: string; data?: Record<string, unknown> } };
                try {
                    msg = JSON.parse(e.data);
                } catch {
                    return;
                }
                if (msg.type === 'welcome') sock?.send(JSON.stringify({ command: 'subscribe', identifier }));
                else if (msg.type === 'confirm_subscription') {
                    tries = 0;
                    setOpen(true);
                } else if (msg.message?.event) handler.current(msg.message.event, msg.message.data ?? {});
            };
            sock.onclose = () => {
                setOpen(false);
                if (stopped) return;
                timer = setTimeout(connect, Math.min(30_000, 1000 * 2 ** tries++));
            };
        };
        connect();
        return () => {
            stopped = true;
            clearTimeout(timer);
            sock?.close();
        };
    }, [ws?.url, ws?.token]); // eslint-disable-line react-hooks/exhaustive-deps
    return open;
}

const NewChat: React.FC = () => {
    const queryClient = useQueryClient();
    const params = useSearchParams();
    // a conversa é da conta REALMENTE logada (o Worker usa o token dela), não do aluno que um administrador está vendo
    const me = { name: auth.currentUser?.displayName || 'Você', avatar: auth.currentUser?.photoURL || null };
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [more, setMore] = useState(false);
    const [teamSeenAt, setTeamSeenAt] = useState(0);
    const [ws, setWs] = useState<ChatPage['ws'] | null>(null);
    const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
    const [olderLoading, setOlderLoading] = useState(false);
    const [typing, setTyping] = useState<string | null>(null);
    const [text, setText] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [fileError, setFileError] = useState('');
    const [replyTo, setReplyTo] = useState<ChatQuote | null>(null);
    const [menuFor, setMenuForRaw] = useState<number | null>(null);
    const [menuBelow, setMenuBelow] = useState(false);
    /** Abre as reações acima do balão; perto do topo da conversa, abaixo (senão some sob o cabeçalho). */
    const setMenuFor = (id: number | null) => {
        if (id != null) {
            const el = list.current?.querySelector(`[data-id="${id}"]`);
            const top = list.current?.getBoundingClientRect().top ?? 0;
            setMenuBelow(!!el && el.getBoundingClientRect().top - top < 64);
        }
        setMenuForRaw(id);
    };
    const [picker, setPicker] = useState<'emoji' | 'sticker' | null>(null);
    const [unreadAt, setUnreadAt] = useState<{ id: number; n: number } | null>(null);
    const [flash, setFlash] = useState<number | null>(null);
    const list = useRef<HTMLDivElement>(null);
    const input = useRef<HTMLTextAreaElement>(null);
    const fileInput = useRef<HTMLInputElement>(null);
    const stick = useRef(true);
    const keepFrom = useRef<number | null>(null);
    const tempId = useRef(-1);
    const idle = useRef(0);

    const markSeen = useCallback(() => {
        if (document.visibilityState !== 'visible') return;
        chatFetch('/seen', { method: 'POST' })
            .then(() => queryClient.setQueryData(CHAT_UNREAD_KEY, { unread: 0 }))
            .catch(() => {});
    }, [queryClient]);

    /** Últimas mensagens (a página do fim). Devolve se algo mudou, para o intervalo das consultas. */
    const refresh = useCallback(
        async (first = false) => {
            try {
                const page = await chatFetch<ChatPage>('');
                let changed = false;
                setMessages((cur) => {
                    const next = mergeMessages(cur, page.messages);
                    changed =
                        next.length !== cur.length || next.some((m, i) => JSON.stringify(m) !== JSON.stringify(cur[i]));
                    return changed ? next : cur;
                });
                setTeamSeenAt(page.teamSeenAt);
                if (first) {
                    setMore(page.more);
                    setWs(page.ws);
                    const at = unreadStart(page.messages, page.unread);
                    if (at != null) setUnreadAt({ id: at, n: page.unread });
                    setState('ready');
                }
                if (page.unread > 0) markSeen();
                return changed;
            } catch {
                if (first) setState('error');
                return false;
            }
        },
        [markSeen],
    );

    useEffect(() => {
        refresh(true);
    }, [refresh]);

    // gancho "Perguntar sobre isto": ?ctx=<link da Plataforma> já entra na mensagem
    useEffect(() => {
        const pre = contextPrefill(params?.get('ctx'), window.location.origin);
        if (pre) {
            setText(pre);
            input.current?.focus();
        }
    }, [params]);

    const live = useCable(ws, (event, data) => {
        if (event === 'conversation.typing_on' || event === 'conversation.typing_off') {
            const u = data.user as { type?: string; available_name?: string; name?: string } | undefined;
            if (u?.type !== 'user') return;
            setTyping(event === 'conversation.typing_on' ? u.available_name || u.name || 'Mettle' : null);
            return;
        }
        if (event.startsWith('message.') || event.startsWith('conversation.')) {
            if (event === 'message.created') setTyping(null);
            refresh();
        }
    });

    // sem tempo real: consulta a cada 4 s com a página à vista, espaçando quando nada muda (até 20 s); com ele, 30 s
    useEffect(() => {
        if (state !== 'ready') return;
        let timer: ReturnType<typeof setTimeout>;
        const tick = async () => {
            if (document.visibilityState === 'visible') {
                const changed = await refresh();
                idle.current = changed ? 0 : idle.current + 1;
            }
            timer = setTimeout(tick, live ? 30_000 : Math.min(20_000, 4000 * 2 ** Math.min(idle.current, 3)));
        };
        timer = setTimeout(tick, live ? 30_000 : 4000);
        const onVisible = () => {
            if (document.visibilityState !== 'visible') return;
            idle.current = 0;
            refresh();
        };
        document.addEventListener('visibilitychange', onVisible);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, [state, live, refresh]);

    // rolagem: fica no fim enquanto o aluno está no fim; "anteriores" mantém o ponto de leitura
    useLayoutEffect(() => {
        const el = list.current;
        if (!el) return;
        if (keepFrom.current != null) {
            el.scrollTop = el.scrollHeight - keepFrom.current;
            keepFrom.current = null;
        } else if (stick.current) el.scrollTop = el.scrollHeight;
    }, [messages, typing, state, picker, replyTo]);

    // imagens e áudios crescem depois de carregar: quem está no fim continua no fim
    useEffect(() => {
        const el = list.current;
        const col = el?.firstElementChild;
        if (!el || !col || typeof ResizeObserver === 'undefined') return;
        const ro = new ResizeObserver(() => {
            if (stick.current && keepFrom.current == null) el.scrollTop = el.scrollHeight;
        });
        ro.observe(col);
        return () => ro.disconnect();
    }, []);

    const loadOlder = async (): Promise<boolean> => {
        const oldest = messages.find((m) => !m.pending);
        if (!oldest || olderLoading) return false;
        setOlderLoading(true);
        try {
            const page = await chatFetch<ChatPage>(`?before=${oldest.id}`);
            keepFrom.current = list.current ? list.current.scrollHeight - list.current.scrollTop : null;
            setMessages((cur) => mergeMessages(cur, page.messages));
            setMore(page.more);
            return page.messages.length > 0;
        } catch {
            return false;
        } finally {
            setOlderLoading(false);
        }
    };

    // tocar na citação leva à mensagem original (carrega as anteriores se for preciso)
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
    }, [messages, more, olderLoading]); // eslint-disable-line react-hooks/exhaustive-deps

    // "digitando…" para a equipe: liga no máximo a cada 3 s; desliga 3 s depois da última tecla ou ao enviar
    const typingOn = useRef(0);
    const typingOff = useRef<ReturnType<typeof setTimeout>>();
    const sendTyping = (on: boolean) => {
        chatFetch('/typing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ on }),
        }).catch(() => {});
    };
    const onType = (value: string) => {
        setText(value);
        if (Date.now() - typingOn.current > 3000) {
            typingOn.current = Date.now();
            sendTyping(true);
        }
        clearTimeout(typingOff.current);
        typingOff.current = setTimeout(() => {
            typingOn.current = 0;
            sendTyping(false);
        }, 3000);
    };

    type Job = { blob: Blob | null; name?: string; sticker?: string; replyTo: number | null };
    const jobs = useRef(new Map<number, Job>());
    const deliver = async (m: ChatMessage, job: Job) => {
        try {
            const { message } = job.sticker
                ? await sendSticker(job.sticker, job.replyTo)
                : await sendChat(m.text, job.blob, job.name, job.replyTo);
            setMessages((cur) =>
                mergeMessages(
                    cur.filter((x) => x.id !== m.id),
                    [message],
                ),
            );
        } catch {
            setMessages((cur) => cur.map((x) => (x.id === m.id ? { ...x, pending: 'failed' } : x)));
        }
    };

    const send = (opts: { blob?: Blob | null; name?: string; sticker?: { id: string; url: string } } = {}) => {
        const blob = opts.sticker ? null : opts.blob !== undefined ? opts.blob : file;
        const body = opts.sticker || (opts.blob && opts.blob !== file) ? '' : text.trim();
        if (!body && !blob && !opts.sticker) return;
        const local = blob ? URL.createObjectURL(blob) : (opts.sticker?.url ?? '');
        const kind =
            opts.sticker || blob?.type.startsWith('image/')
                ? 'image'
                : blob?.type.startsWith('audio/')
                  ? 'audio'
                  : 'file';
        const m: ChatMessage = {
            id: tempId.current--,
            at: Math.floor(Date.now() / 1000),
            mine: true,
            text: body,
            from: null,
            files: local
                ? [
                      {
                          kind,
                          url: local,
                          thumb: null,
                          size: blob?.size ?? null,
                          ext: (opts.name ?? (blob as File | null)?.name ?? '').split('.').pop() ?? null,
                      },
                  ]
                : [],
            sticker: !!opts.sticker,
            reply: replyTo,
            pending: 'sending',
        };
        const job: Job = { blob, name: opts.name, sticker: opts.sticker?.id, replyTo: replyTo?.id ?? null };
        jobs.current.set(m.id, job);
        stick.current = true;
        setMessages((cur) => [...cur, m]);
        if (!opts.sticker && (!opts.blob || opts.blob === file)) {
            setText('');
            setFile(null);
        }
        setReplyTo(null);
        clearTimeout(typingOff.current);
        typingOn.current = 0;
        idle.current = 0;
        deliver(m, job);
        if (!opts.sticker) input.current?.focus();
    };
    const resend = (m: ChatMessage) => {
        const job = jobs.current.get(m.id);
        if (!job) return;
        setMessages((cur) => cur.map((x) => (x.id === m.id ? { ...x, pending: 'sending' } : x)));
        deliver(m, job);
    };

    const react = (m: ChatMessage, emoji: string) => {
        const next = m.reaction === emoji ? null : emoji;
        setMenuFor(null);
        setMessages((cur) => cur.map((x) => (x.id === m.id ? { ...x, reaction: next } : x)));
        reactChat(m.id, next).catch(() =>
            setMessages((cur) => cur.map((x) => (x.id === m.id ? { ...x, reaction: m.reaction ?? null } : x))),
        );
    };

    const startReply = (m: ChatMessage) => {
        setMenuFor(null);
        const f = m.files[0];
        setReplyTo({
            id: m.id,
            mine: m.mine,
            name: m.from?.name ?? '',
            text: m.text.slice(0, 160),
            kind: m.sticker ? 'sticker' : f ? f.kind : 'text',
        });
        input.current?.focus();
    };

    const recorder = useRecorder((blob, name) => send({ blob, name }));

    const pick = (f: File | undefined) => {
        setFileError('');
        if (!f) return;
        if (f.size > MAX_FILE) return setFileError('Arquivo acima de 15 MB.');
        if (!/^(image\/|application\/pdf)/.test(f.type)) return setFileError('Envie imagem ou PDF.');
        setFile(f);
        input.current?.focus();
    };

    const insertEmoji = (e: string) => {
        pushRecentEmoji(e);
        const el = input.current;
        const start = el?.selectionStart ?? text.length;
        const end = el?.selectionEnd ?? text.length;
        const next = text.slice(0, start) + e + text.slice(end);
        setText(next);
        requestAnimationFrame(() => {
            if (!el) return;
            el.focus();
            el.setSelectionRange(start + e.length, start + e.length);
        });
    };

    // altura do campo acompanha o texto (até ~6 linhas)
    useLayoutEffect(() => {
        const el = input.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
    }, [text]);

    // fecha o menu de reações ao tocar fora; Esc fecha menu, painel e resposta
    useEffect(() => {
        const close = (e: Event) => {
            if (!(e.target as HTMLElement).closest?.('.rxbar, .acts')) setMenuFor(null);
        };
        const esc = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;
            setMenuFor(null);
            setPicker(null);
        };
        document.addEventListener('pointerdown', close);
        document.addEventListener('keydown', esc);
        return () => {
            document.removeEventListener('pointerdown', close);
            document.removeEventListener('keydown', esc);
        };
    }, []);

    // celular: arrastar o balão para a direita responde; segurar abre as reações
    const touch = useRef<{
        id: number;
        x: number;
        y: number;
        dx: number;
        el: HTMLElement;
        timer: ReturnType<typeof setTimeout>;
    } | null>(null);
    const touchHandlers = (m: ChatMessage) =>
        m.pending
            ? {}
            : {
                  onTouchStart: (e: React.TouchEvent<HTMLElement>) => {
                      const t = e.touches[0];
                      const el = e.currentTarget;
                      touch.current = {
                          id: m.id,
                          x: t.clientX,
                          y: t.clientY,
                          dx: 0,
                          el,
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
                      const t = e.touches[0];
                      const dx = t.clientX - s.x,
                          dy = t.clientY - s.y;
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

    const rows = useMemo(() => chatRows(messages), [messages]);
    /** Nome do atendente só quando ele MUDA na conversa (numa conversa 1:1 o WhatsApp não mostra nomes). */
    const namedIds = useMemo(() => {
        const ids = new Set<number>();
        let prev = '';
        for (const m of messages) {
            if (m.mine || !m.from) continue;
            if (prev && m.from.name !== prev) ids.add(m.id);
            prev = m.from.name;
        }
        return ids;
    }, [messages]);
    const canSend = !!text.trim() || !!file;

    const bubble = (m: ChatMessage, first: boolean, last: boolean) => {
        const seen = m.mine && teamSeenAt >= m.at;
        const img = m.files.find((f) => f.kind === 'image');
        const audio = m.files.find((f) => f.kind === 'audio');
        const docs = m.files.filter((f) => f.kind === 'file');
        const sticker = m.sticker || (!!img && !m.text && img.ext === 'webp' && m.files.length === 1);
        const big = !m.files.length && bigEmoji(m.text);
        const showName = first && !m.mine && !sticker && !big && namedIds.has(m.id);
        const nameStyle = m.from ? ({ '--h': nameHue(m.from.name) } as React.CSSProperties) : undefined;
        const quote = m.reply ? <QuoteBlock q={m.reply} me="Você" onClick={() => jumpTo(m.reply!.id)} /> : null;

        if (sticker || big)
            return (
                <div className="bare" {...touchHandlers(m)}>
                    {quote}
                    {sticker && img ? (
                        <img className="stkimg" src={img.url} alt="Figurinha" loading="lazy" />
                    ) : (
                        <span className="emo">{m.text}</span>
                    )}
                    <Meta m={m} seen={seen} className="chip" />
                </div>
            );

        const onlyImage = !!img && !m.text && !audio && !docs.length;
        return (
            <div
                className={`bub${last ? ' tail' : ''}${onlyImage ? ' media' : ''}${audio ? ' vn' : ''}${m.reply ? ' hasq' : ''}`}
                {...touchHandlers(m)}
            >
                {showName && (
                    <span className="nm" style={nameStyle}>
                        {m.from!.name}
                    </span>
                )}
                {quote}
                {img && (
                    <a className="img" href={img.url} target="_blank" rel="noopener noreferrer">
                        <img src={img.thumb || img.url} alt="Foto" loading="lazy" />
                        {onlyImage && <Meta m={m} seen={seen} className="over" />}
                    </a>
                )}
                {audio && (
                    <Voice
                        m={m}
                        url={audio.url}
                        who={m.mine ? me : (m.from ?? { name: 'Mettle', avatar: null })}
                        seen={seen}
                    />
                )}
                {docs.map((f, i) => (
                    <a key={i} className="doc" href={f.url} target="_blank" rel="noopener noreferrer">
                        <span className="dic">
                            <FileText size={22} strokeWidth={1.5} />
                            <b>{(f.ext || '').toUpperCase().slice(0, 4)}</b>
                        </span>
                        <span className="dnm">
                            <span>{fileName(f.url, f.ext)}</span>
                            <small>
                                {[(f.ext || '').toUpperCase(), formatSize(f.size)].filter(Boolean).join(' · ')}
                            </small>
                        </span>
                    </a>
                ))}
                {m.text && (
                    <p className="txt">
                        <Text text={m.text} />
                        <span className={`sp${m.mine ? ' me' : ''}`}>{'\u2060'}</span>
                    </p>
                )}
                {!onlyImage &&
                    !audio &&
                    (m.text ? <Meta m={m} seen={seen} /> : <Meta m={m} seen={seen} className="blk" />)}
            </div>
        );
    };

    return (
        <NewPage className="lesson fill">
            <Wrap>
                <header className="hd">
                    <MettleMark />
                    <h1>Suporte Mettle</h1>
                </header>

                <div
                    className="list"
                    ref={list}
                    onScroll={(e) => {
                        const el = e.currentTarget;
                        stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
                    }}
                >
                    <div className="col" role="log" aria-live="polite" aria-label="Conversa com o suporte">
                        {state === 'error' && (
                            <div className="state">
                                <button
                                    type="button"
                                    className="retry"
                                    onClick={() => refresh(true)}
                                    aria-label="Tentar de novo"
                                >
                                    <RotateCw size={20} strokeWidth={1.6} />
                                </button>
                            </div>
                        )}
                        {state === 'ready' && more && (
                            <button
                                type="button"
                                className="older"
                                onClick={() => loadOlder()}
                                disabled={olderLoading}
                                aria-label="Mensagens anteriores"
                            >
                                {olderLoading ? '…' : '↑'}
                            </button>
                        )}
                        {rows.map((r) =>
                            r.type === 'day' ? (
                                <div key={r.key} className="day">
                                    <span>{r.label}</span>
                                </div>
                            ) : (
                                <React.Fragment key={r.key}>
                                    {unreadAt?.id === r.m.id && (
                                        <div className="unread">
                                            <span>
                                                {unreadAt.n}{' '}
                                                {unreadAt.n === 1 ? 'mensagem não lida' : 'mensagens não lidas'}
                                            </span>
                                        </div>
                                    )}
                                    <div
                                        data-id={r.m.id}
                                        className={`msg${r.m.mine ? ' me' : ''}${r.first ? ' first' : ''}${r.last ? ' last' : ''}${r.m.reaction ? ' rx' : ''}${flash === r.m.id ? ' flash' : ''}`}
                                    >
                                        <div className="line">
                                            {bubble(r.m, r.first, r.last)}
                                            {!r.m.pending && (
                                                <span className="acts">
                                                    <button
                                                        type="button"
                                                        aria-label="Reagir"
                                                        onClick={() => setMenuFor(menuFor === r.m.id ? null : r.m.id)}
                                                    >
                                                        <Smile size={17} strokeWidth={1.7} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        aria-label="Responder"
                                                        onClick={() => startReply(r.m)}
                                                    >
                                                        <Reply size={17} strokeWidth={1.7} />
                                                    </button>
                                                </span>
                                            )}
                                            {menuFor === r.m.id && (
                                                <div className={`rxbar${menuBelow ? ' below' : ''}`} role="menu">
                                                    {REACTIONS.map((e) => (
                                                        <button
                                                            key={e}
                                                            type="button"
                                                            role="menuitem"
                                                            aria-pressed={r.m.reaction === e}
                                                            onClick={() => react(r.m, e)}
                                                        >
                                                            {e}
                                                        </button>
                                                    ))}
                                                    <button
                                                        type="button"
                                                        className="rr"
                                                        role="menuitem"
                                                        aria-label="Responder"
                                                        onClick={() => startReply(r.m)}
                                                    >
                                                        <Reply size={18} strokeWidth={1.8} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        {r.m.reaction && (
                                            <button
                                                type="button"
                                                className="pill"
                                                aria-label="Remover reação"
                                                onClick={() => react(r.m, r.m.reaction!)}
                                            >
                                                {r.m.reaction}
                                            </button>
                                        )}
                                        {r.m.pending === 'failed' && (
                                            <button
                                                type="button"
                                                className="fail"
                                                onClick={() => resend(r.m)}
                                                aria-label="Tentar de novo"
                                            >
                                                <RotateCw size={14} strokeWidth={1.8} />
                                            </button>
                                        )}
                                    </div>
                                </React.Fragment>
                            ),
                        )}
                        {typing && (
                            <div className="msg first last">
                                <div className="line">
                                    <div className="bub tail typing" aria-label={`${typing} está digitando`}>
                                        <i />
                                        <i />
                                        <i />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {picker && (
                    <ChatPicker
                        tab={picker}
                        onTab={setPicker}
                        onEmoji={insertEmoji}
                        onSticker={(id, url) => {
                            setPicker(null);
                            send({ sticker: { id, url } });
                        }}
                    />
                )}

                <form
                    className="composer"
                    onSubmit={(e) => {
                        e.preventDefault();
                        send();
                    }}
                >
                    {replyTo && (
                        <div className="replying">
                            <QuoteBlock q={replyTo} me="Você" />
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
                    {(file || fileError) && (
                        <div className="chip">
                            {file ? (
                                <>
                                    <FileText size={16} strokeWidth={1.6} aria-hidden />
                                    <span className="nm">{file.name}</span>
                                    <span className="sz">{formatSize(file.size)}</span>
                                </>
                            ) : (
                                <span className="nm err">{fileError}</span>
                            )}
                            <button
                                type="button"
                                className="ib"
                                aria-label="Remover anexo"
                                onClick={() => {
                                    setFile(null);
                                    setFileError('');
                                }}
                            >
                                <X size={16} strokeWidth={1.6} />
                            </button>
                        </div>
                    )}
                    <div className="bar">
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
                                    {durationLabel(recorder.secs)}
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
                                        onFocus={() => matchMedia('(pointer: coarse)').matches && setPicker(null)}
                                        onChange={(e) => onType(e.target.value)}
                                        onPaste={(e) => {
                                            const f = [...e.clipboardData.files][0];
                                            if (f) {
                                                e.preventDefault();
                                                pick(f);
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            // Enter envia no computador; no celular o Enter quebra a linha (o botão envia)
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
                                    <button type="submit" className="go" aria-label="Enviar" disabled={!canSend}>
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
                </form>
            </Wrap>
        </NewPage>
    );
};

export default NewChat;

/* Papel de parede: ícones de linha do nosso mundo (livro, fones, microfone, estrela, relógio, balão, lápis, globo, nota,
   lâmpada), quase transparentes. Um ladrilho por tema (o traço muda de cor; o fundo vem de --c-wall). */
const ICONS: Record<string, string> = {
    book: "<path d='M0 4q10-6 20 0v24q-10-6-20 0zM20 4q10-6 20 0v24q-10-6-20 0z'/>",
    phones: "<path d='M4 26v-8a16 16 0 0 1 32 0v8M0 24h7v14h-7zM33 24h7v14h-7z'/>",
    mic: "<path d='M14 2a6 6 0 0 1 12 0v14a6 6 0 0 1-12 0zM8 14a12 12 0 0 0 24 0M20 26v8M13 34h14'/>",
    star: "<path d='M20 2l5 10.5 11.5 1.5-8.4 7.9 2.2 11.4L20 27.7l-10.3 5.6 2.2-11.4-8.4-7.9L15 12.5z'/>",
    clock: "<circle cx='20' cy='20' r='16'/><path d='M20 10v10l7 4'/>",
    chat: "<path d='M6 4h28a6 6 0 0 1 6 6v14a6 6 0 0 1-6 6h-18l-10 8v-8a6 6 0 0 1-6-6v-14a6 6 0 0 1 6-6z'/>",
    pencil: "<path d='M4 36l26-26 8 8-26 26h-8zM26 14l8 8'/>",
    globe: "<circle cx='20' cy='20' r='16'/><path d='M4 20h32M20 4c-8 9-8 23 0 32M20 4c8 9 8 23 0 32'/>",
    note: "<path d='M12 34v-28l20-5v26M12 34a5 4 0 1 1-1-1M32 28a5 4 0 1 1-1-1'/>",
    bulb: "<path d='M20 2a12 12 0 0 0-7 22v6h14v-6a12 12 0 0 0-7-22zM14 34h12M16 38h8'/>",
};
/* posições soltas (x, y, giro, escala) num ladrilho de 300 px: sem fileiras, como o papel de parede do WhatsApp */
const SPOTS: [keyof typeof ICONS, number, number, number, number][] = [
    ['book', 18, 22, -12, 0.8],
    ['mic', 120, 8, 10, 0.7],
    ['star', 210, 40, 18, 0.6],
    ['phones', 70, 96, 8, 0.75],
    ['clock', 176, 120, -6, 0.65],
    ['chat', 250, 150, -14, 0.6],
    ['pencil', 14, 170, 20, 0.7],
    ['globe', 104, 196, -8, 0.7],
    ['note', 200, 228, 12, 0.65],
    ['bulb', 262, 250, -10, 0.6],
    ['star', 52, 262, -20, 0.45],
    ['chat', 150, 60, 6, 0.4],
];
const tile = (stroke: string, opacity: number) =>
    `url("data:image/svg+xml,${encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'><g fill='none' stroke='${stroke}' stroke-opacity='${opacity}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>` +
            SPOTS.map(
                ([k, x, y, r, sc]) =>
                    `<g transform='translate(${x} ${y}) rotate(${r} 20 20) scale(${sc})'>${ICONS[k]}</g>`,
            ).join('') +
            `</g></svg>`,
    )}")`;

const Wrap = styled.div`
    --c-wall: #1f1d1b;
    --c-head: #2b2a29;
    --c-in: #353331;
    --c-out: #5b4632;
    --c-out-text: #f6efe6;
    --c-chip: #353331;
    --c-meta: rgba(243, 237, 228, 0.62);
    --c-read: #e2b884;
    --c-name-l: 72%;
    --c-quote: rgba(0, 0, 0, 0.22);
    --c-shadow: 0 1px 0.5px rgba(0, 0, 0, 0.35);
    --c-wallpaper: ${tile('#ffffff', 0.04)};
    --c-pill: #3a3836;
    --c-pill-line: rgba(255, 255, 255, 0.08);

    ${LIGHT_ROOT} & {
        --c-wall: #efe8dc;
        --c-head: #f6f1e9;
        --c-in: #ffffff;
        --c-out: #f1dcbf;
        --c-out-text: #2a2622;
        --c-chip: #ffffff;
        --c-meta: rgba(42, 38, 34, 0.55);
        --c-read: #a0662a;
        --c-name-l: 36%;
        --c-quote: rgba(52, 40, 26, 0.07);
        --c-shadow: 0 1px 0.5px rgba(52, 40, 26, 0.16);
        --c-wallpaper: ${tile('#5a4630', 0.07)};
        --c-pill: #ffffff;
        --c-pill-line: rgba(52, 40, 26, 0.1);
    }

    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    /* papel de parede atrás da conversa E do campo de mensagem (os controles flutuam sobre ele, como no WhatsApp) */
    background-color: var(--c-wall);
    background-image: var(--c-wallpaper);
    background-size: 300px 300px;

    /* ---------- cabeçalho ---------- */
    .hd {
        flex: none;
        display: flex;
        align-items: center;
        gap: 14px;
        height: 60px;
        padding: 0 16px;
        background: var(--c-head);
        border-bottom: 1px solid var(--r-line);
    }
    .hd h1 {
        margin: 0;
        font-size: 16px;
        font-weight: 500;
        color: var(--r-text);
    }

    /* ---------- conversa ---------- */
    .list {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        overflow-x: hidden;
        overscroll-behavior: contain;
        padding: 10px clamp(12px, 6%, 72px) 8px;
    }
    .list > .col {
        display: flex;
        flex-direction: column;
        min-height: 100%;
        justify-content: flex-end;
    }
    .state {
        margin: auto;
    }
    .retry,
    .older {
        display: grid;
        place-items: center;
        width: 36px;
        height: 36px;
        margin: 8px auto;
        border: 0;
        border-radius: 50%;
        background: var(--c-chip);
        box-shadow: var(--c-shadow);
        color: var(--r-muted);
        cursor: pointer;
    }
    .day {
        display: flex;
        justify-content: center;
        margin: 12px 0 8px;
    }
    .day span {
        padding: 5px 12px;
        border-radius: 8px;
        background: var(--c-chip);
        box-shadow: var(--c-shadow);
        font-size: 12.5px;
        color: var(--r-muted);
    }
    .unread {
        display: flex;
        justify-content: center;
        margin: 10px 0;
        padding: 6px 0;
        background: rgba(var(--r-bg-rgb), 0.55);
    }
    .unread span {
        padding: 4px 14px;
        border-radius: 8px;
        background: var(--c-chip);
        font-size: 12.5px;
        font-weight: 500;
        color: var(--r-text);
    }

    .msg {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        margin-top: 2px;
    }
    .msg.first {
        margin-top: 8px;
    }
    .day + .msg.first {
        margin-top: 0;
    }
    .msg.me {
        align-items: flex-end;
    }
    .msg.rx {
        margin-bottom: 12px;
    }
    .line {
        position: relative;
        display: flex;
        align-items: center;
        gap: 6px;
        max-width: 65%;
    }
    .msg.me .line {
        flex-direction: row-reverse;
    }
    .msg.flash .bub,
    .msg.flash .bare {
        animation: chat-flash 1.4s ease-out;
    }
    @keyframes chat-flash {
        0%,
        40% {
            filter: brightness(1.35);
        }
        100% {
            filter: none;
        }
    }

    /* medidas do WhatsApp Web: raio 18, padding 6/10, texto 14,5 com linha de 19, hora 11 */
    .bub {
        position: relative;
        min-width: 0;
        max-width: 100%;
        padding: 6px 10px 7px;
        border-radius: 18px;
        background: var(--c-in);
        box-shadow: var(--c-shadow);
        color: var(--r-text);
        font-size: 14.5px;
        line-height: 19px;
        overflow-wrap: anywhere;
        transition: transform 120ms ease;
        touch-action: pan-y;
    }
    .msg.me .bub {
        background: var(--c-out);
        color: var(--c-out-text);
    }
    /* rabinho curvo só no ÚLTIMO balão do grupo, no canto de baixo, para fora */
    .bub.tail {
        border-bottom-left-radius: 4px;
    }
    .bub.tail::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: -7px;
        width: 10px;
        height: 14px;
        background: inherit;
        clip-path: path('M10 0 C10 7 8 11 0 14 L10 14 Z');
    }
    .msg.me .bub.tail {
        border-bottom-left-radius: 18px;
        border-bottom-right-radius: 4px;
    }
    .msg.me .bub.tail::after {
        left: auto;
        right: -7px;
        clip-path: path('M0 0 C0 7 2 11 10 14 L0 14 Z');
    }
    .bub.hasq {
        padding-top: 4px;
    }
    .nm {
        display: block;
        margin: 0 0 2px;
        font-size: 12.8px;
        font-weight: 600;
        color: hsl(var(--h) 52% var(--c-name-l));
    }
    .txt {
        margin: 0;
        white-space: pre-wrap;
    }
    .txt a {
        color: inherit;
        text-decoration: underline;
        text-underline-offset: 2px;
    }
    /* reserva o lugar da hora na última linha (a hora fica por cima, no canto) */
    /* inline com um "word joiner": fica grudado na última palavra; se não couber, a palavra desce junto (como no WhatsApp),
       em vez de a hora ficar sozinha numa linha nova */
    .sp {
        padding-right: 44px;
    }
    .sp.me {
        padding-right: 64px;
    }
    .tm {
        position: absolute;
        right: 10px;
        bottom: 6px;
        display: inline-flex;
        align-items: center;
        gap: 3px;
        font-size: 11px;
        line-height: 1;
        font-variant-numeric: tabular-nums;
        color: var(--c-meta);
        white-space: nowrap;
    }
    .msg.me .tm {
        color: color-mix(in srgb, var(--c-out-text) 62%, transparent);
    }
    .tm .read {
        color: var(--c-read);
    }
    .tm.blk {
        position: static;
        display: flex;
        justify-content: flex-end;
        margin-top: 4px;
    }
    .tm.inl {
        position: static;
    }
    .tm.over {
        right: 6px;
        bottom: 6px;
        padding: 3px 6px;
        border-radius: 10px;
        background: rgba(0, 0, 0, 0.42);
        color: #fff !important;
    }
    .tm.over .read {
        color: #f0c894;
    }
    /* figurinha e emoji grande: a hora fica sobre o canto de baixo da imagem, como no WhatsApp */
    .tm.chip {
        position: static;
        align-self: flex-end;
        margin-top: -14px;
        padding: 4px 7px;
        border-radius: 8px;
        background: var(--c-chip);
        box-shadow: var(--c-shadow);
        color: var(--c-meta) !important;
    }

    /* citação (resposta) dentro do balão e acima do campo */
    .q {
        display: grid;
        gap: 1px;
        width: calc(100% + 14px);
        min-width: 180px;
        max-width: calc(100% + 14px);
        margin: 0 -7px 5px;
        padding: 6px 10px 7px 10px;
        border: 0;
        border-left: 4px solid hsl(var(--h) 52% var(--c-name-l));
        border-radius: 12px;
        background: var(--c-quote);
        color: inherit;
        text-align: left;
        font: inherit;
        cursor: pointer;
    }
    .qn {
        font-size: 12.5px;
        font-weight: 600;
        color: hsl(var(--h) 52% var(--c-name-l));
    }
    .qt {
        min-width: 0;
        font-size: 13.5px;
        line-height: 18px;
        opacity: 0.8;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }

    /* foto: arredondada, hora por cima */
    .bub.media {
        padding: 3px;
    }
    .bub.media .img {
        border-radius: 15px;
    }
    .img {
        position: relative;
        display: block;
        border-radius: 6px;
        overflow: hidden;
    }
    .img img {
        display: block;
        width: min(320px, 100%);
        max-height: 360px;
        object-fit: cover;
    }
    .bub:not(.media) .img {
        margin: 0 -6px 4px;
    }

    /* figurinha e emoji grande: sem balão */
    .bare {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        transition: transform 120ms ease;
        touch-action: pan-y;
    }
    .msg.me .bare {
        align-items: flex-end;
    }
    .stkimg {
        width: 150px;
        height: 150px;
        object-fit: contain;
    }
    .emo {
        font-size: 44px;
        line-height: 1.15;
    }

    /* documento */
    .doc {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 240px;
        margin: 0 -4px 2px;
        padding: 10px;
        border-radius: 6px;
        background: var(--c-quote);
        color: inherit;
        text-decoration: none;
    }
    .dic {
        position: relative;
        display: grid;
        place-items: center;
        color: var(--r-gold-hi);
    }
    .dic b {
        position: absolute;
        bottom: -2px;
        font-size: 7px;
        font-weight: 700;
    }
    .dnm {
        display: grid;
        min-width: 0;
    }
    .dnm span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 14px;
    }
    .dnm small {
        font-size: 11.5px;
        opacity: 0.7;
    }

    /* nota de voz (como no WhatsApp): avatar com microfone, play, onda fina com bolinha; duração embaixo do início da
       onda e a hora com os vistos no canto */
    .bub.vn {
        padding: 8px 10px 6px 8px;
    }
    .voice {
        display: grid;
        grid-template-columns: 46px 34px minmax(110px, 1fr);
        align-items: center;
        gap: 0 8px;
        width: min(320px, 62vw);
    }
    .play {
        display: grid;
        place-items: center;
        width: 34px;
        height: 34px;
        padding: 0;
        border: 0;
        background: none;
        color: inherit;
        opacity: 0.75;
        cursor: pointer;
    }
    .wv {
        display: grid;
        gap: 2px;
        padding-top: 14px;
    }
    .bars {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 24px;
        cursor: pointer;
    }
    .bars i {
        width: 3px;
        min-height: 3px;
        border-radius: 3px;
        background: currentColor;
        opacity: 0.4;
    }
    .bars i.on {
        opacity: 0.95;
    }
    .bars i.dot {
        height: 3px !important;
    }
    .knob {
        position: absolute;
        top: 50%;
        width: 13px;
        height: 13px;
        margin: -6.5px 0 0 -2px;
        border-radius: 50%;
        background: currentColor;
    }
    .vmeta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        min-height: 16px;
        font-size: 11px;
        font-variant-numeric: tabular-nums;
        color: var(--c-meta);
    }
    .msg.me .vmeta {
        color: color-mix(in srgb, var(--c-out-text) 62%, transparent);
    }
    .vav {
        position: relative;
        width: 46px;
        height: 46px;
    }
    .vmic {
        position: absolute;
        right: -4px;
        bottom: -1px;
        color: var(--c-meta);
        filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.4));
    }
    .msg.me .vmic {
        color: color-mix(in srgb, var(--c-out-text) 70%, transparent);
    }
    .av {
        flex: none;
        display: block;
        border-radius: 50%;
        object-fit: cover;
    }
    .av.ini {
        display: inline-grid;
        place-items: center;
        background: var(--r-surf);
        color: var(--r-muted);
        font-weight: 600;
    }

    /* ações ao passar o mouse: reagir e responder, ao lado do balão */
    .acts {
        display: none;
        gap: 4px;
        flex: none;
    }
    .acts button,
    .rxbar .rr {
        display: grid;
        place-items: center;
        width: 30px;
        height: 30px;
        border: 0;
        border-radius: 50%;
        background: var(--c-chip);
        box-shadow: var(--c-shadow);
        color: var(--r-muted);
        cursor: pointer;
    }
    @media (hover: hover) and (pointer: fine) {
        .line:hover .acts,
        .line:focus-within .acts {
            display: inline-flex;
        }
    }
    .rxbar {
        position: absolute;
        bottom: calc(100% + 6px);
        left: 0;
        z-index: 5;
        display: flex;
        align-items: center;
        gap: 2px;
        padding: 5px 6px;
        border-radius: 26px;
        background: var(--c-chip);
        box-shadow: 0 4px 18px rgba(0, 0, 0, 0.28);
    }
    .msg.me .rxbar {
        left: auto;
        right: 0;
    }
    .rxbar.below {
        bottom: auto;
        top: calc(100% + 6px);
    }
    .rxbar button {
        display: grid;
        place-items: center;
        width: 38px;
        height: 38px;
        border: 0;
        border-radius: 50%;
        background: none;
        font-size: 24px;
        cursor: pointer;
        transition: transform 120ms ease;
    }
    .rxbar button:hover {
        transform: scale(1.18);
    }
    .rxbar button[aria-pressed='true'] {
        background: var(--r-hover);
    }
    .rxbar .rr {
        margin-left: 4px;
        box-shadow: none;
        background: var(--r-hover);
    }
    .pill {
        position: absolute;
        bottom: -12px;
        left: 8px;
        z-index: 1;
        height: 22px;
        padding: 0 5px;
        border: 0;
        border-radius: 11px;
        background: var(--c-chip);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        font-size: 13px;
        line-height: 22px;
        cursor: pointer;
    }
    .msg.me .pill {
        left: auto;
        right: 10px;
    }
    .fail {
        display: grid;
        place-items: center;
        width: 24px;
        height: 24px;
        margin-top: 3px;
        border: 0;
        border-radius: 50%;
        background: var(--r-danger);
        color: #fff;
        cursor: pointer;
    }

    .typing {
        display: flex;
        gap: 4px;
        padding: 12px 14px;
    }
    .typing i {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--r-muted);
        animation: chat-dot 1.2s ease-in-out infinite;
    }
    .typing i:nth-of-type(2) {
        animation-delay: 0.15s;
    }
    .typing i:nth-of-type(3) {
        animation-delay: 0.3s;
    }
    @keyframes chat-dot {
        0%,
        60%,
        100% {
            opacity: 0.35;
            transform: none;
        }
        30% {
            opacity: 1;
            transform: translateY(-2px);
        }
    }

    /* ---------- emojis e figurinhas ---------- */
    .picker {
        flex: none;
        display: flex;
        flex-direction: column;
        height: 300px;
        background: var(--c-head);
        border-top: 1px solid var(--r-line);
    }
    .ptabs {
        display: flex;
        align-items: center;
        gap: 2px;
        padding: 6px 10px;
        border-bottom: 1px solid var(--r-line);
    }
    .ptabs button {
        display: grid;
        place-items: center;
        min-width: 36px;
        height: 34px;
        border: 0;
        border-radius: 8px;
        background: none;
        color: var(--r-muted);
        font-size: 18px;
        cursor: pointer;
    }
    .ptabs button[aria-selected='true'] {
        color: var(--r-gold-hi);
        background: var(--r-hover);
    }
    .cats {
        display: flex;
        gap: 2px;
        margin-left: auto;
    }
    .pgrid {
        flex: 1;
        overflow-y: auto;
        display: grid;
        align-content: start;
        padding: 6px 10px 10px;
    }
    .pgrid.emo {
        grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
    }
    .pgrid.emo button {
        height: 40px;
        border: 0;
        border-radius: 8px;
        background: none;
        font-size: 25px;
        cursor: pointer;
    }
    .pgrid button:hover {
        background: var(--r-hover);
    }
    .gh {
        grid-column: 1 / -1;
        height: 6px;
    }
    .pgrid.stk {
        grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
        gap: 6px;
    }
    .pgrid.stk button {
        aspect-ratio: 1;
        padding: 6px;
        border: 0;
        border-radius: 10px;
        background: none;
        cursor: pointer;
    }
    .pgrid.stk img {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }
    .pempty {
        flex: 1;
        display: grid;
        place-items: center;
        color: var(--r-faint);
        opacity: 0.6;
    }

    /* ---------- escrever ---------- */
    .composer {
        flex: none;
        padding: 6px 16px max(10px, env(safe-area-inset-bottom));
        background: none;
    }
    .replying {
        display: flex;
        align-items: center;
        gap: 6px;
        margin: 2px 52px 6px;
        padding: 6px 6px 6px 8px;
        border-radius: 10px;
        background: var(--c-in);
    }
    .replying .q {
        margin: 0;
        cursor: default;
    }
    .chip {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0 52px 6px;
        padding: 6px 6px 6px 12px;
        border-radius: 10px;
        background: var(--c-in);
        font-size: 13px;
    }
    .chip .nm {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .chip .nm.err {
        color: var(--r-danger);
    }
    .chip .sz {
        color: var(--r-muted);
    }
    .bar {
        display: flex;
        align-items: flex-end;
        gap: 8px;
    }
    /* "+", campo e microfone: mesma altura (46 px), mesma linha de centro, mesmo espaço entre eles */
    .pillin {
        flex: 1;
        min-width: 0;
        display: flex;
        align-items: flex-end;
        min-height: 46px;
        padding: 0 3px 0 18px;
        border-radius: 23px;
        background: var(--c-pill);
        border: 1px solid var(--c-pill-line);
        box-shadow: var(--c-shadow);
    }
    .pillin textarea {
        flex: 1;
        min-width: 0;
        min-height: 44px;
        max-height: 132px;
        padding: 12px 0;
        border: 0;
        outline: none;
        resize: none;
        background: none;
        color: var(--r-text);
        font: inherit;
        font-size: 15px;
        line-height: 20px;
    }
    .pillin textarea:focus-visible {
        outline: none;
    }
    .ib {
        flex: none;
        display: grid;
        place-items: center;
        width: 40px;
        height: 44px;
        border: 0;
        border-radius: 50%;
        background: none;
        color: var(--r-muted);
        cursor: pointer;
    }
    .ib:hover,
    .ib[aria-pressed='true'] {
        color: var(--r-text);
    }
    .ib.plus {
        width: 46px;
        height: 46px;
        background: var(--c-pill);
        border: 1px solid var(--c-pill-line);
        box-shadow: var(--c-shadow);
        color: var(--r-text);
    }
    .go {
        flex: none;
        display: grid;
        place-items: center;
        width: 46px;
        height: 46px;
        border: 0;
        border-radius: 50%;
        background: var(--r-gold);
        color: var(--r-on-gold);
        cursor: pointer;
    }
    .go:hover:not(:disabled) {
        background: var(--r-gold-hi);
    }
    .go:disabled {
        opacity: 0.5;
        cursor: default;
    }
    .rec {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 10px;
        height: 46px;
        padding: 0 16px;
        border-radius: 23px;
        background: var(--c-pill);
        border: 1px solid var(--c-pill-line);
        font-variant-numeric: tabular-nums;
        color: var(--r-text);
    }
    .rec .pulse {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        background: var(--r-danger);
        animation: chat-dot 1.2s ease-in-out infinite;
    }

    @media (max-width: 860px) {
        .hd {
            height: 56px;
            padding: 0 12px;
        }
        .list {
            padding: 6px 10px 10px;
        }
        .line {
            max-width: 80%;
        }
        .composer {
            padding: 6px 8px max(8px, env(safe-area-inset-bottom));
        }
        .replying,
        .chip {
            margin: 2px 4px 6px;
        }
        .bar {
            gap: 6px;
        }
        .picker {
            height: 280px;
        }
        /* iOS não amplia a página ao focar um campo de 16 px */
        .pillin textarea {
            font-size: 16px;
        }
    }
    @media (prefers-reduced-motion: reduce) {
        .typing i,
        .rec .pulse,
        .msg.flash .bub,
        .msg.flash .bare {
            animation: none;
        }
    }
`;
