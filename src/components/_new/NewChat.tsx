'use client';

import styled from '@emotion/styled';
import { useQueryClient } from '@tanstack/react-query';
import { CHAT_UNREAD_KEY } from 'hooks/useChatUnread';
import {
    type ChatMessage,
    type ChatPage,
    chatRows,
    contextPrefill,
    formatSize,
    linkParts,
    mergeMessages,
    timeLabel,
} from 'libs/chat';
import { ArrowUp, Check, CheckCheck, Clock, FileText, Mic, Paperclip, RotateCw, Square, X } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { chatFetch, sendChat } from 'services/chatService';
import { NewPage } from './NewPage';

const SMALL = { size: 18, strokeWidth: 1.5 } as const;
const ACCEPT = 'image/png,image/jpeg,image/gif,image/webp,image/heic,application/pdf';
const MAX_FILE = 15 * 1024 * 1024;

const initials = (name: string) =>
    name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join('');

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

const Files: React.FC<{ m: ChatMessage }> = ({ m }) => (
    <>
        {m.files.map((f, i) =>
            f.kind === 'image' ? (
                <a key={i} className="img" href={f.url} target="_blank" rel="noopener noreferrer">
                    <img src={f.thumb || f.url} alt="Imagem" loading="lazy" />
                </a>
            ) : f.kind === 'audio' ? (
                <audio key={i} className="aud" src={f.url} controls preload="metadata" />
            ) : (
                <a key={i} className="file" href={f.url} target="_blank" rel="noopener noreferrer">
                    <FileText {...SMALL} aria-hidden />
                    <span>{(f.ext || 'arquivo').toUpperCase()}</span>
                    <span className="sz">{formatSize(f.size)}</span>
                </a>
            ),
        )}
    </>
);

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
        mr.current?.state === 'recording' && mr.current.stop();
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
                    changed = next.length !== cur.length || next.some((m, i) => m !== cur[i] && m.id !== cur[i]?.id);
                    return next;
                });
                setTeamSeenAt(page.teamSeenAt);
                if (first) {
                    setMore(page.more);
                    setWs(page.ws);
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
            const user = data.user as { type?: string; available_name?: string; name?: string } | undefined;
            if (user?.type !== 'user') return;
            setTyping(event === 'conversation.typing_on' ? user.available_name || user.name || 'Mettle' : null);
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
    }, [messages, typing, state]);

    const loadOlder = async () => {
        const oldest = messages.find((m) => !m.pending);
        if (!oldest || olderLoading) return;
        setOlderLoading(true);
        try {
            const page = await chatFetch<ChatPage>(`?before=${oldest.id}`);
            keepFrom.current = list.current ? list.current.scrollHeight - list.current.scrollTop : null;
            setMessages((cur) => mergeMessages(cur, page.messages));
            setMore(page.more);
        } catch {
            // tenta de novo no próximo clique
        } finally {
            setOlderLoading(false);
        }
    };

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

    const deliver = async (m: ChatMessage, blob: Blob | null, name?: string) => {
        try {
            const { message } = await sendChat(m.text, blob, name);
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
    const retry = useRef(new Map<number, { blob: Blob | null; name?: string }>());

    const send = (blob: Blob | null = file, name?: string) => {
        const body = blob && blob !== file ? '' : text.trim();
        if (!body && !blob) return;
        const local = blob ? URL.createObjectURL(blob) : '';
        const kind = blob?.type.startsWith('image/') ? 'image' : blob?.type.startsWith('audio/') ? 'audio' : 'file';
        const m: ChatMessage = {
            id: tempId.current--,
            at: Math.floor(Date.now() / 1000),
            mine: true,
            text: body,
            from: null,
            files: blob
                ? [
                      {
                          kind,
                          url: local,
                          thumb: null,
                          size: blob.size,
                          ext: (name ?? (blob as File).name ?? '').split('.').pop() ?? null,
                      },
                  ]
                : [],
            pending: 'sending',
        };
        retry.current.set(m.id, { blob, name });
        stick.current = true;
        setMessages((cur) => [...cur, m]);
        if (!blob || blob === file) {
            setText('');
            setFile(null);
        }
        clearTimeout(typingOff.current);
        typingOn.current = 0;
        idle.current = 0;
        deliver(m, blob, name);
        input.current?.focus();
    };
    const resend = (m: ChatMessage) => {
        const r = retry.current.get(m.id);
        setMessages((cur) => cur.map((x) => (x.id === m.id ? { ...x, pending: 'sending' } : x)));
        deliver(m, r?.blob ?? null, r?.name);
    };

    const recorder = useRecorder((blob, name) => send(blob, name));

    const pick = (f: File | undefined) => {
        setFileError('');
        if (!f) return;
        if (f.size > MAX_FILE) return setFileError('Arquivo acima de 15 MB.');
        if (!/^(image\/|application\/pdf)/.test(f.type)) return setFileError('Envie imagem ou PDF.');
        setFile(f);
        input.current?.focus();
    };

    // altura do campo acompanha o texto (até ~6 linhas)
    useLayoutEffect(() => {
        const el = input.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 148)}px`;
    }, [text]);

    const rows = useMemo(() => chatRows(messages), [messages]);
    const lastMine = useMemo(() => [...messages].reverse().find((m) => m.mine && !m.pending), [messages]);
    const team = useMemo(() => {
        const seen = new Map<string, string | null>();
        messages.forEach(
            (m) => m.from && m.from.name !== 'Mettle' && !seen.has(m.from.name) && seen.set(m.from.name, m.from.avatar),
        );
        return [...seen.entries()].slice(-3);
    }, [messages]);

    const canSend = !!text.trim() || !!file;

    return (
        <NewPage className="lesson fill">
            <Wrap>
                <header className="hd">
                    <div className="who">
                        <h1>Suporte</h1>
                        <span className="sub">Equipe Mettle</span>
                    </div>
                    {team.length > 0 && (
                        <div className="team" aria-hidden>
                            {team.map(([name, avatar]) => (
                                <Avatar key={name} name={name} src={avatar} size={26} />
                            ))}
                        </div>
                    )}
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
                        {state === 'loading' && <div className="state" />}
                        {state === 'error' && (
                            <div className="state">
                                <p>Não foi possível abrir a conversa.</p>
                                <button type="button" className="btn line" onClick={() => refresh(true)}>
                                    Tentar de novo
                                </button>
                            </div>
                        )}
                        {state === 'ready' && more && (
                            <button type="button" className="older" onClick={loadOlder} disabled={olderLoading}>
                                {olderLoading ? 'Carregando…' : 'Mensagens anteriores'}
                            </button>
                        )}
                        {state === 'ready' && messages.length === 0 && (
                            <div className="state empty">
                                <p>Escreva para a equipe Mettle.</p>
                            </div>
                        )}
                        {rows.map((r) =>
                            r.type === 'day' ? (
                                <div key={r.key} className="day">
                                    <span>{r.label}</span>
                                </div>
                            ) : (
                                <div
                                    key={r.key}
                                    className={`msg${r.m.mine ? ' me' : ''}${r.first ? ' first' : ''}${r.last ? ' last' : ''}`}
                                >
                                    {!r.m.mine && (
                                        <div className="side">
                                            {r.first && <Avatar name={r.m.from!.name} src={r.m.from!.avatar} />}
                                        </div>
                                    )}
                                    <div className="stack">
                                        {!r.m.mine && r.first && <span className="name">{r.m.from!.name}</span>}
                                        <div className={`bub${r.m.files.length && !r.m.text ? ' bare' : ''}`}>
                                            {r.m.files.length > 0 && <Files m={r.m} />}
                                            {r.m.text && (
                                                <p className="txt">
                                                    <Text text={r.m.text} />
                                                </p>
                                            )}
                                            <span className="tm">
                                                {timeLabel(r.m.at)}
                                                {r.m.mine &&
                                                    (r.m.pending === 'sending' ? (
                                                        <Clock size={12} strokeWidth={1.75} aria-label="Enviando" />
                                                    ) : r.m.pending ? null : teamSeenAt >= r.m.at ? (
                                                        <CheckCheck
                                                            size={13}
                                                            strokeWidth={1.75}
                                                            className="seen"
                                                            aria-label="Visto"
                                                        />
                                                    ) : (
                                                        <Check size={13} strokeWidth={1.75} aria-label="Enviado" />
                                                    ))}
                                            </span>
                                        </div>
                                        {r.m.pending === 'failed' && (
                                            <button type="button" className="fail" onClick={() => resend(r.m)}>
                                                <RotateCw size={13} strokeWidth={1.75} aria-hidden /> Não enviada ·
                                                tentar de novo
                                            </button>
                                        )}
                                        {r.m === lastMine && r.last && teamSeenAt >= r.m.at && (
                                            <span className="seenl">Visto</span>
                                        )}
                                    </div>
                                </div>
                            ),
                        )}
                        {typing && (
                            <div className="msg first last">
                                <div className="side" />
                                <div className="stack">
                                    <div className="bub typing" aria-label={`${typing} está digitando`}>
                                        <i />
                                        <i />
                                        <i />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <form
                    className="composer"
                    onSubmit={(e) => {
                        e.preventDefault();
                        send();
                    }}
                >
                    <div className="col">
                        {(file || fileError) && (
                            <div className="chip">
                                {file ? (
                                    <>
                                        {file.type.startsWith('image/') ? (
                                            <span className="dot" />
                                        ) : (
                                            <FileText {...SMALL} aria-hidden />
                                        )}
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
                                    <X size={16} strokeWidth={1.5} />
                                </button>
                            </div>
                        )}
                        <div className="bar">
                            {recorder.recording ? (
                                <>
                                    <button
                                        type="button"
                                        className="ib"
                                        aria-label="Descartar áudio"
                                        onClick={() => recorder.stop(true)}
                                    >
                                        <X {...SMALL} />
                                    </button>
                                    <div className="rec" role="status">
                                        <span className="pulse" />
                                        {Math.floor(recorder.secs / 60)}:{String(recorder.secs % 60).padStart(2, '0')}
                                    </div>
                                    <button
                                        type="button"
                                        className="go"
                                        aria-label="Enviar áudio"
                                        onClick={() => recorder.stop()}
                                    >
                                        <Square size={14} strokeWidth={2} fill="currentColor" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        className="ib"
                                        aria-label="Anexar imagem ou PDF"
                                        onClick={() => fileInput.current?.click()}
                                    >
                                        <Paperclip {...SMALL} />
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
                                    <textarea
                                        ref={input}
                                        rows={1}
                                        value={text}
                                        placeholder="Mensagem"
                                        aria-label="Mensagem"
                                        maxLength={4000}
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
                                    {canSend || !recorder.supported ? (
                                        <button type="submit" className="go" aria-label="Enviar" disabled={!canSend}>
                                            <ArrowUp {...SMALL} strokeWidth={2} />
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            className="ib mic"
                                            aria-label="Gravar áudio"
                                            onClick={recorder.start}
                                        >
                                            <Mic {...SMALL} />
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </form>
            </Wrap>
        </NewPage>
    );
};

export default NewChat;

const COL = 'min(760px, 100%)';

const Wrap = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;

    .col {
        width: ${COL};
        margin: 0 auto;
    }

    /* ---------- cabeçalho ---------- */
    .hd {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        width: ${COL};
        margin: 0 auto;
        padding: 22px 20px 14px;
        border-bottom: 1px solid var(--r-line);
    }
    .hd h1 {
        margin: 0;
        font-size: 19px;
        font-weight: 500;
        letter-spacing: -0.01em;
        color: var(--r-text);
    }
    .hd .sub {
        font-size: 12.5px;
        color: var(--r-muted);
    }
    .team {
        display: flex;
    }
    .team .av + .av {
        margin-left: -6px;
    }
    .team .av {
        box-shadow: 0 0 0 2px var(--r-bg);
    }

    /* ---------- conversa ---------- */
    .list {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        overscroll-behavior: contain;
        padding: 8px 20px 12px;
    }
    .list > .col {
        display: flex;
        flex-direction: column;
        min-height: 100%;
        justify-content: flex-end;
    }
    .state {
        margin: auto;
        padding: 40px 0;
        text-align: center;
        color: var(--r-muted);
        display: grid;
        gap: 14px;
        justify-items: center;
    }
    .state p {
        margin: 0;
    }
    .older {
        align-self: center;
        margin: 10px 0 6px;
        padding: 6px 14px;
        border: 1px solid var(--r-line);
        border-radius: 999px;
        background: none;
        color: var(--r-muted);
        font-size: 12.5px;
        cursor: pointer;
    }
    .older:hover:not(:disabled) {
        color: var(--r-text);
        border-color: var(--r-line-strong);
    }
    .day {
        display: flex;
        justify-content: center;
        margin: 18px 0 8px;
    }
    .day span {
        font-size: 11px;
        letter-spacing: var(--r-label-track);
        text-transform: uppercase;
        color: var(--r-faint);
    }

    .msg {
        display: flex;
        gap: 8px;
        margin-top: 2px;
    }
    .msg.first {
        margin-top: 10px;
    }
    .msg.me {
        justify-content: flex-end;
    }
    .side {
        flex: none;
        width: 28px;
        display: flex;
        align-items: flex-start;
        padding-top: 18px;
    }
    .stack {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        max-width: min(78%, 560px);
        min-width: 0;
    }
    .msg.me .stack {
        align-items: flex-end;
    }
    .name {
        margin: 0 0 3px 2px;
        font-size: 12px;
        color: var(--r-muted);
    }
    .av {
        flex: none;
        border-radius: 50%;
        object-fit: cover;
    }
    .av.ini {
        display: inline-grid;
        place-items: center;
        background: var(--r-surf);
        border: 1px solid var(--r-line);
        color: var(--r-muted);
        font-weight: 500;
    }

    .bub {
        position: relative;
        display: grid;
        gap: 6px;
        max-width: 100%;
        padding: 8px 12px 6px;
        border-radius: 16px;
        background: var(--r-surf);
        border: 1px solid var(--r-line);
        color: var(--r-text);
        line-height: 1.45;
        overflow-wrap: anywhere;
    }
    .msg:not(.me).first .bub {
        border-top-left-radius: 6px;
    }
    .msg.me .bub {
        background: var(--r-gold-tint);
        border-color: transparent;
    }
    .msg.me.first .bub {
        border-top-right-radius: 6px;
    }
    .bub.bare {
        padding: 4px 4px 6px;
    }
    .txt {
        margin: 0;
        white-space: pre-wrap;
    }
    .txt a {
        color: var(--r-gold-hi);
        text-decoration: underline;
        text-underline-offset: 2px;
    }
    .tm {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        justify-self: end;
        margin: -2px -2px 0 12px;
        font-size: 10.5px;
        font-variant-numeric: tabular-nums;
        color: var(--r-faint);
    }
    .bub.bare .tm {
        margin-right: 6px;
    }
    .tm .seen {
        color: var(--r-gold-hi);
    }
    .seenl {
        margin: 3px 4px 0 0;
        font-size: 11px;
        color: var(--r-faint);
    }
    .fail {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        margin-top: 4px;
        padding: 0;
        border: 0;
        background: none;
        color: var(--r-danger);
        font-size: 12px;
        cursor: pointer;
    }

    .img {
        display: block;
        border-radius: 12px;
        overflow: hidden;
    }
    .img img {
        display: block;
        max-width: min(320px, 100%);
        max-height: 320px;
        object-fit: cover;
    }
    .aud {
        width: min(280px, 64vw);
        height: 36px;
    }
    .file {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        border-radius: 10px;
        background: var(--r-hover);
        color: var(--r-text);
        text-decoration: none;
        font-size: 13px;
    }
    .file .sz {
        color: var(--r-muted);
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

    /* ---------- escrever ---------- */
    .composer {
        flex: none;
        padding: 8px 20px max(14px, env(safe-area-inset-bottom));
        background: var(--r-bg);
    }
    .chip {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0 0 8px;
        padding: 6px 6px 6px 12px;
        border: 1px solid var(--r-line);
        border-radius: 12px;
        background: var(--r-surf);
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
    .chip .dot {
        width: 8px;
        height: 8px;
        border-radius: 2px;
        background: var(--r-gold);
    }
    .bar {
        display: flex;
        align-items: flex-end;
        gap: 4px;
        padding: 4px;
        border: 1px solid var(--r-line-strong);
        border-radius: 24px;
        background: var(--r-surf);
        transition: border-color var(--r-ease);
    }
    .bar:focus-within {
        border-color: var(--r-gold);
    }
    .bar textarea {
        flex: 1;
        min-width: 0;
        min-height: 40px;
        max-height: 148px;
        padding: 10px 6px;
        border: 0;
        outline: none;
        resize: none;
        background: none;
        color: var(--r-text);
        font: inherit;
        line-height: 20px;
    }
    .bar textarea::placeholder {
        color: var(--r-faint);
    }
    .ib,
    .go {
        flex: none;
        display: inline-grid;
        place-items: center;
        width: 40px;
        height: 40px;
        border: 0;
        border-radius: 50%;
        background: none;
        color: var(--r-muted);
        cursor: pointer;
    }
    .ib:hover {
        color: var(--r-text);
        background: var(--r-hover);
    }
    .go {
        background: var(--r-gold);
        color: var(--r-on-gold);
    }
    .go:hover:not(:disabled) {
        background: var(--r-gold-hi);
    }
    .go:disabled {
        background: var(--r-track);
        color: var(--r-faint);
        cursor: default;
    }
    .rec {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 10px;
        height: 40px;
        padding: 0 6px;
        font-variant-numeric: tabular-nums;
        color: var(--r-text);
    }
    .rec .pulse {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--r-danger);
        animation: chat-dot 1.2s ease-in-out infinite;
    }

    @media (max-width: 860px) {
        .hd {
            padding: 12px 16px 10px;
        }
        .hd h1 {
            font-size: 16px;
        }
        .list {
            padding: 4px 12px 8px;
        }
        .composer {
            padding: 6px 10px max(10px, env(safe-area-inset-bottom));
        }
        .stack {
            max-width: 84%;
        }
        /* iOS não amplia a página ao focar um campo de 16 px */
        .bar textarea {
            font-size: 16px;
        }
    }
    @media (prefers-reduced-motion: reduce) {
        .typing i,
        .rec .pulse {
            animation: none;
        }
    }
`;
