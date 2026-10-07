'use client';

import { css, Global } from '@emotion/react';
import { useGetOverallStatsReport } from 'hooks';
import { OverallStatsEnum, OverallStatsReportResponse } from 'interfaces';
import { statisticsColors } from 'libs';
import { rankActivities, reportHm, reportMinutes } from 'libs/newDesign';
import React, { useState } from 'react';

/*
 * "Overall stats" da LAMP na plataforma nova: o total investido primeiro, a divisão DEDA/Active/Passive em horas,
 * o ranking de cada categoria e a qualidade do DEDA como medidores 0–100. Mesma consulta e mesma chave do react-query
 * da página atual (relatório na ordem do servidor); a ordenação é feita aqui, sem nova chamada.
 */

const styles = css`
    .ostats {
        --os-gap: 40px;
    }
    .ostats .os-top {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 24px var(--os-gap);
        align-items: end;
        padding-bottom: 28px;
        margin-bottom: 28px;
        border-bottom: 1px solid var(--r-line);
    }
    .ostats .os-top > :last-child {
        grid-column: span 2;
    }
    .ostats .os-big {
        margin: 8px 0 4px;
        font-size: 40px;
        font-weight: 300;
        line-height: 1.05;
        letter-spacing: -0.01em;
        font-variant-numeric: tabular-nums;
        color: var(--r-text);
    }
    .ostats .os-big small,
    .ostats .os-cv small.u {
        margin: 0 0.12em 0 0.04em;
        font-size: 0.5em;
        font-weight: 400;
        letter-spacing: 0.02em;
        color: var(--r-muted);
    }
    .ostats .os-split {
        display: flex;
        gap: 3px;
        height: 8px;
        margin-bottom: 14px;
    }
    .ostats .os-split i {
        min-width: 4px;
        border-radius: 4px;
        background: var(--os-c);
        transform-origin: left;
        animation: os-grow 800ms cubic-bezier(0.2, 0.7, 0.2, 1) both;
    }
    .ostats .os-legend {
        display: flex;
        flex-wrap: wrap;
        gap: 8px 28px;
        margin: 0;
        padding: 0;
        list-style: none;
    }
    .ostats .os-legend li {
        display: inline-flex;
        align-items: baseline;
        gap: 8px;
        font-size: 13.5px;
        color: var(--r-muted);
        white-space: nowrap;
    }
    .ostats .os-legend b {
        font-weight: 500;
        font-variant-numeric: tabular-nums;
        color: var(--r-text);
    }
    .ostats .os-dot {
        flex: none;
        align-self: center;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--os-c);
    }

    .ostats .os-cols {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 40px var(--os-gap);
    }
    .ostats .os-cols > section + section {
        margin-top: 0;
    }
    .ostats .os-col .eyebrow {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .ostats .os-cv {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 12px;
        margin: 6px 0 14px;
        font-size: 22px;
        font-weight: 400;
        font-variant-numeric: tabular-nums;
    }
    .ostats .os-cv .share {
        font-size: 13px;
        color: var(--r-muted);
    }
    .ostats .os-rows {
        margin: 0;
        padding: 0;
        list-style: none;
        border-top: 1px solid var(--r-line);
    }
    .ostats .os-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        column-gap: 12px;
        row-gap: 7px;
        align-items: baseline;
        padding: 12px 0 13px;
        border-bottom: 1px solid var(--r-line);
    }
    /* com barras, a própria trilha separa as linhas */
    .ostats .os-rows.bars {
        border-top: 0;
    }
    .ostats .os-rows.bars .os-row {
        padding: 10px 0 12px;
        border-bottom: 0;
    }
    .ostats .os-row .lab {
        font-size: 14px;
        line-height: 1.35;
        color: var(--r-text);
        overflow-wrap: anywhere;
    }
    .ostats .os-row .val {
        font-size: 14px;
        font-variant-numeric: tabular-nums;
        color: var(--r-text);
        white-space: nowrap;
    }
    .ostats .os-row .val.q {
        color: var(--r-gold-hi);
    }
    .ostats .os-bar {
        grid-column: 1 / -1;
        height: 3px;
        border-radius: 2px;
        background: var(--r-track);
        overflow: hidden;
    }
    .ostats .os-bar i {
        display: block;
        height: 100%;
        border-radius: 2px;
        background: var(--os-c, var(--r-gold));
        transform-origin: left;
        animation: os-grow 700ms cubic-bezier(0.2, 0.7, 0.2, 1) both;
    }
    .ostats .os-idle {
        margin-top: 12px;
        font-size: 13px;
        line-height: 1.55;
        color: var(--r-muted);
    }
    .ostats .os-idle {
        color: var(--r-text);
    }
    .ostats .os-idle span {
        color: var(--r-muted);
    }
    .ostats .os-idle .os-idle-head {
        display: block;
        margin-bottom: 2px;
    }
    .ostats .os-sub {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 12px;
        margin: 28px 0 4px;
    }
    .ostats .os-sub b {
        font-size: 13px;
        font-weight: 500;
        font-variant-numeric: tabular-nums;
        color: var(--r-gold-hi);
    }
    .ostats .os-sub + .os-note {
        margin-bottom: 10px;
        font-size: 12.5px;
        color: var(--r-muted);
    }
    .ostats .os-empty {
        max-width: 60ch;
        margin-top: 2px;
    }
    /* no claro, as cores das categorias (neon dos gráficos) escurecem um pouco para ler sobre o marfim */
    html[data-theme='light'] .ostats .os-dot,
    html[data-theme='light'] .ostats .os-split i,
    html[data-theme='light'] .ostats .os-bar i {
        background: color-mix(in oklab, var(--os-c, var(--r-gold)) 78%, #2a2622);
    }
    html[data-theme='light'] .ostats .os-bar.q i {
        background: var(--r-gold);
    }
    @keyframes os-grow {
        from {
            transform: scaleX(0);
        }
    }

    @media (max-width: 860px) {
        .ostats .os-top,
        .ostats .os-cols {
            grid-template-columns: minmax(0, 1fr);
        }
        .ostats .os-top {
            gap: 20px;
        }
        .ostats .os-top > :last-child {
            grid-column: auto;
        }
        .ostats .os-big {
            font-size: 36px;
        }
        .ostats .os-legend {
            gap: 8px 20px;
        }
        /* iOS: controles com 16 px (sem zoom) */
        .ui-new-page.lamp .ostats-sort button {
            font-size: 16px;
        }
    }
`;

type Order = 'time' | 'default';
type Row = { key: string; label: string; text: string; minutes: number };
type Report = OverallStatsReportResponse['data'];

const label = (key: string) => OverallStatsEnum[key as keyof typeof OverallStatsEnum] ?? key;

const rowsOf = (group: Record<string, string>): Row[] =>
    Object.entries(group).map(([key, text]) => ({ key, label: label(key), text, minutes: reportMinutes(text) }));

/** "123h 05m" com as unidades menores (números grandes). */
const Time: React.FC<{ minutes: number }> = ({ minutes }) => {
    const [h, m] = reportHm(minutes).split(' ');
    return (
        <span>
            {h.slice(0, -1)}
            <small className="u">h</small> {m.slice(0, -1)}
            <small className="u">m</small>
        </span>
    );
};

const share = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 100) : 0);

const Category: React.FC<{ name: string; color: string; rows: Row[]; total: number; grand: number; order: Order }> = ({
    name,
    color,
    rows,
    total,
    grand,
    order,
}) => {
    const { done, idle } = rankActivities(rows, order);
    const max = Math.max(...done.map((r) => r.minutes), 1);
    return (
        <section className="os-col" aria-label={`${name} time`} style={{ '--os-c': color } as React.CSSProperties}>
            <p className="eyebrow">
                <i className="os-dot" aria-hidden />
                {name}
            </p>
            <p className="os-cv">
                <Time minutes={total} />
                {grand > 0 && <span className="share">{share(total, grand)}% of total</span>}
            </p>
            {done.length > 0 && (
                <ol className="os-rows bars">
                    {done.map((r) => (
                        <li className="os-row" key={r.key}>
                            <span className="lab">{r.label}</span>
                            <span className="val">{r.text}</span>
                            <span className="os-bar" aria-hidden>
                                <i style={{ width: `${(r.minutes / max) * 100}%` }} />
                            </span>
                        </li>
                    ))}
                </ol>
            )}
            {idle.length > 0 && (
                <p className="os-idle">
                    {/* categoria toda zerada: o aviso numa linha, a lista embaixo */}
                    {done.length ? (
                        <span>Not started yet: </span>
                    ) : (
                        <span className="os-idle-head">Not started yet</span>
                    )}
                    {idle.map((r) => r.label).join(', ')}
                </p>
            )}
        </section>
    );
};

const QUALITY = ['dedaPredPlaceAvg', 'dedaStepsAvg', 'dedaStateMindAvg', 'dedaStateBeingAvg', 'dedaFocusAvg'] as const;

const Deda: React.FC<{ report: Report; grand: number }> = ({ report, grand }) => {
    const deda = report.dedaAverages;
    const dedaMin = reportMinutes(deda.dedaTimeSum);
    const scores = QUALITY.map((key) => ({ key, label: label(key), value: parseFloat(deda[key]) || 0 }));
    // médias vazias (nenhum DEDA registrado) chegam como 0%: mostradas como "—"
    const rated = scores.some((s) => s.value > 0);
    const avg = scores.reduce((sum, s) => sum + s.value, 0) / scores.length;
    return (
        <section
            className="os-col"
            aria-label="DEDA"
            style={{ '--os-c': statisticsColors.DEDA } as React.CSSProperties}
        >
            <p className="eyebrow">
                <i className="os-dot" aria-hidden />
                DEDA
            </p>
            <p className="os-cv">
                <Time minutes={dedaMin} />
                {grand > 0 && <span className="share">{share(dedaMin, grand)}% of total</span>}
            </p>
            <ol className="os-rows">
                <li className="os-row">
                    <span className="lab">{label('readingTimeSum')}</span>
                    <span className="val">{deda.readingTimeSum}</span>
                </li>
            </ol>
            <div className="os-sub">
                <p className="eyebrow">Quality</p>
                {rated && <b>{Math.round(avg)}% avg</b>}
            </div>
            <p className="os-note">Average of your DEDA self-ratings, 0–100%</p>
            <ol className="os-rows bars">
                {scores.map((s) => (
                    <li className="os-row" key={s.key}>
                        <span className="lab">{s.label}</span>
                        <span className="val q">{rated ? `${Math.round(s.value)}%` : '—'}</span>
                        <span
                            className="os-bar q"
                            aria-hidden
                            style={{ '--os-c': 'var(--r-gold)' } as React.CSSProperties}
                        >
                            <i style={{ width: `${Math.min(100, Math.max(0, s.value))}%` }} />
                        </span>
                    </li>
                ))}
            </ol>
        </section>
    );
};

/** Ordenação das atividades: só no navegador, sobre a mesma resposta. */
export const LampStatsSort: React.FC<{ order: Order; onOrder(order: Order): void }> = ({ order, onOrder }) => (
    <div className="toggle ostats-sort" role="group" aria-label="Sort activities">
        <button type="button" aria-pressed={order === 'time'} onClick={() => onOrder('time')}>
            Most time
        </button>
        <button type="button" aria-pressed={order === 'default'} onClick={() => onOrder('default')}>
            Default order
        </button>
    </div>
);

export const LampOverallStats: React.FC<{ order: Order }> = ({ order }) => {
    // mesma consulta e chave da página atual na ordem padrão (['get-overall-stats-report', uid, undefined])
    const { data, isLoading } = useGetOverallStatsReport();
    if (isLoading || !data) return <div className="skel" aria-busy />;

    const active = rowsOf(data.activeStudyTotals);
    const passive = rowsOf(data.passiveStudyTotals);
    const sum = (rows: Row[]) => rows.reduce((t, r) => t + r.minutes, 0);
    const cats = [
        { name: 'DEDA', color: statisticsColors.DEDA, minutes: reportMinutes(data.dedaAverages.dedaTimeSum) },
        { name: 'Active', color: statisticsColors.Active, minutes: sum(active) },
        { name: 'Passive', color: statisticsColors.Passive, minutes: sum(passive) },
    ];
    const grand = cats.reduce((t, c) => t + c.minutes, 0);

    return (
        <div className="ostats">
            <Global styles={styles} />
            <div className="os-top">
                <div>
                    <p className="eyebrow">Total time invested</p>
                    <p className="os-big">
                        <Time minutes={grand} />
                    </p>
                    <p className="hint">DEDA, active and passive study, since you started</p>
                </div>
                {grand > 0 ? (
                    <div>
                        <div
                            className="os-split"
                            role="img"
                            aria-label={cats.map((c) => `${c.name} ${share(c.minutes, grand)}%`).join(', ')}
                        >
                            {cats
                                .filter((c) => c.minutes > 0)
                                .map((c) => (
                                    <i
                                        key={c.name}
                                        style={{ flexGrow: c.minutes, '--os-c': c.color } as React.CSSProperties}
                                    />
                                ))}
                        </div>
                        <ul className="os-legend">
                            {cats.map((c) => (
                                <li key={c.name} style={{ '--os-c': c.color } as React.CSSProperties}>
                                    <i className="os-dot" aria-hidden />
                                    {c.name}
                                    <b>{reportHm(c.minutes)}</b>
                                    {share(c.minutes, grand)}%
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <p className="hint os-empty">Your totals build up here as you log your days in the Input tab.</p>
                )}
            </div>
            <div className="os-cols">
                <Deda report={data} grand={grand} />
                <Category
                    name="Active"
                    color={statisticsColors.Active}
                    rows={active}
                    total={cats[1].minutes}
                    grand={grand}
                    order={order}
                />
                <Category
                    name="Passive"
                    color={statisticsColors.Passive}
                    rows={passive}
                    total={cats[2].minutes}
                    grand={grand}
                    order={order}
                />
            </div>
        </div>
    );
};
