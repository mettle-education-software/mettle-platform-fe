'use client';

import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import { hpecLessonPath } from 'libs/cleanUrls';
import { opensLabel, TrailLesson, TrailModule } from 'libs/hpecTrail';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import React, { useLayoutEffect, useRef, useState } from 'react';
import { ICON } from 'themes/newDesign';

const STATE_LABEL: Record<TrailLesson['state'], string> = {
    done: 'done',
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

    /*
     * Computador: uma janela que mostra só módulos INTEIROS (a borda direita cai sempre entre dois módulos: nenhum
     * texto cortado); as setas do cabeçalho passam de módulo em módulo. 12px à esquerda (fora da coluna) deixam o
     * halo do ponto e a ponta da linha anterior à vista.
     */
    .tr-view {
        box-sizing: border-box;
        width: var(--vw, 100%);
        max-width: calc(100% + 12px);
        margin-left: -12px;
        padding: 4px 0 4px 12px;
        overflow-x: clip;
    }
    .tr-view .tr {
        transform: translateX(calc(-1 * var(--off, 0px)));
        transition: transform 320ms cubic-bezier(0.25, 0.7, 0.25, 1);
    }
    .tools {
        display: flex;
        align-items: center;
        gap: 16px;
    }
    .pager {
        display: flex;
        gap: 6px;
    }
    .pager button {
        display: inline-grid;
        place-items: center;
        width: 32px;
        height: 32px;
        padding: 0;
        border: 1px solid var(--r-line-strong);
        border-radius: 50%;
        background: none;
        color: var(--r-text);
        cursor: pointer;
    }
    .pager button:hover:not(:disabled) {
        border-color: var(--r-gold-hi);
        color: var(--r-gold-hi);
    }
    .pager button:disabled {
        opacity: 0.35;
        cursor: default;
    }
    .pager button:focus-visible {
        outline: 2px solid var(--r-gold-hi);
        outline-offset: 2px;
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
    .mh .mdot {
        display: none;
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
        .tr-view {
            width: auto;
            max-width: none;
            margin: 0;
            padding: 0;
            overflow: visible;
        }
        .tr-view .tr {
            transform: none;
        }
        .pager {
            display: none;
        }
        .tools {
            flex: 1 1 100%;
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
        /* módulo inteiro feito: uma linha (título + ponto cheio), as aulas ficam no HPEC */
        .m-done .ls {
            display: none;
        }
        .m-done .mh {
            position: relative;
            padding-bottom: 2px;
        }
        .m-done .mh .mdot {
            display: block;
            position: absolute;
            left: 0;
            top: 4px;
            margin: 0;
            background: var(--r-gold);
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

type Geom = { vertical: boolean; offs: number[]; ws: number[]; avail: number };

/** Último módulo (índice) que cabe inteiro na janela começando em `s`. */
const fitFrom = (g: Geom, s: number) => {
    let e = s;
    while (e + 1 < g.offs.length && g.offs[e + 1] + g.ws[e + 1] - g.offs[s] <= g.avail) e++;
    return e;
};
/** Chegou ao fim: puxa módulos anteriores enquanto couberem (a janela fica cheia). */
const backfill = (g: Geom, s: number) => {
    const e = fitFrom(g, s);
    if (e < g.offs.length - 1) return s;
    while (s > 0 && g.offs[e] + g.ws[e] - g.offs[s - 1] <= g.avail) s--;
    return s;
};

const LEGEND: { state: TrailLesson['state']; label: string }[] = [
    { state: 'done', label: 'Done' },
    { state: 'open', label: 'Open' },
    { state: 'locked', label: 'Not open yet' },
];

/**
 * Percurso do HPEC: todos os módulos e aulas em ordem, numa linha com pontos (horizontal no computador, em janelas
 * de módulos inteiros; vertical no celular). Feito = ponto cheio; aberta = anel; trancada = anel apagado + data
 * do módulo; "você está aqui" = ponto com halo. Ao entrar na tela, a linha dourada corre até "aqui" e o ponto
 * pulsa duas vezes (sem movimento com prefers-reduced-motion). A legenda mostra só os estados presentes.
 */
export const NewHpecTrail: React.FC<{ modules: TrailModule[]; title: React.ReactNode }> = ({ modules, title }) => {
    const boxRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const [motion, setMotion] = useState<'' | 'armed' | 'armed go'>('');
    const [geom, setGeom] = useState<Geom>();
    const [start, setStart] = useState<number>();

    const states = new Set(modules.flatMap((m) => m.lessons.map((l) => l.state)));
    // módulo de "aqui" (ou o último alcançado)
    const hereIndex = Math.max(
        0,
        modules.findIndex((m) => m.lessons.some((l) => l.state === 'here')) >= 0
            ? modules.findIndex((m) => m.lessons.some((l) => l.state === 'here'))
            : modules.map((m) => m.lessons.some((l) => l.state !== 'locked')).lastIndexOf(true),
    );

    // Medidas da linha a partir dos próprios pontos (o mesmo código nas duas direções) + geometria dos módulos.
    useLayoutEffect(() => {
        const list = listRef.current;
        const box = boxRef.current;
        if (!list || !box) return;
        const measure = () => {
            // só os pontos visíveis (no celular, módulo feito vira uma linha com um ponto só)
            const dots = [...list.querySelectorAll<HTMLElement>('.dot')].filter((d) => d.getClientRects().length);
            if (!dots.length) return;
            const base = list.getBoundingClientRect();
            const center = (el: HTMLElement) => {
                const r = el.getBoundingClientRect();
                return { x: r.left - base.left + r.width / 2, y: r.top - base.top + r.height / 2 };
            };
            const vertical = getComputedStyle(list.querySelector('.ms') as HTMLElement).flexDirection === 'column';
            const first = center(dots[0]);
            const last = center(dots[dots.length - 1]);
            // a linha percorrida vai até "aqui"; sem "aqui", até o último ponto liberado
            const reached =
                list.querySelector<HTMLElement>('.here .dot') ??
                [...list.querySelectorAll<HTMLElement>('.done .dot, .open .dot')].pop();
            const to = reached ? center(reached) : first;
            list.style.setProperty('--len', `${vertical ? last.y - first.y : last.x - first.x}px`);
            list.style.setProperty('--p', `${vertical ? to.y - first.y : to.x - first.x}px`);
            list.style.setProperty('--cx', `${first.x}px`);
            list.style.setProperty('--cy', `${first.y}px`);
            const ms = [...list.querySelectorAll<HTMLElement>('.m')];
            const x0 = ms[0]?.offsetLeft ?? 0;
            setGeom({
                vertical,
                offs: ms.map((m) => m.offsetLeft - x0),
                ws: ms.map((m) => m.offsetWidth),
                avail: box.clientWidth,
            });
        };
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(list);
        ro.observe(box);
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

    // janela de módulos inteiros (computador): começa no módulo de "aqui"
    const paged = geom && !geom.vertical && geom.offs.length > 0;
    const s = paged ? Math.min(start ?? backfill(geom, hereIndex), geom.offs.length - 1) : 0;
    const e = paged ? fitFrom(geom, s) : 0;
    const view = paged
        ? ({
              '--vw': `${geom.offs[e] + geom.ws[e] - geom.offs[s] + 12}px`,
              '--off': `${geom.offs[s]}px`,
          } as React.CSSProperties)
        : undefined;
    const canPrev = paged && s > 0;
    const canNext = paged && e < geom.offs.length - 1;
    const prev = () => {
        if (!geom) return;
        let p = s - 1;
        while (p > 0 && geom.offs[s - 1] + geom.ws[s - 1] - geom.offs[p - 1] <= geom.avail) p--;
        setStart(p);
    };
    const next = () => geom && setStart(backfill(geom, e + 1));

    return (
        <Box ref={boxRef} className={motion}>
            <div className="sh">
                <h2>{title}</h2>
                <div className="tools">
                    <ul className="legend" aria-hidden>
                        {LEGEND.filter((x) => states.has(x.state)).map((x) => (
                            <li key={x.state} className={x.state}>
                                <span className="dot" /> {x.label}
                            </li>
                        ))}
                    </ul>
                    {(canPrev || canNext) && (
                        <div className="pager">
                            <button type="button" onClick={prev} disabled={!canPrev} aria-label="Earlier modules">
                                <ChevronLeft {...ICON} size={16} aria-hidden />
                            </button>
                            <button type="button" onClick={next} disabled={!canNext} aria-label="Later modules">
                                <ChevronRight {...ICON} size={16} aria-hidden />
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <div className="tr-view" style={view}>
                <div ref={listRef} className="tr">
                    <span className="line" aria-hidden />
                    <span className="prog" aria-hidden />
                    <ol className="ms">
                        {modules.map((module, i) => (
                            <li
                                key={module.id}
                                className={`m${module.lessons.every((l) => l.state === 'done') ? ' m-done' : ''}`}
                                style={{ '--n': module.lessons.length } as React.CSSProperties}
                                // Tab para um módulo fora da janela: a janela acompanha
                                onFocus={() => paged && (i < s || i > e) && setStart(backfill(geom, i))}
                            >
                                <div className="mh">
                                    <span className="dot mdot" aria-hidden />
                                    <b>{module.title}</b>
                                    {/* a data/regra de liberação só quando muda (nunca a mesma frase módulo a módulo) */}
                                    {module.unlockDate &&
                                        opensLabel(module.unlockDate) !== opensLabel(modules[i - 1]?.unlockDate) && (
                                            <small>{opensLabel(module.unlockDate)}</small>
                                        )}
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

export default NewHpecTrail;
