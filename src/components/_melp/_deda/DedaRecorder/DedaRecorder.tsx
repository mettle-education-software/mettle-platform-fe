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
    box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.25);

    /* Computador: preso na base da área visível enquanto o aluno lê o cartão. */
    &.sticky {
        position: sticky;
        bottom: 1rem;
        z-index: 2;
    }

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

    audio {
        width: 100%;
        max-width: 28rem;
        height: 44px;
    }

    @media (max-width: 480px) {
        .actions {
            width: 100%;
        }
        .actions > button:not(.link) {
            flex: 1 1 0;
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
}

export const DedaRecorder: React.FC<Props> = ({ dedaId, uid, data, onDone }) => {
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
            Não consigo gravar agora
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
        headline = 'Tudo bem, siga o DEDA sem gravar hoje.';
        detail = 'Quando puder, volte ao passo 2 e grave a sua leitura.';
        actions = (
            <RecButton type="button" className="ghost" onClick={() => setSkipped(false)}>
                Gravar mesmo assim
            </RecButton>
        );
        announce = String(headline);
    } else if (confirmReset) {
        headline = 'Descartar esta gravação e gravar de novo?';
        actions = (
            <>
                <RecButton type="button" className="ghost" onClick={() => setConfirmReset(false)}>
                    Cancelar
                </RecButton>
                <RecButton type="button" onClick={discard}>
                    Sim, regravar
                </RecButton>
            </>
        );
        announce = String(headline);
    } else {
        switch (state.phase) {
            case 'ready':
                if (state.problem === 'denied') {
                    isError = true;
                    headline = 'A Plataforma precisa do microfone.';
                    detail = isMobile
                        ? 'Toque no ícone ao lado do endereço do site, permita o microfone e tente de novo.'
                        : 'Clique no cadeado ao lado do endereço do site e permita o microfone. No Mac e no Windows, confira também se o sistema libera o microfone para o navegador.';
                } else if (state.problem === 'unsupported') {
                    isError = true;
                    headline = 'Este navegador não grava áudio.';
                    detail = copied
                        ? 'Endereço copiado. Cole no Chrome ou no Safari.'
                        : 'Abra a Plataforma no Chrome ou no Safari para gravar.';
                } else if (state.problem === 'nomic') {
                    isError = true;
                    headline = 'Não encontramos um microfone.';
                    detail = 'Conecte um microfone (ou feche outro aplicativo que esteja usando) e tente de novo.';
                } else if (showingToday && todayRecording) {
                    headline = `Você já gravou hoje · ${formatDuration(todayRecording.durationMs)}`;
                    detail = playUrl.isError ? 'Não deu para carregar o áudio agora.' : null;
                } else {
                    headline = 'Grave a sua leitura em voz alta';
                    detail = 'Leia o texto em voz alta enquanto grava. Você pode pausar quando quiser.';
                }
                actions = state.problem ? (
                    <>
                        {state.problem === 'unsupported' ? (
                            <RecButton type="button" className="ghost" onClick={copyAddress}>
                                Copiar endereço
                            </RecButton>
                        ) : (
                            <RecButton type="button" onClick={begin}>
                                Tentar de novo
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
                            <PlayArrow aria-hidden /> {listen ? 'Fechar' : 'Ouvir'}
                        </RecButton>
                        <RecButton type="button" onClick={() => setRerecord(true)}>
                            <Mic aria-hidden /> Regravar
                        </RecButton>
                    </>
                ) : (
                    <>
                        <RecButton type="button" className="record" onClick={begin}>
                            <Mic aria-hidden /> Gravar
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
                        <span className="timer" role="timer" aria-label="Tempo gravado">
                            {formatDuration(elapsed)}
                        </span>
                        <span>Gravando</span>
                    </>
                );
                detail =
                    elapsed >= WARN_RECORDING_MS ? (
                        <>A gravação para sozinha aos 20 minutos.</>
                    ) : (
                        <span className="level" aria-hidden>
                            <span ref={(el) => void (rec.levelElRef.current = el)} />
                        </span>
                    );
                actions = (
                    <>
                        <RecButton type="button" className="ghost" onClick={() => rec.pause()}>
                            <Pause aria-hidden /> Pausar
                        </RecButton>
                        <RecButton type="button" onClick={() => rec.stop()}>
                            <Stop aria-hidden /> Parar
                        </RecButton>
                    </>
                );
                announce = `Gravando. ${spokenDuration(Math.floor(elapsed / 60_000) * 60_000)}`;
                if (elapsed >= WARN_RECORDING_MS)
                    announce = 'Faltam 5 minutos: a gravação para sozinha aos 20 minutos.';
                break;
            case 'paused':
                headline = (
                    <>
                        <span className="timer" role="timer" aria-label="Tempo gravado">
                            {formatDuration(elapsed)}
                        </span>
                        <span>Pausado</span>
                    </>
                );
                detail = state.problem === 'interrupted' ? 'A gravação foi pausada quando você saiu da página.' : null;
                actions = (
                    <>
                        <RecButton type="button" className="ghost" onClick={rec.resume}>
                            <Mic aria-hidden /> Continuar
                        </RecButton>
                        <RecButton type="button" onClick={() => rec.stop()}>
                            <Stop aria-hidden />{' '}
                            {state.problem === 'interrupted' ? 'Parar e salvar o que gravou' : 'Parar'}
                        </RecButton>
                    </>
                );
                announce = state.problem === 'interrupted' ? 'Gravação pausada.' : 'Pausado.';
                break;
            case 'review':
            case 'queued':
            case 'uploading': {
                const restored = state.phase === 'queued' && !state.problem;
                headline = restored
                    ? `Você tem uma gravação de hoje não enviada (${formatDuration(state.accumulatedMs)})`
                    : state.phase === 'uploading'
                      ? `Enviando… ${Math.round(progress * 100)}%`
                      : `Gravação de ${formatDuration(state.accumulatedMs)}`;
                if (state.problem === 'tooShort') {
                    isError = true;
                    detail = 'A gravação precisa ter pelo menos 5 segundos. Regrave a sua leitura.';
                } else if (state.problem === 'limit') {
                    detail = 'A gravação parou aos 20 minutos. Ouça e salve.';
                } else if (state.problem === 'interrupted') {
                    detail =
                        'A gravação foi interrompida (microfone desconectado). O que você gravou até ali está aqui.';
                } else if (state.problem === 'offline') {
                    isError = true;
                    detail = storedOnDevice
                        ? 'Sem internet. Sua gravação está guardada neste aparelho e será enviada quando a conexão voltar. Você pode seguir o DEDA.'
                        : 'Sem internet. Não feche esta página: tente de novo quando a conexão voltar.';
                } else if (state.problem === 'upload') {
                    isError = true;
                    detail = storedOnDevice
                        ? 'Não deu para enviar agora. Sua gravação está guardada neste aparelho.'
                        : 'Não deu para enviar agora. Não feche esta página e tente de novo.';
                } else if (state.problem === 'expired') {
                    isError = true;
                    detail = 'Seu acesso ao Imerso venceu, então não é possível salvar novas gravações.';
                } else if (state.phase === 'review') {
                    detail = 'Ouça antes de salvar. Se não gostar, regrave.';
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
                                <PlayArrow aria-hidden /> {listen ? 'Fechar' : 'Ouvir'}
                            </RecButton>
                            <RecButton
                                type="button"
                                className="ghost"
                                onClick={() => setConfirmReset(true)}
                                disabled={busy}
                            >
                                <Mic aria-hidden /> {restored ? 'Descartar' : 'Regravar'}
                            </RecButton>
                            {state.problem !== 'tooShort' && (
                                <RecButton type="button" onClick={save} disabled={busy} aria-busy={busy}>
                                    {state.phase === 'review' ? 'Salvar' : restored ? 'Enviar' : 'Tentar de novo'}
                                </RecButton>
                            )}
                        </>
                    );
                announce = state.phase === 'uploading' ? 'Enviando a gravação.' : isError ? '' : String(headline);
                break;
            }
            case 'saved':
                headline = `Gravação salva · ${formatDuration(state.accumulatedMs)}`;
                detail = 'Pode seguir para o próximo passo.';
                actions = (
                    <RecButton type="button" className="ghost" onClick={() => (rec.reset(), setRerecord(true))}>
                        <Mic aria-hidden /> Regravar
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
            <Bar className={isMobile ? 'fixed' : 'sticky'} aria-label="Gravador da leitura">
                <div className="status">
                    <div className="headline">{headline}</div>
                    {detail && (
                        <p className={`detail${isError ? ' error' : ''}`} role={isError ? 'alert' : undefined}>
                            {detail}
                        </p>
                    )}
                    {audioSrc && <audio controls src={audioSrc} aria-label="Ouvir a sua gravação" />}
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
