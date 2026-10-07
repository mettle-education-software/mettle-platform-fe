'use client';

import { css, Global } from '@emotion/react';
import { Select } from 'antd';
import { useGeneralWeeklyDevelopment, useGetDedasList, useGetWeeklyPerformance, useOverallProgress } from 'hooks';
import { statisticsColors } from 'libs';
import { axisWords, minutesText } from 'libs/newDesign';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { useAppContext, useMelpContext } from 'providers';
import React, { useEffect, useState } from 'react';
import { LampGoals } from './LampGoals';
import { LampOverallStats, LampStatsSort } from './LampOverallStats';
import { NewLampInput } from './NewLampInput';
import { NewPage } from './NewPage';
import { useSoftChart } from './lampCharts';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

/* ---------- estilos da LAMP (dentro de .ui-new-page.lamp) ---------- */

const lampStyles = css`
    /* abas: controle segmentado, o primeiro comando da página */
    .ui-new-page.lamp .seg {
        display: inline-flex;
        gap: 4px;
        margin: -8px 0 32px;
        padding: 4px;
        border: 1px solid var(--r-line);
        border-radius: 999px;
        background: var(--r-surf);
        overflow: visible;
    }
    .ui-new-page.lamp .seg button {
        min-height: 40px;
        padding: 0 24px;
        border-radius: 999px;
        font-size: 15px;
        color: var(--r-muted);
    }
    .ui-new-page.lamp .seg button::after {
        display: none;
    }
    .ui-new-page.lamp .seg button:hover {
        color: var(--r-text);
        background: var(--r-hover);
    }
    .ui-new-page.lamp .seg button[aria-selected='true'] {
        background: var(--r-gold);
        color: var(--r-on-gold);
        font-weight: 500;
    }

    /* Performance: o resumo (Overall + Weekly progress) num bloco de destaque; o detalhe vem abaixo, mais quieto */
    .ui-new-page.lamp .hero {
        padding: 24px 28px 20px;
        border: 1px solid var(--r-line);
        border-radius: 16px;
        background: var(--r-surf);
    }
    .ui-new-page.lamp .hero h2 {
        font-size: 20px;
    }
    .ui-new-page.lamp .quiet {
        margin-top: 56px;
    }
    .ui-new-page.lamp .quiet > .sh h2 {
        font-size: 17px;
    }
    .ui-new-page.lamp .quiet .chart h3 {
        font-size: 13.5px;
        font-weight: 400;
        color: var(--r-muted);
    }

    /* balão dos gráficos: pequeno, nas cores do tema, valor e rótulo em palavras */
    .ui-new-page.lamp .apexcharts-tooltip,
    .ui-new-page.lamp .apexcharts-tooltip.apexcharts-theme-light,
    .ui-new-page.lamp .apexcharts-tooltip.apexcharts-theme-dark {
        border: 0 !important;
        border-radius: 8px !important;
        background: var(--r-tip-bg) !important;
        color: var(--r-tip-text) !important;
        box-shadow: 0 6px 18px var(--r-card-shadow) !important;
    }
    .ltip {
        display: grid;
        gap: 1px;
        padding: 6px 10px 7px;
        font-family: var(--r-ui-font), system-ui, sans-serif;
        line-height: 1.3;
        white-space: nowrap;
    }
    .ltip b {
        font-size: 14px;
        font-weight: 500;
        font-variant-numeric: tabular-nums;
    }
    .ltip span {
        font-size: 11.5px;
        letter-spacing: 0.01em;
        opacity: 0.82;
    }

    /* Input: o que foi preenchido no dia aparece em dourado (campo de tempo e estrelas) */
    .ui-new-page.lamp .frs .hm {
        color: var(--r-muted);
    }
    .ui-new-page.lamp .frs .hm.on {
        border-color: var(--r-gold);
        background: var(--r-gold-tint);
        color: var(--r-gold-hi);
        font-weight: 500;
    }
    .ui-new-page.lamp .frs .fr .lab {
        color: var(--r-muted);
    }
    .ui-new-page.lamp .frs .fr.on .lab {
        color: var(--r-text);
    }
    .ui-new-page.lamp .sh {
        flex-wrap: wrap;
        margin-bottom: 16px;
    }
    .ui-new-page.lamp .sh h2 {
        display: flex;
        align-items: center;
        gap: 4px;
    }
    .help p {
        margin: 0 0 8px;
        font-size: 13px;
        line-height: 1.5;
    }
    .help p:last-of-type {
        margin: 0;
    }
    .help b {
        font-weight: 500;
        color: var(--r-gold-hi);
    }
    .ui-new-page.lamp .hint-i {
        width: 32px;
        height: 32px;
        color: var(--r-faint);
    }
    .ui-new-page.lamp .hint-i:hover {
        color: var(--r-text);
    }
    .ui-new-page.lamp h3 {
        display: flex;
        align-items: center;
        gap: 4px;
        min-height: 32px;
        margin: 0 0 6px;
        font-size: 15px;
        font-weight: 500;
    }
    .ui-new-page.lamp h3 small {
        margin-left: 4px;
        font-size: var(--r-label-size);
        font-weight: 500;
        letter-spacing: var(--r-label-track);
        color: var(--r-muted);
    }
    .ui-new-page.lamp .ant-select {
        min-width: 170px;
    }
    .ui-new-page.lamp .ant-select-selector {
        background: transparent !important;
        border-color: var(--r-line-strong) !important;
        border-radius: 999px !important;
    }
    /* select aberto: o antd esmaece o item escolhido a ~2:1; fica legível (AA) */
    .ui-new-page.lamp .ant-select-open .ant-select-selection-item {
        color: var(--r-muted);
    }

    /* claro: dourado sobre o tom dourado fica abaixo de AA (4,4:1); o destaque fica no fundo, o texto em grafite */
    html[data-theme='light'] .ui-new-page.lamp .toggle button[aria-pressed='true'] {
        color: var(--r-text);
    }

    /* ---------- Performance ---------- */
    .ui-new-page.lamp .two {
        display: grid;
        grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
        gap: 32px;
    }
    /* colunas lado a lado: sem o respiro vertical entre seções irmãs */
    .ui-new-page.lamp .two > section + section,
    .ui-new-page.lamp .cols3 > section + section {
        margin-top: 0;
    }
    .ui-new-page.lamp .chart > .sh {
        margin-bottom: 0;
    }
    .ui-new-page.lamp .chart {
        position: relative;
        min-width: 0;
    }
    .ui-new-page.lamp .chart .apexcharts-canvas {
        margin: 0 auto;
    }
    .ui-new-page.lamp .chart .apexcharts-tooltip {
        font-family: var(--r-ui-font), system-ui, sans-serif;
    }
    .ui-new-page.lamp .center {
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        pointer-events: none;
        font-size: 22px;
        font-weight: 500;
        font-variant-numeric: tabular-nums;
    }
    .ui-new-page.lamp .legend {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 10px 28px;
        margin-top: 4px;
        list-style: none;
        padding: 0;
    }
    .ui-new-page.lamp .legend li {
        display: grid;
        justify-items: center;
        gap: 2px;
        font-size: var(--r-label-size);
        font-weight: 500;
        letter-spacing: var(--r-label-track);
        text-transform: uppercase;
        color: var(--r-muted);
    }
    .ui-new-page.lamp .legend b {
        font-size: 15px;
        font-weight: 500;
        letter-spacing: 0;
        color: var(--r-text);
    }
    .ui-new-page.lamp .legend i {
        display: block;
        width: 28px;
        height: 3px;
        margin: 2px 0 4px;
        border-radius: 2px;
    }
    .ui-new-page.lamp .toggle {
        display: inline-flex;
        gap: 2px;
        padding: 3px;
        border: 1px solid var(--r-line);
        border-radius: 999px;
    }
    .ui-new-page.lamp .toggle button {
        min-height: 36px;
        padding: 0 14px;
        border: 0;
        border-radius: 999px;
        background: none;
        color: var(--r-muted);
        font-size: 13px;
        cursor: pointer;
    }
    .ui-new-page.lamp .toggle button[aria-pressed='true'] {
        background: var(--r-gold-tint);
        color: var(--r-gold-hi);
    }
    .ui-new-page.lamp .cols3 {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 24px 40px;
    }
    .ui-new-page.lamp .frs {
        border-top: 1px solid var(--r-line);
    }
    .ui-new-page.lamp .frs + .frs {
        margin-top: 20px;
    }
    .ui-new-page.lamp .fr {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        min-height: 48px;
        padding: 4px 0;
        border-bottom: 1px solid var(--r-line);
    }
    .ui-new-page.lamp .fr .lab {
        font-size: 14px;
        line-height: 1.35;
        color: var(--r-text);
    }
    .ui-new-page.lamp .fr .lab small {
        margin-left: 6px;
        font-size: var(--r-label-size);
        letter-spacing: var(--r-label-track);
        color: var(--r-faint);
    }
    .ui-new-page.lamp .fr .val {
        flex: none;
        font-size: 14.5px;
        font-variant-numeric: tabular-nums;
        color: var(--r-gold-hi);
    }
    .ui-new-page.lamp .fr .ant-rate {
        flex: none;
        line-height: 1;
    }
    .ui-new-page.lamp .hm {
        flex: none;
        width: 72px;
        height: 40px;
        padding: 0 8px;
        border: 1px solid var(--r-line-strong);
        border-radius: 10px;
        background: transparent;
        color: var(--r-text);
        font: inherit;
        font-size: 14.5px;
        font-variant-numeric: tabular-nums;
        text-align: center;
    }
    .ui-new-page.lamp .hm:focus {
        border-color: var(--r-gold-hi);
        outline: none;
    }
    .ui-new-page.lamp .fskel {
        height: 320px;
        border-radius: var(--r-radius);
        background: var(--r-surf);
        opacity: 0.5;
    }
    .ui-new-page.lamp .pick {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
    }
    .ui-new-page.lamp .save {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: var(--r-muted);
    }
    .ui-new-page.lamp .spin {
        animation: lamp-spin 1s linear infinite;
    }
    @keyframes lamp-spin {
        to {
            transform: rotate(360deg);
        }
    }
    .ui-new-page.lamp .reviews {
        margin-top: 40px;
    }
    .ui-new-page.lamp .revs {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 28px 24px;
    }
    .ui-new-page.lamp .rev iframe,
    .ui-new-page.lamp .rev .vskel {
        display: block;
        width: 100%;
        aspect-ratio: 16 / 9;
        margin: 8px 0 10px;
        border: 0;
        border-radius: var(--r-radius);
        background: var(--r-video-bg);
    }
    .ui-new-page.lamp .rfoot {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
    }
    .ui-new-page.lamp .rfoot b {
        display: block;
        font-size: 14.5px;
        font-weight: 500;
    }
    .ui-new-page.lamp .rfoot small {
        display: block;
        font-size: 12.5px;
        color: var(--r-muted);
    }
    .ui-new-page.lamp .rfoot .btn {
        min-height: 40px;
        padding: 0 16px;
        font-size: 13.5px;
    }

    .ui-new-page.lamp .skel {
        height: 220px;
        border-radius: var(--r-radius);
        background: var(--r-surf);
        opacity: 0.5;
    }

    @media (max-width: 860px) {
        .ui-new-page.lamp .hm {
            font-size: 16px; /* menos que isso o Safari do iPhone amplia a página ao tocar */
        }
        .ui-new-page.lamp .seg {
            display: flex;
            margin-bottom: 24px;
        }
        .ui-new-page.lamp .seg button {
            flex: 1 1 0;
            padding: 0 8px;
        }
        .ui-new-page.lamp .hero {
            margin: 0 -4px;
            padding: 20px 16px 16px;
        }
        .ui-new-page.lamp .quiet {
            margin-top: 44px;
        }
        .ui-new-page.lamp .two,
        .ui-new-page.lamp .cols3 {
            grid-template-columns: minmax(0, 1fr);
            gap: 32px;
        }
        .ui-new-page.lamp .pick .ant-select {
            flex: 1 1 140px;
            min-width: 0;
        }
        .ui-new-page.lamp .sh .ant-select {
            min-width: 0;
        }
        .ui-new-page.lamp .fr .lab {
            font-size: 13.5px;
        }
    }
`;

/* ---------- Performance ---------- */

const Legend: React.FC<{ name: string; color: string; value?: number | null }> = ({ name, color, value }) => (
    <li>
        <b>{Math.round(value ?? 0)}%</b>
        <i style={{ background: color }} aria-hidden />
        {name}
    </li>
);

const Overall: React.FC = () => {
    const soft = useSoftChart();
    const { user } = useAppContext();
    const { overallGraph, isLoading, overallData } = useOverallProgress(user?.uid);
    if (isLoading || !overallData) return <div className="skel" aria-busy />;
    return (
        <div>
            <div className="chart">
                <ReactApexChart
                    options={soft(overallGraph.options)}
                    series={overallGraph.series}
                    type="radialBar"
                    width="100%"
                    height={300}
                />
                <div className="center" aria-hidden>
                    {overallData.overallPerformance.toFixed(2)}%
                </div>
            </div>
            <ul className="legend" aria-label="Overall progress by activity">
                <Legend name="DEDA" color={statisticsColors.DEDA} value={overallData.byActivity.deda} />
                <Legend name="Active" color={statisticsColors.Active} value={overallData.byActivity.active} />
                <Legend name="Passive" color={statisticsColors.Passive} value={overallData.byActivity.passive} />
                {overallData.byActivity.review !== null && overallData.byActivity.review !== undefined && (
                    <Legend name="Review" color={statisticsColors.Review} value={overallData.byActivity.review} />
                )}
            </ul>
        </div>
    );
};

const Weekly: React.FC = () => {
    const soft = useSoftChart();
    const { user } = useAppContext();
    const { weeklyDevelopment, isLoading, weeklyDevelopmentData } = useGeneralWeeklyDevelopment(user?.uid);
    if (isLoading || !weeklyDevelopmentData) return <div className="skel" aria-busy />;
    // até 100+ semanas no eixo: uma marca a cada ~10, sem rótulos inclinados
    const base = soft(weeklyDevelopment.options, (v, x) => [`${Math.round(v)}%`, `${axisWords(x)} · progress`]);
    const options = {
        ...base,
        xaxis: {
            ...base.xaxis,
            tickAmount: 10,
            labels: { ...base.xaxis?.labels, rotate: 0, hideOverlappingLabels: true },
        },
    };
    return (
        <div className="chart">
            <ReactApexChart options={options} series={weeklyDevelopment.series} type="area" height={300} width="100%" />
        </div>
    );
};

const DedaStats: React.FC<{ week?: string }> = ({ week }) => {
    const soft = useSoftChart();
    const [daily, setDaily] = useState<'dedaTime' | 'readingTime'>('dedaTime');
    const { weeklyPerformanceGraph, dailyPerformanceGraph, isLoading, graphsData } = useGetWeeklyPerformance(
        daily,
        week,
    );
    if (isLoading || !graphsData) return <div className="skel" aria-busy />;
    return (
        <div className="two">
            <div className="chart">
                <div className="sh">
                    <h3>Weekly</h3>
                </div>
                <ReactApexChart
                    options={soft(
                        weeklyPerformanceGraph.options,
                        (v, x) => [`${Math.round(v)}%`, `${axisWords(x)} · this week`],
                        true,
                    )}
                    series={weeklyPerformanceGraph.series}
                    type="bar"
                    width="100%"
                    height={240}
                />
            </div>
            <div className="chart">
                <div className="sh">
                    <h3>Daily</h3>
                    <div className="toggle" role="group" aria-label="Daily measure">
                        <button type="button" aria-pressed={daily === 'dedaTime'} onClick={() => setDaily('dedaTime')}>
                            DEDA time
                        </button>
                        <button
                            type="button"
                            aria-pressed={daily === 'readingTime'}
                            onClick={() => setDaily('readingTime')}
                        >
                            Reading time
                        </button>
                    </div>
                </div>
                <ReactApexChart
                    options={soft(
                        dailyPerformanceGraph.options,
                        (v, x) => [
                            minutesText(v, daily === 'readingTime'),
                            `${axisWords(x)} · ${daily === 'dedaTime' ? 'DEDA time' : 'Reading time'}`,
                        ],
                        true,
                    )}
                    series={dailyPerformanceGraph.series}
                    type="bar"
                    width="100%"
                    height={240}
                />
            </div>
        </div>
    );
};

const Performance: React.FC = () => {
    const { melpSummary } = useMelpContext();
    const { dedasList } = useGetDedasList();
    const [week, setWeek] = useState<string>();
    const [order, setOrder] = useState<'time' | 'default'>('time');
    useEffect(() => {
        if (melpSummary?.current_deda_week) setWeek(`week${melpSummary.current_deda_week}`);
    }, [melpSummary?.current_deda_week]);

    return (
        <div className="panel" role="tabpanel">
            <div className="two hero">
                <section aria-label="Overall progress">
                    <div className="sh">
                        <h2>Overall</h2>
                    </div>
                    <Overall />
                </section>
                <section aria-label="Weekly progress">
                    <div className="sh">
                        <h2>Weekly progress</h2>
                    </div>
                    <Weekly />
                </section>
            </div>
            <section className="quiet" aria-label="DEDA stats">
                <div className="sh">
                    <h2>DEDA stats</h2>
                    <Select
                        aria-label="DEDA week"
                        value={dedasList.length ? week : undefined}
                        options={dedasList}
                        onChange={setWeek}
                        popupMatchSelectWidth={false}
                        loading={!dedasList.length}
                    />
                </div>
                <DedaStats week={week} />
            </section>
            <section className="quiet" aria-label="Overall stats">
                <div className="sh">
                    <h2>Overall stats</h2>
                    <LampStatsSort order={order} onOrder={setOrder} />
                </div>
                <LampOverallStats order={order} />
            </section>
        </div>
    );
};

/* ---------- Goals ---------- */

const GOALS_HELP = (
    <>
        <p>
            See how your daily and weekly study goals evolve over time. The intensity level you select determines how
            quickly you’ll reach your daily targets and, ultimately, achieve your goal of English fluency:
        </p>
        <p>
            <b>Flow:</b> a gradual pace, reaching 3 hours/day (1 hour 15 minutes active, 1 hour 45 minutes passive)
            within 10 months (41 weeks).
        </p>
        <p>
            <b>Boost:</b> a moderate pace, reaching 4 hours/day (1 hour 30 minutes active, 2 hours 30 minutes passive)
            within 8 months (33 weeks).
        </p>
        <p>
            <b>Turbo:</b> an accelerated pace, reaching 5 hours/day (2 hours active, 3 hours passive) within 6 months
            (25 weeks).
        </p>
        <p>
            These targets help you structure your routine effectively, ensuring steady progress based on your commitment
            level. You can only select your intensity level at the start of the program or when restarting it using one
            of your reset options.
        </p>
    </>
);

/* ---------- página ---------- */

const TABS = [
    { key: 'performance', label: 'Performance' },
    { key: 'input', label: 'Input' },
    { key: 'goal', label: 'Goals' },
] as const;
type TabKey = (typeof TABS)[number]['key'];

/**
 * LAMP na plataforma nova: as mesmas três abas (Performance, Input, Goals), os mesmos hooks e as mesmas chamadas
 * da página atual; textos de instrução viram ⓘ; tabela larga rola no próprio container.
 */
const NewLamp: React.FC<{ initialTab?: string }> = ({ initialTab }) => {
    // na casca persistente a página nem sempre recebe searchParams: o endereço é a fonte (?lampTab=goal)
    const params = useSearchParams();
    const asked = initialTab ?? params?.get('lampTab') ?? undefined;
    const [tab, setTab] = useState<TabKey>(TABS.some((t) => t.key === asked) ? (asked as TabKey) : 'performance');

    return (
        <NewPage className="lamp">
            <Global styles={lampStyles} />
            <header className="ph">
                <p className="eyebrow">IMERSO</p>
                <h1>LAMP</h1>
                <p className="ctx">Language Acquisition Management Platform</p>
            </header>
            <div className="seg" role="tablist" aria-label="LAMP">
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        type="button"
                        role="tab"
                        aria-selected={t.key === tab}
                        onClick={() => {
                            // só o endereço muda (o roteador do Next acompanha): sem ida ao servidor nem remontar a página
                            window.history.replaceState(null, '', `/imerso/lamp?lampTab=${t.key}`);
                            setTab(t.key);
                        }}
                    >
                        {t.label}
                    </button>
                ))}
            </div>
            {tab === 'performance' && <Performance />}
            {tab === 'input' && <NewLampInput />}
            {tab === 'goal' && <LampGoals help={GOALS_HELP} />}
        </NewPage>
    );
};

export default NewLamp;
