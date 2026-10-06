'use client';

import { Rate, Select, Tooltip } from 'antd';
import { useGetDedasList } from 'hooks';
import { useLampInputForm } from 'hooks/melp/lampInputForm';
import { useDeda } from 'hooks/queries/dedaQueries';
import { DedaWatchQueryResponse } from 'interfaces';
import { padNumber } from 'libs';
import { clampWeekDay, formatHm, parseHm, weekDayOptions } from 'libs/newDesign';
import { Check, Cloud, Info, LoaderCircle } from 'lucide-react';
import { useMelpContext } from 'providers';
import React, { useEffect, useState } from 'react';
import { ICON } from 'themes/newDesign';

const RATINGS = ['Terrible', 'Bad', 'Normal', 'Good', 'Wonderful'];

/** Tempo "HH:MM" digitado direto (sem modal); grava no blur/Enter com as mesmas regras do seletor atual. */
const Hm: React.FC<{ id: string; value: number; onChange(value: number): void }> = ({ id, value, onChange }) => {
    const [text, setText] = useState(formatHm(value));
    useEffect(() => setText(formatHm(value)), [value]);
    const commit = () => {
        const minutes = parseHm(text);
        setText(formatHm(minutes));
        if (minutes !== (value || 0)) onChange(minutes);
    };
    return (
        <input
            id={id}
            className="hm"
            inputMode="numeric"
            autoComplete="off"
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

/** Aba Input: mesmos campos, mesma leitura/gravação e o mesmo atraso de gravação da aba atual (hooks/melp/lampInputForm). */
export const NewLampInput: React.FC = () => {
    const { melpSummary } = useMelpContext();
    const { dedasList } = useGetDedasList();
    const form = useLampInputForm();
    const { edit, change, inputData, isLoading, selectedWeek, selectedDay } = form;

    // mesma regra do DedaWeekDaySelect: na semana em curso só até hoje; o dia escolhido cai para hoje se preciso
    const today = new Date().getDay() === 0 ? 7 : new Date().getDay();
    const days = weekDayOptions(selectedWeek, melpSummary?.current_deda_week, today);
    useEffect(() => {
        const day = clampWeekDay(selectedDay, days);
        if (day !== selectedDay) form.setSelectedDay(day);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedWeek, selectedDay]);

    const rate = (key: keyof typeof edit, label: string) => (
        <div className="fr" key={key}>
            <span className="lab" id={`lamp-${key}`}>
                {label}
            </span>
            <Rate
                aria-labelledby={`lamp-${key}`}
                tooltips={RATINGS}
                value={Number(edit[key]) || 0}
                onChange={(value) => change(key, value as never)}
            />
        </div>
    );
    const time = (key: keyof typeof edit, label: React.ReactNode) => (
        <div className="fr" key={key}>
            <label className="lab" htmlFor={`lamp-${key}`}>
                {label}
            </label>
            <Hm id={`lamp-${key}`} value={Number(edit[key]) || 0} onChange={(value) => change(key, value as never)} />
        </div>
    );

    return (
        <div className="panel" role="tabpanel">
            <div className="sh">
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
                </div>
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
                    <div className="cols3">
                        <section aria-labelledby="lamp-deda">
                            <h3 id="lamp-deda">
                                DEDA <Hint text="Rate the quality of your DEDA study session today." />
                            </h3>
                            <div className="frs">
                                {rate('dedaPredPlace', 'Predetermined Place/Time')}
                                {rate('dedaFiveSteps', 'Five steps (DEEP)')}
                                {rate('dedaStateMind', 'State of mind')}
                                {rate('dedaStateBeing', 'State of being')}
                                {rate('dedaFocus', 'Focus')}
                            </div>
                        </section>
                        <section aria-labelledby="lamp-active">
                            <h3 id="lamp-active">
                                Active <small>HH:MM</small> <Hint text="Enter your Active Study Time (HH:MM)" />
                            </h3>
                            <div className="frs">
                                {time('activeBook', 'Book')}
                                {time('activeReview', 'Review')}
                                {time('activeDedaNotes', 'DEDA Notes')}
                                {time('activeMooc', 'Fundamentals')}
                                {time('activeOthers', 'Other Content')}
                            </div>
                        </section>
                        <section aria-labelledby="lamp-passive">
                            <h3 id="lamp-passive">
                                Passive <small>HH:MM</small> <Hint text="Enter your Passive Study Time (HH:MM)" />
                            </h3>
                            <div className="frs">
                                {time('passiveTed', 'TED')}
                                {time('passiveSeries', 'Series')}
                                {time('passiveYoutube', 'YouTube')}
                                {time('passivePodcast', 'Podcast')}
                                {time('passiveAudiobook', 'Audiobook')}
                                {time('passiveMovieDoc', 'Movie/Doc')}
                                {time('passiveNewsShows', 'News/Show')}
                                {time('passiveConversation', 'Conversation')}
                                {time('passiveOthers', 'Other Content')}
                            </div>
                        </section>
                    </div>
                    {inputData.reviewInput && (
                        <section className="reviews" aria-labelledby="lamp-review">
                            <h3 id="lamp-review">
                                Review <Hint text="Mark each review as completed when done." />
                            </h3>
                            <div className="revs">
                                {([1, 2, 3] as const).map((n) => {
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
