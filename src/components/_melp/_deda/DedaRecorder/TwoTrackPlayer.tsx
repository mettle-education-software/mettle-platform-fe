'use client';

import styled from '@emotion/styled';
import { AudioPlayer } from 'components';
import { useQueuedRecording, useRecordingPlayUrl, useDedaRecordings } from 'hooks/melp/dedaRecording';
import { brasiliaDate, formatDuration, formatRecordedOn, pickMyReading } from 'libs/dedaRecording';
import { Mic } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AudioPlayerRef } from 'react-audio-play';
import { publishMyReading, ReadAlongModes } from '../DedaReader/ReadAlong';
import { RecButton, SrOnly } from './ui';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    /* Mesmo fundo do que está atrás: o cartão branco no computador, a página no celular. */
    background: #ffffff;
    padding-bottom: 0.5rem;

    &.sticky {
        position: sticky;
        top: 0;
        z-index: 1;
    }

    /* Seletor de faixa no formato das pílulas da página: largura do player, alvo de 44 px. */
    .switch {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.25rem;
        padding: 0.25rem;
        border-radius: 50rem;
        background: rgba(60, 54, 47, 0.08);
    }

    .switch button {
        min-height: 44px;
        border-radius: 50rem;
        border: none;
        background: transparent;
        color: #3c362f;
        font: inherit;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
    }

    .switch button[aria-pressed='true'] {
        background: #b89261;
        color: #1f1b16;
    }

    .switch button.empty {
        color: #6b6258;
    }

    .switch button:focus-visible {
        outline: 3px solid #3c362f;
        outline-offset: 2px;
    }

    .note {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem 1rem;
        color: #3c362f;
        margin: 0;
    }

    .note .ghost {
        color: #2b2b2b;
        border-color: #6b6258;
    }

    .note button:focus-visible {
        outline-color: #2b2b2b;
    }

    .track[hidden] {
        display: none;
    }

    /* Na barra fixa da página nova do DEDA: uma linha, no escuro. */
    &.docked {
        background: transparent;
        padding: 0;
        flex-direction: row;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px 12px;
    }
    &.docked .switch {
        background: var(--r-pill);
        flex: none;
    }
    &.docked .switch button {
        color: var(--r-muted);
        padding: 0 14px;
        font-size: 0.875rem;
    }
    &.docked .switch button[aria-pressed='true'] {
        color: var(--r-on-gold-alt);
    }
    &.docked .switch button.empty {
        color: var(--r-faint);
    }
    &.docked .switch button:focus-visible,
    &.docked .note button:focus-visible {
        outline-color: var(--r-gold-hi);
    }
    &.docked .note {
        color: var(--r-muted);
        font-size: 0.875rem;
    }
    &.docked .note .ghost {
        color: var(--r-strong);
        border-color: var(--r-strong-line);
    }
    &.docked .track {
        flex: 1 1 12rem;
        min-width: 0;
    }

    @media (max-width: 860px) {
        background: #f5f5f5; /* fundo do Layout da Plataforma */

        /* Abaixo da barra de passos do DEDA (4rem, também presa no topo), sem cobri-la. */
        &.sticky {
            top: 4rem;
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
    /** Barra fixa da página nova do DEDA: player compacto, sem capa. */
    docked?: boolean;
}

type Track = 'mine' | 'original';

/**
 * Passo 4: um player, duas faixas — "My reading" e "Original". Os dois players ficam montados
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
    docked,
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
    // Read-along de "My reading" (página nova): qual gravação do servidor está no player. Cópia local (sem internet) não.
    const myId = docked && !localUrl ? mine?.id : undefined;
    useEffect(() => {
        publishMyReading(
            myId && recordings.uid && playUrl.data
                ? { recordingId: myId, uid: recordings.uid, url: playUrl.data }
                : null,
        );
        return () => publishMyReading(null);
    }, [myId, recordings.uid, playUrl.data]);

    const [track, setTrack] = useState<Track>('mine');
    const [finishedMine, setFinishedMine] = useState(false);
    const [announce, setAnnounce] = useState('');
    const mineRef = useRef<AudioPlayerRef>();
    const originalRef = useRef<AudioPlayerRef>();
    const retried = useRef(false);

    const current: Track = hasMine ? track : 'original';
    const choose = (next: Track) => {
        (next === 'mine' ? originalRef : mineRef).current?.pause();
        // Página nova: escolher a faixa já toca (os dois players ficam montados; o clique é o gesto do aluno).
        if (docked && next !== current) (next === 'mine' ? mineRef : originalRef).current?.play();
        setTrack(next);
        setAnnounce(next === 'mine' ? 'Track: My reading' : 'Track: Original');
        if (next === 'mine') setFinishedMine(false);
    };

    const mineDuration = queued.data?.durationMs ?? mine?.durationMs ?? 0;
    const mineSubtitle =
        isCurrentDeda || !mine
            ? `My reading today · ${formatDuration(mineDuration)}`
            : `My reading · ${formatRecordedOn(mine.recordedOn)} · ${formatDuration(mineDuration)}`;

    const switchGroup = (
        <div className="switch" role="group" aria-label="Choose a track">
            <button
                type="button"
                aria-pressed={current === 'mine'}
                className={hasMine ? undefined : 'empty'}
                aria-disabled={!hasMine && !(isCurrentDeda && onGoRecord)}
                onClick={() => (hasMine ? choose('mine') : isCurrentDeda && onGoRecord?.())}
            >
                My reading
            </button>
            <button type="button" aria-pressed={current === 'original'} onClick={() => choose('original')}>
                Original
            </button>
        </div>
    );

    return (
        <Wrapper className={docked ? 'docked' : sticky ? 'sticky' : undefined}>
            {docked ? (
                // Página nova (barra fixa): sem gravação hoje, o texto sai e um "Record" pequeno fica na mesma linha
                // das faixas (leva ao passo 2). Com gravação, nada muda.
                <div className="swrow">
                    {switchGroup}
                    <ReadAlongModes />
                    {!hasMine && !recordings.isLoading && isCurrentDeda && onGoRecord && (
                        <button type="button" className="rec" onClick={onGoRecord}>
                            <Mic size={16} strokeWidth={1.5} aria-hidden />
                            Record
                        </button>
                    )}
                </div>
            ) : (
                switchGroup
            )}
            {!docked && !hasMine && !recordings.isLoading && (
                <p className="note">
                    {isCurrentDeda ? 'You haven’t recorded today yet.' : 'You didn’t record a reading for this DEDA.'}
                    {isCurrentDeda && onGoRecord && (
                        <RecButton type="button" className="ghost" onClick={onGoRecord}>
                            Go to step 2
                        </RecButton>
                    )}
                </p>
            )}
            {finishedMine && current === 'mine' && (
                <p className="note" role="status">
                    Now listen to the original.
                    <RecButton type="button" onClick={() => choose('original')}>
                        Listen to the original
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
                            compact={docked}
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
                            {playUrl.isError ? 'We couldn’t load your recording right now.' : 'Loading your recording…'}
                        </p>
                    )}
                </div>
            )}
            <div className="track" hidden={current !== 'original'}>
                <AudioPlayer
                    ref={originalRef}
                    title={title}
                    coverSrc={coverSrc}
                    audioURL={originalUrl}
                    compact={docked}
                />
            </div>
            <SrOnly aria-live="polite">{announce}</SrOnly>
        </Wrapper>
    );
};
