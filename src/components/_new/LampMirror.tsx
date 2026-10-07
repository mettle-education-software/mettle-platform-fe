'use client';

import { css, Global } from '@emotion/react';
import type { ApexOptions } from 'apexcharts';
import { useGeneralWeeklyDevelopment, useOverallProgress } from 'hooks';
import { useRecordingStats } from 'hooks/melp/dedaRecording';
import { useDedaRun } from 'hooks/melp/lampDays';
import { useTheme } from 'hooks/useTheme';
import {
    axisWords,
    countsForRun,
    DEDA_QUALITY_MIN,
    LampDay,
    lastBreak,
    lastFourVsPrevious,
    topRuns,
    WEEK_DAYS,
    weeklyQuality,
} from 'libs/newDesign';
import { Check } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useAppContext } from 'providers';
import React, { useEffect, useRef, useState } from 'react';
import { DARK, ICON, LIGHT } from 'themes/newDesign';
import { DailyGoal } from './DailyGoal';
import { useSoftChart } from './lampCharts';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

/*
 * Performance da LAMP pela DEDA Run (decisão do André: o KPI mais importante do programa, sempre ao lado do Overall).
 * Um dia conta só com o DEDA a 80% ou mais; abaixo disso, ou sem DEDA, a Run volta a zero. Hoje não quebra enquanto o
 * dia não acaba. Sem confete: linguagem adulta.
 */

const styles = css`
    .drun {
        display: grid;
        grid-template-columns: minmax(0, 1.1fr) minmax(0, 1.5fr);
        gap: 28px 48px;
        padding: 28px 30px 26px;
        border: 1px solid var(--r-line);
        border-radius: 16px;
        background: var(--r-surf);
    }
    .drun .drun-kpis {
        display: flex;
        align-items: flex-end;
        gap: 40px;
        flex-wrap: wrap;
    }
    .drun .drun-n {
        display: block;
        font-size: 76px;
        font-weight: 300;
        line-height: 0.95;
        letter-spacing: -0.02em;
        font-variant-numeric: tabular-nums;
        color: var(--r-text);
    }
    .drun .drun-n small,
    .drun .drun-o small {
        display: block;
        margin-top: 6px;
        font-size: 13px;
        font-weight: 400;
        letter-spacing: 0.01em;
        color: var(--r-muted);
    }
    .drun .drun-o {
        display: block;
        font-size: 32px;
        font-weight: 300;
        line-height: 1.05;
        font-variant-numeric: tabular-nums;
    }
    .drun .drun-best {
        margin-top: 14px;
        font-size: 14px;
        color: var(--r-muted);
    }
    .drun .drun-best b {
        font-weight: 500;
        color: var(--r-text);
    }
    .drun .drun-now {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-top: 10px;
        font-size: 14px;
        line-height: 1.45;
        color: var(--r-text);
    }
    .drun .drun-now.ok {
        color: var(--r-gold-hi);
    }
    .drun .drun-rule {
        margin-top: 6px;
        font-size: 12.5px;
        line-height: 1.45;
        color: var(--r-muted);
    }
    /* mapa de constância: uma coluna por semana do programa, 7 linhas (seg–dom) */
    .cmap {
        margin-top: 44px;
    }
    .cmap .cm-lead {
        margin: -6px 0 12px;
        font-size: 14px;
        color: var(--r-text);
    }
    .cmap .cm-lead span {
        color: var(--r-muted);
    }
    .cmap .cm-tops {
        margin: -6px 0 14px;
        font-size: 12.5px;
        color: var(--r-muted);
    }
    .cmap .cm-wrap {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 6px;
    }
    .cmap .cm-rows {
        display: grid;
        grid-template-rows: repeat(7, var(--ch));
        gap: 3px;
        padding-top: 18px;
        font-size: 10px;
        line-height: var(--ch);
        color: var(--r-muted);
    }
    .cmap .cm-scroll {
        overflow-x: auto;
        scrollbar-width: thin;
    }
    .cmap .cm-grid {
        display: grid;
        grid-auto-flow: column;
        grid-template-rows: 15px repeat(7, var(--ch));
        grid-auto-columns: var(--cw);
        gap: 3px;
        width: max-content;
    }
    .cmap .cm-wk {
        font-size: 10px;
        color: var(--r-muted);
        white-space: nowrap;
        overflow: visible;
    }
    .cmap .cm-c {
        width: var(--cw);
        height: var(--ch);
        padding: 0;
        border: 0;
        border-radius: 3px;
        background: var(--r-track);
        cursor: pointer;
    }
    .cmap .cm-c.counted {
        background: var(--r-gold);
    }
    .cmap .cm-c.low {
        background: color-mix(in oklab, var(--r-danger) 45%, transparent);
    }
    .cmap .cm-c.future {
        background: none;
        box-shadow: inset 0 0 0 1px var(--r-line);
        cursor: default;
    }
    .cmap .cm-c.sel {
        outline: 2px solid var(--r-text);
        outline-offset: 1px;
    }
    .cmap .cm-foot {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 8px 16px;
        margin-top: 10px;
        font-size: 12.5px;
        color: var(--r-muted);
    }
    .cmap .cm-key {
        display: flex;
        gap: 14px;
        flex-wrap: wrap;
    }
    .cmap .cm-key i {
        display: inline-block;
        width: 10px;
        height: 10px;
        margin-right: 5px;
        border-radius: 2px;
        vertical-align: -1px;
        background: var(--r-track);
    }
    .cmap .cm-key .g i {
        background: var(--r-gold);
    }
    .cmap .cm-key .r i {
        background: color-mix(in oklab, var(--r-danger) 45%, transparent);
    }
    .cmap .cm-pick {
        min-height: 20px;
        color: var(--r-text);
    }
    /* tendência e qualidade */
    .mtwo {
        display: grid;
        grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
        gap: 32px 40px;
        margin-top: 44px;
    }
    .mtwo > section + section {
        margin-top: 0;
    }
    .cmp {
        margin: 0 0 4px;
        font-size: 13px;
        color: var(--r-muted);
    }
    .cmp b {
        font-weight: 500;
        color: var(--r-text);
    }
    @media (max-width: 960px) {
        .drun {
            grid-template-columns: minmax(0, 1fr);
            padding: 22px 16px;
            margin: 0 -4px;
        }
        .drun .drun-n {
            font-size: 64px;
        }
        .mtwo {
            grid-template-columns: minmax(0, 1fr);
        }
    }
`;

/** "203 days" / "1 day". */
export const daysText = (n: number) => `${n} day${n === 1 ? '' : 's'}`;

/** Dia da LAMP: "Tue, Oct 6" (sem pausa no programa) ou "Tue, W12". */
export const dayLabel = (d: LampDay) => {
    const wd = WEEK_DAYS[d.day - 1]?.label.slice(0, 3) ?? '';
    if (!d.date) return `${wd}, W${d.week}`;
    const sameYear = d.date.getFullYear() === new Date().getFullYear();
    return `${wd}, ${d.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) })}`;
};

type Run = ReturnType<typeof useDedaRun>;

/** A linha de hoje: o que falta, o que já contou ou onde a Run acabou. */
export const runTodayLine = (run: Run): { text: string; ok: boolean } => {
    if (run.todayCounted) return { text: `Today counted · ${run.current}`, ok: true };
    if (run.beforeToday > 0)
        return { text: `Do today’s DEDA at ${DEDA_QUALITY_MIN}%+ to reach ${run.beforeToday + 1}`, ok: false };
    const brk = lastBreak(run.newestFirst);
    if (brk && brk.previous > 0) {
        const why = brk.day.deda > 0 ? `${Math.round(brk.day.deda)}%` : 'no DEDA';
        return {
            text: `Your run of ${daysText(brk.previous)} ended on ${dayLabel(brk.day)} (${why}). Start again today.`,
            ok: false,
        };
    }
    return { text: `Do today’s DEDA at ${DEDA_QUALITY_MIN}%+ to start your DEDA Run`, ok: false };
};

const Hero: React.FC<{ run: Run }> = ({ run }) => {
    const { user } = useAppContext();
    const { overallData } = useOverallProgress(user?.uid);
    const overall = overallData?.overallPerformance;
    const rec = useRecordingStats();
    const line = runTodayLine(run);
    const ready = !run.loading || run.current > 0;
    return (
        <section className="drun" aria-label="DEDA Run" aria-busy={run.loading || undefined}>
            <div>
                <p className="eyebrow">DEDA Run</p>
                <div className="drun-kpis">
                    <span className="drun-n">
                        {ready ? run.current : '—'}
                        <small>{run.current === 1 ? 'day in a row' : 'days in a row'}</small>
                    </span>
                    <span className="drun-o">
                        {typeof overall === 'number' ? `${overall.toFixed(1)}%` : '—'}
                        <small>Overall</small>
                    </span>
                    {rec.allowed && rec.stats && (
                        <span className="drun-o">
                            {Math.round(rec.stats.rate * 100)}%<small>Recording rate</small>
                        </span>
                    )}
                </div>
                <p className="drun-best">
                    Best · <b>{daysText(Math.max(run.best, run.current))}</b>
                    {run.weeksLoaded < run.currentWeek && ` in the last ${run.weeksLoaded} weeks`}
                </p>
                {ready && (
                    <p className={`drun-now${line.ok ? ' ok' : ''}`} role="status">
                        {line.ok && <Check {...ICON} size={16} aria-hidden />}
                        {line.text}
                    </p>
                )}
                <p className="drun-rule">
                    A day counts when your DEDA is at {DEDA_QUALITY_MIN}% or more. Below that, or no DEDA, the run
                    starts again from zero.
                </p>
            </div>
            <div>
                <p className="eyebrow">Daily goal · Week {String(run.currentWeek).padStart(2, '0')}</p>
                <p className="drun-rule" style={{ margin: '4px 0 12px' }}>
                    Met = DEDA at {DEDA_QUALITY_MIN}%+, Active and Passive goals, all three.
                </p>
                <DailyGoal days={run.newestFirst} week={run.currentWeek} today={run.today} />
            </div>
        </section>
    );
};

/** Mapa de constância: semanas em colunas, dias em linhas; ouro = contou, vermelho = abaixo de 80%, vazio = sem DEDA. */
const ConstancyMap: React.FC<{ run: Run }> = ({ run }) => {
    const [pick, setPick] = useState<LampDay>();
    const oldestFirst = [...run.newestFirst].reverse();
    const tops = topRuns(oldestFirst, 3);
    const best = tops[0];
    const first = oldestFirst[0]?.week ?? run.currentWeek;
    const weeks = Array.from({ length: run.currentWeek - first + 1 }, (_, i) => first + i);
    const at = new Map(oldestFirst.map((d) => [`${d.week}:${d.day}`, d]));
    // a largura do conteúdo inteira: colunas mais largas (até 48 px) quando há poucas semanas; rolagem lateral quando há
    // mais semanas do que cabem a 9 px
    const scroller = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);
    useEffect(() => {
        const el = scroller.current;
        if (!el) return;
        const ro = new ResizeObserver(() => setWidth(el.clientWidth));
        ro.observe(el);
        return () => ro.disconnect();
    }, []);
    const cw = Math.max(9, Math.min(48, Math.floor((width || 600) / weeks.length) - 3));
    const ch = Math.max(9, Math.min(18, cw));
    const every = Math.max(1, Math.ceil(34 / (cw + 3)));
    const label = (d: LampDay) => `${dayLabel(d)} · ${d.deda > 0 ? `${Math.round(d.deda)}%` : 'no DEDA'}`;
    return (
        <section className="cmap" aria-label="Constancy map">
            <div className="sh">
                <h2>Constancy map</h2>
                {first > 1 && (
                    <button type="button" className="lnk gold" onClick={() => run.more(8)} disabled={run.loading}>
                        {run.loading ? 'Loading…' : 'Earlier weeks'}
                    </button>
                )}
            </div>
            {best ? (
                <>
                    <p className="cm-lead">
                        Best run · {daysText(best.days)}{' '}
                        <span>
                            ({dayLabel(best.from)} → {dayLabel(best.to)})
                        </span>
                    </p>
                    {tops.length > 1 && (
                        <p className="cm-tops">
                            {tops
                                .slice(1)
                                .map(
                                    (r, i) =>
                                        `${i ? '3rd' : '2nd'} best: ${daysText(r.days)} (${dayLabel(r.from)} → ${dayLabel(r.to)})`,
                                )
                                .join(' · ')}
                        </p>
                    )}
                </>
            ) : (
                <p className="cm-lead">
                    <span>No run in these weeks yet. One DEDA at {DEDA_QUALITY_MIN}%+ today starts the first.</span>
                </p>
            )}
            <div className="cm-wrap" style={{ '--cw': `${cw}px`, '--ch': `${ch}px` } as React.CSSProperties}>
                <div className="cm-rows" aria-hidden>
                    {['Mon', '', 'Wed', '', 'Fri', '', 'Sun'].map((t, i) => (
                        <span key={i}>{t}</span>
                    ))}
                </div>
                <div className="cm-scroll" ref={scroller}>
                    <div className="cm-grid" role="grid" aria-label={`Weeks ${first} to ${run.currentWeek}`}>
                        {weeks.map((w) => (
                            <React.Fragment key={w}>
                                <span className="cm-wk" aria-hidden>
                                    {(w - first) % every === 0 ? `W${w}` : ''}
                                </span>
                                {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                                    const d = at.get(`${w}:${day}`);
                                    if (!d) return <span key={day} className="cm-c future" aria-hidden />;
                                    const cls = countsForRun(d.deda) ? 'counted' : d.deda > 0 ? 'low' : 'none';
                                    return (
                                        <button
                                            key={day}
                                            type="button"
                                            className={`cm-c ${cls}${pick === d ? ' sel' : ''}`}
                                            title={label(d)}
                                            aria-label={label(d)}
                                            onClick={() => setPick(d)}
                                        />
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>
            <div className="cm-foot">
                <span className="cm-key" aria-hidden>
                    <span className="g">
                        <i />
                        Counted ({DEDA_QUALITY_MIN}%+)
                    </span>
                    <span className="r">
                        <i />
                        Below {DEDA_QUALITY_MIN}%
                    </span>
                    <span>
                        <i />
                        No DEDA
                    </span>
                </span>
                <span className="cm-pick" aria-live="polite">
                    {pick ? label(pick) : 'Tap a day to see its date and %'}
                </span>
            </div>
        </section>
    );
};

const Trend: React.FC = () => {
    const soft = useSoftChart();
    const light = useTheme().resolved === 'light';
    const c = light ? LIGHT : DARK;
    const { user } = useAppContext();
    const { weeklyDevelopment, weeklyDevelopmentData, isLoading } = useGeneralWeeklyDevelopment(user?.uid);
    // a anotação do eixo Y quebra o ApexCharts com a série ainda vazia: só desenha com dados
    if (isLoading || !weeklyDevelopmentData || !weeklyDevelopment.series?.length)
        return <div className="skel" aria-busy />;
    const cmp = lastFourVsPrevious((weeklyDevelopmentData[1] ?? []).map(Number));
    const base = soft(
        {
            ...weeklyDevelopment.options,
            colors: [c['--r-gold']],
            fill: { type: 'gradient', gradient: { opacityFrom: 0.22, opacityTo: 0.02 } },
            stroke: { curve: 'smooth', width: 2 },
            annotations: {
                yaxis: [
                    {
                        y: 80,
                        borderColor: c['--r-muted'],
                        strokeDashArray: 4,
                        label: {
                            text: '80%',
                            position: 'left',
                            textAnchor: 'start',
                            offsetX: 4,
                            borderWidth: 0,
                            style: { background: 'transparent', color: c['--r-muted'], fontSize: '11px' },
                        },
                    },
                ],
            },
        } as ApexOptions,
        (v, x) => [`${Math.round(v)}%`, `${axisWords(x)} · progress`],
    );
    const options = {
        ...base,
        xaxis: {
            ...base.xaxis,
            tickAmount: 8,
            axisTicks: { show: false }, // 104 semanas: só os rótulos, sem marca por semana
            labels: { ...base.xaxis?.labels, rotate: 0, hideOverlappingLabels: true },
        },
        yaxis: { ...(base.yaxis as object), tickAmount: 4 },
    } as ApexOptions;
    const words =
        cmp.last !== undefined && cmp.prev !== undefined
            ? `Last 4 weeks ${Math.round(cmp.last)}% · ${
                  Math.round(cmp.last) === Math.round(cmp.prev)
                      ? 'same as the 4 before'
                      : `${cmp.last > cmp.prev ? 'up' : 'down'} from ${Math.round(cmp.prev)}%`
              }`
            : undefined;
    return (
        <section aria-label="Weekly progress">
            <div className="sh">
                <h2>Weekly progress</h2>
            </div>
            {words && <p className="cmp">{words}</p>}
            <div className="chart">
                <ReactApexChart
                    options={options}
                    series={weeklyDevelopment.series}
                    type="area"
                    height={240}
                    width="100%"
                />
            </div>
        </section>
    );
};

const Quality: React.FC<{ run: Run }> = ({ run }) => {
    const soft = useSoftChart();
    const light = useTheme().resolved === 'light';
    const c = light ? LIGHT : DARK;
    const weeks = weeklyQuality(run.newestFirst).slice(-12);
    if (run.loading && !weeks.length) return <div className="skel" aria-busy />;
    const cats = weeks.map((w) => `W${w.week}`);
    const shownLabels = new Set([cats[0], cats[Math.floor((cats.length - 1) / 2)], cats[cats.length - 1]]);
    const options = soft(
        {
            chart: { type: 'line', toolbar: { show: false }, zoom: { enabled: false } },
            colors: [c['--r-gold']],
            stroke: { curve: 'straight', width: 2 },
            markers: { size: 3 },
            xaxis: {
                categories: weeks.map((w) => `W${w.week}`),
                axisBorder: { show: false },
                axisTicks: { show: false },
                // só a primeira, a do meio e a última (sem rótulos encavalados)
                labels: {
                    rotate: 0,
                    formatter: (v: string) => (shownLabels.has(v) ? v : ''),
                },
            },
            yaxis: { min: 0, max: 100, tickAmount: 4, labels: { formatter: (v: number) => `${Math.round(v)}%` } },
            annotations: {
                yaxis: [
                    {
                        y: DEDA_QUALITY_MIN,
                        borderColor: c['--r-muted'],
                        strokeDashArray: 4,
                        label: { text: '', borderWidth: 0 },
                    },
                ],
            },
            legend: { show: false },
        } as ApexOptions,
        (v, x) => [`${Math.round(v)}%`, `${axisWords(x)} · DEDA quality`],
    );
    return (
        <section aria-label="DEDA quality">
            <div className="sh">
                <h2>DEDA quality</h2>
            </div>
            <p className="cmp">Weekly average of your rated days · line at {DEDA_QUALITY_MIN}%</p>
            {weeks.length ? (
                <div className="chart">
                    <ReactApexChart
                        options={options}
                        series={[{ name: 'Quality', data: weeks.map((w) => Math.round(w.score)) }]}
                        type="line"
                        height={240}
                        width="100%"
                    />
                </div>
            ) : (
                <p className="hint">No rated DEDA in these weeks yet.</p>
            )}
        </section>
    );
};

/** Topo da aba Performance: a DEDA Run (com o Overall), a semana da Run, o mapa de constância, a tendência e a qualidade. */
export const LampMirror: React.FC = () => {
    const run = useDedaRun(12);
    return (
        <>
            <Global styles={styles} />
            <Hero run={run} />
            <ConstancyMap run={run} />
            <div className="mtwo">
                <Trend />
                <Quality run={run} />
            </div>
        </>
    );
};
