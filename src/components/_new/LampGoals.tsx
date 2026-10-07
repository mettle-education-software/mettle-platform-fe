'use client';

import { css, Global } from '@emotion/react';
import { Tooltip } from 'antd';
import type { ApexOptions } from 'apexcharts';
import { useGetGoalByLevel } from 'hooks';
import { useTheme } from 'hooks/useTheme';
import { DedaDifficulties, DedaDifficulty } from 'interfaces/melp';
import { statisticsColors } from 'libs';
import { fullLoadWeek, GoalDay, goalDays, minutesText } from 'libs/newDesign';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useMelpContext } from 'providers';
import React, { useEffect, useState } from 'react';
import { DARK, ICON, LIGHT } from 'themes/newDesign';
import { useSoftChart } from './lampCharts';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

/*
 * Aba Goals na plataforma nova: compara os três níveis (Flow, Boost, Turbo) — o que cada um pede por dia numa
 * semana escolhida, como a meta cresce até a carga cheia e a divisão por categoria — com o nível do aluno em destaque.
 * Mesmas consultas da página atual (/goals/<nível>, chave ['get-goal-by-level', nível]), uma por nível.
 */

const styles = css`
    .lgoals .lead {
        max-width: 62ch;
        margin: -6px 0 24px;
    }
    .lgoals .wk {
        display: grid;
        grid-template-columns: auto auto minmax(0, 1fr) auto auto;
        grid-template-areas: 'lab prev range next now';
        align-items: center;
        gap: 4px 10px;
        margin: 0 0 20px;
    }
    .lgoals .wk .eyebrow {
        grid-area: lab;
    }
    .lgoals .wk .prev {
        grid-area: prev;
    }
    .lgoals .wk .next {
        grid-area: next;
    }
    .lgoals .wk .now {
        grid-area: now;
        justify-self: end;
    }
    .lgoals .wk input {
        grid-area: range;
    }
    @media (max-width: 700px) {
        .lgoals .wk {
            grid-template-columns: auto minmax(0, 1fr) auto;
            grid-template-areas: 'lab lab now' 'prev range next';
        }
    }
    .lgoals .wk .eyebrow {
        min-width: 7.5em;
    }
    .lgoals .wk b {
        font-size: 15px;
        font-weight: 500;
        font-variant-numeric: tabular-nums;
        color: var(--r-text);
    }
    .lgoals .wk .ib {
        width: 40px;
        height: 40px;
        color: var(--r-muted);
    }
    .lgoals .wk .ib:hover:not(:disabled) {
        color: var(--r-text);
    }
    .lgoals .wk .ib:disabled {
        opacity: 0.35;
        cursor: default;
    }
    .lgoals input[type='range'] {
        width: 100%;
        min-width: 0;
        height: 40px;
        margin: 0;
        background: transparent;
        accent-color: var(--r-gold);
        cursor: pointer;
        -webkit-appearance: none;
        appearance: none;
    }
    .lgoals input[type='range']::-webkit-slider-runnable-track {
        height: 2px;
        border-radius: 2px;
        background: var(--r-track);
    }
    .lgoals input[type='range']::-moz-range-track {
        height: 2px;
        border-radius: 2px;
        background: var(--r-track);
    }
    .lgoals input[type='range']::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 20px;
        height: 20px;
        margin-top: -9px;
        border: 0;
        border-radius: 50%;
        background: var(--r-gold);
        box-shadow: 0 0 0 4px var(--r-bg);
    }
    .lgoals input[type='range']::-moz-range-thumb {
        width: 20px;
        height: 20px;
        border: 0;
        border-radius: 50%;
        background: var(--r-gold);
        box-shadow: 0 0 0 4px var(--r-bg);
    }
    .lgoals .now {
        min-height: 40px;
        padding: 0 10px;
    }

    .lgoals .lvls {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 16px;
        margin: 0 0 44px;
        padding: 0;
        list-style: none;
    }
    .lgoals .lvl {
        display: flex;
        flex-direction: column;
        padding: 20px 20px 18px;
        border: 1px solid var(--r-line);
        border-radius: var(--r-radius);
    }
    .lgoals .lvl.mine {
        border-color: var(--r-gold);
        box-shadow: inset 0 0 0 1px var(--r-gold);
    }
    .lgoals .lvl .eyebrow {
        min-height: 1.4em;
    }
    .lgoals .lvl.mine .eyebrow {
        color: var(--r-gold-hi);
    }
    .lgoals .lvl h3 {
        margin: 2px 0 0;
        font-size: 20px;
        font-weight: 400;
    }
    .lgoals .pace {
        margin-top: 2px;
        font-size: 13px;
        color: var(--r-muted);
    }
    .lgoals .big {
        margin: 18px 0 2px;
        font-size: 32px;
        font-weight: 300;
        line-height: 1.1;
        font-variant-numeric: tabular-nums;
    }
    .lgoals .big small {
        margin-left: 6px;
        font-size: 13px;
        font-weight: 400;
        color: var(--r-muted);
    }
    .lgoals .split {
        display: flex;
        gap: 2px;
        height: 6px;
        margin: 14px 0 12px;
    }
    .lgoals .split i {
        min-width: 3px;
        border-radius: 3px;
        background: var(--c);
    }
    .lgoals .cats {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 6px 16px;
        margin: 0;
        padding: 0;
        list-style: none;
    }
    .lgoals .cats li {
        display: flex;
        align-items: baseline;
        gap: 8px;
        font-size: 13.5px;
        color: var(--r-muted);
    }
    .lgoals .cats b {
        margin-left: auto;
        font-weight: 400;
        font-variant-numeric: tabular-nums;
        color: var(--r-text);
        white-space: nowrap;
    }
    .lgoals .cats .d {
        flex: none;
        align-self: center;
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--c);
    }
    html[data-theme='light'] .lgoals .split i,
    html[data-theme='light'] .lgoals .cats .d {
        background: color-mix(in oklab, var(--c) 78%, #2a2622);
    }
    .lgoals .ms {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
        margin: 18px 0 0;
        padding: 14px 0 0;
        border-top: 1px solid var(--r-line);
        list-style: none;
    }
    .lgoals .ms li {
        display: grid;
        gap: 2px;
        font-size: 12px;
        color: var(--r-muted);
    }
    .lgoals .ms b {
        font-size: 14px;
        font-weight: 400;
        font-variant-numeric: tabular-nums;
        color: var(--r-text);
    }
    .lgoals .grow .hint {
        margin: 4px 0 8px;
    }
    @media (max-width: 960px) {
        .lgoals .lvls {
            grid-template-columns: minmax(0, 1fr);
            gap: 12px;
        }
    }
`;

const LEVELS = Object.keys(DedaDifficulties) as DedaDifficulty[];
/** Ritmo de cada nível (os mesmos textos da ajuda da aba): meses até a carga cheia. */
const PACE: Record<string, string> = { EASY: 'Gradual pace', MEDIUM: 'Moderate pace', HARD: 'Accelerated pace' };
const MONTHS: Record<string, number> = { EASY: 10, MEDIUM: 8, HARD: 6 };

const CATS = [
    { key: 'deda', name: 'DEDA', color: statisticsColors.DEDA },
    { key: 'active', name: 'Active', color: statisticsColors.Active },
    { key: 'review', name: 'Review', color: statisticsColors.Review },
    { key: 'passive', name: 'Passive', color: statisticsColors.Passive },
] as const;

const useLevelDays = (level: DedaDifficulty) => goalDays(useGetGoalByLevel(level).data);

const Level: React.FC<{ level: DedaDifficulty; days: GoalDay[]; week: number; mine: boolean }> = ({
    level,
    days,
    week,
    mine,
}) => {
    const day = days[Math.min(week, days.length) - 1];
    const full = fullLoadWeek(days);
    const mid = Math.max(2, Math.round(full / 2));
    return (
        <li className={`lvl${mine ? ' mine' : ''}`} aria-current={mine || undefined}>
            <p className="eyebrow">{mine ? 'Your level' : ''}</p>
            <h3>{DedaDifficulties[level]}</h3>
            <p className="pace">
                {PACE[level]} · full load in {MONTHS[level]} months
            </p>
            {day ? (
                <>
                    <p className="big">
                        {minutesText(day.total)}
                        <small>a day</small>
                    </p>
                    <div className="split" aria-hidden>
                        {CATS.filter((c) => day[c.key] > 0).map((c) => (
                            <i key={c.key} style={{ flexGrow: day[c.key], '--c': c.color } as React.CSSProperties} />
                        ))}
                    </div>
                    <ul className="cats">
                        {CATS.map((c) => (
                            <li key={c.key} style={{ '--c': c.color } as React.CSSProperties}>
                                <i className="d" aria-hidden />
                                {c.name}
                                <b>{day[c.key] ? minutesText(day[c.key]) : '—'}</b>
                            </li>
                        ))}
                    </ul>
                    <ul className="ms" aria-label={`${DedaDifficulties[level]} over the program`}>
                        {[1, mid, full].map((w, i) => (
                            <li key={w}>
                                {i === 2 ? `Week ${w} on` : `Week ${w}`}
                                <b>{minutesText(days[w - 1]?.total ?? 0)}</b>
                            </li>
                        ))}
                    </ul>
                </>
            ) : (
                <div className="skel" aria-busy />
            )}
        </li>
    );
};

export const LampGoals: React.FC<{ help: React.ReactNode }> = ({ help }) => {
    const { melpSummary } = useMelpContext();
    const light = useTheme().resolved === 'light';
    const soft = useSoftChart();
    const tokens = light ? LIGHT : DARK;
    const all = { EASY: useLevelDays('EASY'), MEDIUM: useLevelDays('MEDIUM'), HARD: useLevelDays('HARD') } as Record<
        DedaDifficulty,
        GoalDay[]
    >;
    const weeks = Math.max(1, ...LEVELS.map((l) => all[l].length));
    const current = Math.min(Math.max(1, melpSummary?.current_deda_week ?? 1), weeks);
    const [week, setWeek] = useState(current);
    useEffect(() => setWeek(current), [current]);
    const mine = melpSummary?.deda_difficulty;
    const loading = LEVELS.some((l) => !all[l].length);

    // curva até um pouco depois da carga cheia do nível mais lento (depois disso as metas ficam planas)
    const span = Math.min(weeks, Math.max(...LEVELS.map((l) => fullLoadWeek(all[l]))) + 4);
    const maxTotal = Math.max(60, ...LEVELS.flatMap((l) => all[l].slice(0, span).map((d) => d.total)));
    const colors = LEVELS.map((l) => (l === mine ? tokens['--r-gold'] : tokens['--r-faint']));
    const options = soft(
        {
            chart: {
                type: 'line',
                toolbar: { show: false },
                zoom: { enabled: false },
                animations: { enabled: false },
                // clicar/tocar no gráfico escolhe a semana (os cartões e a linha tracejada acompanham)
                events: {
                    click: (
                        e: MouseEvent | TouchEvent,
                        ctx: { el: HTMLElement; w: { globals: { gridWidth: number; translateX: number } } },
                    ) => {
                        const point = 'changedTouches' in e ? e.changedTouches[0] : e;
                        if (!point) return;
                        const x = point.clientX - ctx.el.getBoundingClientRect().left - ctx.w.globals.translateX;
                        const picked = Math.round((x / ctx.w.globals.gridWidth) * (span - 1)) + 1;
                        if (picked >= 1 && picked <= span) setWeek(picked);
                    },
                },
            },
            colors,
            stroke: { curve: 'stepline', width: LEVELS.map((l) => (l === mine ? 2.5 : 1.5)) },
            legend: { show: false },
            grid: { padding: { right: 12 } },
            dataLabels: {
                enabled: true,
                formatter: (
                    _v: number,
                    o: { seriesIndex: number; dataPointIndex: number; w: { globals: { seriesNames: string[] } } },
                ) => (o.dataPointIndex === span - 1 ? o.w.globals.seriesNames[o.seriesIndex] : ''),
                background: { enabled: false },
                textAnchor: 'end',
                offsetX: -2,
                offsetY: -8,
                style: { fontSize: '12px', fontWeight: 500, colors },
            },
            xaxis: {
                type: 'numeric',
                min: 1,
                max: span,
                tickAmount: Math.min(8, span - 1),
                labels: { formatter: (v: string) => `W${Math.round(Number(v))}` },
                axisBorder: { show: false },
                axisTicks: { show: false },
            },
            yaxis: {
                min: 0,
                max: Math.ceil(maxTotal / 60) * 60,
                tickAmount: Math.ceil(maxTotal / 60),
                labels: { formatter: (v: number) => (v ? `${Math.round(v / 60)}h` : '0') },
            },
            annotations:
                week <= span
                    ? {
                          xaxis: [
                              {
                                  x: week,
                                  borderColor: tokens['--r-line-strong'],
                                  strokeDashArray: 3,
                                  label: { text: '' },
                              },
                          ],
                      }
                    : {},
        } as ApexOptions,
        (v, _x, series, i) => [minutesText(v), `${series} · Week ${i + 1}`],
    );

    return (
        <div className="panel lgoals" role="tabpanel">
            <Global styles={styles} />
            <div className="sh">
                <h2>
                    Daily goal by level
                    <Tooltip
                        title={<div className="help">{help}</div>}
                        placement="bottomLeft"
                        overlayStyle={{ maxWidth: 380 }}
                    >
                        <button type="button" className="ib hint-i" aria-label="About intensity levels and goals">
                            <Info {...ICON} size={16} />
                        </button>
                    </Tooltip>
                </h2>
            </div>
            <p className="hint lead">
                What each intensity asks of you per day. Your level was set when you started and changes only with a
                reset.
            </p>

            <div className="wk">
                <span className="eyebrow" id="goal-week">
                    Week <b>{String(week).padStart(2, '0')}</b>
                </span>
                <button
                    type="button"
                    className="ib prev"
                    aria-label="Previous week"
                    disabled={week <= 1}
                    onClick={() => setWeek((w) => Math.max(1, w - 1))}
                >
                    <ChevronLeft {...ICON} size={18} />
                </button>
                <input
                    type="range"
                    min={1}
                    max={weeks}
                    value={week}
                    aria-labelledby="goal-week"
                    aria-valuetext={`Week ${week}`}
                    onChange={(e) => setWeek(Number(e.target.value))}
                />
                <button
                    type="button"
                    className="ib next"
                    aria-label="Next week"
                    disabled={week >= weeks}
                    onClick={() => setWeek((w) => Math.min(weeks, w + 1))}
                >
                    <ChevronRight {...ICON} size={18} />
                </button>
                <button type="button" className="lnk now" disabled={week === current} onClick={() => setWeek(current)}>
                    {week === current ? 'This week' : 'Back to this week'}
                </button>
            </div>

            <ul className="lvls">
                {LEVELS.map((l) => (
                    <Level key={l} level={l} days={all[l]} week={week} mine={l === mine} />
                ))}
            </ul>

            <section className="grow" aria-label="How the daily goal grows">
                <div className="sh">
                    <h2>How the daily goal grows</h2>
                </div>
                <p className="hint">
                    Each level ramps up week by week, then stays at its full load. Tap the chart to see any week above.
                </p>
                {loading ? (
                    <div className="skel" aria-busy />
                ) : (
                    <div className="chart">
                        <ReactApexChart
                            options={options}
                            series={LEVELS.map((l) => ({
                                name: DedaDifficulties[l],
                                data: all[l].slice(0, span).map((d) => ({ x: d.week, y: d.total })),
                            }))}
                            type="line"
                            width="100%"
                            height={300}
                        />
                    </div>
                )}
            </section>
        </div>
    );
};
