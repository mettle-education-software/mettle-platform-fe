'use client';

import { PodcastEpisode } from 'hooks/queries/dedaQueries';
import {
    cleanEpisodeTitle,
    loadPosition,
    loadRate,
    mediaUrl,
    nextRate,
    initialPlayback,
    playbackAnnouncement,
    playbackReducer,
    playerKeyAction,
    createPlaybackController,
    savePosition,
    saveRate,
} from 'libs/podcast';
import React, { useEffect, useMemo, useReducer, useRef, useState } from 'react';

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

    // status/started/playing num reducer único: `error` terminal e sem corrida entre eventos.
    const [{ status, started, playing }, dispatch] = useReducer(playbackReducer, !!src, initialPlayback);
    const [announcement, setAnnouncement] = useState('');
    const [current, setCurrent] = useState(0);
    const [duration, setDuration] = useState(episode.durationSeconds ?? 0);
    const [rate, setRate] = useState(loadRate);

    // Tentativas de play com geração (corridas entre players, duplo clique, desmontagem): libs/podcast.
    const controller = useMemo(
        () => createPlaybackController({ id: key, getAudio: () => audioRef.current, dispatch }),
        [key],
    );

    useEffect(() => {
        const audio = audioRef.current;
        // Desmontar ou trocar de episódio: salva a posição e invalida/para a tentativa em curso.
        return () => {
            // Só com metadados carregados: sair antes disso não pode apagar a posição salva.
            if (audio && audio.readyState >= 1) savePosition(key, audio.currentTime, audio.duration);
            controller.dispose();
        };
    }, [key, controller]);

    const seekTo = (seconds: number) => {
        const audio = audioRef.current;
        if (!audio || status !== 'ready') return;
        audio.currentTime = Math.min(Math.max(0, seconds), duration || audio.duration || 0);
        setCurrent(audio.currentTime);
    };

    const toggle = () => {
        if (status === 'error') return;
        controller.toggle();
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
            dispatch({ type: 'METADATA' });
        },
        onTimeUpdate: (event) => {
            const { currentTime, duration: total } = event.currentTarget;
            setCurrent(currentTime);
            if (Math.abs(currentTime - lastSavedRef.current) >= 5) {
                lastSavedRef.current = currentTime;
                savePosition(key, currentTime, total);
            }
        },
        onPlay: () => {
            if (controller.onPlay()) setAnnouncement(playbackAnnouncement('play', title) as string);
        },
        onPause: (event) => {
            // Pausa causada por nós (outro episódio começou, onPlay obsoleto) não é anunciada.
            const announce = controller.onPause();
            const message = playbackAnnouncement('pause', title, event.currentTarget.ended);
            if (announce && message) setAnnouncement(message);
            savePosition(key, event.currentTarget.currentTime, event.currentTarget.duration);
        },
        onEnded: () => {
            controller.onEnded();
            setAnnouncement(playbackAnnouncement('ended', title) as string);
            savePosition(key, 0, duration);
        },
        onError: () => dispatch({ type: 'MEDIA_ERROR' }),
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
