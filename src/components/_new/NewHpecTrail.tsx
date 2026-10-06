'use client';

import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import { hpecLessonPath } from 'libs/cleanUrls';
import { opensLabel, TrailLesson, TrailModule } from 'libs/hpecTrail';
import Link from 'next/link';
import React, { useLayoutEffect, useRef, useState } from 'react';

const STATE_LABEL: Record<TrailLesson['state'], string> = {
    done: 'watched',
    here: 'you are here',
    open: 'open, not watched yet',
    locked: 'not open yet',
};

const pulse = keyframes`
    from { transform: scale(1); opacity: 0.55; }
    to { transform: scale(2.6); opacity: 0; }
`;

/* Medidas do trilho: ponto (DOT) e onde o centro dele cai em cada direção. */
const DOT = 11;
const STEP = 136; // largura de cada aula no computador

const Box = styled.div`
    position: relative;

    /* a fila sangra 24px para cada lado e esmaece nas bordas: o que passa da coluna some suave, sem corte seco */
    .tr-scroll {
        overflow-x: auto;
        margin: 0 -24px;
        padding: 4px 24px 12px;
        mask-image: linear-gradient(90deg, transparent, #000 24px, #000 calc(100% - 24px), transparent);
        scrollbar-width: thin;
        scrollbar-color: var(--r-track) transparent;
    }
    .tr-scroll::-webkit-scrollbar {
        height: 4px;
    }
    .tr-scroll::-webkit-scrollbar-thumb {
        background: var(--r-track);
        border-radius: 2px;
    }
    ol {
        margin: 0;
        padding: 0;
        list-style: none;
    }
    .tr {
        position: relative;
        width: max-content;
    }
    .ms {
        display: flex;
    }
    /* linha de fundo (do primeiro ao último ponto) e linha percorrida (até "você está aqui") */
    .line,
    .prog {
        position: absolute;
        left: var(--cx);
        top: calc(var(--cy) - 0.75px);
        height: 1.5px;
        width: var(--len);
        background: var(--r-track);
        transform-origin: 0 50%;
    }
    .prog {
        width: var(--p);
        background: var(--r-gold);
    }
    /* só a ida anima: recolher (armed) é instantâneo */
    &.go .prog {
        transition: transform 1100ms cubic-bezier(0.25, 0.7, 0.25, 1);
    }
    &.armed:not(.go) .prog {
        transform: scaleX(0);
    }

    .m {
        display: flex;
        flex-direction: column;
    }
    /* altura fixa (2 linhas de título + data): os pontos de todos os módulos ficam na mesma linha */
    .mh {
        width: calc(var(--n) * ${STEP}px);
        height: 58px;
        padding-right: 16px;
    }
    .mh b {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        font-size: var(--r-label-size);
        font-weight: 500;
        letter-spacing: var(--r-label-track);
        text-transform: uppercase;
        line-height: 1.45;
        color: var(--r-muted);
    }
    .mh small {
        display: block;
        margin-top: 1px;
        font-size: 12px;
        letter-spacing: 0.01em;
        color: var(--r-muted);
    }
    .ls {
        display: flex;
    }
    .l {
        width: ${STEP}px;
    }
    .n {
        display: block;
        position: relative;
        padding: 0 12px 4px 0;
        color: var(--r-text);
        text-decoration: none;
        border-radius: 8px;
    }
    a.n:hover .t {
        color: var(--r-gold-hi);
    }
    /* anel de foco explícito (um estilo global de links vence o :focus-visible geral) */
    a.n:focus-visible {
        outline: 2px solid var(--r-gold-hi);
        outline-offset: 2px;
    }
    .dot {
        position: relative;
        z-index: 1;
        display: block;
        width: ${DOT}px;
        height: ${DOT}px;
        margin: 6px 0 12px;
        border-radius: 50%;
        border: 1.5px solid var(--r-gold);
        background: var(--r-bg);
        transition: transform var(--r-ease);
    }
    a.n:hover .dot {
        transform: scale(1.2);
    }
    .done .dot {
        background: var(--r-gold);
    }
    .locked .dot {
        border-color: var(--r-line-strong);
    }
    .here .dot {
        background: var(--r-gold);
        box-shadow:
            0 0 0 3px var(--r-bg),
            0 0 0 4.5px var(--r-gold);
    }
    .here .dot::after {
        content: '';
        position: absolute;
        inset: -1.5px;
        border-radius: 50%;
        background: var(--r-gold);
        opacity: 0;
    }
    &.go .here .dot::after {
        animation: ${pulse} 1400ms ease-out 1000ms 2;
    }
    .t {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        font-size: 13px;
        line-height: 1.4;
        overflow-wrap: anywhere;
        color: var(--r-text);
    }
    .here .t {
        font-weight: 500;
    }
    .done .t,
    .locked .t {
        color: var(--r-muted);
    }
    .now {
        display: block;
        margin-top: 3px;
        font-size: var(--r-label-size);
        font-weight: 500;
        letter-spacing: var(--r-label-track);
        text-transform: uppercase;
        color: var(--r-gold-hi);
    }

    .legend {
        display: flex;
        flex-wrap: wrap;
        gap: 4px 16px;
        margin: 0;
        padding: 0;
        list-style: none;
        font-size: 12px;
        letter-spacing: 0.01em;
        color: var(--r-muted);
    }
    .legend li {
        display: inline-flex;
        align-items: center;
        gap: 6px;
    }
    .legend .dot {
        width: 9px;
        height: 9px;
        margin: 0;
    }

    /* celular: o mesmo percurso na vertical, linha à esquerda */
    @media (max-width: 860px) {
        .tr-scroll {
            overflow: visible;
            margin: 0;
            padding: 0;
            mask-image: none;
        }
        .tr {
            width: auto;
        }
        .ms {
            flex-direction: column;
        }
        .line,
        .prog {
            left: calc(var(--cx) - 0.75px);
            top: var(--cy);
            width: 1.5px;
            height: var(--len);
            transform-origin: 50% 0;
        }
        .prog {
            height: var(--p);
        }
        &.armed:not(.go) .prog {
            transform: scaleY(0);
        }
        .m + .m {
            margin-top: 10px;
        }
        .mh {
            width: auto;
            height: auto;
            padding: 2px 0 6px 30px;
        }
        .mh b {
            -webkit-line-clamp: 1;
        }
        .ls {
            flex-direction: column;
        }
        .l {
            width: auto;
        }
        .n {
            display: flex;
            align-items: flex-start;
            gap: 0 19px;
            min-height: 40px;
            padding: 0;
        }
        .dot {
            flex: none;
            margin: 4px 0 0;
        }
        .tx {
            min-width: 0;
            padding-bottom: 12px;
        }
        .t {
            -webkit-line-clamp: 2;
            font-size: 14px;
        }
    }
`;

const Node: React.FC<{ lesson: TrailLesson; module: TrailModule }> = ({ lesson, module }) => {
    const label = `${lesson.title}, ${STATE_LABEL[lesson.state]}${
        lesson.state === 'locked' && module.unlockDate ? `, ${opensLabel(module.unlockDate)}` : ''
    }`;
    const body = (
        <>
            <span className="dot" aria-hidden />
            <span className="tx">
                <span className="t">{lesson.title}</span>
                {lesson.state === 'here' && <span className="now">Up next</span>}
            </span>
        </>
    );
    return (
        <li className={`l ${lesson.state}`}>
            {lesson.state === 'locked' ? (
                <span className="n" aria-label={label} title={label}>
                    {body}
                </span>
            ) : (
                <Link
                    className="n"
                    href={hpecLessonPath(lesson.id)}
                    aria-label={label}
                    aria-current={lesson.state === 'here' ? 'step' : undefined}
                >
                    {body}
                </Link>
            )}
        </li>
    );
};

/**
 * Percurso do HPEC: todos os módulos e aulas em ordem, numa linha com pontos (horizontal e rolável no computador,
 * vertical no celular). Vista = ponto cheio; aberta = anel; trancada = anel apagado + data do módulo; "você está
 * aqui" = ponto com halo. Ao entrar na tela, a linha dourada corre até "aqui" e o ponto pulsa duas vezes (sem
 * movimento com prefers-reduced-motion).
 */
export const NewHpecTrail: React.FC<{ modules: TrailModule[] }> = ({ modules }) => {
    const boxRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const [motion, setMotion] = useState<'' | 'armed' | 'armed go'>('');

    // Medidas da linha a partir dos próprios pontos (o mesmo código nas duas direções).
    useLayoutEffect(() => {
        const list = listRef.current;
        if (!list) return;
        const measure = () => {
            const dots = [...list.querySelectorAll<HTMLElement>('.dot')];
            if (!dots.length) return;
            const base = list.getBoundingClientRect();
            const center = (el: HTMLElement) => {
                const r = el.getBoundingClientRect();
                return { x: r.left - base.left + r.width / 2, y: r.top - base.top + r.height / 2 };
            };
            const vertical = getComputedStyle(list.querySelector('.ms') as HTMLElement).flexDirection === 'column';
            const first = center(dots[0]);
            const last = center(dots[dots.length - 1]);
            // a linha percorrida vai até "aqui"; sem "aqui", até o último ponto liberado (tudo visto)
            const reached =
                list.querySelector<HTMLElement>('.here .dot') ??
                [...list.querySelectorAll<HTMLElement>('.done .dot, .open .dot')].pop();
            const to = reached ? center(reached) : first;
            const len = vertical ? last.y - first.y : last.x - first.x;
            const p = vertical ? to.y - first.y : to.x - first.x;
            list.style.setProperty('--len', `${len}px`);
            list.style.setProperty('--p', `${p}px`);
            list.style.setProperty('--cx', `${first.x}px`);
            list.style.setProperty('--cy', `${first.y}px`);
            if (!vertical) {
                // computador: a fila rola até o começo do módulo de "aqui" (só na horizontal; a página não se mexe)
                const scroller = list.parentElement as HTMLElement;
                const mod = (reached ?? dots[0]).closest('.m') as HTMLElement;
                scroller.scrollLeft = mod.getBoundingClientRect().left - base.left;
            }
        };
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(list);
        return () => ro.disconnect();
    }, [modules]);

    // Movimento: arma (linha recolhida) e solta quando o percurso aparece na tela; uma vez só.
    useLayoutEffect(() => {
        const box = boxRef.current;
        if (
            !box ||
            window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
            !('IntersectionObserver' in window)
        )
            return;
        setMotion('armed');
        const io = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    // dois quadros: o estado recolhido pinta antes da transição começar
                    requestAnimationFrame(() => requestAnimationFrame(() => setMotion('armed go')));
                    io.disconnect();
                }
            },
            { threshold: 0.35 },
        );
        io.observe(box);
        return () => io.disconnect();
    }, []);

    return (
        <Box ref={boxRef} className={motion}>
            <div className="tr-scroll">
                <div ref={listRef} className="tr">
                    <span className="line" aria-hidden />
                    <span className="prog" aria-hidden />
                    <ol className="ms">
                        {modules.map((module) => (
                            <li
                                key={module.id}
                                className="m"
                                style={{ '--n': module.lessons.length } as React.CSSProperties}
                            >
                                <div className="mh">
                                    <b title={module.title}>{module.title}</b>
                                    {module.unlockDate && <small>{opensLabel(module.unlockDate)}</small>}
                                </div>
                                <ol className="ls" aria-label={module.title}>
                                    {module.lessons.map((lesson) => (
                                        <Node key={lesson.id} lesson={lesson} module={module} />
                                    ))}
                                </ol>
                            </li>
                        ))}
                    </ol>
                </div>
            </div>
        </Box>
    );
};

/** Legenda dos estados (pontos iguais aos do percurso). */
export const TrailLegend: React.FC = () => (
    <Box>
        <ul className="legend" aria-hidden>
            <li className="done">
                <span className="dot" /> Watched
            </li>
            <li className="open">
                <span className="dot" /> Open
            </li>
            <li className="locked">
                <span className="dot" /> Not open yet
            </li>
        </ul>
    </Box>
);

export default NewHpecTrail;
