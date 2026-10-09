'use client';

import { CaretRightFilled, LoadingOutlined, PauseOutlined, RedoOutlined, UndoOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { PodcastEpisode } from 'hooks/queries/dedaQueries';
import { coverBackground, formatTime, nextRate, podcastCardColor } from 'libs/podcast';
import React from 'react';
import { BACK_SECONDS, FORWARD_SECONDS, usePodcastPlayback } from './usePodcastPlayback';

const Card = styled.div`
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    min-width: 0;
    padding: 0.75rem 0.75rem 1rem;
    border-radius: 10px;
    color: #ffffff;
    outline: none;

    &:focus-visible {
        box-shadow: 0 0 0 2px #ffffff;
    }
`;

const Top = styled.div`
    display: flex;
    gap: 0.9rem;
    min-width: 0;
    padding-right: 3.5rem;

    /* o botão de play fica embaixo; no celular o título usa a largura toda */
    @media (max-width: 600px) {
        padding-right: 0;
    }
`;

const Cover = styled.div`
    flex-shrink: 0;
    width: 5.5rem;
    height: 5.5rem;
    border-radius: 6px;
    background: rgba(0, 0, 0, 0.3) center / cover no-repeat;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);

    @media (max-width: 600px) {
        width: 4.5rem;
        height: 4.5rem;
    }
`;

const Info = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    min-width: 0;
    padding-top: 0.15rem;
`;

const Title = styled.span`
    font-size: 15px;
    font-weight: 700;
    line-height: 1.35;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
`;

const Meta = styled.span`
    font-size: 12px;
    opacity: 0.85;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const PlayButton = styled.button`
    all: unset;
    position: absolute;
    right: 0.75rem;
    bottom: 0.75rem;
    width: 2.75rem;
    height: 2.75rem;
    border-radius: 50%;
    background: #ffffff;
    color: #121212;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.15rem;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

    &:hover {
        transform: scale(1.05);
    }

    &:focus-visible {
        outline: 2px solid #ffffff;
        outline-offset: 3px;
    }
`;

const Controls = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    padding-right: 3.5rem;
`;

// Trilha preenchida até a posição atual (--progress é um número calculado no componente).
const Progress = styled.input`
    width: 100%;
    /* área de toque de 44px; a trilha visível tem 4px */
    height: 44px;
    margin: -10px 0;
    appearance: none;
    -webkit-appearance: none;
    border-radius: 999px;
    cursor: pointer;
    /* arrastar a barra não rola o carrossel; só o gesto vertical da página passa */
    touch-action: pan-y;
    accent-color: #ffffff;
    background: linear-gradient(
            to right,
            #ffffff 0 var(--progress, 0%),
            rgba(255, 255, 255, 0.3) var(--progress, 0%) 100%
        )
        center / 100% 4px no-repeat;

    &::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #ffffff;
        border: none;
    }

    &::-moz-range-thumb {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #ffffff;
        border: none;
    }

    &::-moz-range-track {
        background: transparent;
    }

    &:focus-visible {
        outline: 2px solid #ffffff;
        outline-offset: 3px;
    }

    &:disabled {
        cursor: default;
        opacity: 0.5;
    }
`;

const Times = styled.div`
    display: flex;
    justify-content: space-between;
    margin-top: -0.25rem;
    font-size: 12px;
    opacity: 0.85;
    font-variant-numeric: tabular-nums;
`;

const Buttons = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;

    @media (max-width: 600px) {
        gap: 0.25rem;
    }
`;

const SmallButton = styled.button`
    all: unset;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    font-size: 12px;
    font-weight: 600;
    min-width: 44px;
    min-height: 44px;
    justify-content: center;
    padding: 0 0.6rem;
    box-sizing: border-box;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.15);

    @media (max-width: 600px) {
        padding: 0 0.4rem;
    }

    &:focus-visible {
        outline: 2px solid #ffffff;
    }

    &:disabled {
        opacity: 0.5;
        cursor: default;
    }
`;

const VisuallyHidden = styled.span`
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
`;

const ERROR_MESSAGE = 'Couldn’t load this episode.';

/** Card de episódio no estilo Spotify, com player inline (sem popup). */
export const PodcastCard = ({ episode }: { episode: PodcastEpisode }) => {
    const playback = usePodcastPlayback(episode);
    const { status, playing, current, duration, rate, title } = playback;

    return (
        <Card
            role="group"
            aria-label={title}
            tabIndex={0}
            onKeyDown={playback.onKeyDown}
            style={{ backgroundColor: podcastCardColor(episode.accentColor) }}
        >
            <Top>
                <Cover style={{ backgroundImage: coverBackground(episode.coverImageUrl) }} aria-hidden />
                <Info>
                    <Title title={title}>{title}</Title>
                    <Meta>
                        {[episode.showName, duration ? formatTime(duration) : null].filter(Boolean).join(' · ')}
                    </Meta>
                </Info>
            </Top>

            {status === 'error' ? (
                <Meta>{ERROR_MESSAGE}</Meta>
            ) : (
                <Controls>
                    <Progress
                        type="range"
                        min={0}
                        max={Math.max(duration, 1)}
                        step={1}
                        value={current}
                        style={
                            {
                                '--progress': `${duration ? (Math.min(current, duration) / duration) * 100 : 0}%`,
                            } as React.CSSProperties
                        }
                        aria-label="Playback position"
                        aria-valuetext={`${formatTime(current)} of ${formatTime(duration)}`}
                        onChange={(event) => playback.seekTo(Number(event.target.value))}
                    />
                    <Times>
                        <span>{formatTime(current)}</span>
                        <span>{formatTime(duration)}</span>
                    </Times>
                    <Buttons>
                        <SmallButton
                            type="button"
                            aria-label={`Back ${BACK_SECONDS} seconds`}
                            onClick={() => playback.seekTo(current - BACK_SECONDS)}
                        >
                            <UndoOutlined /> {BACK_SECONDS}
                        </SmallButton>
                        <SmallButton
                            type="button"
                            aria-label={`Forward ${FORWARD_SECONDS} seconds`}
                            onClick={() => playback.seekTo(current + FORWARD_SECONDS)}
                        >
                            <RedoOutlined /> {FORWARD_SECONDS}
                        </SmallButton>
                        <SmallButton
                            type="button"
                            aria-label={`Playback speed ${rate}×. Change to ${nextRate(rate)}×`}
                            onClick={playback.cycleRate}
                        >
                            {rate}×
                        </SmallButton>
                    </Buttons>
                </Controls>
            )}

            {status !== 'error' && (
                <PlayButton
                    type="button"
                    aria-label={playing ? `Pause ${title}` : `Play ${title}`}
                    aria-busy={status === 'loading'}
                    onClick={playback.toggle}
                >
                    {status === 'loading' ? <LoadingOutlined /> : playing ? <PauseOutlined /> : <CaretRightFilled />}
                </PlayButton>
            )}

            {/* Anúncio para leitor de tela: tocando, pausado, fim e erro. */}
            <VisuallyHidden aria-live="polite">
                {status === 'error' ? ERROR_MESSAGE : playback.announcement}
            </VisuallyHidden>

            {playback.src && <audio ref={playback.audioRef} {...playback.audioProps} />}
        </Card>
    );
};
