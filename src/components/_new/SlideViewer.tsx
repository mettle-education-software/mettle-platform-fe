'use client';

import styled from '@emotion/styled';
import { uiFont } from 'components/_melp/_deda/DedaReader/readerFonts';
import { auth } from 'config/firebase';
import { SLIDE_HOTSPOTS, SLIDES_API } from 'libs/masterclass';
import { IMERSO_PRODUCT } from 'libs/productAccess';
import { ChevronLeft, ChevronRight, LayoutGrid, X } from 'lucide-react';
import { useProductAccess } from 'providers';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ICON, UI_FONT_VAR, ui } from 'themes/newDesign';

// Leitor dos slides da Masterclass, por cima da aula (Esc ou × volta ao texto). Mesmo acabamento do leitor do e-book:
// tela cheia, barra discreta, ‹ ›, teclado e deslizar, "slide N de M" e a grade de miniaturas.
// Sem arquivo para baixar: as imagens (webp, 1600 px) vêm do R2 privado pelo Worker mettle-events, com o acesso do
// aluno à Masterclass e URLs que vencem em 15 min; não há PDF nem botão de baixar; arrastar e o menu do botão
// direito ficam desligados na imagem. Isso só tira os caminhos fáceis: captura de tela (e quem abrir as ferramentas
// do navegador dentro dos 15 min) continua possível, e não há como impedir.

type Load = { state: 'loading' } | { state: 'error'; noAccess: boolean } | { state: 'ok'; slides: string[] };
const REFRESH_MS = 13 * 60_000; // as URLs vencem em 15 min: renova antes, com o leitor aberto

const block = (e: React.SyntheticEvent) => e.preventDefault();

export const SlideViewer: React.FC<{ title: string; onClose: () => void }> = ({ title, onClose }) => {
    const [load, setLoad] = useState<Load>({ state: 'loading' });
    // "Matricular-se" dos slides 91/92 (oferta do Imerso para alunos da Masterclass): nunca para quem já tem o Imerso
    const offer = useProductAccess().access(IMERSO_PRODUCT).state === 'none';
    const [i, setI] = useState(0);
    const [grid, setGrid] = useState(false);
    const closeRef = useRef<HTMLButtonElement>(null);
    const startX = useRef<number | null>(null);

    const fetchSlides = useCallback(async () => {
        try {
            const token = await auth.currentUser?.getIdToken();
            const res = await fetch(SLIDES_API, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
            if (!res.ok) return setLoad({ state: 'error', noAccess: res.status === 403 });
            const { slides } = (await res.json()) as { slides: string[] };
            setLoad({ state: 'ok', slides });
        } catch {
            setLoad({ state: 'error', noAccess: false });
        }
    }, []);
    useEffect(() => {
        fetchSlides();
        const timer = setInterval(fetchSlides, REFRESH_MS);
        return () => clearInterval(timer);
    }, [fetchSlides]);

    const slides = load.state === 'ok' ? load.slides : [];
    const total = slides.length;
    const go = useCallback((n: number) => setI(() => Math.max(0, Math.min(n, total - 1))), [total]);

    // foco na entrada e volta ao link na saída; a página por baixo não rola
    useEffect(() => {
        const back = document.activeElement as HTMLElement | null;
        closeRef.current?.focus();
        const overflow = document.documentElement.style.overflow;
        document.documentElement.style.overflow = 'hidden';
        return () => {
            document.documentElement.style.overflow = overflow;
            back?.focus?.();
        };
    }, []);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                if (grid) setGrid(false);
                else onClose();
                return;
            }
            if (grid) return;
            if (['ArrowRight', 'PageDown', ' '].includes(e.key)) {
                e.preventDefault();
                go(i + 1);
            } else if (['ArrowLeft', 'PageUp'].includes(e.key)) {
                e.preventDefault();
                go(i - 1);
            } else if (e.key === 'Home') go(0);
            else if (e.key === 'End') go(total - 1);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [go, i, total, grid, onClose]);

    const onPointerDown = (e: React.PointerEvent) => {
        startX.current = e.pointerType === 'mouse' ? null : e.clientX;
    };
    const onPointerUp = (e: React.PointerEvent) => {
        if (startX.current === null) return;
        const dx = e.clientX - startX.current;
        startX.current = null;
        if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1));
    };

    const n = i + 1;
    const view = (
        <Shell
            className={uiFont.className}
            style={UI_FONT_VAR}
            role="dialog"
            aria-modal="true"
            aria-label={`Slides: ${title}`}
        >
            <header className="tb">
                <button ref={closeRef} type="button" className="ib" aria-label="Fechar os slides" onClick={onClose}>
                    <X {...ICON} />
                </button>
                <p className="title">{title}</p>
                <div className="end">
                    {total > 0 && (
                        <span className="count" aria-live="polite">
                            {`slide ${n} de ${total}`}
                        </span>
                    )}
                    <button
                        type="button"
                        className="ib"
                        aria-label="Todos os slides"
                        aria-pressed={grid}
                        disabled={!total}
                        onClick={() => setGrid((g) => !g)}
                    >
                        <LayoutGrid {...ICON} />
                    </button>
                </div>
            </header>

            {load.state === 'loading' && <p className="msg">Carregando os slides…</p>}
            {load.state === 'error' && (
                <p className="msg">
                    {load.noAccess
                        ? 'Os slides são para quem tem acesso à Masterclass.'
                        : 'Não deu para abrir os slides agora. Tente de novo em instantes.'}
                </p>
            )}

            {total > 0 && grid && (
                <ol className="grid">
                    {slides.map((src, k) => (
                        <li key={k}>
                            <button
                                type="button"
                                aria-label={`Slide ${k + 1}`}
                                aria-current={k === i || undefined}
                                onClick={() => {
                                    setI(k);
                                    setGrid(false);
                                }}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element -- URL assinada e curta: sem otimizador */}
                                <img src={src} alt="" loading="lazy" draggable={false} onContextMenu={block} />
                                <span>{k + 1}</span>
                            </button>
                        </li>
                    ))}
                </ol>
            )}

            {total > 0 && !grid && (
                <div className="stage" onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
                    <button
                        type="button"
                        className="ib nav prev"
                        aria-label="Slide anterior"
                        disabled={i === 0}
                        onClick={() => go(i - 1)}
                    >
                        <ChevronLeft {...ICON} />
                    </button>
                    <figure className="slide" onContextMenu={block} onDragStart={block}>
                        {/* eslint-disable-next-line @next/next/no-img-element -- URL assinada e curta: sem otimizador */}
                        <img src={slides[i]} alt={`Slide ${n} de ${total}`} draggable={false} />
                        {(offer ? (SLIDE_HOTSPOTS[n] ?? []) : []).map((h) => (
                            <a
                                key={h.href}
                                className="hot"
                                href={h.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={h.label}
                                style={{
                                    left: `${h.left}%`,
                                    top: `${h.top}%`,
                                    width: `${h.width}%`,
                                    height: `${h.height}%`,
                                }}
                            />
                        ))}
                    </figure>
                    <button
                        type="button"
                        className="ib nav next"
                        aria-label="Próximo slide"
                        disabled={i >= total - 1}
                        onClick={() => go(i + 1)}
                    >
                        <ChevronRight {...ICON} />
                    </button>
                    {/* os vizinhos já baixam: virar o slide não pisca */}
                    <div hidden>
                        {[slides[i - 1], slides[i + 1]].filter(Boolean).map((src) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={src} src={src} alt="" />
                        ))}
                    </div>
                </div>
            )}
        </Shell>
    );
    return typeof document === 'undefined' ? null : createPortal(view, document.body);
};

const Shell = styled.div`
    ${ui}
    position: fixed;
    inset: 0;
    z-index: 2000;
    display: grid;
    grid-template-rows: 60px minmax(0, 1fr);
    background: var(--r-bg);
    color: var(--r-text);
    -webkit-user-select: none;
    user-select: none;
    -webkit-touch-callout: none;

    .tb {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
        align-items: center;
        gap: 12px;
        padding: 0 16px;
        padding-top: env(safe-area-inset-top);
    }
    .tb .ib {
        width: 40px;
        height: 40px;
        color: var(--r-muted);
    }
    .tb .ib:hover,
    .tb .ib[aria-pressed='true'] {
        color: var(--r-text);
        background: var(--r-hover);
    }
    .title {
        margin: 0;
        max-width: 46vw;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        font-size: 13px;
        font-weight: 600;
    }
    .end {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
    }
    .count {
        font-size: 12.5px;
        color: var(--r-muted);
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
    }
    .msg {
        align-self: center;
        justify-self: center;
        padding: 0 24px;
        text-align: center;
        color: var(--r-muted);
    }

    .stage {
        position: relative;
        display: grid;
        place-items: center;
        min-height: 0;
        padding: 8px 72px 32px;
        touch-action: pan-y pinch-zoom;
    }
    .slide {
        position: relative;
        margin: 0;
        /* o maior 16:9 que cabe; os botões dos slides 91–92 ficam em % desta caixa */
        width: min(100%, calc((100dvh - 60px - 40px) * 16 / 9));
        aspect-ratio: 16 / 9;
        border-radius: 8px;
        overflow: hidden;
        background: var(--r-surf);
        box-shadow: 0 12px 40px var(--r-card-shadow);
    }
    .slide img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: contain;
        pointer-events: none;
        -webkit-user-drag: none;
    }
    .hot {
        position: absolute;
        border-radius: 10px;
    }
    .hot:hover,
    .hot:focus-visible {
        outline: 2px solid var(--r-gold-hi);
        outline-offset: 2px;
    }
    .nav {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        color: var(--r-muted);
    }
    .nav:hover:not(:disabled) {
        color: var(--r-text);
    }
    .nav:disabled {
        opacity: 0.3;
    }
    .prev {
        left: 16px;
    }
    .next {
        right: 16px;
    }

    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 16px;
        margin: 0;
        padding: 8px 24px 40px;
        list-style: none;
        overflow-y: auto;
        align-content: start;
    }
    .grid button {
        display: grid;
        gap: 6px;
        width: 100%;
        padding: 0;
        border: 0;
        background: none;
        color: var(--r-muted);
        font: inherit;
        font-size: 12px;
        cursor: pointer;
    }
    .grid img {
        width: 100%;
        aspect-ratio: 16 / 9;
        border-radius: 6px;
        border: 2px solid transparent;
        background: var(--r-surf);
        object-fit: cover;
        -webkit-user-drag: none;
    }
    .grid button[aria-current] img {
        border-color: var(--r-gold);
    }
    .grid button[aria-current] {
        color: var(--r-text);
    }

    @media (max-width: 767px) {
        .stage {
            padding: 8px 12px 72px;
        }
        .slide {
            border-radius: 4px;
        }
        .nav {
            top: auto;
            bottom: 12px;
            transform: none;
        }
        .prev {
            left: calc(50% - 56px);
        }
        .next {
            right: calc(50% - 56px);
        }
        .grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
            padding: 8px 12px 32px;
        }
        .title {
            display: none;
        }
        .tb {
            grid-template-columns: auto 1fr;
        }
    }
`;

export default SlideViewer;
