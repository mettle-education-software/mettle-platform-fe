'use client';

import { LoadingOutlined, PauseOutlined, CaretRightFilled, RedoOutlined, UndoOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Typography } from 'antd';
import { PodcastEpisode } from 'hooks/queries/dedaQueries';
import {
    cleanEpisodeTitle,
    coverBackground,
    formatTime,
    loadPosition,
    loadRate,
    nextRate,
    playerKeyAction,
    savePosition,
    saveRate,
} from 'libs/podcast';
import React, { useEffect, useRef, useState } from 'react';

// Cor de destaque da Plataforma (a mesma do "Day N" dos cards); fallback caso a variável falte no portal.
const ACCENT = 'var(--secondary, #b89261)';
const BACK_SECONDS = 15;
const FORWARD_SECONDS = 30;

const Wrapper = styled.div`
    height: 100%;
    overflow-y: auto;
    padding: 0 1.5rem 2rem;
    outline: none;
`;

const Column = styled.div`
    max-width: 26rem;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    text-align: center;
`;

const Cover = styled.div`
    width: min(18rem, 70vw, 40vh);
    aspect-ratio: 1;
    border-radius: 8px;
    background: #2b2b2b center / cover no-repeat;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
`;

// Trilha preenchida até a posição atual (--progress é um número nosso, calculado no componente).
const Progress = styled.input`
    width: 100%;
    height: 6px;
    margin: 0.5rem 0;
    appearance: none;
    -webkit-appearance: none;
    border-radius: 999px;
    cursor: pointer;
    accent-color: ${ACCENT};
    background: linear-gradient(to right, ${ACCENT} 0 var(--progress, 0%), #e0dcd7 var(--progress, 0%) 100%);

    &::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: ${ACCENT};
        border: none;
    }

    &::-moz-range-thumb {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: ${ACCENT};
        border: none;
    }

    &::-moz-range-track {
        background: transparent;
    }

    &:focus-visible {
        outline: 2px solid ${ACCENT};
        outline-offset: 4px;
    }

    &:disabled {
        cursor: default;
        opacity: 0.5;
    }
`;

const Times = styled.div`
    width: 100%;
    display: flex;
    justify-content: space-between;
    margin-top: -0.5rem;
    font-size: 12px;
    color: #8c8c8c;
    font-variant-numeric: tabular-nums;
`;

const Controls = styled.div`
    display: flex;
    align-items: center;
    gap: 1.5rem;
`;

const IconButton = styled.button`
    all: unset;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    font-size: 1.5rem;
    color: #262626;
    border-radius: 50%;
    padding: 0.25rem;

    small {
        font-size: 10px;
        font-weight: 600;
    }

    &:focus-visible {
        outline: 2px solid ${ACCENT};
    }

    &:disabled {
        opacity: 0.4;
        cursor: default;
    }
`;

const PlayButton = styled(IconButton)`
    width: 4rem;
    height: 4rem;
    justify-content: center;
    background: ${ACCENT};
    color: #ffffff;
    font-size: 1.75rem;

    &:hover:not(:disabled) {
        filter: brightness(1.1);
    }
`;

const RateButton = styled.button`
    all: unset;
    cursor: pointer;
    min-width: 3.25rem;
    text-align: center;
    font-size: 13px;
    font-weight: 600;
    padding: 0.25rem 0.75rem;
    border-radius: 999px;
    color: #ffffff;
    background: ${ACCENT};
    font-variant-numeric: tabular-nums;

    &:focus-visible {
        outline: 2px solid ${ACCENT};
        outline-offset: 2px;
    }
`;

/** Player de podcast da Plataforma (áudio nativo), aberto no mesmo popup dos artigos e vídeos. */
export const PodcastPlayer = ({ episode, titleId }: { episode: PodcastEpisode; titleId: string }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const lastSavedRef = useRef(0);
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    const [playing, setPlaying] = useState(false);
    const [current, setCurrent] = useState(0);
    const [duration, setDuration] = useState(episode.durationSeconds ?? 0);
    const [rate, setRate] = useState(loadRate);

    const key = episode.audioUrl;
    const title = cleanEpisodeTitle(episode.title);

    useEffect(() => {
        wrapperRef.current?.focus();
        const audio = audioRef.current;
        // Fechar o popup desmonta o player: salva a posição e para o áudio.
        return () => {
            if (!audio) return;
            // Só com metadados carregados: fechar antes disso não pode apagar a posição salva.
            if (audio.readyState >= 1) savePosition(key, audio.currentTime, audio.duration);
            audio.pause();
        };
    }, [key]);

    const seekTo = (seconds: number) => {
        const audio = audioRef.current;
        if (!audio || status !== 'ready') return;
        audio.currentTime = Math.min(Math.max(0, seconds), duration || audio.duration || 0);
        setCurrent(audio.currentTime);
    };

    const toggle = () => {
        const audio = audioRef.current;
        if (!audio || status === 'error') return;
        // Só formato/fonte inválidos viram erro; bloqueio ou interrupção do play não.
        if (audio.paused) audio.play().catch((error) => error?.name === 'NotSupportedError' && setStatus('error'));
        else audio.pause();
    };

    const onKeyDown = (event: React.KeyboardEvent) => {
        const action = playerKeyAction(event.key, event.target as HTMLElement);
        if (!action) return;
        event.preventDefault();
        if (action === 'toggle') toggle();
        else seekTo(current + (action === 'back' ? -BACK_SECONDS : BACK_SECONDS));
    };

    return (
        <Wrapper ref={wrapperRef} tabIndex={-1} onKeyDown={onKeyDown}>
            <Column>
                <Cover
                    style={{ backgroundImage: coverBackground(episode.coverImageUrl) }}
                    role="img"
                    aria-label={episode.showName || title}
                />
                <div>
                    {episode.showName && (
                        <Typography.Text
                            style={{
                                color: ACCENT,
                                fontSize: 12,
                                letterSpacing: 1,
                                textTransform: 'uppercase',
                            }}
                        >
                            {episode.showName}
                        </Typography.Text>
                    )}
                    <Typography.Title id={titleId} level={3} style={{ margin: '0.25rem 0 0' }}>
                        {title}
                    </Typography.Title>
                </div>

                <audio
                    ref={audioRef}
                    src={episode.audioUrl}
                    preload="metadata"
                    onLoadedMetadata={(event) => {
                        const audio = event.currentTarget;
                        if (Number.isFinite(audio.duration)) setDuration(audio.duration);
                        const saved = loadPosition(key);
                        if (saved) audio.currentTime = saved;
                        setCurrent(audio.currentTime);
                        audio.playbackRate = rate;
                        setStatus('ready');
                        // Autoplay: o clique no card é o gesto do usuário. Se o navegador bloquear,
                        // fica o botão play normal, sem erro (falha real de mídia chega pelo onError).
                        audio.play().catch(() => undefined);
                    }}
                    onTimeUpdate={(event) => {
                        const { currentTime, duration: total } = event.currentTarget;
                        setCurrent(currentTime);
                        if (Math.abs(currentTime - lastSavedRef.current) >= 5) {
                            lastSavedRef.current = currentTime;
                            savePosition(key, currentTime, total);
                        }
                    }}
                    onPlay={() => setPlaying(true)}
                    onPause={(event) => {
                        setPlaying(false);
                        savePosition(key, event.currentTarget.currentTime, event.currentTarget.duration);
                    }}
                    onEnded={() => {
                        setPlaying(false);
                        savePosition(key, 0, duration);
                    }}
                    onError={() => setStatus('error')}
                />

                {status === 'error' ? (
                    <Typography.Text type="danger" role="alert">
                        Não foi possível carregar este episódio.
                    </Typography.Text>
                ) : (
                    <>
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
                            disabled={status !== 'ready'}
                            aria-label="Playback position"
                            aria-valuetext={`${formatTime(current)} of ${formatTime(duration)}`}
                            onChange={(event) => seekTo(Number(event.target.value))}
                        />
                        <Times>
                            <span>{formatTime(current)}</span>
                            <span>{formatTime(duration)}</span>
                        </Times>

                        <Controls>
                            <IconButton
                                type="button"
                                aria-label={`Back ${BACK_SECONDS} seconds`}
                                disabled={status !== 'ready'}
                                onClick={() => seekTo(current - BACK_SECONDS)}
                            >
                                <UndoOutlined />
                                <small>{BACK_SECONDS}</small>
                            </IconButton>
                            <PlayButton
                                type="button"
                                aria-label={playing ? 'Pause' : 'Play'}
                                aria-busy={status === 'loading'}
                                onClick={toggle}
                            >
                                {status === 'loading' ? (
                                    <LoadingOutlined />
                                ) : playing ? (
                                    <PauseOutlined />
                                ) : (
                                    <CaretRightFilled />
                                )}
                            </PlayButton>
                            <IconButton
                                type="button"
                                aria-label={`Forward ${FORWARD_SECONDS} seconds`}
                                disabled={status !== 'ready'}
                                onClick={() => seekTo(current + FORWARD_SECONDS)}
                            >
                                <RedoOutlined />
                                <small>{FORWARD_SECONDS}</small>
                            </IconButton>
                        </Controls>

                        <RateButton
                            type="button"
                            aria-label={`Playback speed ${rate}×. Change to ${nextRate(rate)}×`}
                            onClick={() => {
                                const value = nextRate(rate);
                                setRate(value);
                                saveRate(value);
                                if (audioRef.current) audioRef.current.playbackRate = value;
                            }}
                        >
                            {rate}×
                        </RateButton>
                    </>
                )}
            </Column>
        </Wrapper>
    );
};
