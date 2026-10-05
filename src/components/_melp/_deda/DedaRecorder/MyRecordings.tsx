'use client';

import styled from '@emotion/styled';
import { PlayArrow } from '@mui/icons-material';
import { Popconfirm, Skeleton } from 'antd';
import { AudioPlayer, MaxWidthContainer } from 'components';
import { useDedaRecordings, useHideRecording, useRecordingPlayUrl } from 'hooks/melp/dedaRecording';
import {
    computeIndicators,
    DedaRecording,
    formatDelta,
    formatDuration,
    formatRecordedOn,
    spokenDuration,
} from 'libs/dedaRecording';
import React, { useState } from 'react';
import { RecButton } from './ui';

const Layout = styled.div`
    width: 100%;
    padding: 1.5rem 0 3rem;
    color: #2b2b2b; /* a aba fica sobre o fundo claro da página */
    display: grid;
    gap: 1.5rem;
    grid-template-columns: minmax(0, 1fr);

    @media (min-width: 861px) {
        grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
        align-items: start;
    }

    h2 {
        font-size: 1.25rem;
        margin: 0 0 1rem;
        color: #2b2b2b;
    }

    /* Três indicadores sempre lado a lado, de 360 px em diante. */
    .cards {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.75rem;
        margin: 0;
    }

    .card {
        background: #3c362f;
        color: #ffffff;
        border-radius: 0.75rem;
        padding: 0.875rem 1rem;
        margin: 0;
    }

    .card dt {
        color: #e8dccb;
        font-size: 0.875rem;
    }

    .card dd {
        margin: 0.25rem 0 0;
        font-size: 1.375rem;
        font-weight: 700;
        font-variant-numeric: tabular-nums;
    }

    .card .sub {
        display: block;
        font-size: 0.875rem;
        font-weight: 400;
        color: #e8dccb;
    }

    .bars {
        margin-top: 1.25rem;
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 0.5rem;
        align-items: end;
        height: 8rem;
        padding: 0 0.25rem;
        list-style: none;
    }

    .bars li {
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.75rem;
        color: #6b6258;
    }

    .bar {
        width: 100%;
        max-width: 2.5rem;
        background: #b89261;
        border-radius: 0.25rem 0.25rem 0 0;
        min-height: 2px;
    }

    .bar.none {
        background: rgba(60, 54, 47, 0.15);
    }

    .list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .row {
        min-height: 56px;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.5rem 0.75rem;
        background: #3c362f;
        color: #ffffff;
        border-radius: 0.5rem;
    }

    .row.none {
        background: transparent;
        border: 1px dashed rgba(60, 54, 47, 0.3);
        color: #6b6258;
    }

    .row.none .day span {
        color: #6b6258;
    }

    .row.active {
        outline: 2px solid #b89261;
    }

    .row .day {
        flex: 1;
        min-width: 0;
        overflow-wrap: anywhere;
    }

    .row .day strong {
        display: block;
    }

    .row .day span {
        color: #e8dccb;
        font-size: 0.875rem;
    }

    .row .duration {
        font-variant-numeric: tabular-nums;
        font-weight: 600;
    }

    .player {
        margin-bottom: 0.75rem;
    }

    @media (max-width: 480px) {
        .card {
            padding: 0.75rem;
        }
        .card dt,
        .card .sub {
            font-size: 0.8125rem;
        }
        .card dd {
            font-size: 1.125rem;
        }
    }
`;

const RowPlayer: React.FC<{ recording: DedaRecording; title: string; coverSrc?: string }> = ({
    recording,
    title,
    coverSrc,
}) => {
    const playUrl = useRecordingPlayUrl(recording.id);
    if (playUrl.isError) return <p role="alert">We couldn’t load this recording right now.</p>;
    if (!playUrl.data) return <p>Loading…</p>;
    return (
        <AudioPlayer
            audioURL={playUrl.data}
            title={title}
            coverSrc={coverSrc}
            subtitle={`${formatRecordedOn(recording.recordedOn)} · ${formatDuration(recording.durationMs)}`}
            onError={() => playUrl.refetch()}
        />
    );
};

interface Props {
    dedaId: string;
    dedaTitle?: string;
    coverSrc?: string;
}

/** Aba "My recordings": os 7 dias, a duração de cada leitura e três indicadores (seção 5.4 do plano). */
export const MyRecordings: React.FC<Props> = ({ dedaId, dedaTitle, coverSrc }) => {
    const recordings = useDedaRecordings(dedaId);
    const [playing, setPlaying] = useState<string | null>(null);
    const hide = useHideRecording();
    const ind = computeIndicators(recordings.data?.recordings ?? []);
    const longest = Math.max(1, ...ind.days.map((d) => d?.durationMs ?? 0));
    const active = ind.days.find((d) => d?.id === playing) ?? null;

    return (
        <MaxWidthContainer>
            <Skeleton loading={recordings.isLoading} active>
                <Layout>
                    <section aria-labelledby="rec-summary">
                        <h2 id="rec-summary">Your week in this DEDA</h2>
                        <dl className="cards">
                            <div className="card">
                                <dt>Days recorded</dt>
                                <dd>{ind.recordedDays} of 7</dd>
                            </div>
                            <div className="card">
                                <dt>First → last day</dt>
                                <dd>
                                    {ind.deltaMs === null || !ind.first || !ind.last ? (
                                        '—'
                                    ) : (
                                        <>
                                            {formatDelta(ind.deltaMs)}
                                            <span className="sub">
                                                {formatDuration(ind.first.durationMs)} →{' '}
                                                {formatDuration(ind.last.durationMs)}
                                            </span>
                                        </>
                                    )}
                                </dd>
                            </div>
                            <div className="card">
                                <dt>Time reading aloud</dt>
                                <dd>{formatDuration(ind.totalMs)}</dd>
                            </div>
                        </dl>
                        <ol className="bars" aria-label="Reading time per day">
                            {ind.days.map((d, i) => (
                                <li key={i}>
                                    <span
                                        className={`bar${d ? '' : ' none'}`}
                                        style={{
                                            height: `${d ? Math.max(4, Math.round((d.durationMs / longest) * 100)) : 2}%`,
                                        }}
                                        aria-hidden
                                    />
                                    <span
                                        aria-label={
                                            d
                                                ? `Day ${i + 1}: ${spokenDuration(d.durationMs)}`
                                                : `Day ${i + 1}: no recording`
                                        }
                                    >
                                        D{i + 1}
                                    </span>
                                </li>
                            ))}
                        </ol>
                    </section>
                    <section aria-labelledby="rec-days">
                        <h2 id="rec-days">Recordings</h2>
                        {active && (
                            <div className="player">
                                <RowPlayer
                                    key={active.id}
                                    recording={active}
                                    title={dedaTitle ?? dedaId}
                                    coverSrc={coverSrc}
                                />
                            </div>
                        )}
                        <ul className="list">
                            {ind.days.map((d, i) =>
                                d ? (
                                    <li key={i} className={`row${d.id === playing ? ' active' : ''}`}>
                                        <div className="day">
                                            <strong>Day {i + 1}</strong>
                                            <span>{formatRecordedOn(d.recordedOn)}</span>
                                        </div>
                                        <span className="duration">{formatDuration(d.durationMs)}</span>
                                        <RecButton
                                            type="button"
                                            className={d.id === playing ? undefined : 'ghost'}
                                            aria-pressed={d.id === playing}
                                            aria-label={`Play Day ${i + 1}, ${spokenDuration(d.durationMs)}`}
                                            onClick={() => setPlaying(d.id === playing ? null : d.id)}
                                        >
                                            <PlayArrow aria-hidden />
                                        </RecButton>
                                        <Popconfirm
                                            title="Remove this recording?"
                                            description="It will no longer appear in your list or in the player."
                                            okText="Remove"
                                            cancelText="Cancel"
                                            onConfirm={() => {
                                                if (d.id === playing) setPlaying(null);
                                                hide.mutate(d.id);
                                            }}
                                        >
                                            <RecButton
                                                type="button"
                                                className="link"
                                                disabled={hide.isPending}
                                                aria-label={`Remove Day ${i + 1}`}
                                            >
                                                Remove
                                            </RecButton>
                                        </Popconfirm>
                                    </li>
                                ) : (
                                    <li key={i} className="row none">
                                        <div className="day">
                                            <strong>Day {i + 1}</strong>
                                            <span>No recording</span>
                                        </div>
                                    </li>
                                ),
                            )}
                        </ul>
                    </section>
                </Layout>
            </Skeleton>
        </MaxWidthContainer>
    );
};
