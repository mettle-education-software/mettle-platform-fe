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
    color: #ffffff;
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
        color: #ffffff;
    }

    .cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(9.5rem, 1fr));
        gap: 0.75rem;
        margin: 0;
    }

    .card {
        background: #3c362f;
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
        color: #e8dccb;
    }

    .bar {
        width: 100%;
        max-width: 2.5rem;
        background: #b89261;
        border-radius: 0.25rem 0.25rem 0 0;
        min-height: 2px;
    }

    .bar.none {
        background: rgba(255, 255, 255, 0.15);
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
        border-radius: 0.5rem;
    }

    .row.none {
        background: transparent;
        border: 1px dashed rgba(255, 255, 255, 0.25);
        color: #d9d2c7;
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
`;

const RowPlayer: React.FC<{ recording: DedaRecording; title: string; coverSrc?: string }> = ({
    recording,
    title,
    coverSrc,
}) => {
    const playUrl = useRecordingPlayUrl(recording.id);
    if (playUrl.isError) return <p role="alert">Não deu para carregar esta gravação agora.</p>;
    if (!playUrl.data) return <p>Carregando…</p>;
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

/** Aba "Minhas gravações": os 7 dias, a duração de cada leitura e três indicadores (seção 5.4 do plano). */
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
                        <h2 id="rec-summary">Sua semana neste DEDA</h2>
                        <dl className="cards">
                            <div className="card">
                                <dt>Dias gravados</dt>
                                <dd>{ind.recordedDays} de 7</dd>
                            </div>
                            <div className="card">
                                <dt>Primeiro → último dia</dt>
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
                                <dt>Tempo lido em voz alta</dt>
                                <dd>{formatDuration(ind.totalMs)}</dd>
                            </div>
                        </dl>
                        <ol className="bars" aria-label="Duração da leitura em cada dia">
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
                                                ? `Dia ${i + 1}: ${spokenDuration(d.durationMs)}`
                                                : `Dia ${i + 1}: sem gravação`
                                        }
                                    >
                                        D{i + 1}
                                    </span>
                                </li>
                            ))}
                        </ol>
                    </section>
                    <section aria-labelledby="rec-days">
                        <h2 id="rec-days">Gravações</h2>
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
                                            aria-label={`Ouvir Day ${i + 1}, ${spokenDuration(d.durationMs)}`}
                                            onClick={() => setPlaying(d.id === playing ? null : d.id)}
                                        >
                                            <PlayArrow aria-hidden />
                                        </RecButton>
                                        <Popconfirm
                                            title="Remover esta gravação?"
                                            description="Ela some da sua lista e do player."
                                            okText="Remover"
                                            cancelText="Cancelar"
                                            onConfirm={() => {
                                                if (d.id === playing) setPlaying(null);
                                                hide.mutate(d.id);
                                            }}
                                        >
                                            <RecButton
                                                type="button"
                                                className="link"
                                                disabled={hide.isPending}
                                                aria-label={`Remover Day ${i + 1}`}
                                            >
                                                Remover
                                            </RecButton>
                                        </Popconfirm>
                                    </li>
                                ) : (
                                    <li key={i} className="row none">
                                        <div className="day">
                                            <strong>Day {i + 1}</strong>
                                            <span>sem gravação</span>
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
