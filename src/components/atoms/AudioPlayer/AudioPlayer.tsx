import styled from '@emotion/styled';
import { Howl } from 'howler';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import React, { useState, useEffect, useRef, useCallback } from 'react';

interface AudioPlayerProps {
    audioURL: string;
    onPlayStart?: () => void;
    primaryColor?: string;
    secondaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
    title?: string;
    artist?: string;
}

const PlayerContainer = styled.div<{ backgroundColor: string }>`
    width: 100%;
    height: 5rem;
    background-color: ${(props) => props.backgroundColor};
    border-radius: 0.5rem;
    box-shadow:
        0 4px 6px -1px rgba(0, 0, 0, 0.1),
        0 2px 4px -1px rgba(0, 0, 0, 0.06);
    padding: 1rem;
    display: flex;
    align-items: center;
    gap: 1rem;
`;

const PlayButton = styled.button<{ primaryColor: string; disabled: boolean }>`
    flex-shrink: 0;
    width: 3rem;
    height: 3rem;
    background-color: ${(props) => props.primaryColor};
    border-radius: 50%;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
    transition: all 0.2s ease;
    opacity: ${(props) => (props.disabled ? 0.5 : 1)};

    &:hover:not(:disabled) {
        transform: scale(1.05);
    }

    &:focus {
        outline: 2px solid ${(props) => props.primaryColor};
        outline-offset: 2px;
    }
`;

const LoadingSpinner = styled.div`
    width: 1.25rem;
    height: 1.25rem;
    border: 2px solid white;
    border-top: 2px solid transparent;
    border-radius: 50%;
    animation: spin 1s linear infinite;

    @keyframes spin {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }
`;

const TrackInfo = styled.div`
    flex: 1;
    min-width: 0;
`;

const TrackHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.25rem;
`;

const TrackDetails = styled.div`
    overflow: hidden;
    padding-right: 0.5rem;
`;

const TrackTitle = styled.h3<{ textColor: string }>`
    color: ${(props) => props.textColor};
    font-size: 0.875rem;
    font-weight: 500;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const TrackArtist = styled.p<{ textColor: string }>`
    color: ${(props) => props.textColor};
    opacity: 0.7;
    font-size: 0.75rem;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const TimeDisplay = styled.div<{ textColor: string }>`
    color: ${(props) => props.textColor};
    font-size: 0.75rem;
    flex-shrink: 0;
`;

const ProgressBarContainer = styled.div<{ secondaryColor: string }>`
    position: relative;
    height: 0.5rem;
    background-color: ${(props) => props.secondaryColor};
    border-radius: 9999px;
    cursor: pointer;

    &:hover .progress-thumb {
        opacity: 1;
    }
`;

const ProgressBar = styled.div<{ primaryColor: string; width: number }>`
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background-color: ${(props) => props.primaryColor};
    border-radius: 9999px;
    width: ${(props) => props.width}%;
    transition: all 0.15s ease;
`;

const ProgressThumb = styled.div<{ primaryColor: string; left: number }>`
    position: absolute;
    top: 50%;
    width: 1rem;
    height: 1rem;
    background-color: ${(props) => props.primaryColor};
    border-radius: 50%;
    transform: translateY(-50%);
    left: ${(props) => props.left}%;
    margin-left: -0.5rem;
    transition: all 0.15s ease;
    opacity: 0;
`;

const VolumeControls = styled.div`
    display: none;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;

    @media (min-width: 640px) {
        display: flex;
    }
`;

const VolumeButton = styled.button`
    padding: 0.25rem;
    border: none;
    background: none;
    border-radius: 0.25rem;
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover {
        background-color: rgba(0, 0, 0, 0.1);
    }

    &:focus {
        outline: 2px solid rgba(59, 130, 246, 0.5);
        outline-offset: 2px;
    }
`;

const VolumeBarContainer = styled.div<{ secondaryColor: string }>`
    position: relative;
    width: 5rem;
    height: 0.5rem;
    background-color: ${(props) => props.secondaryColor};
    border-radius: 9999px;
    cursor: pointer;

    &:hover .volume-thumb {
        opacity: 1;
    }
`;

const VolumeBar = styled.div<{ primaryColor: string; width: number }>`
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background-color: ${(props) => props.primaryColor};
    border-radius: 9999px;
    width: ${(props) => props.width}%;
    transition: all 0.15s ease;
`;

const VolumeThumb = styled.div<{ primaryColor: string; left: number }>`
    position: absolute;
    top: 50%;
    width: 0.75rem;
    height: 0.75rem;
    background-color: ${(props) => props.primaryColor};
    border-radius: 50%;
    transform: translateY(-50%);
    left: ${(props) => props.left}%;
    margin-left: -0.375rem;
    transition: all 0.15s ease;
    opacity: 0;
`;

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
    audioURL,
    onPlayStart,
    primaryColor = 'var(--brown-bg)',
    secondaryColor = '#e5e7eb',
    backgroundColor = '#ffffff',
    textColor = '#1f2937',
    title = 'DEDA',
    artist = 'Listen',
}) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const howlRef = useRef<Howl | null>(null);
    const progressRef = useRef<HTMLDivElement>(null);
    const volumeRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number>();

    // Initialize Howler instance
    useEffect(() => {
        if (!audioURL) return;

        setIsLoading(true);

        howlRef.current = new Howl({
            src: [audioURL],
            html5: true,
            preload: true,
            volume: volume,
            onload: () => {
                const howl = howlRef.current;
                if (howl) {
                    setDuration(howl.duration());
                    setIsLoading(false);
                    setupMediaSession();
                }
            },
            onplay: () => {
                setIsPlaying(true);
                onPlayStart?.();
                updateProgress();
            },
            onpause: () => {
                setIsPlaying(false);
                if (animationRef.current) {
                    cancelAnimationFrame(animationRef.current);
                }
            },
            onend: () => {
                setIsPlaying(false);
                setCurrentTime(0);
                if (animationRef.current) {
                    cancelAnimationFrame(animationRef.current);
                }
            },
            onseek: () => {
                updateProgress();
            },
            onloaderror: (id, error) => {
                setIsLoading(false);
                console.error('Failed to load audio:', error);
            },
            onplayerror: (id, error) => {
                console.error('Playback error:', error);
            },
        });

        return () => {
            if (howlRef.current) {
                howlRef.current.unload();
            }
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [audioURL, volume]);

    // Setup Media Session API for mobile lock screen controls
    const setupMediaSession = useCallback(() => {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: title,
                artist: artist,
                artwork: [
                    { src: '/api/placeholder/96/96', sizes: '96x96', type: 'image/png' },
                    { src: '/api/placeholder/128/128', sizes: '128x128', type: 'image/png' },
                    { src: '/api/placeholder/192/192', sizes: '192x192', type: 'image/png' },
                    { src: '/api/placeholder/256/256', sizes: '256x256', type: 'image/png' },
                ],
            });

            navigator.mediaSession.setActionHandler('play', () => {
                handlePlayPause();
            });

            navigator.mediaSession.setActionHandler('pause', () => {
                handlePlayPause();
            });

            navigator.mediaSession.setActionHandler('seekbackward', (details) => {
                const skipTime = details.seekOffset ?? 10;
                seek(Math.max(0, currentTime - skipTime));
            });

            navigator.mediaSession.setActionHandler('seekforward', (details) => {
                const skipTime = details.seekOffset ?? 10;
                seek(Math.min(duration, currentTime + skipTime));
            });

            navigator.mediaSession.setActionHandler('seekto', (details) => {
                if (details.seekTime !== undefined) {
                    seek(details.seekTime);
                }
            });
        }
    }, [title, artist, currentTime, duration]);

    // Update progress animation
    const updateProgress = useCallback(() => {
        if (howlRef.current && isPlaying) {
            const seek = howlRef.current.seek();
            const currentSeek = typeof seek === 'number' ? seek : 0;
            setCurrentTime(currentSeek);

            // Update Media Session position state
            if ('mediaSession' in navigator && navigator.mediaSession.setPositionState) {
                navigator.mediaSession.setPositionState({
                    duration: duration,
                    playbackRate: 1,
                    position: currentSeek,
                });
            }

            animationRef.current = requestAnimationFrame(updateProgress);
        }
    }, [isPlaying, duration]);

    const handlePlayPause = () => {
        if (!howlRef.current || isLoading) return;

        if (isPlaying) {
            howlRef.current.pause();
        } else {
            howlRef.current.play();
        }
    };

    const seek = (time: number) => {
        if (!howlRef.current) return;

        const seekTime = Math.max(0, Math.min(time, duration));
        howlRef.current.seek(seekTime);
        setCurrentTime(seekTime);
    };

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!progressRef.current || !duration) return;

        const rect = progressRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;
        const newTime = percentage * duration;

        seek(newTime);
    };

    const handleVolumeChange = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!volumeRef.current) return;

        const rect = volumeRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, clickX / rect.width));

        setVolume(percentage);
        setIsMuted(percentage === 0);

        if (howlRef.current) {
            howlRef.current.volume(percentage);
        }
    };

    const toggleMute = () => {
        const newMuted = !isMuted;
        setIsMuted(newMuted);

        if (howlRef.current) {
            howlRef.current.volume(newMuted ? 0 : volume);
        }
    };

    const formatTime = (time: number) => {
        if (!isFinite(time)) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
    const volumePercentage = isMuted ? 0 : volume * 100;

    return (
        <PlayerContainer backgroundColor={backgroundColor}>
            {/* Play/Pause Button */}
            <PlayButton onClick={handlePlayPause} disabled={isLoading} primaryColor={primaryColor}>
                {isLoading ? (
                    <LoadingSpinner />
                ) : isPlaying ? (
                    <Pause color="white" size={24} />
                ) : (
                    <Play color="white" size={24} style={{ marginLeft: '2px' }} />
                )}
            </PlayButton>

            {/* Track Info & Progress */}
            <TrackInfo>
                <TrackHeader>
                    <TrackDetails>
                        <TrackTitle textColor={textColor}>{title}</TrackTitle>
                        <TrackArtist textColor={textColor}>{artist}</TrackArtist>
                    </TrackDetails>
                    <TimeDisplay textColor={textColor}>
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </TimeDisplay>
                </TrackHeader>

                {/* Progress Bar */}
                <ProgressBarContainer ref={progressRef} secondaryColor={secondaryColor} onClick={handleProgressClick}>
                    <ProgressBar primaryColor={primaryColor} width={progressPercentage} />
                    <ProgressThumb className="progress-thumb" primaryColor={primaryColor} left={progressPercentage} />
                </ProgressBarContainer>
            </TrackInfo>

            {/* Volume Controls */}
            <VolumeControls>
                <VolumeButton onClick={toggleMute}>
                    {isMuted || volume === 0 ? (
                        <VolumeX color={textColor} size={20} />
                    ) : (
                        <Volume2 color={textColor} size={20} />
                    )}
                </VolumeButton>

                <VolumeBarContainer ref={volumeRef} secondaryColor={secondaryColor} onClick={handleVolumeChange}>
                    <VolumeBar primaryColor={primaryColor} width={volumePercentage} />
                    <VolumeThumb className="volume-thumb" primaryColor={primaryColor} left={volumePercentage} />
                </VolumeBarContainer>
            </VolumeControls>
        </PlayerContainer>
    );
};
