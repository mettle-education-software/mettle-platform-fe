'use client';

import styled from '@emotion/styled';
import { AudioPlayer } from 'components';
import { useQueuedRecording, useRecordingPlayUrl, useDedaRecordings } from 'hooks/melp/dedaRecording';
import { brasiliaDate, formatDuration, formatRecordedOn, pickMyReading } from 'libs/dedaRecording';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AudioPlayerRef } from 'react-audio-play';
import { RecButton, SrOnly } from './ui';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    background: #2b2b2b;
    padding-bottom: 0.5rem;

    &.sticky {
        position: sticky;
        top: 0;
        z-index: 1;
    }

    .switch {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;
        max-width: 28rem;
    }

    .switch button {
        min-height: 48px;
        border-radius: 0.5rem;
        border: 2px solid #8a7a66;
        background: transparent;
        color: #ffffff;
        font: inherit;
        font-weight: 600;
        cursor: pointer;
    }

    .switch button[aria-pressed='true'] {
        background: #b89261;
        border-color: #b89261;
        color: #1f1b16;
    }

    .switch button.empty {
        border-style: dashed;
        color: #d9d2c7;
    }

    .switch button:focus-visible {
        outline: 3px solid #ffffff;
        outline-offset: 2px;
    }

    .note {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem 1rem;
        color: #e8dccb;
        margin: 0;
    }

    .track[hidden] {
        display: none;
    }

    @media (max-width: 860px) {
        .switch {
            max-width: none;
        }
    }
`;

interface Props {
    dedaId: string;
    isCurrentDeda: boolean;
    title: string;
    coverSrc: string;
    originalUrl: string;
    onGoRecord?: () => void;
    sticky?: boolean;
}

type Track = 'mine' | 'original';

/**
 * Passo 4: um player, duas faixas — "Minha leitura" e "Original". Os dois players ficam montados
 * (um escondido), então cada faixa lembra onde parou; trocar pausa a que estava tocando.
 */
export const TwoTrackPlayer: React.FC<Props> = ({
    dedaId,
    isCurrentDeda,
    title,
    coverSrc,
    originalUrl,
    onGoRecord,
    sticky,
}) => {
    const recordings = useDedaRecordings(dedaId);
    const today = brasiliaDate(new Date());
    const mine = pickMyReading(recordings.data?.recordings ?? [], today, isCurrentDeda);
    // Sem internet: a cópia que ficou no aparelho toca no lugar da do servidor.
    const queued = useQueuedRecording(recordings.uid, dedaId, today, isCurrentDeda && recordings.active);
    const localUrl = useMemo(() => (queued.data ? URL.createObjectURL(queued.data.blob) : null), [queued.data]);
    useEffect(() => () => void (localUrl && URL.revokeObjectURL(localUrl)), [localUrl]);
    const playUrl = useRecordingPlayUrl(localUrl ? null : mine?.id);
    const mineUrl = localUrl ?? playUrl.data ?? null;
    const hasMine = !!queued.data || !!mine;

    const [track, setTrack] = useState<Track>('mine');
    const [finishedMine, setFinishedMine] = useState(false);
    const [announce, setAnnounce] = useState('');
    const mineRef = useRef<AudioPlayerRef>();
    const originalRef = useRef<AudioPlayerRef>();
    const retried = useRef(false);

    const current: Track = hasMine ? track : 'original';
    const choose = (next: Track) => {
        (next === 'mine' ? originalRef : mineRef).current?.pause();
        setTrack(next);
        setAnnounce(next === 'mine' ? 'Faixa: Minha leitura' : 'Faixa: Original');
        if (next === 'mine') setFinishedMine(false);
    };

    const mineDuration = queued.data?.durationMs ?? mine?.durationMs ?? 0;
    const mineSubtitle =
        isCurrentDeda || !mine
            ? `Minha leitura de hoje · ${formatDuration(mineDuration)}`
            : `Minha leitura · ${formatRecordedOn(mine.recordedOn)} · ${formatDuration(mineDuration)}`;

    return (
        <Wrapper className={sticky ? 'sticky' : undefined}>
            <div className="switch" role="group" aria-label="Escolha a faixa">
                <button
                    type="button"
                    aria-pressed={current === 'mine'}
                    className={hasMine ? undefined : 'empty'}
                    aria-disabled={!hasMine && !(isCurrentDeda && onGoRecord)}
                    onClick={() => (hasMine ? choose('mine') : isCurrentDeda && onGoRecord?.())}
                >
                    Minha leitura
                </button>
                <button type="button" aria-pressed={current === 'original'} onClick={() => choose('original')}>
                    Original
                </button>
            </div>
            {!hasMine && !recordings.isLoading && (
                <p className="note">
                    {isCurrentDeda ? 'Você ainda não gravou hoje.' : 'Você não gravou a leitura deste DEDA.'}
                    {isCurrentDeda && onGoRecord && (
                        <RecButton type="button" className="ghost" onClick={onGoRecord}>
                            Ir para o passo 2
                        </RecButton>
                    )}
                </p>
            )}
            {finishedMine && current === 'mine' && (
                <p className="note" role="status">
                    Agora ouça o original.
                    <RecButton type="button" onClick={() => choose('original')}>
                        Ouvir o original
                    </RecButton>
                </p>
            )}
            {hasMine && (
                <div className="track" hidden={current !== 'mine'}>
                    {mineUrl ? (
                        <AudioPlayer
                            ref={mineRef}
                            title={title}
                            subtitle={mineSubtitle}
                            coverSrc={coverSrc}
                            audioURL={mineUrl}
                            onEnd={() => setFinishedMine(true)}
                            onError={() => {
                                // O endereço vale 5 minutos: pede outro uma vez.
                                if (!localUrl && !retried.current) {
                                    retried.current = true;
                                    playUrl.refetch();
                                }
                            }}
                        />
                    ) : (
                        <p className="note" role={playUrl.isError ? 'alert' : undefined}>
                            {playUrl.isError
                                ? 'Não deu para carregar a sua gravação agora.'
                                : 'Carregando a sua gravação…'}
                        </p>
                    )}
                </div>
            )}
            <div className="track" hidden={current !== 'original'}>
                <AudioPlayer ref={originalRef} title={title} coverSrc={coverSrc} audioURL={originalUrl} />
            </div>
            <SrOnly aria-live="polite">{announce}</SrOnly>
        </Wrapper>
    );
};
