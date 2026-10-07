'use client';

import { css, Global } from '@emotion/react';
import { RowPlayer } from 'components/_melp/_deda/DedaReader/ReaderRecordings';
import { useGetDedasList } from 'hooks';
import { useDedaRecordings } from 'hooks/melp/dedaRecording';
import { formatDuration, formatRecordedOn, spokenDuration } from 'libs/dedaRecording';
import { Play, X } from 'lucide-react';
import { useMelpContext } from 'providers';
import React, { useState } from 'react';
import { ICON } from 'themes/newDesign';

/*
 * Aba Recordings da LAMP (plataforma nova): todas as gravações do aluno, por DEDA/semana, da mais recente para trás.
 * A API só lista com ?dedaId=, então é a MESMA consulta da aba "My recordings" de cada DEDA (mesma chave), quatro
 * DEDAs por vez ("Earlier weeks") para poupar o servidor. O player é o mesmo (RowPlayer, endereço de 5 min).
 */

const styles = css`
    .lrecs .grp {
        padding: 18px 0 14px;
        border-top: 1px solid var(--r-line);
    }
    .lrecs .grp header {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 4px 16px;
        margin-bottom: 8px;
    }
    .lrecs .grp h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 400;
    }
    .lrecs .grp h3 span {
        margin-right: 8px;
        font-size: var(--r-label-size);
        letter-spacing: var(--r-label-track);
        color: var(--r-muted);
    }
    .lrecs .grp header small {
        font-size: 12.5px;
        color: var(--r-muted);
        font-variant-numeric: tabular-nums;
    }
    .lrecs .grp.empty {
        padding: 12px 0;
    }
    .lrecs .grp.empty header {
        margin: 0;
    }
    .lrecs ul {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 8px 16px;
        margin: 0;
        padding: 0;
        list-style: none;
    }
    .lrecs li {
        display: flex;
        align-items: center;
        gap: 8px;
        min-height: 52px;
        min-width: 0;
    }
    .lrecs .play {
        display: flex;
        align-items: center;
        gap: 12px;
        flex: 1;
        min-width: 0;
        min-height: 48px;
        padding: 6px 12px 6px 6px;
        border: 1px solid var(--r-line);
        border-radius: 999px;
        background: none;
        color: var(--r-text);
        font: inherit;
        text-align: left;
        cursor: pointer;
    }
    .lrecs .play:hover {
        border-color: var(--r-gold);
    }
    .lrecs .play i {
        display: grid;
        place-items: center;
        flex: none;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: var(--r-gold-tint);
        color: var(--r-gold-hi);
    }
    .lrecs .play span {
        flex: 1;
        min-width: 0;
        font-size: 14px;
    }
    .lrecs .play small {
        font-size: 13px;
        color: var(--r-muted);
        font-variant-numeric: tabular-nums;
    }
    .lrecs li .msg {
        flex: 1;
        font-size: 13px;
        color: var(--r-muted);
    }
    .lrecs li > div {
        flex: 1;
        min-width: 0;
    }
    .lrecs .more {
        margin-top: 16px;
    }
`;

const Group: React.FC<{ dedaId: string; week: number; title: string; first: boolean }> = ({
    dedaId,
    week,
    title,
    first,
}) => {
    const recs = useDedaRecordings(dedaId);
    const [playing, setPlaying] = useState<string | null>(null);
    if (recs.data?.enabled === false)
        return first ? <p className="hint">Recordings aren&rsquo;t available for your account yet.</p> : null;
    const list = recs.data?.recordings ?? [];
    const total = list.reduce((t, r) => t + (r.durationMs || 0), 0);
    const head = (
        <header>
            <h3>
                <span>W{String(week).padStart(2, '0')}</span>
                {title}
            </h3>
            <small>
                {recs.isLoading
                    ? 'Loading…'
                    : list.length
                      ? `${list.length} of 7 days · ${formatDuration(total)}`
                      : 'No recordings'}
            </small>
        </header>
    );
    if (!list.length) return <section className="grp empty">{head}</section>;
    return (
        <section className="grp" aria-label={`Week ${week}, ${title}`}>
            {head}
            <ul>
                {[...list]
                    .sort((a, b) => a.weekDay.localeCompare(b.weekDay))
                    .map((r) => (
                        <li key={r.id}>
                            {playing === r.id ? (
                                <>
                                    <div>
                                        <RowPlayer key={r.id} recording={r} />
                                    </div>
                                    <button
                                        type="button"
                                        className="ib"
                                        aria-label="Close the player"
                                        onClick={() => setPlaying(null)}
                                    >
                                        <X {...ICON} size={18} aria-hidden />
                                    </button>
                                </>
                            ) : (
                                <button
                                    type="button"
                                    className="play"
                                    aria-label={`Play day ${r.weekDay.replace('day', '')}, ${spokenDuration(r.durationMs)}`}
                                    onClick={() => setPlaying(r.id)}
                                >
                                    <i>
                                        <Play {...ICON} size={16} aria-hidden />
                                    </i>
                                    <span>
                                        Day {r.weekDay.replace('day', '')} · {formatRecordedOn(r.recordedOn)}
                                    </span>
                                    <small>{formatDuration(r.durationMs)}</small>
                                </button>
                            )}
                        </li>
                    ))}
            </ul>
        </section>
    );
};

export const LampRecordings: React.FC = () => {
    const { melpSummary } = useMelpContext();
    const { dedasList } = useGetDedasList();
    const [shown, setShown] = useState(4);
    const current = melpSummary?.current_deda_week ?? 0;
    const unlocked = melpSummary?.unlocked_dedas ?? [];
    const weeks = Array.from({ length: Math.min(shown, current) }, (_, i) => current - i).filter((w) => unlocked[w]);
    return (
        <div className="panel lrecs" role="tabpanel">
            <Global styles={styles} />
            <div className="sh">
                <h2>Your recordings</h2>
            </div>
            <p className="hint" style={{ margin: '-8px 0 16px' }}>
                Every reading you recorded in step 2, week by week. Listen back to hear how far you&rsquo;ve come.
            </p>
            {weeks.map((w) => (
                <Group
                    key={w}
                    dedaId={unlocked[w]}
                    week={w}
                    first={w === current}
                    title={dedasList[w - 1]?.label.replace(/^W\d+\s*\|\s*/, '') ?? unlocked[w]}
                />
            ))}
            {shown < current && (
                <button type="button" className="btn line more" onClick={() => setShown((n) => n + 4)}>
                    Earlier weeks
                </button>
            )}
        </div>
    );
};
