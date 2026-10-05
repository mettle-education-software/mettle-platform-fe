'use client';

import styled from '@emotion/styled';
import { Mic, Pause, PlayArrow, Stop } from '@mui/icons-material';
import { useQueryClient } from '@tanstack/react-query';
import { useDeviceSize } from 'hooks';
import {
    sendRecording,
    uploadProblem,
    useAcceptRecordingConsent,
    useQueuedRecording,
    useRecordingPlayUrl,
} from 'hooks/melp/dedaRecording';
import { useDedaRecorder } from 'hooks/useDedaRecorder';
import {
    brasiliaDate,
    DedaRecordingsResponse,
    formatDuration,
    pickMyReading,
    spokenDuration,
    WARN_RECORDING_MS,
} from 'libs/dedaRecording';
import { idbQueue, QueuedRecording, queueKey } from 'libs/recordingQueue';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AudioPlayer as RawAudioPlayer } from 'react-audio-play';
import { RecordingConsent } from './RecordingConsent';
import { RecButton, SrOnly } from './ui';

const Bar = styled.section`
    background: #3c362f;
    color: #ffffff;
    border-radius: 0.75rem;
    padding: 1rem;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem 1.25rem;

    /* Computador: no topo do passo, como o player dos passos 1 e 4 (o texto rola dentro do cartão, sem nada por cima). */
    /* Celular, enquanto grava: preso acima da barra de navegação do DEDA. */
    &.fixed {
        position: fixed;
        left: 0;
        right: 0;
        bottom: calc(3rem + env(safe-area-inset-bottom));
        z-index: 2;
        border-radius: 0.75rem 0.75rem 0 0;
        padding: 0.75rem 1rem;
        max-height: 60vh;
        overflow-y: auto;
        box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.25);
    }

    /* Na barra fixa da página nova do DEDA: sem cartão, uma linha no computador. */
    &.docked {
        background: transparent;
        padding: 0;
        border-radius: 0;
        flex-wrap: nowrap;
    }
    &.docked .status {
        flex: 1 1 auto;
    }
    &.docked .detail {
        color: var(--r-muted);
        font-size: 0.875rem;
    }
    &.docked .error {
        color: var(--r-error);
    }
    &.docked .timer {
        font-size: 1.25rem;
    }
    &.docked .actions {
        flex: none;
    }
    @media (max-width: 860px) {
        &.docked {
            flex-wrap: wrap;
        }
        &.docked .actions {
            width: 100%;
        }
        &.docked .actions > button:not(.link) {
            flex: 1 1 auto;
            padding: 0 1rem;
        }
    }

    .status {
        flex: 1 1 14rem;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
    }

    .headline {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        font-size: 1rem;
        font-weight: 600;
        overflow-wrap: anywhere;
    }

    .timer {
        font-variant-numeric: tabular-nums;
        font-size: 1.5rem;
        font-weight: 700;
        letter-spacing: 0.02em;
    }

    .dot {
        width: 0.75rem;
        height: 0.75rem;
        border-radius: 50%;
        background: #ff5a4f;
        flex: none;
        animation: rec-blink 1.2s ease-in-out infinite;
    }

    @media (prefers-reduced-motion: reduce) {
        .dot {
            animation: none;
        }
    }

    @keyframes rec-blink {
        50% {
            opacity: 0.35;
        }
    }

    .level {
        height: 6px;
        border-radius: 3px;
        background: rgba(255, 255, 255, 0.15);
        overflow: hidden;
        max-width: 16rem;
    }

    .level > span {
        display: block;
        height: 100%;
        background: #8fd16a;
        transform-origin: left center;
        transform: scaleX(0);
        transition: transform 80ms linear;
    }

    .detail {
        color: #e8dccb;
        font-size: 0.9375rem;
        line-height: 1.4;
        margin: 0;
    }

    .error {
        color: #ffd2cc;
        font-weight: 600;
    }

    .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        align-items: center;
    }

    .player {
        width: 100%;
        max-width: 28rem;
        margin-top: 0.25rem;
    }

    @media (max-width: 480px) {
        .actions {
            width: 100%;
        }
        /* Os botões dividem a linha e quebram para a de baixo quando não cabem (nunca cortam o texto). */
        .actions > button:not(.link) {
            flex: 1 1 auto;
            padding: 0 1rem;
        }
        .player {
            max-width: none;
        }
        .timer {
            font-size: 1.25rem;
        }
    }
`;

interface Props {
    dedaId: string;
    uid: string;
    data: DedaRecordingsResponse;
    /** Passo 2 pode ser concluído: gravação salva, guardada no aparelho, já feita hoje, ou o aluno usou a saída. */
    onDone(): void;
    /** Barra fixa da página nova do DEDA (libs/dedaReader): só a apresentação muda. */
    docked?: boolean;
}

export const DedaRecorder: React.FC<Props> = ({ dedaId, uid, data, onDone, docked }) => {
    const isMobile = useDeviceSize() === 'mobile';
    const queryClient = useQueryClient();
    const rec = useDedaRecorder();
    const { state, dispatch, elapsed, blob } = rec;

    const today = brasiliaDate(new Date());
    const todayRecording = pickMyReading(data.recordings, today, true);
    const queued = useQueuedRecording(uid, dedaId, today, true);

    const [consentOpen, setConsentOpen] = useState(false);
    const consent = useAcceptRecordingConsent();
    const [skipped, setSkipped] = useState(false);
    const [rerecord, setRerecord] = useState(false);
    const [confirmReset, setConfirmReset] = useState(false);
    const [listen, setListen] = useState(false);
    const [progress, setProgress] = useState(0);
    const [storedOnDevice, setStoredOnDevice] = useState(false);
    const [copied, setCopied] = useState(false);
    const recordedOnRef = useRef(today);

    // Gravação de hoje que ficou no aparelho numa visita anterior.
    useEffect(() => {
        if (queued.data && state.phase === 'ready' && !blob) {
            rec.setBlob(queued.data.blob);
            rec.setMimeType(queued.data.mimeType);
            recordedOnRef.current = queued.data.recordedOn;
            setStoredOnDevice(true);
            dispatch({ type: 'restore', durationMs: queued.data.durationMs });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queued.data]);

    const done =
        state.phase === 'saved' ||
        (state.phase === 'queued' && storedOnDevice) ||
        skipped ||
        (!!todayRecording && !rerecord);
    useEffect(() => {
        if (done) onDone();
    }, [done, onDone]);

    // Aviso ao fechar/recarregar com gravação não salva.
    const unsaved = ['recording', 'paused', 'review', 'uploading'].includes(state.phase);
    // Celular: preso embaixo só enquanto grava (o aluno lê e precisa de Pausar/Parar à mão); fora disso fica no topo
    // do passo e não cobre o texto.
    const floating = isMobile && ['recording', 'paused'].includes(state.phase);
    useEffect(() => {
        if (!unsaved) return;
        const warn = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', warn);
        return () => window.removeEventListener('beforeunload', warn);
    }, [unsaved]);

    const blobUrl = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob]);
    useEffect(() => () => void (blobUrl && URL.revokeObjectURL(blobUrl)), [blobUrl]);

    const showingToday = !!todayRecording && !rerecord && state.phase === 'ready';
    const playUrl = useRecordingPlayUrl(showingToday && listen ? todayRecording?.id : null);

    const begin = () => {
        setListen(false);
        setSkipped(false);
        if (!data.consent.accepted) return setConsentOpen(true);
        recordedOnRef.current = brasiliaDate(new Date());
        rec.start();
    };

    const acceptConsent = () =>
        consent.mutate(undefined, {
            onSuccess: () => {
                setConsentOpen(false);
                recordedOnRef.current = brasiliaDate(new Date());
                rec.start();
            },
        });

    const save = async () => {
        if (!blob || state.accumulatedMs < 5000) return dispatch({ type: 'upload' });
        dispatch({ type: 'upload' });
        setProgress(0);
        const item: QueuedRecording = {
            key: queueKey(uid, dedaId, recordedOnRef.current),
            userUid: uid,
            dedaId,
            recordedOn: recordedOnRef.current,
            durationMs: state.accumulatedMs,
            mimeType: rec.mimeType,
            blob,
            createdAt: Date.now(),
        };
        let stored = storedOnDevice;
        if (!stored) {
            stored = await idbQueue
                .put(item)
                .then(() => true)
                .catch(() => false); // modo privado / sem IndexedDB: segue só com a cópia em memória
            setStoredOnDevice(stored);
        }
        try {
            await sendRecording(item, setProgress);
            await idbQueue.delete(item.key).catch(() => undefined);
            setStoredOnDevice(false);
            dispatch({ type: 'saved' });
            queryClient.invalidateQueries({ queryKey: ['deda-recordings', uid] });
            queryClient.invalidateQueries({ queryKey: ['deda-recording-queued', uid] });
        } catch (error) {
            const problem = uploadProblem(error);
            if (problem === 'expired') await idbQueue.delete(item.key).catch(() => undefined);
            dispatch({ type: 'queued', problem });
        }
    };

    const discard = async () => {
        await idbQueue.delete(queueKey(uid, dedaId, recordedOnRef.current)).catch(() => undefined);
        setStoredOnDevice(false);
        setConfirmReset(false);
        setRerecord(true);
        queryClient.invalidateQueries({ queryKey: ['deda-recording-queued', uid] });
        rec.reset();
    };

    const exitLink = (
        <RecButton type="button" className="link" onClick={() => setSkipped(true)}>
            I can’t record right now
        </RecButton>
    );

    const copyAddress = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
        } catch {
            setCopied(false);
        }
    };

    let headline: React.ReactNode = null;
    let detail: React.ReactNode = null;
    let isError = false;
    let actions: React.ReactNode = null;
    let announce = '';

    if (skipped) {
        headline = 'No problem. Go on with the DEDA without recording today.';
        detail = 'When you can, come back to step 2 and record your reading.';
        actions = (
            <RecButton type="button" className="ghost" onClick={() => setSkipped(false)}>
                Record anyway
            </RecButton>
        );
        announce = String(headline);
    } else if (confirmReset) {
        headline = 'Discard this recording and record again?';
        actions = (
            <>
                <RecButton type="button" className="ghost" onClick={() => setConfirmReset(false)}>
                    Cancel
                </RecButton>
                <RecButton type="button" onClick={discard}>
                    Yes, record again
                </RecButton>
            </>
        );
        announce = String(headline);
    } else {
        switch (state.phase) {
            case 'ready':
                if (state.problem === 'denied') {
                    isError = true;
                    headline = 'The Platform needs your microphone.';
                    detail = isMobile
                        ? 'Tap the icon next to the site address, allow the microphone and try again.'
                        : 'Click the lock next to the site address and allow the microphone. On Mac and Windows, also check that the system lets the browser use the microphone.';
                } else if (state.problem === 'unsupported') {
                    isError = true;
                    headline = 'This browser can’t record audio.';
                    detail = copied
                        ? 'Address copied. Paste it into Chrome or Safari.'
                        : 'Open the Platform in Chrome or Safari to record.';
                } else if (state.problem === 'nomic') {
                    isError = true;
                    headline = 'We couldn’t find a microphone.';
                    detail = 'Connect a microphone (or close any other app that’s using it) and try again.';
                } else if (showingToday && todayRecording) {
                    headline = `You recorded today · ${formatDuration(todayRecording.durationMs)}`;
                    detail = playUrl.isError ? 'We couldn’t load the audio right now.' : null;
                } else {
                    headline = 'Record yourself reading aloud';
                    detail = 'Read the text aloud while you record. You can pause at any time.';
                }
                actions = state.problem ? (
                    <>
                        {state.problem === 'unsupported' ? (
                            <RecButton type="button" className="ghost" onClick={copyAddress}>
                                Copy address
                            </RecButton>
                        ) : (
                            <RecButton type="button" onClick={begin}>
                                Try again
                            </RecButton>
                        )}
                        {exitLink}
                    </>
                ) : showingToday ? (
                    <>
                        <RecButton
                            type="button"
                            className="ghost"
                            onClick={() => setListen((v) => !v)}
                            aria-expanded={listen}
                        >
                            <PlayArrow aria-hidden /> {listen ? 'Close' : 'Listen'}
                        </RecButton>
                        <RecButton type="button" onClick={() => setRerecord(true)}>
                            <Mic aria-hidden /> Record again
                        </RecButton>
                    </>
                ) : (
                    <>
                        <RecButton type="button" className="record" onClick={begin}>
                            <Mic aria-hidden /> Record
                        </RecButton>
                        {exitLink}
                    </>
                );
                announce = isError ? '' : String(headline);
                break;
            case 'recording':
                headline = (
                    <>
                        <span className="dot" aria-hidden />
                        <span className="timer" role="timer" aria-label="Recorded time">
                            {formatDuration(elapsed)}
                        </span>
                        <span>Recording</span>
                    </>
                );
                detail =
                    elapsed >= WARN_RECORDING_MS ? (
                        <>Recording stops automatically at 20 minutes.</>
                    ) : (
                        <span className="level" aria-hidden>
                            <span ref={(el) => void (rec.levelElRef.current = el)} />
                        </span>
                    );
                actions = (
                    <>
                        <RecButton type="button" className="ghost" onClick={() => rec.pause()}>
                            <Pause aria-hidden /> Pause
                        </RecButton>
                        <RecButton type="button" onClick={() => rec.stop()}>
                            <Stop aria-hidden /> Stop
                        </RecButton>
                    </>
                );
                announce = `Recording. ${spokenDuration(Math.floor(elapsed / 60_000) * 60_000)}`;
                if (elapsed >= WARN_RECORDING_MS)
                    announce = '5 minutes left: recording stops automatically at 20 minutes.';
                break;
            case 'paused':
                headline = (
                    <>
                        <span className="timer" role="timer" aria-label="Recorded time">
                            {formatDuration(elapsed)}
                        </span>
                        <span>Paused</span>
                    </>
                );
                detail = state.problem === 'interrupted' ? 'Recording paused when you left the page.' : null;
                actions = (
                    <>
                        <RecButton type="button" className="ghost" onClick={rec.resume}>
                            <Mic aria-hidden /> Resume
                        </RecButton>
                        <RecButton type="button" onClick={() => rec.stop()}>
                            <Stop aria-hidden />{' '}
                            {state.problem === 'interrupted' ? 'Stop and keep what you recorded' : 'Stop'}
                        </RecButton>
                    </>
                );
                announce = state.problem === 'interrupted' ? 'Recording paused.' : 'Paused.';
                break;
            case 'review':
            case 'queued':
            case 'uploading': {
                const restored = state.phase === 'queued' && !state.problem;
                headline = restored
                    ? `You have an unsent recording from today (${formatDuration(state.accumulatedMs)})`
                    : state.phase === 'uploading'
                      ? `Uploading… ${Math.round(progress * 100)}%`
                      : `Your recording · ${formatDuration(state.accumulatedMs)}`;
                if (state.problem === 'tooShort') {
                    isError = true;
                    detail = 'Your recording must be at least 5 seconds long. Please record again.';
                } else if (state.problem === 'limit') {
                    detail = 'Recording stopped at 20 minutes. Listen and save it.';
                } else if (state.problem === 'interrupted') {
                    detail =
                        'Recording was interrupted (microphone disconnected). Everything you recorded up to that point is here.';
                } else if (state.problem === 'offline') {
                    isError = true;
                    detail = storedOnDevice
                        ? 'No internet connection. Your recording is saved on this device and will be uploaded when you’re back online. You can go on with the DEDA.'
                        : 'No internet connection. Don’t close this page: try again when you’re back online.';
                } else if (state.problem === 'upload') {
                    isError = true;
                    detail = storedOnDevice
                        ? 'We couldn’t upload it right now. Your recording is saved on this device.'
                        : 'We couldn’t upload it right now. Don’t close this page and try again.';
                } else if (state.problem === 'expired') {
                    isError = true;
                    detail = 'Your Imerso access has expired, so new recordings cannot be saved.';
                } else if (state.phase === 'review') {
                    detail = 'Listen before saving. If you don’t like it, record again.';
                }
                const busy = state.phase === 'uploading';
                actions =
                    state.problem === 'expired' ? (
                        exitLink
                    ) : (
                        <>
                            <RecButton
                                type="button"
                                className="ghost"
                                onClick={() => setListen((v) => !v)}
                                aria-expanded={listen}
                                disabled={busy || !blobUrl}
                            >
                                <PlayArrow aria-hidden /> {listen ? 'Close' : 'Listen'}
                            </RecButton>
                            <RecButton
                                type="button"
                                className="ghost"
                                onClick={() => setConfirmReset(true)}
                                disabled={busy}
                            >
                                <Mic aria-hidden /> {restored ? 'Discard' : 'Record again'}
                            </RecButton>
                            {state.problem !== 'tooShort' && (
                                <RecButton type="button" onClick={save} disabled={busy} aria-busy={busy}>
                                    {state.phase === 'review' ? 'Save' : restored ? 'Upload' : 'Try again'}
                                </RecButton>
                            )}
                        </>
                    );
                announce = state.phase === 'uploading' ? 'Uploading your recording.' : isError ? '' : String(headline);
                break;
            }
            case 'saved':
                headline = `Recording saved · ${formatDuration(state.accumulatedMs)}`;
                detail = 'You can move on to the next step.';
                actions = (
                    <RecButton type="button" className="ghost" onClick={() => (rec.reset(), setRerecord(true))}>
                        <Mic aria-hidden /> Record again
                    </RecButton>
                );
                announce = String(headline);
                break;
        }
    }

    const audioSrc =
        listen && !confirmReset && !skipped
            ? showingToday
                ? playUrl.data
                : ['review', 'queued'].includes(state.phase)
                  ? blobUrl
                  : null
            : null;

    return (
        <>
            <Bar className={docked ? 'docked' : floating ? 'fixed' : undefined} aria-label="Reading recorder">
                <div className="status">
                    <div className="headline">{headline}</div>
                    {detail && (
                        <p className={`detail${isError ? ' error' : ''}`} role={isError ? 'alert' : undefined}>
                            {detail}
                        </p>
                    )}
                    {audioSrc && (
                        <div className="player" role="group" aria-label="Listen to your recording">
                            <RawAudioPlayer
                                src={audioSrc}
                                width="100%"
                                sliderColor="var(--brown-bg)"
                                style={{ boxShadow: 'none', borderRadius: '0.5rem', height: '3.5rem' }}
                            />
                        </div>
                    )}
                </div>
                <div className="actions">{actions}</div>
                <SrOnly aria-live="polite">{announce}</SrOnly>
            </Bar>
            <RecordingConsent
                open={consentOpen}
                loading={consent.isPending}
                failed={consent.isError}
                onAccept={acceptConsent}
                onDecline={() => setConsentOpen(false)}
            />
        </>
    );
};
