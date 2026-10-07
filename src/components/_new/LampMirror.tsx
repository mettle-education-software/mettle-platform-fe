'use client';

import { css, Global } from '@emotion/react';
import type { ApexOptions } from 'apexcharts';
import { useGeneralWeeklyDevelopment, useOverallProgress } from 'hooks';
import { useDedaRun } from 'hooks/melp/lampDays';
import { useTheme } from 'hooks/useTheme';
import { statisticsColors } from 'libs';
import { axisWords, DEDA_QUALITY_MIN, weeklyQuality } from 'libs/newDesign';
import dynamic from 'next/dynamic';
import { useAppContext } from 'providers';
import React from 'react';
import { DARK, LIGHT } from 'themes/newDesign';
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
    /* topo: a DEDA Run à esquerda, o anel do Overall (DEDA/Active/Passive/Review) à direita */
    .drun {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        align-items: center;
        gap: 24px 40px;
        padding: 24px 30px;
        border: 1px solid var(--r-line);
        border-radius: 16px;
        background: var(--r-surf);
    }
    .drun > .drun-l {
        justify-self: center;
    }
    .drun .drun-eb {
        display: flex;
        align-items: center;
        gap: 2px;
        margin: 0 0 -4px;
    }
    .drun .drun-n {
        display: block;
        font-size: 96px;
        font-weight: 300;
        line-height: 1;
        letter-spacing: -0.02em;
        font-variant-numeric: tabular-nums;
        color: var(--r-text);
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
            font-size: 76px;
        }
        .mtwo {
            grid-template-columns: minmax(0, 1fr);
        }
    }
`;

type Run = ReturnType<typeof useDedaRun>;

const Legend: React.FC<{ name: string; color: string; value?: number | null }> = ({ name, color, value }) => (
    <li>
        <b>{Math.round(value ?? 0)}%</b>
        <i style={{ background: color }} aria-hidden />
        {name}
    </li>
);

/** O anel original do Overall: DEDA, Active, Passive e Review concêntricos, o Overall no centro, os índices embaixo. */
const Overall: React.FC = () => {
    const soft = useSoftChart();
    const { user } = useAppContext();
    const { overallGraph, isLoading, overallData } = useOverallProgress(user?.uid);
    if (isLoading || !overallData) return <div className="skel" aria-busy />;
    const by = overallData.byActivity;
    return (
        <div>
            <div className="chart">
                <ReactApexChart
                    options={soft(overallGraph.options)}
                    series={overallGraph.series}
                    type="radialBar"
                    width="100%"
                    height={260}
                />
                <div className="center" aria-hidden>
                    {overallData.overallPerformance.toFixed(1)}%
                </div>
            </div>
            <ul className="legend" aria-label="Overall progress by activity">
                <Legend name="DEDA" color={statisticsColors.DEDA} value={by.deda} />
                <Legend name="Active" color={statisticsColors.Active} value={by.active} />
                <Legend name="Passive" color={statisticsColors.Passive} value={by.passive} />
                {by.review !== null && by.review !== undefined && (
                    <Legend name="Review" color={statisticsColors.Review} value={by.review} />
                )}
            </ul>
        </div>
    );
};

const Hero: React.FC<{ run: Run }> = ({ run }) => {
    const ready = !run.loading || run.current > 0;
    return (
        <section className="drun" aria-label="DEDA Run" aria-busy={run.loading || undefined}>
            <div className="drun-l">
                <p className="eyebrow drun-eb">
                    DEDA Run
                    <Hint
                        text={`A day counts when your DEDA is at ${DEDA_QUALITY_MIN}% or more. Below that, or no DEDA, the run starts again from zero.`}
                    />
                </p>
                <span className="drun-n">{ready ? run.current : '—'}</span>
            </div>
            <Overall />
        </section>
    );
};

/** Calendário da DEDA Run e da meta do dia. */
const ConstancyMap: React.FC<{ run: Run }> = ({ run }) => (
    <section className="cmap">
        <LampCalendar newestFirst={run.newestFirst} title="Imerso Calendar" />
    </section>
);

/** Eixo das semanas, igual nos dois gráficos lado a lado (Weekly progress e DEDA quality). */
const weekAxis = (cats: (string | number)[]) => ({
    categories: cats,
    tickAmount: Math.max(1, Math.min(8, cats.length - 1)),
    axisBorder: { show: false },
    axisTicks: { show: false },
});
const WEEK_LABELS = { rotate: 0, hideOverlappingLabels: true };

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
                        label: { text: '', borderWidth: 0 },
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
            ...weekAxis(weeklyDevelopmentData[0] ?? []),
            labels: { ...base.xaxis?.labels, ...WEEK_LABELS },
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
    const { user } = useAppContext();
    // o mesmo eixo do Weekly progress: as semanas do programa até hoje, com os mesmos rótulos
    const cats = useGeneralWeeklyDevelopment(user?.uid).weeklyDevelopmentData?.[0] ?? [];
    const weeks = weeklyQuality(run.newestFirst);
    if ((run.loading && !weeks.length) || !cats.length) return <div className="skel" aria-busy />;
    const byWeek = new Map(weeks.map((w) => [w.week, Math.round(w.score)]));
    const data = cats.map((l) => byWeek.get(Number(String(l).replace(/\D/g, ''))) ?? null);
    const options = soft(
        {
            chart: { type: 'line', toolbar: { show: false }, zoom: { enabled: false } },
            colors: [c['--r-gold']],
            stroke: { curve: 'straight', width: 2 },
            markers: { size: cats.length > 30 ? 0 : 3 },
            xaxis: { ...weekAxis(cats), labels: WEEK_LABELS },
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
        (v, x) => [v == null ? '—' : `${Math.round(v)}%`, `${axisWords(x)} · DEDA quality`],
    );
    return (
        <section aria-label="DEDA quality">
            <div className="sh">
                <h2>DEDA quality</h2>
            </div>
            <div className="chart">
                <ReactApexChart
                    options={options}
                    series={[{ name: 'Quality', data }]}
                    type="line"
                    height={240}
                    width="100%"
                />
            </div>
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
