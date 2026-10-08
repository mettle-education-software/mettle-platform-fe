'use client';

import { css, Global } from '@emotion/react';
import { runMilestone } from 'libs/newDesign';
import React, { useEffect, useState } from 'react';

/*
 * A DEDA Run em ouro (8-Out-2026): o único lugar da página em que o dourado domina. Sem ícone: a tipografia e o anel
 * são o símbolo. Anel em fio quando o dia de hoje ainda não contou; completo (desenhado uma vez) quando contou.
 * Um brilho lento passa pelo número a cada ~8 s; nos marcos (7, 30, 50, 100…), na primeira vez, um brilho curto e o
 * selo "N dias". prefers-reduced-motion: tudo parado.
 */

const SEEN_KEY = 'runMilestoneSeen';

const styles = css`
    .rg {
        --rg-bg: radial-gradient(120% 90% at 85% 0%, rgba(232, 186, 110, 0.26), transparent 62%),
            linear-gradient(150deg, #2c2215 0%, #463218 58%, #64451d 100%);
        --rg-gold: #f0cf93;
        --rg-gold-2: #d9a95e;
        --rg-shine: #fff4dc;
        --rg-label: #ead3a8;
        --rg-line: rgba(240, 207, 147, 0.3);
        --rg-glow: rgba(226, 178, 96, 0.22);
    }
    html[data-theme='light'] .rg {
        --rg-bg: radial-gradient(120% 90% at 85% 0%, rgba(255, 255, 255, 0.75), transparent 62%),
            linear-gradient(150deg, #fbf4e4 0%, #f4e6c6 60%, #ecd6a6 100%);
        --rg-gold: #85561b;
        --rg-gold-2: #a8732c;
        --rg-shine: #fff8e6;
        --rg-label: #6a481b;
        --rg-line: rgba(133, 86, 27, 0.26);
        --rg-glow: rgba(168, 115, 44, 0.2);
    }

    /* ---------- cartão da LAMP ---------- */
    .rg-card {
        position: relative;
        display: grid;
        grid-template-rows: auto 1fr;
        min-height: 300px;
        padding: 22px 26px 26px;
        overflow: hidden;
        border: 1px solid var(--rg-line);
        border-radius: 16px;
        background: var(--rg-bg);
        color: var(--rg-label);
        transition: box-shadow 600ms ease;
    }
    .rg-card.on {
        box-shadow:
            0 0 0 1px var(--rg-line),
            0 14px 44px var(--rg-glow);
    }
    .rg-card .rg-eb {
        display: flex;
        align-items: center;
        gap: 2px;
        margin: 0;
        font-size: var(--r-label-size);
        font-weight: 600;
        letter-spacing: var(--r-label-track);
        text-transform: uppercase;
        color: var(--rg-label);
    }
    .rg-card .rg-eb .hint-i {
        color: var(--rg-label);
    }
    .rg-card .rg-mid {
        display: grid;
        place-items: center;
        gap: 10px;
    }
    .rg .rg-ring {
        position: relative;
        display: grid;
        place-items: center;
        width: 188px;
        height: 188px;
    }
    .rg .rg-ring svg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        transform: rotate(-90deg);
    }
    .rg .rg-ring .bg {
        fill: none;
        stroke: var(--rg-line);
        stroke-width: 1;
    }
    .rg .rg-ring .fg {
        fill: none;
        stroke: var(--rg-gold-2);
        stroke-width: 2;
        stroke-linecap: round;
        stroke-dasharray: 1;
        stroke-dashoffset: 0;
    }
    .rg .rg-ring .fg.draw {
        animation: rg-draw 1400ms cubic-bezier(0.3, 0.6, 0.2, 1) both;
    }
    @keyframes rg-draw {
        from {
            stroke-dashoffset: 1;
        }
    }
    .rg .rg-n {
        position: relative;
        font-size: 84px;
        font-weight: 500;
        line-height: 1;
        letter-spacing: -0.03em;
        font-variant-numeric: tabular-nums;
        color: var(--rg-gold);
    }
    /* o brilho: uma cópia do número com um degradê claro que passa devagar */
    .rg .rg-n::after {
        content: attr(data-n);
        position: absolute;
        inset: 0;
        color: transparent;
        background: linear-gradient(
                100deg,
                transparent 0%,
                transparent 42%,
                var(--rg-shine) 50%,
                transparent 58%,
                transparent 100%
            )
            no-repeat;
        background-size: 260% 100%;
        background-position: 130% 0;
        -webkit-background-clip: text;
        background-clip: text;
        opacity: 0.85;
        animation: rg-sweep 8s ease-in-out 1.2s infinite;
        pointer-events: none;
    }
    @keyframes rg-sweep {
        0% {
            background-position: 130% 0;
        }
        20%,
        100% {
            background-position: -30% 0;
        }
    }
    .rg .rg-badge {
        padding: 3px 10px;
        border: 1px solid var(--rg-line);
        border-radius: 999px;
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.04em;
        color: var(--rg-gold);
        animation: rg-badge 700ms ease-out both;
    }
    @keyframes rg-badge {
        from {
            opacity: 0;
            transform: translateY(4px);
        }
    }
    /* marco: um brilho curto que nasce do número e se apaga */
    .rg-card.burst::before {
        content: '';
        position: absolute;
        left: 50%;
        top: 56%;
        width: 340px;
        height: 340px;
        margin: -170px 0 0 -170px;
        border-radius: 50%;
        background: radial-gradient(circle, var(--rg-glow) 0%, rgba(240, 207, 147, 0.18) 30%, transparent 62%);
        animation: rg-burst 1800ms ease-out both;
        pointer-events: none;
    }
    @keyframes rg-burst {
        0% {
            opacity: 0;
            transform: scale(0.4);
        }
        30% {
            opacity: 1;
        }
        100% {
            opacity: 0;
            transform: scale(1.25);
        }
    }

    /* ---------- versão compacta (faixa do IMERSO, rodapé do menu) ---------- */
    .rg .rg-ring,
    .rg .rg-n,
    .rg .rg-l {
        margin: 0;
    }
    span.rg.rg-chip {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px 6px 6px;
        border: 1px solid var(--rg-line);
        border-radius: 999px;
        background: var(--rg-bg);
        color: var(--rg-label);
        white-space: nowrap;
    }
    span.rg.rg-chip.on {
        box-shadow: 0 6px 18px var(--rg-glow);
    }
    .rg.rg-chip .rg-ring {
        width: 34px;
        height: 34px;
    }
    .rg.rg-chip .rg-n {
        font-size: 15px;
        font-weight: 600;
        letter-spacing: 0;
    }
    .rg.rg-chip .rg-l {
        font-size: var(--r-label-size);
        font-weight: 600;
        letter-spacing: var(--r-label-track);
        text-transform: uppercase;
    }
    .rg.rg-chip.lg .rg-ring {
        width: 54px;
        height: 54px;
    }
    .rg.rg-chip.lg .rg-n {
        font-size: 22px;
    }
    /* qualquer valor cabe: o anel cresce com os dígitos e, com 4, a letra desce um passo */
    .rg.rg-chip[data-d='3'] .rg-ring {
        width: 40px;
        height: 40px;
    }
    .rg.rg-chip[data-d='4'] .rg-ring {
        width: 44px;
        height: 44px;
    }
    .rg.rg-chip[data-d='4'] .rg-n {
        font-size: 13px;
    }
    .rg.rg-chip.lg[data-d='3'] .rg-ring {
        width: 58px;
        height: 58px;
    }
    .rg.rg-chip.lg[data-d='4'] .rg-ring {
        width: 62px;
        height: 62px;
    }
    .rg.rg-chip.lg[data-d='4'] .rg-n {
        font-size: 19px;
    }
    .rg.rg-chip.bare {
        padding: 4px;
    }

    @media (prefers-reduced-motion: reduce) {
        .rg .rg-n::after,
        .rg .rg-ring .fg.draw,
        .rg .rg-badge,
        .rg-card.burst::before {
            animation: none;
        }
        .rg .rg-n::after {
            display: none;
        }
        .rg-card.burst::before {
            opacity: 0;
        }
    }
`;

/** O anel: fio quando hoje ainda não contou; ouro completo (desenhado uma vez ao aparecer) quando contou. */
const Ring: React.FC<{ on: boolean; draw?: boolean; children: React.ReactNode }> = ({ on, draw, children }) => (
    <span className="rg-ring">
        <svg viewBox="0 0 100 100" aria-hidden>
            <circle className="bg" cx="50" cy="50" r="48" />
            {on && <circle className={`fg${draw ? ' draw' : ''}`} cx="50" cy="50" r="48" pathLength={1} />}
        </svg>
        {children}
    </span>
);

/** Cartão da DEDA Run (aba Performance da LAMP). */
export const RunCard: React.FC<{ current: number; counted: boolean; ready: boolean; hint?: React.ReactNode }> = ({
    current,
    counted,
    ready,
    hint,
}) => {
    const [burst, setBurst] = useState(0);
    useEffect(() => {
        if (!ready) return;
        const reached = runMilestone(current);
        let seen = 0;
        try {
            seen = Number(window.localStorage.getItem(SEEN_KEY)) || 0;
        } catch {
            // armazenamento bloqueado: comemora uma vez por visita
        }
        if (reached > seen) setBurst(reached);
        try {
            // a Run quebrou: o próximo marco volta a ser comemorado
            if (reached !== seen) window.localStorage.setItem(SEEN_KEY, String(reached));
        } catch {
            // idem
        }
    }, [current, ready]);
    return (
        <section
            className={`rg rg-card${counted ? ' on' : ''}${burst ? ' burst' : ''}`}
            aria-label={`DEDA Run: ${ready ? current : '—'}`}
        >
            <Global styles={styles} />
            <p className="rg-eb">
                DEDA Run
                {hint}
            </p>
            <div className="rg-mid">
                <Ring on={counted} draw>
                    <span className="rg-n" data-n={ready ? current : '—'}>
                        {ready ? current : '—'}
                    </span>
                </Ring>
                {burst > 0 && <span className="rg-badge">{burst} dias</span>}
            </div>
        </section>
    );
};

/** A mesma Run, compacta: faixa do IMERSO e rodapé do menu. Sem rótulo (menu recolhido), o nome vai no title. */
export const RunChip: React.FC<{ current: number; counted: boolean; large?: boolean; label?: string }> = ({
    current,
    counted,
    large,
    label = 'DEDA Run',
}) => {
    const n = Math.max(0, Math.round(current));
    const digits = Math.min(4, String(n).length);
    return (
        <span
            className={`rg rg-chip${counted ? ' on' : ''}${large ? ' lg' : ''}${label ? '' : ' bare'}`}
            data-d={digits}
            title={label ? undefined : `DEDA Run: ${n}`}
            aria-label={label ? undefined : `DEDA Run: ${n}`}
        >
            <Global styles={styles} />
            <Ring on={counted}>
                <span className="rg-n" data-n={n}>
                    {n}
                </span>
            </Ring>
            {label && <span className="rg-l">{label}</span>}
        </span>
    );
};
