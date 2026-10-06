'use client';

import { css, Global } from '@emotion/react';
import styled from '@emotion/styled';
import { useDeda } from 'hooks/queries/dedaQueries';
import { useNewDesign } from 'hooks/useNewDesign';
import { DedaListenQueryResponse } from 'interfaces';
import {
    Alignment,
    alignUrlFor,
    isUsableAlignment,
    markBox,
    rangeIndexAt,
    wordAt,
    wordRanges,
    wordsOfDocument,
} from 'libs/readAlong';
import React, { ReactNode, useEffect, useRef, useState } from 'react';

const HIGHLIGHT = 'deda-readalong';

// A métrica do texto não muda (nada de negrito) e o DOM do texto também não: ::highlight só escurece a palavra; o
// fundo amarelo é uma marca à parte, atrás do texto, centrada nas letras (o fundo do ::highlight ocupa a caixa da
// fonte inteira e, com a entrelinha alta, fica mais para cima do que a palavra).
const highlightStyle = css`
    ::highlight(${HIGHLIGHT}) {
        color: var(--r-readalong-text, #1d1a17);
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
 * Read-along do passo 4 (piloto, conta do dono): com o áudio original tocando, a palavra dita ganha um fundo dourado
 * amarelo, centrado nas letras; a rolagem acompanha (palavra no terço superior) até o aluno rolar por conta própria — aí aparece "Follow".
 * Tocar numa palavra leva o áudio até ela. Sem tempos publicados para o DEDA (ou outra faixa): nada muda.
 */
export const ReadAlong = ({ dedaId, children }: { dedaId: string; children: ReactNode }) => {
    const allowed = useNewDesign();
    const { data } = useDeda<DedaListenQueryResponse>('deda-listen', dedaId);
    const audioUrl = data?.dedaContentCollection?.items[0]?.dedaListenAudioMedia?.url ?? '';
    const url = allowed ? alignUrlFor(audioUrl, dedaId) : null;
    const box = useRef<HTMLDivElement>(null);
    const [align, setAlign] = useState<Alignment | null>(null);
    const [follow, setFollow] = useState(true);
    const [active, setActive] = useState(false);
    const followRef = useRef(true);
    followRef.current = follow;
    const ranges = useRef<Range[]>([]);
    const current = useRef(-1);
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

    useEffect(() => {
        const registry = highlights();
        const prose = () => box.current?.querySelector('.prose');
        if (!align || !registry) return;
        const hl = new Highlight();
        registry.set(HIGHLIGHT, hl);
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let raf = 0;
        let audio: HTMLAudioElement | null = null;
        let lastLookup = 0;
        let ok: boolean | null = null; // texto confere com os tempos? (contagem igual)

        const sync = () => {
            const root = prose();
            if (!root) return false;
            const stale = !ranges.current.length || !ranges.current[0].startContainer.isConnected;
            if (stale) {
                ranges.current = wordRanges(root);
                ok = isUsableAlignment(align, dedaId, audioUrl, ranges.current.length);
                current.current = -1;
            }
            return !!ok;
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

        // marca amarela da palavra atual, em coordenadas do contêiner (rola junto com o texto)
        const place = (i: number) => {
            const layer = marks.current;
            const origin = box.current?.getBoundingClientRect();
            if (!layer || !origin) return;
            layer.replaceChildren();
            const range = ranges.current[i];
            const el = range?.startContainer.parentElement;
            if (!range || !el) return;
            const font = fontOf(el);
            for (const r of Array.from(range.getClientRects())) {
                const b = markBox(r, origin, font);
                const mark = document.createElement('i');
                mark.style.cssText = `left:${b.left}px;top:${b.top}px;width:${b.width}px;height:${b.height}px`;
                layer.appendChild(mark);
            }
        };
        // "Aa", largura da janela, celular girado: a palavra muda de lugar — a marca vai junto
        const layerAtStart = marks.current;
        const resize = new ResizeObserver(() => current.current >= 0 && place(current.current));
        if (box.current) resize.observe(box.current);

        const tick = (now: number) => {
            raf = requestAnimationFrame(tick);
            if (now - lastLookup > 500 || (audio && !audio.isConnected)) {
                audio = findOriginal(audioUrl);
                lastLookup = now;
            }
            const on = !!audio && audio.currentTime > 0 && sync();
            setActive(on); // mesmo valor = sem re-render
            const i = on && audio ? wordAt(align.words, audio.currentTime * 1000) : -1;
            if (i === current.current) return;
            current.current = i;
            hl.clear();
            place(i);
            if (i < 0) return;
            hl.add(ranges.current[i]);
            if (followRef.current && audio && !audio.paused) scrollTo(i);
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
            audio.currentTime = align.words[i][0] / 1000;
            setFollow(true);
        };
        const el = box.current;
        el?.addEventListener('click', onClick);

        scrollNow.current = () => current.current >= 0 && scrollTo(current.current, true);

        return () => {
            cancelAnimationFrame(raf);
            resize.disconnect();
            layerAtStart?.replaceChildren();
            events.forEach((t) => scroller?.removeEventListener(t, manual));
            el?.removeEventListener('click', onClick);
            registry.delete(HIGHLIGHT);
            ranges.current = [];
            current.current = -1;
            scrollNow.current = () => undefined;
        };
    }, [align, audioUrl, dedaId]);

    return (
        <Box ref={box}>
            {align && <Global styles={highlightStyle} />}
            <div className="ra-marks" ref={marks} aria-hidden />
            <div className="ra-text">{children}</div>
            {align && active && !follow && (
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
