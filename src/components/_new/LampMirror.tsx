'use client';

import { css, Global } from '@emotion/react';
import type { ApexOptions } from 'apexcharts';
import { useGeneralWeeklyDevelopment, useOverallProgress } from 'hooks';
import { useLampDays } from 'hooks/melp/lampDays';
import { useTheme } from 'hooks/useTheme';
import { statisticsColors } from 'libs';
import {
    axisWords,
    bestStreak,
    constancyRuns,
    DayStatus,
    dayStatus,
    DEDA_QUALITY_MIN,
    LampDay,
    lastFourVsPrevious,
    WEEK_DAYS,
    weeklyQuality,
} from 'libs/newDesign';
import dynamic from 'next/dynamic';
import { useAppContext } from 'providers';
import React, { useState } from 'react';
import { DARK, LIGHT } from 'themes/newDesign';
import { useSoftChart } from './lampCharts';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

/*
 * Performance da LAMP como espelho ("estou cumprindo o que me propus?"): a semana dia a dia contra a meta, a sequência
 * de DEDA bem feito e o Overall; depois a tendência e a qualidade do DEDA. Sem confete: linguagem adulta, constância.
 */

const styles = css`
    .mirror {
        display: grid;
        grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr) minmax(0, 1.15fr);
        gap: 28px 40px;
        padding: 26px 28px 24px;
        border: 1px solid var(--r-line);
        border-radius: 16px;
        background: var(--r-surf);
    }
    .mirror > div {
        min-width: 0;
    }
    .mirror .big {
        margin: 6px 0 2px;
        font-size: 34px;
        font-weight: 300;
        line-height: 1.1;
        font-variant-numeric: tabular-nums;
    }
    .mirror .big small {
        margin-left: 4px;
        font-size: 14px;
        font-weight: 400;
        color: var(--r-muted);
    }
    .mirror .sub {
        font-size: 13px;
        line-height: 1.45;
        color: var(--r-muted);
    }
    /* Overall e as frentes */
    .fronts {
        display: grid;
        gap: 9px;
        margin: 12px 0 0;
        padding: 0;
        list-style: none;
    }
    .fronts li {
        display: grid;
        grid-template-columns: 4.6em minmax(0, 1fr) 2.8em;
        align-items: center;
        gap: 10px;
        font-size: 12.5px;
        color: var(--r-muted);
    }
    .fronts b {
        font-weight: 500;
        text-align: right;
        font-variant-numeric: tabular-nums;
        color: var(--r-text);
    }
    .fronts .bar {
        position: relative;
        height: 3px;
        border-radius: 2px;
        background: var(--r-track);
    }
    .fronts .bar i {
        display: block;
        height: 100%;
        border-radius: 2px;
        background: var(--c);
    }
    .fronts .bar s {
        position: absolute;
        top: -3px;
        left: 80%;
        width: 1px;
        height: 9px;
        background: var(--r-muted);
    }
    html[data-theme='light'] .fronts .bar i {
        background: color-mix(in oklab, var(--c) 78%, #2a2622);
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
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 4px 18px;
        margin: 0 0 4px;
        font-size: 13px;
        color: var(--r-muted);
    }
    .cmp b {
        font-size: 15px;
        font-weight: 500;
        color: var(--r-text);
        font-variant-numeric: tabular-nums;
    }
    .crit {
        margin: 8px 0 0;
        padding: 0;
        list-style: none;
        border-top: 1px solid var(--r-line);
    }
    .crit li {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto 3.4em;
        gap: 12px;
        padding: 9px 0;
        border-bottom: 1px solid var(--r-line);
        font-size: 13.5px;
        font-variant-numeric: tabular-nums;
    }
    .crit li span:nth-of-type(2) {
        color: var(--r-text);
    }
    .crit li span:last-child {
        text-align: right;
        color: var(--r-muted);
    }
    .hist {
        margin-top: 44px;
    }
    .hist .tl {
        position: relative;
        height: 10px;
        margin: 10px 0 6px;
        border-radius: 5px;
        background: var(--r-track);
    }
    .hist .tl i {
        position: absolute;
        top: 0;
        bottom: 0;
        min-width: 3px;
        border-radius: 5px;
        background: var(--r-gold);
        opacity: 0.55;
    }
    .hist .tl i.best {
        opacity: 1;
    }
    .hist .tlx {
        display: flex;
        justify-content: space-between;
        font-size: 11.5px;
        color: var(--r-muted);
    }
    .hist .runs {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 0 32px;
        margin: 14px 0 0;
        padding: 0;
        list-style: none;
    }
    .hist .runs li {
        display: flex;
        align-items: baseline;
        gap: 10px;
        padding: 9px 0;
        border-bottom: 1px solid var(--r-line);
        font-size: 13.5px;
        color: var(--r-muted);
        font-variant-numeric: tabular-nums;
    }
    .hist .runs li span {
        flex: 1;
        min-width: 0;
    }
    .hist .runs b {
        font-weight: 500;
        color: var(--r-text);
    }
    .hist .runs em {
        font-style: normal;
        font-size: var(--r-label-size);
        letter-spacing: var(--r-label-track);
        text-transform: uppercase;
        color: var(--r-gold-hi);
    }
    .hist .runs li.best b {
        color: var(--r-gold-hi);
    }
    @media (max-width: 960px) {
        .mirror {
            grid-template-columns: minmax(0, 1fr);
            padding: 20px 16px;
            margin: 0 -4px;
        }
        .mtwo {
            grid-template-columns: minmax(0, 1fr);
        }
    }
`;

/** Estilo dos 7 dias (também na faixa da home do IMERSO). */
export const weekDotsStyles = css`
    /* os 7 dias */
    .wdots {
        display: grid;
        grid-template-columns: repeat(7, minmax(0, 1fr));
        gap: 6px;
        margin: 14px 0 12px;
        padding: 0;
        list-style: none;
    }
    .wdots li {
        display: grid;
        justify-items: center;
        gap: 6px;
        font-size: 11px;
        letter-spacing: 0.06em;
        color: var(--r-muted);
    }
    .wdots i {
        display: block;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        border: 1.5px solid var(--r-line-strong);
    }
    .wdots .wd-kept i {
        border-color: var(--r-gold);
        background: var(--r-gold);
    }
    .wdots .wd-partial i {
        border-color: var(--r-gold);
        background: linear-gradient(90deg, var(--r-gold) 50%, transparent 50%);
    }
    .wdots .wd-missed i {
        border-color: var(--r-line-strong);
    }
    .wdots .wd-today i {
        border: 2px solid var(--r-gold-hi);
        box-shadow: 0 0 0 3px var(--r-gold-tint);
    }
    .wdots .wd-future i {
        border-style: dashed;
        border-color: var(--r-line);
    }
    .wdots .wd-now {
        color: var(--r-text);
        font-weight: 500;
    }
    .wlegend {
        display: flex;
        flex-wrap: wrap;
        gap: 4px 14px;
        margin: 0;
        padding: 0;
        list-style: none;
        font-size: 12px;
        color: var(--r-muted);
    }
    .wlegend span {
        display: inline-block;
        width: 9px;
        height: 9px;
        margin-right: 5px;
        border-radius: 50%;
        border: 1.5px solid var(--r-gold);
        vertical-align: -1px;
    }
    .wlegend .k span {
        background: var(--r-gold);
    }
    .wlegend .p span {
        background: linear-gradient(90deg, var(--r-gold) 50%, transparent 50%);
    }
    .wlegend .m span {
        border-color: var(--r-line-strong);
    }
`;

const STATUS_LABEL: Record<DayStatus, string> = {
    kept: 'kept',
    partial: 'partly done',
    missed: 'missed',
    today: 'today, in progress',
    future: 'ahead',
};

/** Os 7 dias da semana em curso, contra a meta. Também usado na faixa da home do IMERSO (`compact`). */
export const WeekDots: React.FC<{ days: LampDay[]; week: number; today: number; compact?: boolean }> = ({
    days,
    week,
    today,
    compact,
}) => (
    <ul className="wdots" aria-label={`Week ${week}, day by day`}>
        {WEEK_DAYS.map((w, i) => {
            const n = i + 1;
            const d = days.find((x) => x.week === week && x.day === n);
            const status = dayStatus(d, n === today, n > today);
            return (
                <li key={w.value} className={`wd-${status}`} title={`${w.label}: ${STATUS_LABEL[status]}`}>
                    <i aria-hidden />
                    <span className={n === today ? 'wd-now' : undefined}>
                        {compact ? w.label[0] : w.label.slice(0, 3)}
                        <span className="sr">: {STATUS_LABEL[status]}</span>
                    </span>
                </li>
            );
        })}
    </ul>
);

/** "12 days" / "1 day" / "—". */
export const daysText = (n: number) => (n ? `${n} day${n > 1 ? 's' : ''}` : '—');

/** Dia da LAMP: a data ("Oct 2" / "Oct 2, 2025") ou, com pausas no programa, a semana ("Mon, W96"). */
const dayLabel = (d: LampDay) => {
    if (!d.date) return `${WEEK_DAYS[d.day - 1]?.label.slice(0, 3) ?? ''}, W${d.week}`;
    const sameYear = d.date.getFullYear() === new Date().getFullYear();
    return d.date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        ...(sameYear ? {} : { year: 'numeric' }),
    });
};

type Days = ReturnType<typeof useLampDays>;

const Hero: React.FC<{ days: Days }> = ({ days }) => {
    const { user } = useAppContext();
    const { overallData } = useOverallProgress(user?.uid);
    const { newestFirst, streak, currentWeek, today, weeksLoaded, loading } = days;
    const thisWeek = newestFirst.filter((d) => d.week === currentWeek);
    const kept = thisWeek.filter((d) => dayStatus(d, d.day === today) === 'kept').length;
    const best = bestStreak([...newestFirst].reverse());
    const by = overallData?.byActivity;
    const fronts: [string, number | null | undefined, string][] = [
        ['DEDA', by?.deda, statisticsColors.DEDA],
        ['Active', by?.active, statisticsColors.Active],
        ['Passive', by?.passive, statisticsColors.Passive],
        ...(by && by.review !== null && by.review !== undefined
            ? ([['Review', by.review, statisticsColors.Review]] as [string, number, string][])
            : []),
    ];
    const overall = overallData?.overallPerformance;

    return (
        <section className="mirror" aria-label="How you are doing" aria-busy={loading || undefined}>
            <div>
                <p className="eyebrow">This week · Week {String(currentWeek).padStart(2, '0')}</p>
                <p className="big">
                    {kept}
                    <small>of {today} days kept so far</small>
                </p>
                <WeekDots days={newestFirst} week={currentWeek} today={today} />
                <ul className="wlegend" aria-hidden>
                    <li className="k">
                        <span />
                        Kept
                    </li>
                    <li className="p">
                        <span />
                        Partly
                    </li>
                    <li className="m">
                        <span />
                        Missed
                    </li>
                </ul>
            </div>
            <div>
                <p className="eyebrow">DEDA Run</p>
                <p className="big">
                    {loading && !streak.current ? '—' : streak.current}
                    <small>{streak.current === 1 ? 'day' : 'days'} in a row</small>
                </p>
                {best > 0 && (
                    <p className="sub">
                        Best · <b>{daysText(best)}</b>
                        {weeksLoaded < currentWeek && ` in the last ${weeksLoaded} weeks`}
                    </p>
                )}
                <p className="sub">
                    Days in a row with your DEDA done at quality {DEDA_QUALITY_MIN}% or more (an average of 3.5 stars).
                    Today in progress doesn&rsquo;t break it; a missed day can&rsquo;t be made up.
                </p>
            </div>
            <div>
                <p className="eyebrow">Overall</p>
                <p className="big">
                    {typeof overall === 'number' ? overall.toFixed(1) : '—'}
                    <small>% · the program asks for 80%+</small>
                </p>
                <ul className="fronts">
                    {fronts.map(([name, value, color]) => (
                        <li key={name} style={{ '--c': color } as React.CSSProperties}>
                            {name}
                            <span className="bar" aria-hidden>
                                <i style={{ width: `${Math.min(100, Math.max(0, value ?? 0))}%` }} />
                                <s />
                            </span>
                            <b>{typeof value === 'number' ? `${Math.round(value)}%` : '—'}</b>
                        </li>
                    ))}
                </ul>
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
    if (isLoading || !weeklyDevelopmentData) return <div className="skel" aria-busy />;
    const values = (weeklyDevelopmentData[1] ?? []).map(Number);
    const cmp = lastFourVsPrevious(values);
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
            labels: { ...base.xaxis?.labels, rotate: 0, hideOverlappingLabels: true },
        },
        yaxis: { ...(base.yaxis as object), tickAmount: 4 },
    } as ApexOptions;
    const pts = (n?: number) => (n === undefined ? '—' : `${Math.round(n)}%`);
    return (
        <section aria-label="Weekly progress">
            <div className="sh">
                <h2>Weekly progress</h2>
            </div>
            <p className="cmp">
                <span>
                    Last 4 weeks <b>{pts(cmp.last)}</b>
                </span>
                <span>
                    Previous 4 <b>{pts(cmp.prev)}</b>
                </span>
                {cmp.delta !== undefined && (
                    <span>
                        <b>
                            {cmp.delta >= 0 ? '+' : '−'}
                            {Math.abs(Math.round(cmp.delta))} pts
                        </b>
                    </span>
                )}
            </p>
            <div className="chart">
                <ReactApexChart
                    options={options}
                    series={weeklyDevelopment.series}
                    type="area"
                    height={260}
                    width="100%"
                />
            </div>
        </section>
    );
};

const CRITERIA = ['Place/Time', 'Five steps', 'State of mind', 'State of being', 'Focus'];

const Quality: React.FC<{ days: Days }> = ({ days }) => {
    const soft = useSoftChart();
    const light = useTheme().resolved === 'light';
    const c = light ? LIGHT : DARK;
    const { newestFirst, loading } = days;
    const weeks = weeklyQuality(newestFirst).slice(-8);
    if (loading && !weeks.length) return <div className="skel" aria-busy />;
    const recent = weeks.slice(-4);
    const before = weeks.slice(-8, -4);
    const avg = (ws: typeof weeks, k: number) =>
        ws.length ? ws.reduce((t, w) => t + w.criteria[k], 0) / ws.length : undefined;
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
            <p className="cmp">
                <span>Rated days, last {weeks.length} weeks · line at 70%</span>
            </p>
            {weeks.length ? (
                <div className="chart">
                    <ReactApexChart
                        options={options}
                        series={[{ name: 'Quality', data: weeks.map((w) => Math.round(w.score)) }]}
                        type="line"
                        height={180}
                        width="100%"
                    />
                </div>
            ) : (
                <p className="hint">No rated DEDA in these weeks yet.</p>
            )}
            <ul className="crit" aria-label="The five criteria, last 4 weeks">
                {CRITERIA.map((name, k) => {
                    const now = avg(recent, k);
                    const prev = avg(before, k);
                    const delta = now !== undefined && prev !== undefined ? now - prev : undefined;
                    return (
                        <li key={name}>
                            <span>{name}</span>
                            <span>{now === undefined ? '—' : `${now.toFixed(1)} ★`}</span>
                            <span>
                                {delta === undefined || Math.abs(delta) < 0.05
                                    ? '='
                                    : `${delta > 0 ? '+' : '−'}${Math.abs(delta).toFixed(1)}`}
                            </span>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
};

/** Suas DEDA Runs: cada sequência numa linha do tempo (dias carregados) e numa lista, a maior em destaque. */
const History: React.FC<{ days: Days; onMore?: () => void }> = ({ days, onMore }) => {
    const oldestFirst = [...days.newestFirst].reverse();
    const runs = constancyRuns(oldestFirst);
    const best = Math.max(0, ...runs.map((r) => r.days));
    const total = oldestFirst.length;
    const index = (d: LampDay) => oldestFirst.indexOf(d);
    const first = oldestFirst[0];
    return (
        <section className="hist" aria-label="Your DEDA Runs">
            <div className="sh">
                <h2>Your DEDA Runs</h2>
                {onMore && first && first.week > 1 && (
                    <button type="button" className="lnk gold" onClick={onMore}>
                        Earlier weeks
                    </button>
                )}
            </div>
            <p className="cmp">
                <span>
                    Every run of days with your DEDA at {DEDA_QUALITY_MIN}%+, last {days.weeksLoaded} weeks
                </span>
            </p>
            {!runs.length ? (
                <p className="hint">No DEDA Run in these weeks yet. One good DEDA today starts the first.</p>
            ) : (
                <>
                    <div className="tl" aria-hidden>
                        {runs.map((r) => (
                            <i
                                key={`${r.from.week}-${r.from.day}`}
                                className={r.days === best ? 'best' : undefined}
                                style={{
                                    left: `${(index(r.from) / total) * 100}%`,
                                    width: `${(r.days / total) * 100}%`,
                                }}
                            />
                        ))}
                    </div>
                    <div className="tlx" aria-hidden>
                        <span>{first ? dayLabel(first) : ''}</span>
                        <span>Today</span>
                    </div>
                    <ol className="runs">
                        {[...runs].reverse().map((r) => (
                            <li key={`${r.from.week}-${r.from.day}`} className={r.days === best ? 'best' : undefined}>
                                <span>
                                    {dayLabel(r.from)} → {r.to === oldestFirst[total - 1] ? 'today' : dayLabel(r.to)}
                                </span>
                                <b>{daysText(r.days)}</b>
                                {r.days === best && <em>Best</em>}
                            </li>
                        ))}
                    </ol>
                </>
            )}
        </section>
    );
};

/** Topo da aba Performance: o espelho, a tendência e a qualidade. */
export const LampMirror: React.FC = () => {
    const [weeks, setWeeks] = useState(8);
    const days = useLampDays(weeks);
    return (
        <>
            <Global styles={styles} />
            <Global styles={weekDotsStyles} />
            <Hero days={days} />
            <div className="mtwo">
                <Trend />
                <Quality days={days} />
            </div>
            <History days={days} onMore={() => setWeeks(days.weeksLoaded + 8)} />
        </>
    );
};
