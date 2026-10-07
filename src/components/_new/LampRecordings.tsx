'use client';

import { css, Global } from '@emotion/react';
import { AudioPlayer } from 'components';
import { useDedasGrid } from 'components/_melp/_deda/DedasGrid/DedasGrid';
import { useDedaRecordings, useRecordingPlayUrl } from 'hooks/melp/dedaRecording';
import { dedaPath } from 'libs/cleanUrls';
import { IMAGE_MIRROR_HOSTS } from 'libs/contentImage';
import { contentfulImage } from 'libs/dedaHeader';
import { DedaRecording, formatDuration, formatRecordedOn, spokenDuration } from 'libs/dedaRecording';
import { WEEK_DAYS } from 'libs/newDesign';
import { ChevronDown, Play, SkipBack, SkipForward, X } from 'lucide-react';
import Link from 'next/link';
import { useMelpContext } from 'providers';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ICON } from 'themes/newDesign';

/*
 * Aba Recordings da LAMP (plataforma nova): um acordeão por semana (DEDA), do mais recente para trás, que aguenta de
 * poucas gravações a 156 semanas × 7. A API só lista com ?dedaId= (todas as voltas daquele DEDA de uma vez), então é
 * uma consulta por DEDA, a MESMA da aba "My recordings" (mesma chave), carregada aos poucos conforme a rolagem. Um só
 * player fixo embaixo; quando o mesmo DEDA tem gravações em mais de uma volta, "Hear your progress" toca a primeira e
 * depois a mais recente. Miniaturas só pelo espelho de imagens (/ctfimg), pequenas e preguiçosas.
 */

const styles = css`
    .lrec .tools {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 10px 16px;
        margin: -8px 0 18px;
    }
    .lrec .find {
        width: min(280px, 100%);
        height: 40px;
        padding: 0 14px;
        border: 1px solid var(--r-line-strong);
        border-radius: 999px;
        background: transparent;
        color: var(--r-text);
        font: inherit;
        font-size: 16px;
    }
    .lrec .find::placeholder {
        color: var(--r-muted);
        opacity: 1;
    }
    .lrec .weeks {
        margin: 0;
        padding: 0;
        list-style: none;
        border-top: 1px solid var(--r-line);
    }
    .lrec .wk {
        border-bottom: 1px solid var(--r-line);
    }
    .lrec .wh {
        display: grid;
        grid-template-columns: 64px minmax(0, 1fr) auto 20px;
        align-items: center;
        gap: 14px;
        width: 100%;
        min-height: 56px;
        padding: 10px 2px;
        border: 0;
        background: none;
        color: var(--r-text);
        font: inherit;
        text-align: left;
        cursor: pointer;
    }
    .lrec .wh:hover .t b {
        color: var(--r-gold-hi);
    }
    .lrec .th {
        width: 64px;
        height: 36px;
        border-radius: 6px;
        background: var(--r-track);
        object-fit: cover;
    }
    .lrec .t {
        min-width: 0;
        font-size: 14.5px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .lrec .t small {
        margin-right: 8px;
        font-size: var(--r-label-size);
        letter-spacing: var(--r-label-track);
        color: var(--r-muted);
    }
    .lrec .t b {
        font-weight: 400;
    }
    .lrec .kpi {
        display: flex;
        align-items: center;
        gap: 14px;
        font-size: 12.5px;
        color: var(--r-muted);
        font-variant-numeric: tabular-nums;
    }
    .lrec .d7 {
        display: flex;
        gap: 3px;
    }
    .lrec .d7 i {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--r-track);
    }
    .lrec .d7 i.on {
        background: var(--r-gold);
    }
    .lrec .chev {
        color: var(--r-muted);
        transition: transform 200ms ease;
    }
    .lrec .wk.open .chev {
        transform: rotate(180deg);
    }
    /* painel: abre com suavidade (0fr → 1fr) */
    .lrec .wp {
        display: grid;
        grid-template-rows: 0fr;
        transition: grid-template-rows 220ms ease;
    }
    .lrec .wk.open .wp {
        grid-template-rows: 1fr;
    }
    .lrec .wp > div {
        overflow: hidden;
    }
    .lrec .recs {
        margin: 0 0 12px 78px;
        padding: 0;
        list-style: none;
    }
    .lrec .recs button {
        display: grid;
        grid-template-columns: 28px minmax(0, 1fr) auto;
        align-items: center;
        gap: 10px;
        width: 100%;
        min-height: 44px;
        padding: 0 4px;
        border: 0;
        border-top: 1px solid var(--r-line);
        background: none;
        color: var(--r-text);
        font: inherit;
        font-size: 14px;
        text-align: left;
        cursor: pointer;
    }
    .lrec .recs button:hover,
    .lrec .recs button.now {
        color: var(--r-gold-hi);
    }
    .lrec .recs .pi {
        display: grid;
        place-items: center;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: var(--r-gold-tint);
        color: var(--r-gold-hi);
    }
    .lrec .recs small {
        font-size: 13px;
        color: var(--r-muted);
        font-variant-numeric: tabular-nums;
    }
    .lrec .cmp {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 6px 14px;
        margin: 0 0 14px 78px;
        padding: 10px 14px;
        border-radius: 10px;
        background: var(--r-gold-tint);
        font-size: 13.5px;
        color: var(--r-text);
    }
    .lrec .cmp .btn {
        min-height: 36px;
        padding: 0 14px;
        font-size: 13px;
    }
    .lrec .kpi .sk {
        display: block;
        width: 150px;
        height: 10px;
        border-radius: 5px;
        background: var(--r-track);
        opacity: 0.7;
    }
    .lrec .recs .none {
        display: grid;
        grid-template-columns: 28px minmax(0, 1fr) auto;
        align-items: center;
        gap: 10px;
        min-height: 40px;
        margin: 0;
        padding: 0 4px;
        border-top: 1px solid var(--r-line);
        font-size: 14px;
        color: var(--r-muted);
    }
    .lrec .recs .none span {
        grid-column: 2;
    }
    .lrec .gap {
        padding: 12px 2px;
        border-bottom: 1px solid var(--r-line);
        font-size: 12.5px;
        color: var(--r-muted);
    }
    .lrec .more {
        height: 1px;
    }
    .lrec .empty {
        margin: 8px 0;
        font-size: 14.5px;
        color: var(--r-muted);
    }
    /* o player: um só, fixo embaixo */
    .lrec .player {
        position: sticky;
        bottom: 0;
        z-index: 3;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: 6px 16px;
        margin-top: 20px;
        padding: 12px 16px;
        border: 1px solid var(--r-line);
        border-radius: 14px;
        background: var(--r-surf);
        box-shadow: 0 -6px 24px var(--r-card-shadow);
    }
    .lrec .player .who {
        min-width: 0;
        font-size: 13.5px;
    }
    .lrec .player .who b {
        font-weight: 500;
    }
    .lrec .player .who span {
        color: var(--r-muted);
    }
    .lrec .player .ctl {
        display: flex;
        gap: 2px;
    }
    .lrec .player .ap {
        grid-column: 1 / -1;
        min-width: 0;
    }
    @media (max-width: 760px) {
        .lrec .wh {
            grid-template-columns: 48px minmax(0, 1fr) 20px;
            gap: 10px;
        }
        .lrec .th {
            width: 48px;
            height: 27px;
        }
        .lrec .kpi {
            grid-column: 2 / 3;
            margin-top: -6px;
        }
        .lrec .chev {
            grid-row: 1;
            grid-column: 3;
        }
        .lrec .recs,
        .lrec .cmp {
            margin-left: 0;
        }
    }
`;

type Week = { week: number; dedaId: string; title: string; slug?: string; image?: string };
type Rec = DedaRecording & { title: string };

/** Miniatura só do espelho (/ctfimg): nunca direto do Contentful. Pequena (128×72 para 2×) e preguiçosa. */
const thumbOf = (raw?: string) => {
    const src = contentfulImage(raw, { w: 128, h: 72, fit: 'fill', fm: 'webp', q: 60 });
    try {
        return src && IMAGE_MIRROR_HOSTS.includes(new URL(src).hostname) ? src : undefined;
    } catch {
        return undefined;
    }
};

const Player: React.FC<{
    rec: Rec;
    onPrev?: () => void;
    onNext?: () => void;
    onEnd(): void;
    onClose(): void;
}> = ({ rec, onPrev, onNext, onEnd, onClose }) => {
    const url = useRecordingPlayUrl(rec.id);
    const retried = useRef(false);
    return (
        <div className="player" role="region" aria-label="Now playing">
            <p className="who">
                <b>{rec.title}</b>{' '}
                <span>
                    · W{Number(rec.week.replace('week', ''))} · Day {rec.weekDay.replace('day', '')} ·{' '}
                    {formatRecordedOn(rec.recordedOn)}
                </span>
            </p>
            <span className="ctl">
                <button
                    type="button"
                    className="ib"
                    aria-label="Previous recording"
                    disabled={!onPrev}
                    onClick={onPrev}
                >
                    <SkipBack {...ICON} size={18} />
                </button>
                <button type="button" className="ib" aria-label="Next recording" disabled={!onNext} onClick={onNext}>
                    <SkipForward {...ICON} size={18} />
                </button>
                <button type="button" className="ib" aria-label="Close the player" onClick={onClose}>
                    <X {...ICON} size={18} />
                </button>
            </span>
            <div className="ap">
                {url.isError ? (
                    <p className="hint">We couldn&rsquo;t load this recording right now.</p>
                ) : !url.data ? (
                    <p className="hint">Loading…</p>
                ) : (
                    <AudioPlayer
                        key={rec.id}
                        compact
                        autoPlay
                        audioURL={url.data}
                        onEnd={onEnd}
                        onError={() => {
                            // o endereço vale 5 minutos: pede outro uma vez
                            if (!retried.current) {
                                retried.current = true;
                                url.refetch();
                            }
                        }}
                    />
                )}
            </div>
        </div>
    );
};

/** Uma semana do gotejamento do aluno: cabeçalho sempre presente; os números chegam quando a linha fica perto da tela. */
const WeekRow: React.FC<{
    w: Week;
    open: boolean;
    onToggle(): void;
    onRecs(week: number, recs: Rec[]): void;
    playing?: string;
    play(rec: Rec, queue?: Rec[]): void;
}> = ({ w, open, onToggle, onRecs, playing, play }) => {
    // só pede as gravações quando a linha chega perto da tela (o cabeçalho já está lá desde o começo)
    const ref = useRef<HTMLLIElement>(null);
    const [near, setNear] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el || near) return;
        const io = new IntersectionObserver((es) => es.some((e) => e.isIntersecting) && setNear(true), {
            rootMargin: '600px',
        });
        io.observe(el);
        return () => io.disconnect();
    }, [near]);
    const q = useDedaRecordings(w.dedaId, near);
    const all = useMemo(() => (q.data?.recordings ?? []).map((r) => ({ ...r, title: w.title })), [q.data, w.title]);
    // uma gravação por dia (a última tomada): se vier mais de uma, fica a mais recente
    const byDay = new Map<string, Rec>();
    all.filter((r) => r.week === `week${w.week}`)
        .sort((a, b) => (a.createdAt ?? a.recordedOn).localeCompare(b.createdAt ?? b.recordedOn))
        .forEach((r) => byDay.set(r.weekDay, r));
    const mine = [...byDay.values()].sort((a, b) => a.weekDay.localeCompare(b.weekDay));
    const known = !!q.data || q.isError;
    useEffect(() => {
        if (known) onRecs(w.week, mine);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [known, q.data, w.week]);
    // mesmo DEDA em mais de uma volta: a primeira gravação de todas e a mais recente
    const weeksWith = new Set(all.map((r) => r.week));
    const sorted = [...all].sort((a, b) => a.recordedOn.localeCompare(b.recordedOn));
    const first = sorted[0];
    const latest = sorted[sorted.length - 1];
    const compare = weeksWith.size > 1 && first && latest && first.id !== latest.id;
    const total = mine.reduce((t, r) => t + (r.durationMs || 0), 0);
    const thumb = thumbOf(w.image);
    const wn = (r: Rec) => `W${Number(r.week.replace('week', ''))}`;
    const has = mine.length > 0;
    return (
        <li ref={ref} className={`wk${open && has ? ' open' : ''}`}>
            <button type="button" className="wh" aria-expanded={open && has} disabled={!has} onClick={onToggle}>
                {/* eslint-disable-next-line @next/next/no-img-element -- miniatura do espelho, pequena */}
                {thumb ? <img className="th" src={thumb} alt="" loading="lazy" /> : <span className="th" />}
                <span className="t">
                    <small>W{String(w.week).padStart(2, '0')}</small>
                    <b>{w.title}</b>
                </span>
                <span className="kpi">
                    {!known ? (
                        <span className="sk" aria-label="Loading" />
                    ) : has ? (
                        <>
                            <span>
                                {mine.length} of 7 days · {formatDuration(total)}
                            </span>
                            <span className="d7" aria-hidden>
                                {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                                    <i key={d} className={byDay.has(`day${d}`) ? 'on' : undefined} />
                                ))}
                            </span>
                        </>
                    ) : (
                        <span>No recordings</span>
                    )}
                </span>
                <ChevronDown {...ICON} size={18} className="chev" aria-hidden />
            </button>
            {has && (
                <div className="wp">
                    <div>
                        {compare && (
                            <p className="cmp">
                                Hear your progress: {wn(first)} vs {wn(latest)}
                                <button type="button" className="btn gold" onClick={() => play(first, [first, latest])}>
                                    <Play {...ICON} size={14} aria-hidden /> First, then latest
                                </button>
                            </p>
                        )}
                        <ul className="recs">
                            {[1, 2, 3, 4, 5, 6, 7].map((d) => {
                                const r = byDay.get(`day${d}`);
                                const wd = WEEK_DAYS[d - 1].label;
                                return (
                                    <li key={d}>
                                        {r ? (
                                            <button
                                                type="button"
                                                className={playing === r.id ? 'now' : undefined}
                                                aria-label={`Play day ${d}, ${spokenDuration(r.durationMs)}`}
                                                onClick={() => play(r)}
                                            >
                                                <span className="pi">
                                                    <Play {...ICON} size={14} aria-hidden />
                                                </span>
                                                <span>
                                                    Day {d} · {formatRecordedOn(r.recordedOn)}
                                                </span>
                                                <small>{formatDuration(r.durationMs)}</small>
                                            </button>
                                        ) : (
                                            <p className="none">
                                                <span>
                                                    Day {d} · {wd}
                                                </span>
                                                <small>—</small>
                                            </p>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            )}
        </li>
    );
};

export const LampRecordings: React.FC = () => {
    const { melpSummary } = useMelpContext();
    // a MESMA lista da página de DEDAs: o gotejamento do aluno (unlocked_dedas na ordem, já com pausa e reinício),
    // bloqueada como lá (suspenso ou nos 2 primeiros dias), semana = semana atual − posição a partir do mais recente
    const blockedDEDAs = melpSummary?.melp_status === 'MELP_SUSPENDED' || melpSummary?.days_since_melp_start < 2;
    const grid = useDedasGrid('allDedas', blockedDEDAs);
    const current = (grid.currentWeek as number) ?? 0;
    const byId = useMemo(() => new Map((grid.allDedas ?? []).map((d) => [d.dedaId, d])), [grid.allDedas]);
    const allWeeks: Week[] = useMemo(
        () =>
            grid.unlockedDEDAs
                .slice()
                .reverse()
                .map((id, index) => {
                    const deda = byId.get(id);
                    return {
                        week: current - index,
                        dedaId: id,
                        title: deda?.dedaTitle ?? id,
                        slug: deda?.dedaSlug,
                        image: deda?.dedaFeaturedImage?.url,
                    };
                }),
        [grid.unlockedDEDAs, current, byId],
    );
    const [find, setFind] = useState('');
    const [open, setOpen] = useState<Record<number, boolean>>({});
    const [recs, setRecs] = useState<Record<number, Rec[]>>({});
    const [queue, setQueue] = useState<Rec[]>([]);
    const [now, setNow] = useState<Rec>();

    const term = find.trim().toLowerCase();
    const weeks = term ? allWeeks.filter((w) => w.title.toLowerCase().includes(term)) : allWeeks;

    const onRecs = (week: number, mine: Rec[]) =>
        setRecs((r) => (r[week]?.length === mine.length ? r : { ...r, [week]: mine }));
    // a semana mais recente com gravações abre sozinha (uma vez), quando as mais novas já se sabe que estão vazias
    const autoOpened = useRef(false);
    useEffect(() => {
        if (autoOpened.current) return;
        for (const w of allWeeks) {
            const known = recs[w.week];
            if (known === undefined) return;
            if (known.length) {
                autoOpened.current = true;
                setOpen((o) => ({ ...o, [w.week]: true }));
                return;
            }
        }
    }, [recs, allWeeks]);

    // ordem do player: as gravações conhecidas, da semana mais recente para trás, dia a dia
    const flat = useMemo(() => allWeeks.flatMap((w) => recs[w.week] ?? []), [allWeeks, recs]);
    const play = (rec: Rec, q: Rec[] = []) => {
        setQueue(q.slice(1));
        setNow(rec);
    };
    const at = now ? flat.findIndex((r) => r.id === now.id) : -1;

    const known = allWeeks.filter((w) => recs[w.week] !== undefined);
    const none = allWeeks.length > 0 && known.length === allWeeks.length && known.every((w) => !recs[w.week].length);
    const today = allWeeks[0];

    return (
        <div className="panel lrec" role="tabpanel">
            <Global styles={styles} />
            <div className="sh">
                <h2>Your recordings</h2>
            </div>
            <div className="tools">
                <p className="hint">
                    {none ? (
                        <>
                            Your readings from step 2 will appear here, week by week.{' '}
                            {today?.slug && (
                                <Link className="lnk gold" href={dedaPath(today.slug)}>
                                    Record today&rsquo;s reading
                                </Link>
                            )}
                        </>
                    ) : (
                        <>Every reading you recorded in step 2. Listen back to hear how far you&rsquo;ve come.</>
                    )}
                </p>
                <input
                    className="find"
                    type="search"
                    placeholder="Find a DEDA"
                    aria-label="Find a DEDA by name"
                    value={find}
                    onChange={(e) => setFind(e.target.value)}
                />
            </div>
            <ul className="weeks">
                {weeks.map((w) => (
                    <WeekRow
                        key={w.week}
                        w={w}
                        open={!!open[w.week]}
                        onToggle={() => setOpen((o) => ({ ...o, [w.week]: !o[w.week] }))}
                        onRecs={onRecs}
                        playing={now?.id}
                        play={play}
                    />
                ))}
            </ul>
            {now && (
                <Player
                    rec={now}
                    onPrev={at > 0 ? () => play(flat[at - 1]) : undefined}
                    onNext={at >= 0 && at < flat.length - 1 ? () => play(flat[at + 1]) : undefined}
                    onEnd={() => {
                        if (queue.length) {
                            setNow(queue[0]);
                            setQueue(queue.slice(1));
                        }
                    }}
                    onClose={() => {
                        setNow(undefined);
                        setQueue([]);
                    }}
                />
            )}
        </div>
    );
};
