'use client';

import { css, Global } from '@emotion/react';
import { Rate, Select, Tooltip } from 'antd';
import { useGetDedasList, useGetGoalByLevel } from 'hooks';
import { LampInputEdit, useLampInputForm } from 'hooks/melp/lampInputForm';
import { useDeda } from 'hooks/queries/dedaQueries';
import { DedaWatchQueryResponse } from 'interfaces';
import { getDayToday, padNumber } from 'libs';
import {
    addMinutes,
    clampWeekDay,
    durationText,
    goalDays,
    goalProgress,
    minutesText,
    implausibleEntry,
    parseDuration,
    STAR_NAMES,
    starName,
    stepDay,
    WEEK_DAYS,
    weekDayOptions,
} from 'libs/newDesign';
import { Check, ChevronLeft, ChevronRight, Cloud, Info, LoaderCircle } from 'lucide-react';
import { useMelpContext } from 'providers';
import React, { useEffect, useState } from 'react';
import { ICON } from 'themes/newDesign';

/*
 * Aba Input da plataforma nova, pensada a partir da LAMP: o dia contra a meta do nível do aluno (Active/Passive em
 * tempo, DEDA em qualidade, Review feita ou não), com a regra da constância à vista (o que passa da meta não conta).
 * Mesma leitura, mesma gravação e mesmo atraso de hoje (hooks/melp/lampInputForm); meta pela mesma consulta da aba Goals.
 */

const styles = css`
    .linput .dayhead {
        display: flex;
        align-items: center;
        gap: 8px 16px;
        flex-wrap: wrap;
        margin: 0 0 6px;
    }
    .linput .when {
        flex: 1 1 auto;
        min-width: 0;
    }
    .linput .when h2 {
        display: flex;
        align-items: baseline;
        gap: 10px;
        flex-wrap: wrap;
        margin-top: 2px;
        font-size: 22px;
    }
    .linput .when h2 span {
        font-size: 14px;
        color: var(--r-muted);
    }
    .linput .when .eyebrow.past {
        color: var(--r-gold-hi);
    }
    .linput .nav {
        display: flex;
        gap: 4px;
    }
    .linput .nav .ib {
        width: 44px;
        height: 44px;
        border: 1px solid var(--r-line-strong);
        color: var(--r-text);
    }
    .linput .nav .ib:disabled {
        opacity: 0.35;
        cursor: default;
    }
    .linput .pick {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px 12px;
        margin: 12px 0 0;
    }
    .linput .save {
        margin-left: auto;
    }

    .linput .glance {
        display: grid;
        grid-template-columns: repeat(var(--n), minmax(0, 1fr));
        gap: 12px;
        margin: 28px 0 10px;
        padding: 0;
        list-style: none;
    }
    .linput .gt {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 16px 18px;
        border: 1px solid var(--r-line);
        border-radius: var(--r-radius);
        background: var(--r-surf);
    }
    .linput .gt .v {
        font-size: 15px;
        color: var(--r-muted);
        font-variant-numeric: tabular-nums;
    }
    .linput .gt .v b {
        margin-right: 4px;
        font-size: 24px;
        font-weight: 400;
        color: var(--r-text);
    }
    .linput .gt .gbar {
        height: 3px;
        border-radius: 2px;
        background: var(--r-track);
        overflow: hidden;
    }
    .linput .gt .gbar i {
        display: block;
        height: 100%;
        background: var(--r-gold);
        transition: width 400ms ease;
    }
    .linput .gt .note {
        display: flex;
        align-items: center;
        gap: 4px;
        min-height: 20px;
        font-size: 12.5px;
        line-height: 1.35;
        color: var(--r-muted);
    }
    .linput .gt.met .note {
        color: var(--r-gold-hi);
    }
    .linput .gt .note s {
        text-decoration: none;
    }
    .linput .rule {
        margin: 0 0 28px;
        font-size: 13px;
    }

    .ui-new-page.lamp .linput .cols3 {
        grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr) minmax(0, 1fr);
    }
    .linput h3 .sum {
        margin-left: auto;
        font-size: 13px;
        font-weight: 400;
        letter-spacing: 0;
        color: var(--r-muted);
        font-variant-numeric: tabular-nums;
    }
    .linput h3 .sum b {
        font-weight: 500;
        color: var(--r-text);
    }
    .linput .ro {
        margin: -2px 0 8px;
        font-size: 12.5px;
        color: var(--r-muted);
    }

    /* estrelas com o nome do nível escolhido */
    .linput .fr.s {
        flex-wrap: wrap;
    }
    .linput .stars {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-left: auto;
    }
    .linput .sname {
        min-width: 4.4em;
        font-size: 12.5px;
        text-align: right;
        color: var(--r-muted);
    }
    .linput .fr.on .sname {
        color: var(--r-gold-hi);
    }

    /* tempo: hh:mm e, na linha em uso, +5 / +15 / +30 / Clear */
    .linput .fr.t {
        flex-wrap: wrap;
        row-gap: 0;
    }
    .linput .chips {
        display: none;
        flex-basis: 100%;
        justify-content: flex-end;
        gap: 6px;
        padding: 2px 0 8px;
    }
    .linput .fr.t:focus-within .chips {
        display: flex;
    }
    .linput .chips button {
        min-height: 36px;
        min-width: 52px;
        padding: 0 12px;
        border: 1px solid var(--r-line-strong);
        border-radius: 999px;
        background: none;
        color: var(--r-text);
        font-size: 14px;
        font-variant-numeric: tabular-nums;
        cursor: pointer;
    }
    .linput .chips button:hover {
        border-color: var(--r-gold);
        color: var(--r-gold-hi);
    }
    .linput .chips button.clr {
        border-color: transparent;
        color: var(--r-muted);
    }

    .ui-new-page.lamp .linput .frs .hm {
        width: 84px;
    }
    .ui-new-page.lamp .linput .frs .hm::placeholder {
        color: var(--r-muted);
        opacity: 1;
    }
    .linput .guard {
        flex-basis: 100%;
        display: grid;
        gap: 8px;
        margin: 4px 0 10px;
        padding: 12px 14px;
        border-radius: 10px;
        background: var(--r-gold-tint);
    }
    .linput .guard p {
        font-size: 14px;
        color: var(--r-text);
    }
    .linput .guard div {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }
    .linput .guard .btn {
        min-height: 40px;
        padding: 0 16px;
    }
    @media (max-width: 860px) {
        .ui-new-page.lamp .linput .cols3 {
            grid-template-columns: minmax(0, 1fr);
        }
        .linput .glance {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
            margin-top: 20px;
        }
        .linput .gt {
            padding: 14px 14px;
        }
        .linput .gt .v b {
            font-size: 22px;
        }
        .linput .save {
            margin-left: 0;
        }
        .linput .chips button {
            min-height: 40px;
            font-size: 15px;
        }
    }
`;

/**
 * Tempo em minutos primeiro: aceita "15", "90", "1h30", "1:30", "1.5h"… (libs/newDesign `parseDuration`) e mostra
 * "15 min" / "1 h 30". Grava no blur/Enter; o servidor recebe os minutos como hoje.
 */
const Hm: React.FC<{ id: string; value: number; onChange(value: number): void }> = ({ id, value, onChange }) => {
    const [text, setText] = useState(durationText(value));
    useEffect(() => setText(durationText(value)), [value]);
    const commit = () => {
        const minutes = parseDuration(text);
        if (minutes === null) {
            setText(durationText(value));
            return;
        }
        setText(durationText(minutes));
        if (minutes !== (value || 0)) onChange(minutes);
    };
    return (
        <input
            id={id}
            className={value > 0 ? 'hm on' : 'hm'}
            inputMode="decimal"
            autoComplete="off"
            placeholder="min"
            value={text}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setText(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        />
    );
};

const Hint: React.FC<{ text: string }> = ({ text }) => (
    <Tooltip title={text} placement="top">
        <button type="button" className="ib hint-i" aria-label={text}>
            <Info {...ICON} size={16} />
        </button>
    </Tooltip>
);

const REVIEWS: Record<number, string> = {
    1: '1st review · 1 day after',
    2: '2nd review · 1 week after',
    3: '3rd review · 1 month after',
};

const Review: React.FC<{
    number: number;
    dedaId: string;
    title: string;
    week: string;
    status: boolean;
    onToggle(status: boolean): void;
}> = ({ number, dedaId, title, week, status, onToggle }) => {
    const { data } = useDeda<DedaWatchQueryResponse>('deda-watch', dedaId);
    const url = data?.dedaContentCollection.items[0]?.dedaWatchVideoLink;
    return (
        <div className="rev">
            <p className="eyebrow">{REVIEWS[number]}</p>
            {url ? (
                <iframe
                    src={url}
                    title={title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                    allowFullScreen
                />
            ) : (
                <span className="vskel" aria-hidden />
            )}
            <div className="rfoot">
                <span>
                    <b>{title}</b>
                    <small>Week {padNumber(Number(week.replace('week', '')))}</small>
                </span>
                <button
                    type="button"
                    className={`btn ${status ? 'gold' : 'line'}`}
                    aria-pressed={status}
                    onClick={() => onToggle(!status)}
                >
                    {status && <Check {...ICON} size={16} aria-hidden />}
                    {status ? 'Completed' : 'Mark as completed'}
                </button>
            </div>
        </div>
    );
};

type TimeKey = keyof LampInputEdit & `${'active' | 'passive'}${string}`;
const ACTIVE: [TimeKey, string][] = [
    ['activeBook', 'Book'],
    ['activeReview', 'Review'],
    ['activeDedaNotes', 'DEDA Notes'],
    ['activeMooc', 'Fundamentals'],
    ['activeOthers', 'Other Content'],
];
const PASSIVE: [TimeKey, string][] = [
    ['passiveTed', 'TED'],
    ['passiveSeries', 'Series'],
    ['passiveYoutube', 'YouTube'],
    ['passivePodcast', 'Podcast'],
    ['passiveAudiobook', 'Audiobook'],
    ['passiveMovieDoc', 'Movie/Doc'],
    ['passiveNewsShows', 'News/Show'],
    ['passiveConversation', 'Conversation'],
    ['passiveOthers', 'Other Content'],
];
const QUALITY: [keyof LampInputEdit, string][] = [
    ['dedaPredPlace', 'Predetermined Place/Time'],
    ['dedaFiveSteps', 'Five steps (DEEP)'],
    ['dedaStateMind', 'State of mind'],
    ['dedaStateBeing', 'State of being'],
    ['dedaFocus', 'Focus'],
];

/** Tempo contra a meta, como o servidor conta: até a meta conta; o que passa não. */
const GoalTile: React.FC<{ name: string; done: number; goal: number }> = ({ name, done, goal }) => {
    const p = goalProgress(done, goal);
    return (
        <li className={`gt${p.met ? ' met' : ''}`}>
            <p className="eyebrow">{name}</p>
            <p className="v">
                <b>{minutesText(p.counted)}</b>of {minutesText(goal)}
            </p>
            <span className="gbar" aria-hidden>
                <i style={{ width: `${p.ratio * 100}%` }} />
            </span>
            <p className="note">
                {p.met ? (
                    <>
                        <Check {...ICON} size={14} aria-hidden /> Goal met
                        {p.extra > 0 && <s>· +{minutesText(p.extra)} doesn&rsquo;t count</s>}
                    </>
                ) : (
                    `${minutesText(p.missing)} to go`
                )}
            </p>
        </li>
    );
};

/** Aba Input: o dia contra a meta, com o mesmo estado e a mesma gravação de hoje (hooks/melp/lampInputForm). */
export const NewLampInput: React.FC = () => {
    const { melpSummary } = useMelpContext();
    const { dedasList } = useGetDedasList();
    const form = useLampInputForm();
    const { edit, change, inputData, isLoading, selectedWeek, selectedDay } = form;
    const goals = goalDays(useGetGoalByLevel(melpSummary?.deda_difficulty).data);

    // mesma regra do seletor atual: na semana em curso só até hoje; o dia escolhido cai para hoje se preciso
    const todayKey = getDayToday();
    const today = Number(todayKey.replace('day', ''));
    const currentWeek = melpSummary?.current_deda_week;
    const days = weekDayOptions(selectedWeek, currentWeek, today);
    useEffect(() => {
        const day = clampWeekDay(selectedDay, days);
        if (day !== selectedDay) form.setSelectedDay(day);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedWeek, selectedDay]);

    const weekNumber = Number(selectedWeek.replace('week', ''));
    const isToday = weekNumber === currentWeek && selectedDay === todayKey;
    const go = (target?: { week: string; day: string }) => {
        if (!target) return;
        if (target.week !== selectedWeek) form.setSelectedWeek(target.week);
        form.setSelectedDay(target.day);
    };
    const weeks = dedasList.map((d) => d.value);
    const prev = stepDay(selectedWeek, selectedDay, -1, weeks, currentWeek, today);
    const next = stepDay(selectedWeek, selectedDay, 1, weeks, currentWeek, today);

    const goal = goals[Math.min(weekNumber, goals.length) - 1];
    const sum = (rows: [TimeKey, string][]) => rows.reduce((t, [k]) => t + (Number(edit[k]) || 0), 0);
    const active = sum(ACTIVE);
    const passive = sum(PASSIVE);
    const ratings = QUALITY.map(([k]) => Number(edit[k]) || 0);
    const rated = ratings.filter((r) => r > 0);
    const avg = rated.length ? rated.reduce((a, b) => a + b, 0) / rated.length : 0;
    const reviews = ([1, 2, 3] as const).filter((n) => inputData?.reviewInput?.[`review${n}`]);
    const reviewsDone = reviews.filter((n) => edit[`reviewStatus${n}`]).length;
    const dedaTime = inputData?.dedaInput?.deda_time ?? 0;

    const rate = (key: keyof LampInputEdit, label: string) => {
        const value = Number(edit[key]) || 0;
        return (
            <div className={value > 0 ? 'fr s on' : 'fr s'} key={key}>
                <span className="lab" id={`lamp-${key}`}>
                    {label}
                </span>
                <span className="stars">
                    <Rate
                        aria-labelledby={`lamp-${key}`}
                        tooltips={[...STAR_NAMES]}
                        value={value}
                        onChange={(v) => change(key, v as never)}
                    />
                    <span className="sname" aria-live="polite">
                        {starName(value) || '—'}
                    </span>
                </span>
            </div>
        );
    };
    // registro implausível (6 h ou mais numa atividade, ou o dia passando de 12 h): confirma ali mesmo, sem gravar antes
    const [pending, setPending] = useState<{ key: TimeKey; minutes: number; suggestion?: number; day: number }>();
    const [resets, setResets] = useState(0);
    useEffect(() => setPending(undefined), [selectedWeek, selectedDay]);
    const commitTime = (key: TimeKey, minutes: number) => {
        const day = active + passive - (Number(edit[key]) || 0) + minutes;
        const odd = minutes > (Number(edit[key]) || 0) ? implausibleEntry(minutes, day) : undefined;
        if (odd) return setPending({ key, minutes, suggestion: odd.suggestion, day });
        setPending(undefined);
        change(key, minutes as never);
    };
    const time = (key: TimeKey, label: string) => {
        const value = Number(edit[key]) || 0;
        const ask = pending?.key === key ? pending : undefined;
        return (
            <div className={value > 0 ? 'fr t on' : 'fr t'} key={key}>
                <label className="lab" htmlFor={`lamp-${key}`}>
                    {label}
                </label>
                <Hm key={`${key}-${resets}`} id={`lamp-${key}`} value={value} onChange={(v) => commitTime(key, v)} />
                {ask ? (
                    <div className="guard" role="alert">
                        <p>
                            {ask.suggestion
                                ? `${durationText(ask.minutes)}? Did you mean ${ask.suggestion} min?`
                                : `That makes ${durationText(ask.day)} today. Keep it?`}
                        </p>
                        <div>
                            {ask.suggestion ? (
                                <button
                                    type="button"
                                    className="btn gold"
                                    onClick={() => {
                                        setPending(undefined);
                                        change(key, ask.suggestion as never);
                                    }}
                                >
                                    {ask.suggestion} min
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="btn line"
                                    onClick={() => {
                                        setPending(undefined);
                                        setResets((n) => n + 1);
                                    }}
                                >
                                    Undo
                                </button>
                            )}
                            <button
                                type="button"
                                className="btn line"
                                onClick={() => {
                                    setPending(undefined);
                                    change(key, ask.minutes as never);
                                }}
                            >
                                Keep {durationText(ask.minutes)}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div
                        className="chips"
                        role="group"
                        aria-label={`Add time to ${label}`}
                        // o campo continua em foco (a linha segue aberta, inclusive no Safari, que não foca botões)
                        onMouseDown={(e) => e.preventDefault()}
                    >
                        {[5, 15, 30].map((m) => (
                            <button
                                key={m}
                                type="button"
                                aria-label={`Add ${m} minutes to ${label}`}
                                onClick={() => change(key, addMinutes(value, m) as never)}
                            >
                                +{m}
                            </button>
                        ))}
                        {value > 0 && (
                            <button
                                type="button"
                                className="clr"
                                aria-label={`Clear ${label}`}
                                onClick={() => change(key, 0 as never)}
                            >
                                Clear
                            </button>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const dayName = WEEK_DAYS.find((d) => d.value === selectedDay)?.label ?? '';

    return (
        <div className="panel linput" role="tabpanel">
            <Global styles={styles} />
            <div className="dayhead">
                <div className="when">
                    <p className={`eyebrow${isToday ? '' : ' past'}`}>{isToday ? 'Today' : 'Past day'}</p>
                    <h2>
                        {dayName}
                        <span>Week {String(weekNumber).padStart(2, '0')}</span>
                    </h2>
                </div>
                <div className="nav">
                    <button
                        type="button"
                        className="ib"
                        aria-label="Previous day"
                        disabled={!prev}
                        onClick={() => go(prev)}
                    >
                        <ChevronLeft {...ICON} size={18} />
                    </button>
                    <button
                        type="button"
                        className="ib"
                        aria-label="Next day"
                        disabled={!next}
                        onClick={() => go(next)}
                    >
                        <ChevronRight {...ICON} size={18} />
                    </button>
                </div>
            </div>
            <div className="pick">
                <Select
                    aria-label="DEDA week"
                    value={dedasList.length ? selectedWeek : undefined}
                    options={dedasList}
                    onChange={(value) => form.setSelectedWeek(value)}
                    popupMatchSelectWidth={false}
                    loading={!dedasList.length}
                />
                <Select
                    aria-label="Day"
                    value={selectedDay}
                    options={days as unknown as { label: string; value: string }[]}
                    onChange={(value) => form.setSelectedDay(value)}
                    popupMatchSelectWidth={false}
                />
                {!isToday && currentWeek && (
                    <button
                        type="button"
                        className="lnk gold"
                        onClick={() => go({ week: `week${currentWeek}`, day: todayKey })}
                    >
                        Back to today
                    </button>
                )}
                <span className="save" role="status">
                    {form.isSaving ? (
                        <>
                            <LoaderCircle {...ICON} size={16} className="spin" aria-hidden /> Saving…
                        </>
                    ) : (
                        <>
                            <Cloud {...ICON} size={16} aria-hidden /> Saved
                            {form.lastSavedAt &&
                                ` ${form.lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                        </>
                    )}
                </span>
            </div>

            {isLoading || !inputData ? (
                <div className="cols3" aria-busy>
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="fskel" aria-hidden />
                    ))}
                </div>
            ) : (
                <>
                    <ul
                        className="glance"
                        aria-label="This day against your goal"
                        style={{ '--n': reviews.length ? 4 : 3 } as React.CSSProperties}
                    >
                        <li className={`gt${rated.length === 5 ? ' met' : ''}`}>
                            <p className="eyebrow">DEDA quality</p>
                            <p className="v">
                                <b>{rated.length ? avg.toFixed(1) : '—'}</b>
                                {starName(avg)}
                            </p>
                            <span className="gbar" aria-hidden>
                                <i style={{ width: `${(avg / 5) * 100}%` }} />
                            </span>
                            <p className="note">
                                {rated.length === 5 ? (
                                    <>
                                        <Check {...ICON} size={14} aria-hidden /> All five rated
                                    </>
                                ) : (
                                    `${rated.length} of 5 rated`
                                )}
                            </p>
                        </li>
                        <GoalTile name="Active" done={active} goal={goal?.active ?? 0} />
                        <GoalTile name="Passive" done={passive} goal={goal?.passive ?? 0} />
                        {reviews.length > 0 && (
                            <li className={`gt${reviewsDone === reviews.length ? ' met' : ''}`}>
                                <p className="eyebrow">Review</p>
                                <p className="v">
                                    <b>{reviewsDone}</b>of {reviews.length} done
                                </p>
                                <span className="gbar" aria-hidden>
                                    <i style={{ width: `${(reviewsDone / reviews.length) * 100}%` }} />
                                </span>
                                <p className="note">
                                    {reviewsDone === reviews.length ? (
                                        <>
                                            <Check {...ICON} size={14} aria-hidden /> All done
                                        </>
                                    ) : (
                                        `${reviews.length - reviewsDone} pending`
                                    )}
                                </p>
                            </li>
                        )}
                    </ul>
                    <p className="hint rule">
                        Each day counts on its own: time beyond the goal doesn&rsquo;t add up, and a missed day
                        can&rsquo;t be made up later.
                    </p>

                    <div className="cols3">
                        <section aria-labelledby="lamp-deda">
                            <h3 id="lamp-deda">
                                DEDA{' '}
                                <Hint text="Rate the quality of your DEDA session. The day counts for your DEDA Run at 80% or more." />
                            </h3>
                            <p className="ro">
                                {dedaTime > 0
                                    ? `DEDA time ${minutesText(dedaTime)} · from your DEDA session`
                                    : 'DEDA time comes from your DEDA session'}
                            </p>
                            <div className="frs">{QUALITY.map(([k, l]) => rate(k, l))}</div>
                        </section>
                        <section aria-labelledby="lamp-active">
                            <h3 id="lamp-active">
                                Active{' '}
                                <Hint text="Active study time, in minutes (15, 90 or 1h30). Review time counts as Active." />
                                <span className="sum">
                                    <b>{minutesText(active)}</b> of {minutesText(goal?.active ?? 0)}
                                </span>
                            </h3>
                            <div className="frs">{ACTIVE.map(([k, l]) => time(k, l))}</div>
                        </section>
                        <section aria-labelledby="lamp-passive">
                            <h3 id="lamp-passive">
                                Passive{' '}
                                <Hint text="Passive study time, in minutes (15, 90 or 1h30). English only, no subtitles." />
                                <span className="sum">
                                    <b>{minutesText(passive)}</b> of {minutesText(goal?.passive ?? 0)}
                                </span>
                            </h3>
                            <div className="frs">{PASSIVE.map(([k, l]) => time(k, l))}</div>
                        </section>
                    </div>
                    {inputData.reviewInput && (
                        <section className="reviews" aria-labelledby="lamp-review">
                            <h3 id="lamp-review">
                                Review <Hint text="Mark each review as completed when done." />
                            </h3>
                            <div className="revs">
                                {reviews.map((n) => {
                                    const review = inputData.reviewInput?.[`review${n}`];
                                    if (!review) return null;
                                    return (
                                        <Review
                                            key={n}
                                            number={n}
                                            dedaId={review.dedaId}
                                            title={review.name}
                                            week={review.weekNumber}
                                            status={!!edit[`reviewStatus${n}`]}
                                            onToggle={(status) => change(`reviewStatus${n}`, status)}
                                        />
                                    );
                                })}
                            </div>
                        </section>
                    )}
                </>
            )}
        </div>
    );
};
