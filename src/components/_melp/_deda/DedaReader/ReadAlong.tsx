'use client';

import { css, Global } from '@emotion/react';
import styled from '@emotion/styled';
import { auth } from 'config/firebase';
import { useDeda } from 'hooks/queries/dedaQueries';
import { useNewDesign } from 'hooks/useNewDesign';
import { DedaListenQueryResponse } from 'interfaces';
import {
    Alignment,
    alignUrlFor,
    Block,
    blockAt,
    blocksOf,
    isUsableAlignment,
    isUsableOwnAlignment,
    lineRects,
    markBox,
    OwnAlignment,
    ownAlignUrl,
    ownTimeline,
    rangeIndexAt,
    READALONG_MODES,
    ReadAlongMode,
    wordAt,
    wordRanges,
    wordsAndGaps,
} from 'libs/readAlong';
import { Highlighter } from 'lucide-react';
import React, { ReactNode, useEffect, useRef, useState, useSyncExternalStore } from 'react';

const HIGHLIGHT = 'deda-readalong';
/** Palavra dita dentro do bloco (modos Phrase e Sentence): sublinhado fino, na cor do texto sobre o amarelo. */
const HIGHLIGHT_WORD = 'deda-readalong-word';

// ---------- "My reading": qual gravação do aluno está no player (publicada pelo TwoTrackPlayer) ----------

type MyReading = { recordingId: string; uid: string; url: string } | null;
let myReading: MyReading = null;
const myListeners = new Set<() => void>();
/** O player de duas faixas avisa qual gravação "My reading" está tocando (ou null). */
export const publishMyReading = (next: MyReading) => {
    if (next?.recordingId === myReading?.recordingId && next?.url === myReading?.url && next?.uid === myReading?.uid)
        return;
    myReading = next;
    myListeners.forEach((l) => l());
};
const useMyReading = () =>
    useSyncExternalStore(
        (l) => {
            myListeners.add(l);
            return () => void myListeners.delete(l);
        },
        () => myReading,
        () => null,
    );

// ---------- modo (Word · Phrase · Sentence): por aparelho, padrão Phrase ----------

const MODE_KEY = 'deda-readalong-mode';
const LABEL: Record<ReadAlongMode, string> = { word: 'Word', phrase: 'Phrase', sentence: 'Sentence' };
type ModeState = { mode: ReadAlongMode; available: boolean };
const SERVER_STATE: ModeState = { mode: 'phrase', available: false };
let modeState: ModeState | null = null;
const listeners = new Set<() => void>();
const getModeState = (): ModeState => {
    if (!modeState) {
        let saved: string | null = null;
        try {
            saved = localStorage.getItem(MODE_KEY);
        } catch {
            // armazenamento bloqueado: fica o padrão
        }
        modeState = { mode: READALONG_MODES.find((m) => m === saved) ?? 'phrase', available: false };
    }
    return modeState;
};
const setModeState = (next: Partial<ModeState>) => {
    modeState = { ...getModeState(), ...next };
    listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
    listeners.add(l);
    return () => void listeners.delete(l);
};
const useModeState = () => useSyncExternalStore(subscribe, getModeState, () => SERVER_STATE);

// Pílula baixa e leve, igual a "My reading | Original" da barra (30 px de altura, toque de 44 px).
const Modes = styled.div`
    position: relative;
    && {
        flex: none;
    }
    .ramodes-seg {
        display: flex;
        padding: 2px;
        border: 1px solid var(--r-line);
        border-radius: 999px;
    }
    .ramodes-seg button {
        position: relative;
        min-height: 30px;
        padding: 0 12px;
        border: 0;
        border-radius: 999px;
        background: none;
        color: var(--r-muted);
        font: inherit;
        font-size: 13px;
        letter-spacing: 0.01em;
        white-space: nowrap;
        cursor: pointer;
    }
    .ramodes-seg button::after {
        content: '';
        position: absolute;
        inset: -8px 0;
    }
    .ramodes-seg button[aria-pressed='true'] {
        background: var(--r-gold-tint);
        color: var(--r-gold-hi);
    }
    button:focus-visible {
        outline: 2px solid var(--r-gold-hi);
        outline-offset: 2px;
    }
    .ramodes-icon {
        display: none;
    }
    @media (max-width: 860px) {
        .ramodes-icon {
            position: relative;
            display: grid;
            place-items: center;
            width: 34px;
            height: 34px;
            padding: 0;
            border: 1px solid var(--r-line);
            border-radius: 999px;
            background: none;
            color: var(--r-gold-hi);
            cursor: pointer;
        }
        .ramodes-icon::after {
            content: '';
            position: absolute;
            inset: -5px;
        }
        &.open .ramodes-icon {
            background: var(--r-gold-tint);
        }
        .ramodes-seg {
            display: none;
        }
        /* aberto: o segmento sobe por cima do texto, alinhado à direita do ícone; a barra não muda de altura */
        &.open .ramodes-seg {
            display: flex;
            position: absolute;
            bottom: calc(100% + 10px);
            right: 0;
            z-index: 5;
            background: var(--r-sheet);
            box-shadow: 0 6px 24px var(--r-card-shadow);
        }
    }
`;

/**
 * Seletor do read-along no passo 4, ao lado de "My reading | Original". Só aparece quando há tempos para o DEDA.
 * No celular vira um ícone que abre o mesmo segmento (a barra não cresce).
 */
export const ReadAlongModes = () => {
    const { mode, available } = useModeState();
    const [open, setOpen] = useState(false);
    if (!available) return null;
    const choose = (m: ReadAlongMode) => {
        try {
            localStorage.setItem(MODE_KEY, m);
        } catch {
            // sem armazenamento: vale só nesta visita
        }
        setModeState({ mode: m });
        setOpen(false);
    };
    return (
        <Modes className={open ? 'open' : undefined}>
            <button
                type="button"
                className="ramodes-icon"
                aria-expanded={open}
                aria-label={`Highlight: ${LABEL[mode]}`}
                onClick={() => setOpen(!open)}
            >
                <Highlighter size={16} strokeWidth={1.5} aria-hidden />
            </button>
            <div className="ramodes-seg" role="group" aria-label="Highlight">
                {READALONG_MODES.map((m) => (
                    <button key={m} type="button" aria-pressed={mode === m} onClick={() => choose(m)}>
                        {LABEL[m]}
                    </button>
                ))}
            </div>
        </Modes>
    );
};

// A métrica do texto não muda (nada de negrito) e o DOM do texto também não: ::highlight só escurece a palavra; o
// fundo amarelo é uma marca à parte, atrás do texto, centrada nas letras (o fundo do ::highlight ocupa a caixa da
// fonte inteira e, com a entrelinha alta, fica mais para cima do que a palavra).
const highlightStyle = css`
    ::highlight(${HIGHLIGHT}) {
        color: var(--r-readalong-text, #1d1a17);
    }
    ::highlight(${HIGHLIGHT_WORD}) {
        color: var(--r-readalong-text, #1d1a17);
        text-decoration: underline;
        text-decoration-thickness: 0.07em;
        text-underline-offset: 0.18em;
        text-decoration-color: var(--r-readalong-text, #1d1a17);
    }
`;

const Box = styled.div`
    position: relative;
    > .ra-marks {
        position: absolute;
        inset: 0;
        z-index: 0;
        pointer-events: none;
    }
    > .ra-marks i {
        position: absolute;
        border-radius: 0.22em;
        /* marca-texto amarelo (themes/palette: --r-readalong) */
        background: var(--r-readalong, rgba(255, 214, 10, 0.88));
    }
    /* "My reading": palavra lida com outra no lugar, no trecho que está tocando — a mesma marca, em vermelho
       (texto escuro do destaque: 6,2:1 no claro, 4,7:1 no escuro) */
    > .ra-marks i.miss {
        background: rgba(255, 90, 74, 0.88);
    }
    /* troca de bloco: o novo aparece e o anterior some em ~120 ms (sem movimento com prefers-reduced-motion) */
    > .ra-marks i.in {
        animation: ra-in 120ms ease-out;
    }
    > .ra-marks i.out {
        opacity: 0;
        transition: opacity 120ms ease-out;
    }
    @keyframes ra-in {
        from {
            opacity: 0;
        }
    }
    @media (prefers-reduced-motion: reduce) {
        > .ra-marks i.in {
            animation: none;
        }
        > .ra-marks i.out {
            display: none;
        }
    }
    > .ra-text {
        position: relative;
        z-index: 1;
    }
`;

let canvas: HTMLCanvasElement | null = null;
/** Medidas da fonte do texto (tamanho, ascendente da caixa e altura das maiúsculas), pelo canvas. */
const fontOf = (el: Element) => {
    const cs = getComputedStyle(el);
    canvas = canvas ?? document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const size = parseFloat(cs.fontSize) || 16;
    if (!ctx) return { size, ascent: size * 0.95, cap: size * 0.7 };
    ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const m = ctx.measureText('H');
    return { size, ascent: m.fontBoundingBoxAscent || size * 0.95, cap: m.actualBoundingBoxAscent || size * 0.7 };
};

const FollowButton = styled.button`
    position: sticky;
    bottom: 12px;
    display: block;
    margin: 8px auto 0;
    padding: 6px 14px;
    border: 1px solid var(--r-line-strong);
    border-radius: 999px;
    background: var(--r-surf);
    color: var(--r-text);
    font: inherit;
    font-size: var(--r-ui-size, 14.5px);
    cursor: pointer;
`;

type HighlightRegistry = Map<string, unknown>;
const highlights = (): HighlightRegistry | null =>
    typeof CSS !== 'undefined' && 'highlights' in CSS && typeof Highlight !== 'undefined'
        ? (CSS as unknown as { highlights: HighlightRegistry }).highlights
        : null;

/** O <audio> do original (mesma URL), se estiver na faixa visível — "My reading" fica de fora. */
const findOriginal = (audioUrl: string): HTMLAudioElement | null => {
    for (const a of Array.from(document.querySelectorAll('audio'))) {
        if ((a.currentSrc || a.src) === audioUrl && !a.closest('[hidden]')) return a;
    }
    return null;
};

/**
 * Read-along do passo 4 (piloto, conta do dono): com o áudio original tocando, o trecho dito ganha um fundo amarelo,
 * centrado nas letras — a palavra (Word), o bloco de sentido (Phrase, padrão) ou a sentença (Sentence); nos dois
 * últimos a palavra dita leva um sublinhado fino. A rolagem acompanha (início do bloco no terço superior) até o aluno
 * rolar por conta própria — aí aparece "Follow". Tocar numa palavra leva o áudio até ela (Phrase/Sentence: ao começo
 * do bloco). Sem tempos publicados para o DEDA (ou outra faixa): nada muda.
 */
export const ReadAlong = ({ dedaId, children }: { dedaId: string; children: ReactNode }) => {
    const allowed = useNewDesign();
    const { data } = useDeda<DedaListenQueryResponse>('deda-listen', dedaId);
    const audioUrl = data?.dedaContentCollection?.items[0]?.dedaListenAudioMedia?.url ?? '';
    const url = allowed ? alignUrlFor(audioUrl, dedaId) : null;
    const box = useRef<HTMLDivElement>(null);
    const [align, setAlign] = useState<Alignment | null>(null);
    const mine = useMyReading();
    const [own, setOwn] = useState<OwnAlignment | null>(null);
    const [follow, setFollow] = useState(true);
    const [active, setActive] = useState(false);
    const followRef = useRef(true);
    followRef.current = follow;
    const ranges = useRef<Range[]>([]);
    const current = useRef(-1);
    const { mode } = useModeState();
    const modeRef = useRef(mode);
    modeRef.current = mode;
    const scrollNow = useRef<() => void>(() => undefined);
    const marks = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setAlign(null);
        if (!url || !highlights()) return;
        const ctrl = new AbortController();
        fetch(url, { signal: ctrl.signal })
            .then((r) => (r.ok ? r.json() : null))
            .then((json) => json && setAlign(json))
            .catch(() => undefined); // sem tempos: o passo fica como sempre foi
        return () => ctrl.abort();
    }, [url]);

    // "My reading": tempos da própria gravação (Worker; só o dono e a equipe). Sem tempos ainda: toca sem destaque.
    useEffect(() => {
        setOwn(null);
        if (!allowed || !mine || !highlights()) return;
        const ctrl = new AbortController();
        auth.currentUser
            ?.getIdToken()
            .then((token) =>
                fetch(ownAlignUrl(mine.uid, mine.recordingId), {
                    headers: { Authorization: `Bearer ${token}` },
                    cache: 'no-store',
                    signal: ctrl.signal,
                }),
            )
            .then((r) => (r.ok ? r.json() : null))
            .then((json) => json && !json.noReading && setOwn(json))
            .catch(() => undefined);
        return () => ctrl.abort();
    }, [allowed, mine]);

    useEffect(() => {
        const registry = highlights();
        const prose = () => box.current?.querySelector('.prose');
        if ((!align && !own) || !registry) return;
        const hl = new Highlight();
        const hlWord = new Highlight();
        registry.set(HIGHLIGHT, hl);
        registry.set(HIGHLIGHT_WORD, hlWord);
        const ownLine = own ? ownTimeline(own.words) : null;
        const missed = new Set(own?.miss ?? []);
        let okOwn = false; // tempos da gravação conferem com o texto?
        let source: 'original' | 'mine' | null = null; // faixa à vista que manda no destaque
        let line: [number, number][] = align?.words ?? [];
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let raf = 0;
        let audio: HTMLAudioElement | null = null;
        let lastLookup = 0;
        let ok: boolean | null = null; // texto confere com os tempos? (contagem igual)
        let runs: string[] = [];
        let blocks: Block[] = [];
        let blocksMode: ReadAlongMode | null = null;
        let word = -1; // palavra dita (current.current = bloco)

        const sync = () => {
            const root = prose();
            if (!root) return false;
            const stale = !ranges.current.length || !ranges.current[0].startContainer.isConnected;
            if (stale) {
                ({ ranges: ranges.current, runs } = wordRanges(root));
                ok = !!align && isUsableAlignment(align, dedaId, audioUrl, ranges.current.length);
                okOwn = !!own && isUsableOwnAlignment(own, dedaId, ranges.current.length);
                setModeState({ available: ok || okOwn });
                current.current = -1;
                source = null; // faixas novas: escolhe a fonte (e as marcas de "My reading") de novo
                lastLookup = 0;
                blocksMode = null;
            }
            if ((ok || okOwn) && blocksMode !== modeRef.current) {
                const { words, gaps } = wordsAndGaps(runs);
                blocksMode = modeRef.current;
                blocks = blocksOf(words, gaps, blocksMode);
                current.current = -1;
            }
            return !!ok || okOwn;
        };

        /** Faixas do bloco b, uma por nó de texto (palavra a palavra, com a pontuação entre elas). */
        const blockRanges = (b: number): Range[] => {
            const out: Range[] = [];
            const [s, e] = blocks[b] ?? [0, -1];
            for (let k = s; k <= e; k++) {
                const r = ranges.current[k];
                const prev = out[out.length - 1];
                if (prev && prev.endContainer === r.startContainer) prev.setEnd(r.endContainer, r.endOffset);
                else out.push(r.cloneRange());
            }
            return out;
        };

        const scrollTo = (i: number, force = false) => {
            const scroller = box.current?.closest('.scroll');
            const r = ranges.current[i]?.getBoundingClientRect();
            if (!scroller || !r) return;
            const s = scroller.getBoundingClientRect();
            const y = r.top - s.top;
            if (force || y < s.height * 0.08 || y > s.height * 0.5)
                scroller.scrollTo({
                    top: scroller.scrollTop + y - s.height / 3,
                    behavior: reduced ? 'auto' : 'smooth',
                });
        };

        // marca amarela do bloco atual (uma faixa por linha visual), em coordenadas do contêiner (rola junto com o
        // texto). `fade`: troca de bloco nos modos Phrase/Sentence; no Word a marca anda sem transição, como antes.
        const place = (b: number, fade = false) => {
            const layer = marks.current;
            const origin = box.current?.getBoundingClientRect();
            if (!layer || !origin) return;
            if (fade && !reduced) {
                const old = Array.from(layer.children);
                old.forEach((m) => m.classList.add('out'));
                setTimeout(() => old.forEach((m) => m.remove()), 160);
            } else layer.replaceChildren();
            const parts = b >= 0 ? blockRanges(b) : [];
            const el = parts[0]?.startContainer.parentElement;
            if (!el) return;
            const font = fontOf(el);
            const draw = (rs: Range[], cls: string) => {
                const rects = rs.flatMap((r) => Array.from(r.getClientRects()));
                for (const line of lineRects(rects, font.size / 2)) {
                    const m = markBox(line, origin, font);
                    const mark = document.createElement('i');
                    mark.className = [cls, fade ? 'in' : ''].filter(Boolean).join(' ');
                    mark.style.cssText = `left:${m.left}px;top:${m.top}px;width:${m.width}px;height:${m.height}px`;
                    layer.appendChild(mark);
                }
            };
            // "My reading": as palavras trocadas do trecho atual ganham a mesma marca em vermelho, por cima do amarelo;
            // no modo Word, a própria palavra fica só vermelha. Fora do trecho que está tocando, nada de vermelho.
            const [s, e] = blocks[b] ?? [0, -1];
            const miss =
                source === 'mine'
                    ? Array.from({ length: e - s + 1 }, (_, n) => s + n).filter((k) => missed.has(k))
                    : [];
            if (!(blocksMode === 'word' && miss.length)) draw(parts, '');
            if (miss.length) draw(miss.map((k) => ranges.current[k]).filter(Boolean), 'miss');
        };
        // "Aa", largura da janela, celular girado: a palavra muda de lugar — a marca vai junto
        const layerAtStart = marks.current;
        const resize = new ResizeObserver(() => current.current >= 0 && place(current.current));
        if (box.current) resize.observe(box.current);

        const tick = (now: number) => {
            raf = requestAnimationFrame(tick);
            const ready = sync(); // também liga o seletor de modo assim que o texto confere com os tempos
            if (now - lastLookup > 500 || (audio && !audio.isConnected)) {
                // a faixa visível manda: "My reading" (se houver tempos da gravação) ou o original
                const mineEl = okOwn && mine ? findOriginal(mine.url) : null;
                const origEl = ok ? findOriginal(audioUrl) : null;
                const next = mineEl ? 'mine' : origEl ? 'original' : null;
                audio = mineEl ?? origEl;
                lastLookup = now;
                if (next !== source) {
                    source = next;
                    line = next === 'mine' && ownLine ? ownLine : (align?.words ?? []);
                    word = -1;
                    current.current = -2; // força redesenhar a marca
                }
            }
            const on = !!audio && !!source && audio.currentTime > 0 && ready;
            setActive(on); // mesmo valor = sem re-render
            const i = on && audio ? wordAt(line, audio.currentTime * 1000) : -1;
            const b = i >= 0 ? blockAt(blocks, i) : -1;
            const byWord = blocksMode === 'word';
            if (i !== word) {
                word = i;
                hlWord.clear();
                if (i >= 0 && !byWord) hlWord.add(ranges.current[i]);
            }
            if (b === current.current) return;
            const fade = !byWord && current.current >= 0 && b >= 0;
            current.current = b;
            hl.clear();
            place(b, fade);
            if (b < 0) return;
            blockRanges(b).forEach((r) => hl.add(r));
            if (followRef.current && audio && !audio.paused) scrollTo(blocks[b][0]);
        };
        raf = requestAnimationFrame(tick);

        // Rolagem do aluno (roda, toque, teclado, barra) pausa o acompanhamento; a rolagem automática não conta.
        const scroller = box.current?.closest('.scroll');
        const manual = (e: Event) => {
            if (
                e.type === 'keydown' &&
                !['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes((e as KeyboardEvent).key)
            )
                return;
            if (e.type === 'pointerdown' && e.target !== scroller) return;
            if (current.current >= 0) setFollow(false);
        };
        const events = ['wheel', 'touchmove', 'keydown', 'pointerdown'];
        events.forEach((t) => scroller?.addEventListener(t, manual, { passive: true }));

        // Tocar numa palavra leva o áudio até ela (termos com nota de contexto e links seguem como são).
        const onClick = (e: MouseEvent) => {
            const target = e.target as Element;
            if (!audio || !sync() || target.closest('.term, .inote, a, button')) return;
            if (window.getSelection()?.toString()) return;
            const d = document as Document & {
                caretPositionFromPoint?(x: number, y: number): { offsetNode: Node; offset: number } | null;
            };
            const pos = d.caretPositionFromPoint?.(e.clientX, e.clientY);
            const range = pos ? null : document.caretRangeFromPoint?.(e.clientX, e.clientY);
            const node = pos?.offsetNode ?? range?.startContainer;
            const offset = pos?.offset ?? range?.startOffset ?? 0;
            const i = node ? rangeIndexAt(ranges.current, node, offset) : -1;
            if (i < 0) return;
            const b = blockAt(blocks, i); // Phrase/Sentence: do começo do bloco
            const t = line[b >= 0 ? blocks[b][0] : i]?.[0];
            if (t === undefined || !Number.isFinite(t)) return; // palavra que o aluno pulou: sem tempo
            audio.currentTime = t / 1000;
            setFollow(true);
        };
        const el = box.current;
        el?.addEventListener('click', onClick);

        scrollNow.current = () => current.current >= 0 && scrollTo(blocks[current.current][0], true);

        return () => {
            cancelAnimationFrame(raf);
            resize.disconnect();
            layerAtStart?.replaceChildren();
            events.forEach((t) => scroller?.removeEventListener(t, manual));
            el?.removeEventListener('click', onClick);
            registry.delete(HIGHLIGHT);
            registry.delete(HIGHLIGHT_WORD);
            setModeState({ available: false });
            ranges.current = [];
            current.current = -1;
            scrollNow.current = () => undefined;
        };
    }, [align, own, mine, audioUrl, dedaId]);

    return (
        <Box ref={box}>
            {(align || own) && <Global styles={highlightStyle} />}
            <div className="ra-marks" ref={marks} aria-hidden />
            <div className="ra-text">{children}</div>
            {(align || own) && active && !follow && (
                <FollowButton
                    type="button"
                    onClick={() => {
                        setFollow(true);
                        scrollNow.current();
                    }}
                >
                    Follow
                </FollowButton>
            )}
        </Box>
    );
};
