'use client';

import { PodcastEpisode } from 'hooks/queries/dedaQueries';
import {
    cleanEpisodeTitle,
    loadPosition,
    loadRate,
    mediaUrl,
    nextRate,
    playbackAnnouncement,
    playerKeyAction,
    podcastPlayback,
    savePosition,
    saveRate,
    statusAfterPlayRejection,
} from 'libs/podcast';
import React, { useEffect, useRef, useState } from 'react';

export const BACK_SECONDS = 15;
export const FORWARD_SECONDS = 30;

/**
 * Estado e controles de um episódio sobre um <audio> nativo: posição e velocidade lembradas,
 * um episódio por vez, anúncios para leitor de tela e atalhos de teclado.
 * O componente renderiza `<audio ref={audioRef} {...audioProps} />` quando `src` existir.
 */
export const usePodcastPlayback = (episode: PodcastEpisode) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const lastSavedRef = useRef(0);
    // Só http(s): URL inválida nem monta o <audio> e cai direto no estado de erro.
    const src = mediaUrl(episode.audioUrl);
    const key = episode.audioUrl;
    const title = cleanEpisodeTitle(episode.title);

    const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>(src ? 'idle' : 'error');
    const [playing, setPlaying] = useState(false);
    const [started, setStarted] = useState(false);
    const [announcement, setAnnouncement] = useState('');
    const [current, setCurrent] = useState(0);
    const [duration, setDuration] = useState(episode.durationSeconds ?? 0);
    const [rate, setRate] = useState(loadRate);

    useEffect(() => {
        const audio = audioRef.current;
        // Desmontar (sair da página/DEDA): salva a posição e para o áudio.
        return () => {
            podcastPlayback.release(key);
            if (!audio) return;
            // Só com metadados carregados: sair antes disso não pode apagar a posição salva.
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
        if (!audio.paused) return audio.pause();
        setStarted(true);
        if (status === 'idle') setStatus('loading');
        // Rejeição não fatal (bloqueio, interrupção) volta ao estado anterior e o play pode ser clicado de novo.
        audio.play().catch((error) => {
            const next = statusAfterPlayRejection(error, audio.readyState >= 1);
            setStatus(next);
            if (next === 'idle') setStarted(false);
        });
    };

    const cycleRate = () => {
        const value = nextRate(rate);
        setRate(value);
        saveRate(value);
        if (audioRef.current) audioRef.current.playbackRate = value;
    };

    const onKeyDown = (event: React.KeyboardEvent) => {
        const action = playerKeyAction(event.key, event.target as HTMLElement);
        if (!action) return;
        event.preventDefault();
        if (action === 'toggle') toggle();
        else seekTo(current + (action === 'back' ? -BACK_SECONDS : BACK_SECONDS));
    };

    const audioProps: React.AudioHTMLAttributes<HTMLAudioElement> = {
        src: src ?? undefined,
        // Até 7 episódios por DEDA: nada é baixado antes do primeiro play.
        preload: 'none',
        onLoadedMetadata: (event) => {
            const audio = event.currentTarget;
            if (Number.isFinite(audio.duration)) setDuration(audio.duration);
            const saved = loadPosition(key);
            if (saved) audio.currentTime = saved;
            setCurrent(audio.currentTime);
            audio.playbackRate = rate;
            setStatus('ready');
        },
        onTimeUpdate: (event) => {
            const { currentTime, duration: total } = event.currentTarget;
            setCurrent(currentTime);
            if (Math.abs(currentTime - lastSavedRef.current) >= 5) {
                lastSavedRef.current = currentTime;
                savePosition(key, currentTime, total);
            }
        },
        onPlay: (event) => {
            const audio = event.currentTarget;
            podcastPlayback.claim(key, () => audio.pause());
            setPlaying(true);
            setAnnouncement(playbackAnnouncement('play', title) as string);
        },
        onPause: (event) => {
            setPlaying(false);
            const message = playbackAnnouncement('pause', title, event.currentTarget.ended);
            if (message) setAnnouncement(message);
            savePosition(key, event.currentTarget.currentTime, event.currentTarget.duration);
        },
        onEnded: () => {
            setPlaying(false);
            podcastPlayback.release(key);
            setAnnouncement(playbackAnnouncement('ended', title) as string);
            savePosition(key, 0, duration);
        },
        onError: () => setStatus('error'),
    };

    return {
        audioRef,
        audioProps,
        src,
        title,
        status,
        playing,
        started,
        announcement,
        current,
        duration,
        rate,
        toggle,
        seekTo,
        cycleRate,
        onKeyDown,
    };
};
