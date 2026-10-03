'use client';

import {
    elapsedMs,
    initialRecorderState,
    MAX_RECORDING_MS,
    pickRecordingFormat,
    RecorderProblem,
    recorderReducer,
} from 'libs/dedaRecording';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';

type WakeLockSentinelLike = { release(): Promise<void> };

const micProblem = (error: unknown): RecorderProblem => {
    const name = (error as DOMException)?.name;
    if (name === 'NotAllowedError' || name === 'SecurityError') return 'denied';
    if (name === 'NotFoundError' || name === 'OverconstrainedError' || name === 'NotReadableError') return 'nomic';
    return 'unsupported';
};

/**
 * Gravador do navegador (MediaRecorder), em mono, com contador pelo relógio real (pausas descontadas),
 * nível do microfone, tela acesa e pausa automática quando a página some (iPhone para a captura).
 * As regras de estado ficam em libs/dedaRecording (recorderReducer).
 */
export const useDedaRecorder = () => {
    const [state, dispatch] = useReducer(recorderReducer, initialRecorderState);
    const [now, setNow] = useState(() => Date.now());
    const [blob, setBlob] = useState<Blob | null>(null);
    const [mimeType, setMimeType] = useState('');

    const recorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const wakeLockRef = useRef<WakeLockSentinelLike | null>(null);
    const levelElRef = useRef<HTMLElement | null>(null);
    const rafRef = useRef<number>();

    const requestWakeLock = useCallback(async () => {
        try {
            const wl = (navigator as Navigator & { wakeLock?: { request(t: 'screen'): Promise<WakeLockSentinelLike> } })
                .wakeLock;
            wakeLockRef.current = (await wl?.request('screen')) ?? null;
        } catch {
            // sem suporte ou negado: segue sem tela acesa
        }
    }, []);

    const releaseDevices = useCallback(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        streamRef.current?.getTracks().forEach((t) => t.stop()); // apaga a luz de gravação
        streamRef.current = null;
        audioCtxRef.current?.close().catch(() => undefined);
        audioCtxRef.current = null;
        wakeLockRef.current?.release().catch(() => undefined);
        wakeLockRef.current = null;
        if (levelElRef.current) levelElRef.current.style.transform = 'scaleX(0)';
    }, []);

    const startLevelMeter = (stream: MediaStream) => {
        try {
            const Ctx =
                window.AudioContext ??
                (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            const ctx = new Ctx();
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 512;
            ctx.createMediaStreamSource(stream).connect(analyser);
            audioCtxRef.current = ctx;
            const buf = new Uint8Array(analyser.fftSize);
            const tick = () => {
                analyser.getByteTimeDomainData(buf);
                let sum = 0;
                for (const v of buf) sum += (v - 128) * (v - 128);
                const level = Math.min(1, Math.sqrt(sum / buf.length) / 40);
                if (levelElRef.current) levelElRef.current.style.transform = `scaleX(${level.toFixed(3)})`;
                rafRef.current = requestAnimationFrame(tick);
            };
            tick();
        } catch {
            // sem Web Audio: só não mostra o nível
        }
    };

    const start = useCallback(async () => {
        const supported =
            typeof window !== 'undefined' &&
            typeof MediaRecorder !== 'undefined' &&
            !!navigator.mediaDevices?.getUserMedia;
        const format = supported ? pickRecordingFormat((t) => MediaRecorder.isTypeSupported(t)) : null;
        if (!format) return dispatch({ type: 'problem', problem: 'unsupported' });
        let stream: MediaStream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
            });
        } catch (error) {
            return dispatch({ type: 'problem', problem: micProblem(error) });
        }
        let recorder: MediaRecorder;
        try {
            recorder = new MediaRecorder(stream, format);
        } catch {
            stream.getTracks().forEach((t) => t.stop());
            return dispatch({ type: 'problem', problem: 'unsupported' });
        }
        streamRef.current = stream;
        recorderRef.current = recorder;
        chunksRef.current = [];
        setBlob(null);
        const type = recorder.mimeType || format.mimeType;
        setMimeType(type);
        recorder.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
        recorder.onstop = () => {
            setBlob(new Blob(chunksRef.current, { type }));
            releaseDevices();
        };
        // Fone desconectado, ligação que toma o microfone: para e guarda o que já foi gravado.
        stream.getAudioTracks().forEach((track) =>
            track.addEventListener('ended', () => {
                if (recorder.state !== 'inactive') {
                    recorder.stop();
                    dispatch({ type: 'stop', now: Date.now(), interrupted: true });
                }
            }),
        );
        recorder.start(1000); // pedaços a cada segundo: uma falha no fim não perde tudo
        startLevelMeter(stream);
        requestWakeLock();
        dispatch({ type: 'start', now: Date.now() });
    }, [releaseDevices, requestWakeLock]);

    const pause = useCallback((interrupted = false) => {
        if (recorderRef.current?.state !== 'recording') return;
        recorderRef.current.pause();
        dispatch({ type: 'pause', now: Date.now(), interrupted });
    }, []);

    const resume = useCallback(() => {
        if (recorderRef.current?.state !== 'paused') return;
        recorderRef.current.resume();
        requestWakeLock();
        dispatch({ type: 'resume', now: Date.now() });
    }, [requestWakeLock]);

    const stop = useCallback((limit = false) => {
        const recorder = recorderRef.current;
        if (!recorder || recorder.state === 'inactive') return;
        recorder.stop();
        dispatch({ type: 'stop', now: Date.now(), limit });
    }, []);

    const reset = useCallback(() => {
        if (recorderRef.current && recorderRef.current.state !== 'inactive') {
            recorderRef.current.onstop = null;
            recorderRef.current.stop();
        }
        releaseDevices();
        recorderRef.current = null;
        chunksRef.current = [];
        setBlob(null);
        dispatch({ type: 'reset' });
    }, [releaseDevices]);

    // Contador: re-renderiza 4x por segundo enquanto grava e encerra aos 20 minutos.
    useEffect(() => {
        if (state.phase !== 'recording') return;
        const id = setInterval(() => {
            const t = Date.now();
            setNow(t);
            if (elapsedMs(state, t) >= MAX_RECORDING_MS) stop(true);
        }, 250);
        return () => clearInterval(id);
    }, [state, stop]);

    // Página some (troca de app, tela bloqueada): pausa sozinho; na volta, o aluno escolhe continuar ou parar.
    useEffect(() => {
        const onVisibility = () => document.visibilityState === 'hidden' && pause(true);
        document.addEventListener('visibilitychange', onVisibility);
        return () => document.removeEventListener('visibilitychange', onVisibility);
    }, [pause]);

    // Desmontou (saiu do passo): libera o microfone.
    useEffect(
        () => () => {
            if (recorderRef.current && recorderRef.current.state !== 'inactive') {
                recorderRef.current.onstop = null;
                recorderRef.current.stop();
            }
            releaseDevices();
        },
        [releaseDevices],
    );

    return {
        state,
        dispatch,
        elapsed: elapsedMs(state, Math.max(now, state.segmentStart ?? 0)),
        blob,
        setBlob,
        mimeType,
        setMimeType,
        levelElRef,
        start,
        pause,
        resume,
        stop,
        reset,
    };
};
