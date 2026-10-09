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
    Copy,
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
export const MettleMark: React.FC<{ size?: number }> = ({ size = 40 }) => (
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
        <img className="cav" src={src} alt="" width={size} height={size} style={{ width: size, height: size }} />
    ) : (
        <span className="cav ini" style={{ width: size, height: size, fontSize: size * 0.38 }} aria-hidden>
            {initials(name) || 'M'}
        </span>
    );

/** Avatar da nota de voz: a foto, ou a silhueta padrão (como o WhatsApp mostra quem não tem foto). */
const VoiceAvatar: React.FC<{ src: string | null }> = ({ src }) =>
    src ? (
        <img className="vimg" src={src} alt="" width={42} height={42} />
    ) : (
        <svg className="vimg" viewBox="0 0 42 42" width={42} height={42} aria-hidden>
            <circle cx="21" cy="21" r="21" fill="var(--c-avatar-bg)" />
            <circle cx="21" cy="16.5" r="7" fill="var(--c-avatar-fg)" />
            <path
                d="M7.5 35.5c2.6-6.1 7.6-9.5 13.5-9.5s10.9 3.4 13.5 9.5A21 21 0 0 1 7.5 35.5z"
                fill="var(--c-avatar-fg)"
            />
        </svg>
    );

export const Text: React.FC<{ text: string }> = ({ text }) => (
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
export const Meta: React.FC<{ m: ChatMessage; seen: boolean; className?: string }> = ({ m, seen, className }) => (
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
function useWave(
    id: number,
    el: React.RefObject<HTMLElement>,
    onDuration: (d: number) => void,
    load: () => Promise<ArrayBuffer> = () => chatAudio(id),
    key = `mettleChatWave41:${id}`,
) {
    const [bars, setBars] = useState<number[]>(() => {
        try {
            const v = JSON.parse(sessionStorage.getItem(key) || 'null');
            if (v && Array.isArray(v.b)) return v.b;
        } catch {
            // sem armazenamento
        }
        return waveform(id, 41);
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
            load()
                .then((buf) => new OfflineAudioContext(1, 1, 44100).decodeAudioData(buf))
                .then((audio) => {
                    const b = peaks(audio.getChannelData(0), 41);
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
/** `load`/`waveKey`: de onde vêm os bytes do áudio e a chave da onda (a Comunidade usa a própria mídia). */
export const Voice: React.FC<{
    m: ChatMessage;
    url: string;
    who: { name: string; avatar: string | null };
    seen: boolean;
    load?: () => Promise<ArrayBuffer>;
    waveKey?: string;
}> = ({ m, url, who, seen, load, waveKey }) => {
    const audio = useRef<HTMLAudioElement>(null);
    const box = useRef<HTMLDivElement>(null);
    const [playing, setPlaying] = useState(false);
    const [pos, setPos] = useState(0);
    const [dur, setDur] = useState(0);
    const bars = useWave(m.id, box, (d) => isFinite(d) && d > 0 && setDur(d), load, waveKey);
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
                <VoiceAvatar src={who.avatar} />
                <Mic size={16} strokeWidth={1.6} className="vmic" aria-hidden />
            </span>
            <button type="button" className="play" aria-label={playing ? 'Pausar' : 'Ouvir'} onClick={toggle}>
                {playing ? (
                    <Pause size={20} fill="currentColor" strokeWidth={0} />
                ) : (
                    <svg viewBox="0 0 16 18" width={15} height={18} aria-hidden>
                        <path
                            d="M1.5 1.6v14.8c0 .9 1 1.5 1.8 1l11.6-7.4c.7-.5.7-1.5 0-2L3.3.6c-.8-.5-1.8.1-1.8 1z"
                            fill="currentColor"
                        />
                    </svg>
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

export const QuoteBlock: React.FC<{ q: ChatQuote; onClick?: () => void; me: string }> = ({ q, onClick, me }) => {
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
/**
 * Celular (toque, sem hover): segurar um balão abre o NOSSO menu (reações, responder, copiar), nunca a seleção de texto
 * do iOS (Copiar/Pesquisar/Traduzir e as alças azuis). No computador a seleção continua normal.
 */
export function useNoNativeSelection() {
    useEffect(() => {
        const touchOnly = () => matchMedia('(hover: none)').matches;
        const onBubble = (t: EventTarget | null) => {
            const el = t instanceof Element ? t : (t as Node | null)?.parentElement;
            return !!el?.closest?.('.bub, .bare, .voice, .msg');
        };
        const block = (e: Event) => {
            if (touchOnly() && onBubble(e.target)) e.preventDefault();
        };
        document.addEventListener('selectstart', block);
        document.addEventListener('contextmenu', block);
        return () => {
            document.removeEventListener('selectstart', block);
            document.removeEventListener('contextmenu', block);
        };
    }, []);
}

/** Copia o texto da mensagem (API da área de transferência; sem ela, o caminho antigo do execCommand). */
export async function copyText(text: string) {
    try {
        await navigator.clipboard.writeText(text);
    } catch {
        const t = document.createElement('textarea');
        t.value = text;
        t.setAttribute('readonly', '');
        t.style.position = 'fixed';
        t.style.opacity = '0';
        document.body.appendChild(t);
        t.select();
        document.execCommand('copy');
        t.remove();
    }
}

export function useRecorder(onDone: (blob: Blob, name: string) => void) {
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
    useNoNativeSelection();
    // a área segura (env(safe-area-inset-bottom)) só existe com viewport-fit=cover; liga só enquanto o chat está aberto
    useEffect(() => {
        const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
        if (!meta || meta.content.includes('viewport-fit')) return;
        const before = meta.content;
        meta.content = `${before}, viewport-fit=cover`;
        return () => {
            meta.content = before;
        };
    }, []);
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
        ro.observe(el); // o campo mudou de altura (área segura, resposta, anexo): continua no fim
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

    const bubble = (m: ChatMessage, first: boolean, last: boolean): React.ReactElement => {
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
                <div className={`bare${big ? ' bigemo' : ''}`} {...touchHandlers(m)}>
                    {quote}
                    {sticker && img ? (
                        <img className="stkimg" src={img.url} alt="Figurinha" loading="lazy" />
                    ) : (
                        <span className="emo">{m.text}</span>
                    )}
                    <Meta m={m} seen={seen} className="chip" />
                </div>
            );

        if (audio && m.text.trim()) {
            if (m.text.trim() === fileName(audio.url, audio.ext)) return bubble({ ...m, text: '' }, first, last);
            return (
                <div className="pair">
                    {bubble({ ...m, files: m.files.filter((f) => f.kind !== 'audio') }, first, false)}
                    {bubble({ ...m, text: '', reply: null }, false, last)}
                </div>
            );
        }

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
                        {/* fechado (404) ou fora do ar: uma linha calma, a saída por e-mail e o campo desligado */}
                        {state === 'error' && (
                            <div className="state" role="status">
                                <p>Suporte indisponível no momento</p>
                                <a href="mailto:hello@mettle.com.br">hello@mettle.com.br</a>
                                <button type="button" className="again" onClick={() => refresh(true)}>
                                    Tentar de novo
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
                                                    {r.m.text && (
                                                        <button
                                                            type="button"
                                                            className="rr"
                                                            role="menuitem"
                                                            aria-label="Copiar"
                                                            onClick={() => {
                                                                copyText(r.m.text);
                                                                setMenuFor(null);
                                                            }}
                                                        >
                                                            <Copy size={17} strokeWidth={1.8} />
                                                        </button>
                                                    )}
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
                        if (state !== 'error') send();
                    }}
                >
                    <fieldset disabled={state === 'error'}>
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
                    </fieldset>
                </form>
            </Wrap>
        </NewPage>
    );
};

export default NewChat;

/* Papel de parede: rabiscos de linha do nosso mundo, densos como o do WhatsApp (desenho próprio), um arquivo por tema em
   public/img/chat-wall-{dark,light}.svg (ladrilho de 400 px; gerado por scripts/chat-wallpaper.py). */
export const Wrap = styled.div`
    /* identidade do WhatsApp nesta página (pedido do André): cores das variáveis públicas do WhatsApp Web
       (--WDS-*, tema padrão de out/2026), papel de parede nosso tingido como o deles; a casca segue Mettle */
    /* neutros medidos na captura do WhatsApp Web do André (calibrados pela nossa captura no mesmo Mac); cores dos tokens */
    --c-wall: #0e0e0e;
    --c-head: #1b1c1c;
    --c-in: #242626; /* systems-bubble-surface-incoming */
    --c-out: #144d37; /* systems-bubble-surface-outgoing */
    --c-out-text: #fafafa;
    --c-chip: #1d1f1f; /* systems-bubble-surface-system (data, reação) */
    --c-meta: rgba(255, 255, 255, 0.6); /* systems-bubble-content-deemphasized */
    --c-read: #53bdeb; /* content-read */
    --c-name-l: 72%;
    --c-quote: rgba(0, 0, 0, 0.2); /* systems-bubble-surface-overlay */
    --c-shadow: 0 1px 0.5px rgba(0, 0, 0, 0.13);
    --c-wallpaper: url('/img/chat-wall-dark.svg');
    --c-pill: #353535;
    --c-pill-line: rgba(255, 255, 255, 0.14);
    --c-accent: #21c063;
    --c-on-accent: #0a0a0a;
    --c-play: rgba(255, 255, 255, 0.6);
    --c-bar: rgba(255, 255, 255, 0.45);
    --c-bar-on: rgba(255, 255, 255, 0.9);
    --c-knob: #ffffff;
    --c-avatar-bg: #6a7175;
    --c-avatar-fg: #cfd4d6;
    /* tokens da Mettle usados pelo CSS do chat, trocados pelos do WhatsApp só aqui dentro */
    --r-text: #fafafa;
    --r-muted: rgba(255, 255, 255, 0.6);
    --r-faint: rgba(255, 255, 255, 0.6);
    --r-line: rgba(255, 255, 255, 0.1);
    --r-hover: rgba(255, 255, 255, 0.06);
    --r-surf: #242626;
    --r-gold: #21c063;
    --r-gold-hi: #21c063;
    --r-on-gold: #0a0a0a;
    --r-bg-rgb: 22, 23, 23;

    ${LIGHT_ROOT} & {
        --c-wall: #f5f1eb;
        --c-head: #f7f5f3;
        --c-in: #ffffff;
        --c-out: #d9fdd3;
        --c-out-text: #0a0a0a;
        --c-chip: rgba(255, 255, 255, 0.9);
        --c-meta: rgba(0, 0, 0, 0.6);
        --c-read: #007bfc;
        --c-name-l: 36%;
        --c-quote: rgba(194, 189, 184, 0.15);
        --c-shadow: 0 1px 0.5px rgba(11, 20, 26, 0.13);
        --c-wallpaper: url('/img/chat-wall-light.svg');
        --c-pill: #ffffff;
        --c-pill-line: transparent;
        --c-accent: #1daa61;
        --c-on-accent: #ffffff;
        --c-play: rgba(0, 0, 0, 0.45);
        --c-bar: rgba(0, 0, 0, 0.25);
        --c-bar-on: rgba(0, 0, 0, 0.55);
        --c-knob: #5b6368;
        --c-avatar-bg: #dfe5e7;
        --c-avatar-fg: #ffffff;
        --r-text: #0a0a0a;
        --r-muted: rgba(0, 0, 0, 0.6);
        --r-faint: rgba(0, 0, 0, 0.6);
        --r-line: rgba(0, 0, 0, 0.1);
        --r-hover: rgba(0, 0, 0, 0.05);
        --r-surf: #ffffff;
        --r-gold: #1daa61;
        --r-gold-hi: #1daa61;
        --r-on-gold: #ffffff;
        --r-bg-rgb: 245, 241, 235;
    }
    /* a pilha de fontes do WhatsApp Web, sem fonte baixada: cada sistema desenha o que o WhatsApp desenha nele (no Mac,
       Helvetica Neue); suavização, peso e espaçamento como os deles, sem herdar o tracking/peso da casca nova */
    font-family: 'Segoe UI Historic', 'Segoe UI', 'Helvetica Neue', Helvetica, 'Lucida Grande', Arial, Ubuntu, Cantarell,
        'Fira Sans', sans-serif;
    font-weight: 400;
    letter-spacing: normal;
    font-feature-settings: normal;
    font-variation-settings: normal;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
    /* celular: o app do WhatsApp no iPhone usa a fonte do sistema */
    @media (max-width: 600px) {
        font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, 'Helvetica Neue', Helvetica,
            sans-serif;
    }
    .txt {
        font-weight: 400;
    }

    --sab: env(safe-area-inset-bottom, 0px);
    @media (display-mode: standalone) and (pointer: coarse) {
        /* app instalado no celular: se o iOS não informar a área segura, reserva a do indicador de início */
        --sab: max(env(safe-area-inset-bottom, 0px), 26px);
    }
    -webkit-tap-highlight-color: transparent;
    .voice {
        -webkit-user-select: none;
        user-select: none;
        -webkit-touch-callout: none;
    }
    @media (hover: none) {
        /* toque: segurar abre o nosso menu, não a seleção do iOS (no computador a seleção continua) */
        .msg,
        .bub,
        .bare {
            -webkit-user-select: none;
            user-select: none;
            -webkit-touch-callout: none;
        }
    }
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    /* papel de parede atrás da conversa E do campo de mensagem (os controles flutuam sobre ele, como no WhatsApp) */
    background-color: var(--c-wall);
    background-image: var(--c-wallpaper);
    background-size: 400px 400px;

    /* ---------- cabeçalho ---------- */
    .hd {
        flex: none;
        display: flex;
        align-items: center;
        gap: 14px;
        height: 55px;
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
        padding: 10px 14px 8px;
    }
    .list > .col {
        display: flex;
        flex-direction: column;
        min-height: 100%;
        justify-content: flex-end;
    }
    .state {
        display: grid;
        justify-items: center;
        gap: 4px;
        margin: auto;
        padding: 0 24px;
        text-align: center;
        font-size: 14px;
        line-height: 1.5;
        color: var(--r-muted);
    }
    .state p {
        color: var(--r-text);
    }
    .state a {
        color: var(--r-gold-hi);
    }
    .state .again {
        min-height: 44px;
        padding: 0 12px;
        border: 0;
        background: none;
        color: var(--r-muted);
        font: inherit;
        text-decoration: underline;
        text-underline-offset: 3px;
        cursor: pointer;
    }
    .composer fieldset {
        min-width: 0;
        margin: 0;
        padding: 0;
        border: 0;
    }
    .composer fieldset:disabled {
        opacity: 0.45;
    }
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
        font-weight: 500;
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
        margin-top: 6px;
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
        margin-bottom: 18px;
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
        padding: 7px 11px 7px;
        border-radius: 12px;
        background: var(--c-in);
        box-shadow: var(--c-shadow);
        color: var(--r-text);
        font-size: 14.2px;
        line-height: 17px;
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
        border-bottom-left-radius: 0;
    }
    /* rabinho do WhatsApp: um entalhe curvo que sai da borda do balão no canto de baixo (4 px sobrepostos ao balão,
       mesma cor: sem emenda) */
    .bub.tail::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: -6px;
        width: 10px;
        height: 16px;
        background: inherit;
        clip-path: path('M10 0 V16 H1.1 C0.2 16 -0.2 15.1 0.6 14.6 C3.6 12.2 6 8.6 6 2 V0 Z');
    }
    .msg.me .bub.tail {
        border-bottom-left-radius: 12px;
        border-bottom-right-radius: 0;
    }
    .msg.me .bub.tail::after {
        left: auto;
        right: -6px;
        clip-path: path('M0 0 V16 H8.9 C9.8 16 10.2 15.1 9.4 14.6 C6.4 12.2 4 8.6 4 2 V0 Z');
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
        padding-right: 52px;
    }
    .sp.me {
        padding-right: 72px;
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
    /* figurinha: a hora fica sobre o canto de baixo da imagem (como no WhatsApp) */
    .tm.chip {
        position: absolute;
        right: 0;
        bottom: 2px;
        margin: 0;
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
        font-size: 12.8px;
        font-weight: 600;
        color: hsl(var(--h) 52% var(--c-name-l));
    }
    .qt {
        min-width: 0;
        font-size: 13.2px;
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
        border-radius: 9px;
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
    /* emoji grande: a hora embaixo, à direita, encostando de leve no emoji (como no WhatsApp) */
    /* emoji grande: a hora embaixo, alinhada ao emoji (à esquerda no recebido, à direita no enviado) */
    .bare.bigemo .tm.chip {
        position: static;
        align-self: auto;
        margin-top: 2px;
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

    /* nota de voz, medidas do WhatsApp Web (captura do André, 1x): balão de 68 px, avatar de 42 com microfone fino
       sobreposto embaixo à direita, play claro de 15 × 18, bolinha branca de 12, barras de 2 px a cada 4 px; duração
       embaixo do começo da onda e hora com vistos no canto, 11 px */
    .bub.vn {
        padding: 12px 10px 14px 12px;
    }
    .pair {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
        min-width: 0;
    }
    .msg.me .pair {
        align-items: flex-end;
    }
    .voice {
        position: relative;
        display: grid;
        grid-template-columns: 58.5px 38px minmax(120px, 1fr);
        align-items: center;
        gap: 0;
        width: min(276px, 62vw);
        height: 42px;
    }
    .play {
        display: grid;
        place-items: center;
        width: 38px;
        height: 38px;
        padding: 0;
        border: 0;
        background: none;
        color: var(--c-play);
        cursor: pointer;
    }
    .wv {
        position: static;
    }
    .bars {
        position: relative;
        display: flex;
        align-items: center;
        gap: 2px;
        height: 20px;
        padding-left: 4px;
        cursor: pointer;
    }
    .bars i {
        flex: none;
        width: 2px;
        min-height: 2px;
        border-radius: 1px;
        background: var(--c-bar);
    }
    .bars i.on {
        background: var(--c-bar-on);
    }
    .bars i.dot {
        height: 2px !important;
    }
    .knob {
        position: absolute;
        top: 50%;
        width: 12px;
        height: 12px;
        margin: -6px 0 0 4px;
        border-radius: 50%;
        background: var(--c-knob);
    }
    .vmeta {
        position: absolute;
        left: 95.5px;
        right: 1px;
        bottom: -14px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 11px;
        line-height: 11px;
        font-variant-numeric: tabular-nums;
        color: var(--c-meta);
    }
    .msg.me .vmeta {
        color: color-mix(in srgb, var(--c-out-text) 62%, transparent);
    }
    .vav {
        position: relative;
        width: 42px;
        height: 42px;
    }
    .vimg {
        display: block;
        width: 42px;
        height: 42px;
        border-radius: 50%;
        object-fit: cover;
    }
    .vmic {
        position: absolute;
        right: -7px;
        bottom: -3px;
        color: var(--c-play);
    }
    .cav {
        flex: none;
        display: block;
        border-radius: 50%;
        object-fit: cover;
    }
    .cav.ini {
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
        bottom: -17px;
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
        /* área segura de baixo (indicador de início do iPhone) + folga, como no WhatsApp */
        padding: 6px 7px calc(var(--sab) + 8px) 9px;
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
    .cbar {
        display: flex;
        align-items: flex-end;
        gap: 8px;
    }
    /* medidas do WhatsApp Web: "+" e microfone de 36 px, campo de 32 px na mesma linha de centro, 8 px entre eles */
    .pillin {
        flex: 1;
        min-width: 0;
        display: flex;
        align-items: flex-end;
        min-height: 32px;
        padding: 0 3px 0 14px;
        border-radius: 16px;
        margin-bottom: 2px;
        background: var(--c-pill);
        border: 1px solid var(--c-pill-line);
        box-shadow: var(--c-shadow);
    }
    .pillin textarea {
        flex: 1;
        min-width: 0;
        min-height: 30px;
        max-height: 132px;
        padding: 5px 0;
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
    .pillin .ib {
        height: 30px;
    }
    .ib.plus {
        width: 36px;
        height: 36px;
        background: var(--c-pill);
        border: 1px solid var(--c-pill-line);
        box-shadow: var(--c-shadow);
        color: var(--r-text);
    }
    .go {
        flex: none;
        display: grid;
        place-items: center;
        width: 36px;
        height: 36px;
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
        height: 32px;
        padding: 0 14px;
        border-radius: 16px;
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
        .bub {
            padding: 8px 12px 8px;
            border-radius: 18px;
            font-size: 16.5px;
            line-height: 22px;
        }
        .tm {
            right: 12px;
        }
        .composer {
            padding: 6px 8px calc(max(var(--sab), 12px) + 8px);
        }
        .replying,
        .chip {
            margin: 2px 4px 6px;
        }
        .cbar {
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
    /* celular: "+" só o ícone, campo de 40 px e microfone redondo de 40 px (proporções do WhatsApp no celular) */
    @media (max-width: 600px) {
        /* nota de voz: as 41 barras (168 px) cabem no balão do iPhone; abaixo de 390 px a onda é recortada
           (mesma correção da Comunidade, fe #156) */
        .voice {
            width: min(276px, 68vw);
        }
        .bars {
            overflow: hidden;
        }
        .ib.plus {
            width: 36px;
            height: 40px;
            background: none;
            border: 0;
            box-shadow: none;
        }
        .pillin {
            margin-bottom: 0;
            min-height: 40px;
            border-radius: 20px;
            padding-left: 14px;
        }
        .pillin textarea {
            min-height: 38px;
            padding: 9px 0;
        }
        .pillin .ib {
            height: 38px;
        }
        .go {
            width: 40px;
            height: 40px;
        }
        .rec {
            height: 40px;
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
