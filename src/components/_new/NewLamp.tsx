'use client';

import { css, Global } from '@emotion/react';
import { Select, Tooltip } from 'antd';
import { uiFont } from 'components/_melp/_deda/DedaReader/readerFonts';
import {
    useGeneralWeeklyDevelopment,
    useGetDedasList,
    useGetGoalByLevel,
    useGetOverallStatsReport,
    useGetWeeklyPerformance,
    useGoalGraphOptions,
    useOverallProgress,
} from 'hooks';
import { OverallStatsEnum } from 'interfaces';
import { DedaDifficulties, DedaDifficulty } from 'interfaces/melp';
import { statisticsColors } from 'libs';
import { goalLabel, softChart } from 'libs/newDesign';
import { Info } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useAppContext, useMelpContext } from 'providers';
import React, { useEffect, useRef, useState } from 'react';
import { ICON } from 'themes/newDesign';
import { NewLampInput } from './NewLampInput';
import { NewPage } from './NewPage';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

const FONT = uiFont.style.fontFamily;

/* ---------- estilos da LAMP (dentro de .ui-new-page.lamp) ---------- */

const lampStyles = css`
    .ui-new-page.lamp .seg {
        margin-bottom: 24px;
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
        color: #d3a878;
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
        color: var(--r-faint);
    }
    .ui-new-page.lamp .ant-select {
        min-width: 170px;
    }
    .ui-new-page.lamp .ant-select-selector {
        background: transparent !important;
        border-color: var(--r-line-strong) !important;
        border-radius: 999px !important;
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

    /* ---------- Goals ---------- */
    .ui-new-page.lamp .tiles {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 12px;
        margin: 0 0 40px;
    }
    .ui-new-page.lamp .tile {
        padding: 14px 16px;
        border: 1px solid var(--r-line);
        border-radius: var(--r-radius);
    }
    .ui-new-page.lamp .tile.total {
        border-color: var(--r-gold);
        background: var(--r-gold-tint);
    }
    .ui-new-page.lamp .tile .eyebrow {
        display: flex;
        align-items: center;
        gap: 6px;
    }
    .ui-new-page.lamp .tile .eyebrow i {
        width: 8px;
        height: 8px;
        border-radius: 50%;
    }
    .ui-new-page.lamp .tile b {
        display: block;
        margin-top: 6px;
        font-size: 22px;
        font-weight: 400;
        font-variant-numeric: tabular-nums;
    }
    .ui-new-page.lamp .tile.total b {
        color: var(--r-gold-hi);
    }
    .ui-new-page.lamp .tw {
        max-height: 440px;
        overflow: auto;
        border-top: 1px solid var(--r-line);
        scrollbar-width: thin;
        scrollbar-color: var(--r-track) transparent;
    }
    .ui-new-page.lamp table {
        width: 100%;
        min-width: 420px;
        border-collapse: collapse;
        font-size: 14px;
        font-variant-numeric: tabular-nums;
    }
    .ui-new-page.lamp th {
        position: sticky;
        top: 0;
        z-index: 1;
        padding: 10px 12px;
        background: var(--r-bg);
        font-size: var(--r-label-size);
        font-weight: 500;
        letter-spacing: var(--r-label-track);
        text-transform: uppercase;
        text-align: right;
        color: var(--r-muted);
        border-bottom: 1px solid var(--r-line);
    }
    .ui-new-page.lamp td {
        padding: 9px 12px;
        text-align: right;
        color: var(--r-muted);
        border-bottom: 1px solid var(--r-line);
    }
    .ui-new-page.lamp th:first-of-type,
    .ui-new-page.lamp td:first-of-type {
        text-align: left;
    }
    .ui-new-page.lamp tr.now td {
        color: var(--r-text);
        background: var(--r-gold-tint);
    }
    .ui-new-page.lamp tr.now td:first-of-type {
        color: var(--r-gold-hi);
    }
    .ui-new-page.lamp .skel {
        height: 220px;
        border-radius: var(--r-radius);
        background: var(--r-surf);
        opacity: 0.5;
    }

    @media (max-width: 1100px) {
        .ui-new-page.lamp .tiles {
            grid-template-columns: repeat(3, minmax(0, 1fr));
        }
    }
    @media (max-width: 860px) {
        .ui-new-page.lamp .two,
        .ui-new-page.lamp .cols3 {
            grid-template-columns: minmax(0, 1fr);
            gap: 32px;
        }
        .ui-new-page.lamp .tiles {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
        }
        .ui-new-page.lamp .tile.total {
            grid-column: 1 / -1;
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
        .ui-new-page.lamp .tw {
            margin: 0 -20px;
            padding: 0 20px;
        }
        .ui-new-page.lamp table {
            min-width: 520px;
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
    const { user } = useAppContext();
    const { overallGraph, isLoading, overallData } = useOverallProgress(user?.uid);
    if (isLoading || !overallData) return <div className="skel" aria-busy />;
    return (
        <div>
            <div className="chart">
                <ReactApexChart
                    options={softChart(overallGraph.options, FONT)}
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
    const { user } = useAppContext();
    const { weeklyDevelopment, isLoading, weeklyDevelopmentData } = useGeneralWeeklyDevelopment(user?.uid);
    if (isLoading || !weeklyDevelopmentData) return <div className="skel" aria-busy />;
    // até 100+ semanas no eixo: uma marca a cada ~10, sem rótulos inclinados
    const soft = softChart(weeklyDevelopment.options, FONT);
    const options = {
        ...soft,
        xaxis: {
            ...soft.xaxis,
            tickAmount: 10,
            labels: { ...soft.xaxis?.labels, rotate: 0, hideOverlappingLabels: true },
        },
    };
    return (
        <div className="chart">
            <ReactApexChart options={options} series={weeklyDevelopment.series} type="area" height={300} width="100%" />
        </div>
    );
};

const DedaStats: React.FC<{ week?: string }> = ({ week }) => {
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
                    options={softChart(weeklyPerformanceGraph.options, FONT)}
                    series={weeklyPerformanceGraph.series}
                    type="bar"
                    width="100%"
                    height={300}
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
                    options={softChart(dailyPerformanceGraph.options, FONT)}
                    series={dailyPerformanceGraph.series}
                    type="bar"
                    width="100%"
                    height={300}
                />
            </div>
        </div>
    );
};

const Stats: React.FC<{ sortBy?: 'ASC' | 'DESC' }> = ({ sortBy }) => {
    const { data, isLoading } = useGetOverallStatsReport(sortBy);
    if (isLoading || !data) return <div className="skel" aria-busy />;
    const { readingTimeSum, dedaTimeSum, ...averages } = data.dedaAverages;
    const rows = (entries: [string, string][]) =>
        entries.map(([key, value]) => (
            <div className="fr" key={key}>
                <span className="lab">{OverallStatsEnum[key as keyof typeof OverallStatsEnum] ?? key}</span>
                <span className="val">{value}</span>
            </div>
        ));
    return (
        <div className="cols3">
            <section>
                <h3>DEDA</h3>
                <div className="frs">{rows(Object.entries(averages))}</div>
                <div className="frs">
                    {rows([
                        ['readingTimeSum', readingTimeSum],
                        ['dedaTimeSum', dedaTimeSum],
                    ])}
                </div>
            </section>
            <section>
                <h3>Active</h3>
                <div className="frs">{rows(Object.entries(data.activeStudyTotals))}</div>
            </section>
            <section>
                <h3>Passive</h3>
                <div className="frs">{rows(Object.entries(data.passiveStudyTotals))}</div>
            </section>
        </div>
    );
};

const Performance: React.FC = () => {
    const { melpSummary } = useMelpContext();
    const { dedasList } = useGetDedasList();
    const [week, setWeek] = useState<string>();
    const [sortBy, setSortBy] = useState<'ASC' | 'DESC'>();
    useEffect(() => {
        if (melpSummary?.current_deda_week) setWeek(`week${melpSummary.current_deda_week}`);
    }, [melpSummary?.current_deda_week]);

    return (
        <div className="panel" role="tabpanel">
            <div className="two">
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
            <section aria-label="DEDA stats">
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
            <section aria-label="Overall stats">
                <div className="sh">
                    <h2>Overall stats</h2>
                    <Select
                        aria-label="Sort by"
                        value={sortBy ?? 'none'}
                        options={[
                            { label: 'Default order', value: 'none' },
                            { label: 'From higher to lower', value: 'DESC' },
                            { label: 'From lower to higher', value: 'ASC' },
                        ]}
                        onChange={(value) => setSortBy(value === 'none' ? undefined : (value as 'ASC' | 'DESC'))}
                        popupMatchSelectWidth={false}
                    />
                </div>
                <Stats sortBy={sortBy} />
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

const Goals: React.FC<{ level: DedaDifficulty; onLevel(level: DedaDifficulty): void }> = ({ level, onLevel }) => {
    const { melpSummary } = useMelpContext();
    const { data, isLoading } = useGetGoalByLevel(level);
    // a tabela abre com a semana atual à vista
    const tableRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const box = tableRef.current;
        const now = box?.querySelector<HTMLElement>('tr.now');
        if (box && now) box.scrollTop = Math.max(0, now.offsetTop - box.clientHeight / 2);
    }, [data]);
    const { goalGraph, isGraphLoading } = useGoalGraphOptions(level);
    const currentWeek = melpSummary?.current_deda_week ?? 0;
    const row = data?.[currentWeek - 1];
    const mine = melpSummary?.deda_difficulty;

    const tiles: { key: keyof NonNullable<typeof row>; name: string; color?: string }[] = [
        { key: 'deda', name: 'DEDA', color: statisticsColors.DEDA },
        { key: 'review', name: 'Review', color: statisticsColors.Review },
        { key: 'active', name: 'Active', color: statisticsColors.Active },
        { key: 'passive', name: 'Passive', color: statisticsColors.Passive },
        { key: 'total', name: 'Total' },
    ];

    return (
        <div className="panel" role="tabpanel">
            <div className="sh">
                <h2>
                    Daily goal<span>Week {String(currentWeek).padStart(2, '0')}</span>
                    <Tooltip
                        title={<div className="help">{GOALS_HELP}</div>}
                        placement="bottomLeft"
                        overlayStyle={{ maxWidth: 380 }}
                    >
                        <button type="button" className="ib hint-i" aria-label="About intensity levels and goals">
                            <Info {...ICON} size={16} />
                        </button>
                    </Tooltip>
                </h2>
                <Select
                    aria-label="Compare levels"
                    value={level}
                    onChange={onLevel}
                    popupMatchSelectWidth={false}
                    options={(Object.keys(DedaDifficulties) as DedaDifficulty[]).map((key) => ({
                        value: key,
                        label: `${DedaDifficulties[key]}${key === mine ? ' · your level' : ''}`,
                    }))}
                />
            </div>
            {isLoading || !data ? (
                <div className="skel" aria-busy />
            ) : (
                <div className="tiles">
                    {tiles.map((tile) => (
                        <div key={tile.key} className={`tile${tile.key === 'total' ? ' total' : ''}`}>
                            <p className="eyebrow">
                                {tile.color && <i style={{ background: tile.color }} aria-hidden />}
                                {tile.name}
                            </p>
                            <b>{goalLabel(row?.[tile.key] as string | undefined)}</b>
                        </div>
                    ))}
                </div>
            )}
            <section aria-label="Goals over time">
                <div className="sh">
                    <h2>Goals over time</h2>
                </div>
                {isGraphLoading || !goalGraph.series?.length ? (
                    <div className="skel" aria-busy />
                ) : (
                    <div className="chart">
                        <ReactApexChart
                            options={softChart(goalGraph.options, FONT)}
                            series={goalGraph.series}
                            type="line"
                            width="100%"
                            height={320}
                        />
                    </div>
                )}
            </section>
            <section aria-label="Weekly goals">
                <div className="sh">
                    <h2>Weekly goals</h2>
                </div>
                {isLoading || !data ? (
                    <div className="skel" aria-busy />
                ) : (
                    <div className="tw" ref={tableRef}>
                        <table>
                            <thead>
                                <tr>
                                    <th scope="col">Week</th>
                                    <th scope="col">DEDA</th>
                                    <th scope="col">Review</th>
                                    <th scope="col">Active</th>
                                    <th scope="col">Passive</th>
                                    <th scope="col">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((r) => (
                                    <tr key={r.key ?? r.week} className={r.week === currentWeek ? 'now' : undefined}>
                                        <td>{r.week}</td>
                                        <td>{r.deda}</td>
                                        <td>{r.review}</td>
                                        <td>{r.active}</td>
                                        <td>{r.passive}</td>
                                        <td>{r.total}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
};

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
    const router = useRouter();
    const { melpSummary } = useMelpContext();
    const [tab, setTab] = useState<TabKey>(
        TABS.some((t) => t.key === initialTab) ? (initialTab as TabKey) : 'performance',
    );
    const [level, setLevel] = useState<DedaDifficulty>(melpSummary?.deda_difficulty);
    useEffect(() => {
        if (melpSummary) setLevel(melpSummary.deda_difficulty);
    }, [melpSummary]);

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
                            router.replace(`/imerso/lamp?lampTab=${t.key}`);
                            setTab(t.key);
                        }}
                    >
                        {t.label}
                    </button>
                ))}
            </div>
            {tab === 'performance' && <Performance />}
            {tab === 'input' && <NewLampInput />}
            {tab === 'goal' && <Goals level={level} onLevel={setLevel} />}
        </NewPage>
    );
};

export default NewLamp;
