'use client';

import { AudioPlayer } from 'components';
import { useDedaRecordings, useHideRecording, useRecordingPlayUrl } from 'hooks/melp/dedaRecording';
import {
    computeIndicators,
    DedaRecording,
    formatDelta,
    formatDuration,
    formatRecordedOn,
    spokenDuration,
} from 'libs/dedaRecording';
import { Play, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { ICON } from './readerStyles';

/** A linha do dia tocando: o mesmo player dos passos 2 e 4, no lugar do conteúdo da linha. */
const RowPlayer = ({ recording }: { recording: DedaRecording }) => {
    const playUrl = useRecordingPlayUrl(recording.id);
    const retried = useRef(false);
    if (playUrl.isError)
        return (
            <p className="msg" role="alert">
                We couldn’t load this recording right now.
            </p>
        );
    if (!playUrl.data) return <p className="msg">Loading…</p>;
    return (
        <AudioPlayer
            compact
            // o toque que abriu a linha já pediu para tocar
            autoPlay
            audioURL={playUrl.data}
            onError={() => {
                // O endereço vale 5 minutos: pede outro uma vez.
                if (!retried.current) {
                    retried.current = true;
                    playUrl.refetch();
                }
            }}
        />
    );
};

/**
 * Aba "My recordings" da página nova: os mesmos dados e as mesmas chamadas de DedaRecorder/MyRecordings (lista,
 * endereço de reprodução, "Remove"); muda a apresentação — a linha do dia vira o player, um áudio por vez.
 */
export const ReaderRecordings = ({ dedaId }: { dedaId: string }) => {
    const recordings = useDedaRecordings(dedaId);
    const [playing, setPlaying] = useState<string | null>(null);
    // "Remove": a confirmação acontece na própria linha (nada de caixa por cima); Esc cancela.
    const [removing, setRemoving] = useState<string | null>(null);
    useEffect(() => {
        if (!removing) return;
        const escape = (event: KeyboardEvent) => event.key === 'Escape' && setRemoving(null);
        document.addEventListener('keydown', escape);
        return () => document.removeEventListener('keydown', escape);
    }, [removing]);
    const hide = useHideRecording();
    const ind = computeIndicators(recordings.data?.recordings ?? []);
    const longest = Math.max(1, ...ind.days.map((d) => d?.durationMs ?? 0));

    if (recordings.isLoading) return <p className="hint recs">Loading…</p>;

    return (
        <div className="recs">
            <section aria-labelledby="rec-summary">
                <h2 id="rec-summary">Your week in this DEDA</h2>
                <dl className="stats">
                    <div>
                        <dt>Days recorded</dt>
                        <dd>{ind.recordedDays} of 7</dd>
                    </div>
                    <div>
                        <dt>First → last</dt>
                        <dd>
                            {ind.deltaMs === null || !ind.first || !ind.last ? '—' : formatDelta(ind.deltaMs)}
                            <small>
                                {ind.deltaMs === null || !ind.first || !ind.last
                                    ? 'Needs 2 days'
                                    : `${formatDuration(ind.first.durationMs)} → ${formatDuration(ind.last.durationMs)}`}
                            </small>
                        </dd>
                    </div>
                    <div>
                        <dt>Total time</dt>
                        <dd>{formatDuration(ind.totalMs)}</dd>
                    </div>
                </dl>
                <ol className="bars" aria-label="Reading time per day">
                    {ind.days.map((d, i) => (
                        <li key={i}>
                            <span
                                className={`bar${d ? '' : ' none'}`}
                                style={{
                                    height: d
                                        ? `${Math.max(6, Math.round((d.durationMs / longest) * 100))}%`
                                        : undefined,
                                }}
                                aria-hidden
                            />
                            <span
                                aria-label={
                                    d ? `Day ${i + 1}: ${spokenDuration(d.durationMs)}` : `Day ${i + 1}: no recording`
                                }
                            >
                                D{i + 1}
                            </span>
                        </li>
                    ))}
                </ol>
            </section>
            <section aria-labelledby="rec-days">
                <h2 id="rec-days">Recordings</h2>
                <ul className="list">
                    {ind.days.map((d, i) =>
                        !d ? (
                            <li key={i} className="row none">
                                <b>Day {i + 1}</b>
                                <span>No recording</span>
                            </li>
                        ) : d.id === playing ? (
                            <li key={i} className="row rowp" aria-label={`Day ${i + 1}, playing`}>
                                <RowPlayer key={d.id} recording={d} />
                                <button
                                    type="button"
                                    className="ib"
                                    aria-label={`Close the player of Day ${i + 1}`}
                                    onClick={() => setPlaying(null)}
                                >
                                    <X {...ICON} size={18} aria-hidden />
                                </button>
                            </li>
                        ) : d.id === removing ? (
                            <li key={i} className="row rowc" role="group" aria-label={`Remove Day ${i + 1}?`}>
                                <span className="ask">
                                    <b>Remove Day {i + 1}?</b>
                                    <span>It leaves your list and the player.</span>
                                </span>
                                <button type="button" className="btn ghost" autoFocus onClick={() => setRemoving(null)}>
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn line danger"
                                    disabled={hide.isPending}
                                    onClick={() => hide.mutate(d.id, { onSettled: () => setRemoving(null) })}
                                >
                                    Remove
                                </button>
                            </li>
                        ) : (
                            <li key={i} className="row">
                                <button
                                    type="button"
                                    className="play"
                                    aria-label={`Play Day ${i + 1}, ${spokenDuration(d.durationMs)}`}
                                    onClick={() => setPlaying(d.id)}
                                >
                                    <i>
                                        <Play {...ICON} size={16} aria-hidden />
                                    </i>
                                    <span className="day">
                                        <b>Day {i + 1}</b>
                                        <span>{formatRecordedOn(d.recordedOn)}</span>
                                    </span>
                                    <span className="duration">{formatDuration(d.durationMs)}</span>
                                </button>
                                <button
                                    type="button"
                                    className="lnk"
                                    disabled={hide.isPending}
                                    aria-label={`Remove Day ${i + 1}`}
                                    onClick={() => setRemoving(d.id)}
                                >
                                    Remove
                                </button>
                            </li>
                        ),
                    )}
                </ul>
            </section>
        </div>
    );
};
