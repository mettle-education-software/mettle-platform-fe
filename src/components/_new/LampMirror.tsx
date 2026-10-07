'use client';

import { css, Global } from '@emotion/react';
import type { ApexOptions } from 'apexcharts';
import { useGeneralWeeklyDevelopment, useOverallProgress } from 'hooks';
import { useRecordingStats } from 'hooks/melp/dedaRecording';
import { useDedaRun } from 'hooks/melp/lampDays';
import { useTheme } from 'hooks/useTheme';
import { axisWords, DEDA_QUALITY_MIN, LampDay, lastBreak, WEEK_DAYS, weeklyQuality } from 'libs/newDesign';
import { Check } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useAppContext } from 'providers';
import React from 'react';
import { DARK, ICON, LIGHT } from 'themes/newDesign';
import { LampCalendar } from './LampCalendar';
import { Hint } from './NewLampInput';
import { useSoftChart } from './lampCharts';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

/*
 * Performance da LAMP pela DEDA Run (decisão do André: o KPI mais importante do programa, sempre ao lado do Overall).
 * Um dia conta só com o DEDA a 80% ou mais; abaixo disso, ou sem DEDA, a Run volta a zero. Hoje não quebra enquanto o
 * dia não acaba. Sem confete: linguagem adulta.
 */

const styles = css`
    .drun {
        padding: 28px 30px 26px;
        border: 1px solid var(--r-line);
        border-radius: 16px;
        background: var(--r-surf);
    }
    .drun .drun-eb {
        display: flex;
        align-items: center;
        gap: 2px;
        margin: -10px 0 -6px;
    }
    .drun .drun-kpis {
        display: flex;
        align-items: flex-end;
        gap: 12px 30px;
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
    .drun .drun-now {
        display: flex;
        align-items: center;
        gap: 6px;
        margin: 0 0 0 auto;
        padding-bottom: 22px;
        font-size: 14px;
        line-height: 1.45;
        color: var(--r-text);
    }
    .drun .drun-now.ok {
        color: var(--r-gold-hi);
    }
    .cmap {
        margin-top: 44px;
    }
    /* tendência e qualidade */
    .mtwo {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        align-items: start;
        gap: 32px 40px;
        margin-top: 44px;
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
        .drun .drun-now {
            flex-basis: 100%;
            margin: 4px 0 0;
            padding: 0;
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
    if (run.beforeToday > 0) return { text: `Today: DEDA ${DEDA_QUALITY_MIN}%+ → ${run.beforeToday + 1}`, ok: false };
    const brk = lastBreak(run.newestFirst);
    if (brk && brk.previous > 0) {
        const why = brk.day.deda > 0 ? `${Math.round(brk.day.deda)}%` : 'no DEDA';
        return { text: `Run of ${daysText(brk.previous)} ended ${dayLabel(brk.day)} (${why})`, ok: false };
    }
    return { text: `Today: DEDA ${DEDA_QUALITY_MIN}%+ starts your run`, ok: false };
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
            <p className="eyebrow drun-eb">
                DEDA Run
                <Hint
                    text={`A day counts when your DEDA is at ${DEDA_QUALITY_MIN}% or more. Below that, or no DEDA, the run starts again from zero.`}
                />
            </p>
            <div className="drun-kpis">
                <span className="drun-n">
                    {ready ? run.current : '—'}
                    <small>{run.current === 1 ? 'day in a row' : 'days in a row'}</small>
                </span>
                <span className="drun-o">
                    {ready ? Math.max(run.best, run.current) : '—'}
                    <small>Best</small>
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
                {ready && (
                    <p className={`drun-now${line.ok ? ' ok' : ''}`} role="status">
                        {line.ok && <Check {...ICON} size={16} aria-hidden />}
                        {line.text}
                    </p>
                )}
            </div>
        </section>
    );
};

/** Calendário da DEDA Run e da meta do dia. */
const ConstancyMap: React.FC<{ run: Run }> = ({ run }) => (
    <section className="cmap" aria-label="Imerso Calendar">
        <div className="sh">
            <h2>Imerso Calendar</h2>
        </div>
        <LampCalendar newestFirst={run.newestFirst} />
    </section>
);

const Trend: React.FC = () => {
    const soft = useSoftChart();
    const light = useTheme().resolved === 'light';
    const c = light ? LIGHT : DARK;
    const { user } = useAppContext();
    const { weeklyDevelopment, weeklyDevelopmentData, isLoading } = useGeneralWeeklyDevelopment(user?.uid);
    // a anotação do eixo Y quebra o ApexCharts com a série ainda vazia: só desenha com dados
    if (isLoading || !weeklyDevelopmentData || !weeklyDevelopment.series?.length)
        return <div className="skel" aria-busy />;
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
    return (
        <section aria-label="Weekly progress">
            <div className="sh">
                <h2>Weekly progress</h2>
            </div>
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
