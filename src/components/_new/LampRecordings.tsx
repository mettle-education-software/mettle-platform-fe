'use client';

import { css, Global } from '@emotion/react';
import { Select } from 'antd';
import { AudioPlayer } from 'components';
import { useDedasGrid } from 'components/_melp/_deda/DedasGrid/DedasGrid';
import { useDedaRecordings, useRecordingPlayUrl, useRecordingStats } from 'hooks/melp/dedaRecording';
import { dedaPath } from 'libs/cleanUrls';
import { IMAGE_MIRROR_HOSTS } from 'libs/contentImage';
import { dedaIdsSince, dedaLampWeek, isCalendarClock } from 'libs/dedaClock';
import { contentfulImage } from 'libs/dedaHeader';
import {
    DedaRecording,
    formatDuration,
    formatRecordedOn,
    RECORDER_SINCE,
    spokenDuration,
    weeksSinceRecorder,
} from 'libs/dedaRecording';
import { isoPlus, WEEK_DAYS } from 'libs/newDesign';
import { ChevronDown, Play, X } from 'lucide-react';
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
        width: min(300px, 100%);
    }
    .lrec .find .ant-select-selector,
    .lrec .find input {
        font-size: 16px !important;
    }
    /* o antd esmaece a dica a ~2:1; fica legível (AA) */
    .lrec .find .ant-select-selection-placeholder {
        color: var(--r-muted);
    }
    /* KPIs de gravação: leves, como os números do topo da LAMP */
    .lrec .rk {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 12px;
        margin: -4px 0 22px;
    }
    .lrec .rk > div {
        padding: 14px 16px;
        border: 1px solid var(--r-line);
        border-radius: var(--r-radius);
    }
    .lrec .rk dt {
        font-size: var(--r-label-size);
        letter-spacing: var(--r-label-track);
        text-transform: uppercase;
        color: var(--r-muted);
    }
    .lrec .rk dd {
        margin: 6px 0 0;
        font-size: 24px;
        font-weight: 300;
        font-variant-numeric: tabular-nums;
    }
    .lrec .rk dd small {
        display: block;
        margin-top: 2px;
        font-size: 12px;
        font-weight: 400;
        color: var(--r-muted);
    }
    @media (max-width: 760px) {
        .lrec .rk {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
        }
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
    .lrec .recs .rr {
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
    .lrec .recs .rr:hover,
    .lrec .recs .rr.now {
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
        display: grid;
        gap: 6px;
        margin: 0 0 14px 78px;
        padding: 10px 14px;
        border-radius: 10px;
        background: var(--r-gold-tint);
        font-size: 13.5px;
        color: var(--r-text);
    }
    .lrec .cmp p {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 6px 14px;
    }
    .lrec .cmp .recs {
        margin: 0;
    }
    .lrec .inl {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: 6px;
        min-height: 52px;
        padding: 4px 0;
        border-top: 1px solid var(--r-line);
    }
    /* fechar: só o ×, sem círculo (o anel de foco do teclado vem de ui, :focus-visible) */
    .lrec .inl .x,
    .lrec .inl .x:hover {
        background: none;
    }
    .lrec .inl .x:hover {
        color: var(--r-gold-hi);
    }
    .lrec .inl .ap {
        min-width: 0;
    }
    .lrec .inl .msg {
        padding: 0 8px;
        font-size: 13px;
        color: var(--r-muted);
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

/** Uma linha: um DEDA. `week` = semana da LAMP em que o aluno o fez (relógio novo: sem semana na LAMP = sem rótulo);
 * `byWeek`: legado, as gravações da linha são as daquela semana (o mesmo DEDA pode ter outra volta). */
type Week = { week?: number; dedaId: string; title: string; slug?: string; image?: string; byWeek: boolean };
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

/**
 * O player na própria linha (o mesmo player fino do passo 2 e de My recordings): um toque em ▶ já toca; terminou ou
 * fechou, a linha volta a ser compacta. Endereço de 5 min: pede outro uma vez se falhar.
 */
const InlinePlayer: React.FC<{ rec: Rec; onEnd(): void; onClose(): void }> = ({ rec, onEnd, onClose }) => {
    const url = useRecordingPlayUrl(rec.id);
    const retried = useRef(false);
    return (
        <div className="inl" role="group" aria-label={`Playing day ${rec.weekDay.replace('day', '')}`}>
            <div className="ap">
                {url.isError ? (
                    <p className="msg">We couldn&rsquo;t load this recording right now.</p>
                ) : !url.data ? (
                    <p className="msg">Loading…</p>
                ) : (
                    <AudioPlayer
                        key={rec.id}
                        compact
                        autoPlay
                        audioURL={url.data}
                        onEnd={onEnd}
                        onError={() => {
                            if (!retried.current) {
                                retried.current = true;
                                url.refetch();
                            }
                        }}
                    />
                )}
            </div>
            <button type="button" className="ib x" aria-label="Close the player" onClick={onClose}>
                <X {...ICON} size={18} />
            </button>
        </div>
    );
};

/** Uma gravação: linha compacta (▶ · rótulo · duração) ou, tocando, o player ali mesmo. */
const RecRow: React.FC<{
    rec: Rec;
    label: string;
    playing?: string;
    play(rec: Rec, queue?: Rec[]): void;
    onEnd(): void;
    stop(): void;
}> = ({ rec, label, playing, play, onEnd, stop }) =>
    playing === rec.id ? (
        <InlinePlayer rec={rec} onEnd={onEnd} onClose={stop} />
    ) : (
        <button
            type="button"
            className="rr"
            aria-label={`Play ${label}, ${spokenDuration(rec.durationMs)}`}
            onClick={() => play(rec)}
        >
            <span className="pi">
                <Play {...ICON} size={14} aria-hidden />
            </span>
            <span>{label}</span>
            <small>{formatDuration(rec.durationMs)}</small>
        </button>
    );

/** Uma semana do gotejamento do aluno: cabeçalho sempre presente; os números chegam quando a linha fica perto da tela. */
const WeekRow: React.FC<{
    w: Week;
    open: boolean;
    onToggle(): void;
    onRecs(dedaId: string, recs: Rec[]): void;
    playing?: string;
    play(rec: Rec, queue?: Rec[]): void;
    onEnd(): void;
    stop(): void;
}> = ({ w, open, onToggle, onRecs, playing, play, onEnd, stop }) => {
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
    all.filter((r) => !w.byWeek || r.week === `week${w.week}`)
        .sort((a, b) => (a.createdAt ?? a.recordedOn).localeCompare(b.createdAt ?? b.recordedOn))
        .forEach((r) => byDay.set(r.weekDay, r));
    const mine = [...byDay.values()].sort((a, b) => a.weekDay.localeCompare(b.weekDay));
    const known = !!q.data || q.isError;
    useEffect(() => {
        if (known) onRecs(w.dedaId, mine);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [known, q.data, w.dedaId]);
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
        <li ref={ref} id={`wk-${w.dedaId}`} className={`wk${open && has ? ' open' : ''}`}>
            <button type="button" className="wh" aria-expanded={open && has} disabled={!has} onClick={onToggle}>
                {/* eslint-disable-next-line @next/next/no-img-element -- miniatura do espelho, pequena */}
                {thumb ? <img className="th" src={thumb} alt="" loading="lazy" /> : <span className="th" />}
                <span className="t">
                    {w.week ? <small>W{w.week}</small> : null}
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
                            <div className="cmp">
                                <p>
                                    Hear your progress: {wn(first)} vs {wn(latest)}
                                    <button
                                        type="button"
                                        className="btn gold"
                                        onClick={() => play(first, [first, latest])}
                                    >
                                        <Play {...ICON} size={14} aria-hidden /> Play both
                                    </button>
                                </p>
                                <ul className="recs">
                                    {[first, latest].map((r) => (
                                        <li key={`c-${r.id}`}>
                                            <RecRow
                                                rec={r}
                                                label={`${wn(r)} · Day ${r.weekDay.replace('day', '')} · ${formatRecordedOn(r.recordedOn)}`}
                                                playing={playing}
                                                play={play}
                                                onEnd={onEnd}
                                                stop={stop}
                                            />
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <ul className="recs">
                            {[1, 2, 3, 4, 5, 6, 7].map((d) => {
                                const r = byDay.get(`day${d}`);
                                const wd = WEEK_DAYS[d - 1].label;
                                return (
                                    <li key={d}>
                                        {r ? (
                                            <RecRow
                                                rec={r}
                                                label={`Day ${d} · ${formatRecordedOn(r.recordedOn)}`}
                                                playing={playing}
                                                play={play}
                                                onEnd={onEnd}
                                                stop={stop}
                                            />
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

/** "Oct 5" */
const shortDate = (iso: string) =>
    new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

/** Tempo gravado: "36 s", "12 min", "1h 12". */
const timeText = (ms: number) => {
    const s = Math.round(ms / 1000);
    if (s < 60) return `${s} s`;
    const m = Math.round(s / 60);
    return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}`;
};

export const LampRecordings: React.FC = () => {
    const { melpSummary } = useMelpContext();
    // a MESMA lista da página de DEDAs: o gotejamento do aluno (unlocked_dedas na ordem, já com pausa e reinício),
    // bloqueada como lá (suspenso ou nos 2 primeiros dias), semana = semana atual − posição a partir do mais recente
    const blockedDEDAs = melpSummary?.melp_status === 'MELP_SUSPENDED' || melpSummary?.days_since_melp_start < 2;
    const grid = useDedasGrid('allDedas', blockedDEDAs);
    const current = (grid.currentWeek as number) ?? 0;
    const calendar = isCalendarClock(melpSummary);
    const byId = useMemo(() => new Map((grid.allDedas ?? []).map((d) => [d.dedaId, d])), [grid.allDedas]);
    // só os DEDAs desde que o gravador existe (+2 semanas de folga): antes disso não há gravação — nem pedido
    // (frente 4b, item 5). Relógio novo: por DEDA exibido, rótulo pela semana da LAMP (deda_weeks); legado: por posição.
    const allWeeks: Week[] = useMemo(() => {
        const rows: { id: string; week?: number }[] = calendar
            ? dedaIdsSince(melpSummary, isoPlus(RECORDER_SINCE, -14)).map((id) => ({
                  id,
                  week: dedaLampWeek(melpSummary, id) ?? undefined,
              }))
            : grid.unlockedDEDAs
                  .slice()
                  .reverse()
                  .slice(0, weeksSinceRecorder())
                  .map((id, index) => ({ id, week: current - index }));
        return rows.map(({ id, week }) => {
            const deda = byId.get(id);
            return {
                week,
                dedaId: id,
                title: deda?.dedaTitle ?? id,
                slug: deda?.dedaSlug,
                image: deda?.dedaFeaturedImage?.url,
                byWeek: !calendar,
            };
        });
    }, [calendar, melpSummary, grid.unlockedDEDAs, current, byId]);
    const [open, setOpen] = useState<Record<string, boolean>>({});
    const [recs, setRecs] = useState<Record<string, Rec[]>>({});
    const [queue, setQueue] = useState<Rec[]>([]);
    const [now, setNow] = useState<Rec>();

    const weeks = allWeeks;
    const stats = useRecordingStats();
    // ir a um DEDA: abre a linha e rola até ela
    const goTo = (dedaId: string) => {
        setOpen((o) => ({ ...o, [dedaId]: true }));
        requestAnimationFrame(() =>
            document.getElementById(`wk-${dedaId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
        );
    };

    const onRecs = (dedaId: string, mine: Rec[]) =>
        setRecs((r) => (r[dedaId]?.length === mine.length ? r : { ...r, [dedaId]: mine }));
    // a semana mais recente com gravações abre sozinha (uma vez), quando as mais novas já se sabe que estão vazias
    const autoOpened = useRef(false);
    useEffect(() => {
        if (autoOpened.current) return;
        for (const w of allWeeks) {
            const known = recs[w.dedaId];
            if (known === undefined) return;
            if (known.length) {
                autoOpened.current = true;
                setOpen((o) => ({ ...o, [w.dedaId]: true }));
                return;
            }
        }
    }, [recs, allWeeks]);

    const play = (rec: Rec, q: Rec[] = []) => {
        setQueue(q.slice(1));
        setNow(rec);
    };
    // terminou: o próximo da fila (Play both) ou a linha volta a ser compacta
    const next = () => {
        if (queue.length) {
            setNow(queue[0]);
            setQueue(queue.slice(1));
        } else setNow(undefined);
    };
    const stop = () => {
        setNow(undefined);
        setQueue([]);
    };

    const known = allWeeks.filter((w) => recs[w.dedaId] !== undefined);
    const none = allWeeks.length > 0 && known.length === allWeeks.length && known.every((w) => !recs[w.dedaId].length);
    const today = allWeeks[0];

    return (
        <div className="panel lrec" role="tabpanel">
            <Global styles={styles} />
            <div className="sh">
                <h2>Your recordings</h2>
            </div>
            {stats.allowed && stats.stats && (
                <dl className="rk lcar sm">
                    <div>
                        <dt>Recording rate</dt>
                        <dd>{Math.round(stats.stats.rate * 100)}%</dd>
                    </div>
                    <div>
                        <dt>Recordings</dt>
                        <dd>{stats.stats.recordings}</dd>
                    </div>
                    <div>
                        <dt>Recording days</dt>
                        <dd>
                            {stats.stats.recordingDays}
                            <small>since {shortDate(stats.stats.since)}</small>
                        </dd>
                    </div>
                    <div>
                        <dt>Time recorded</dt>
                        <dd>{timeText(stats.stats.totalMs)}</dd>
                    </div>
                    <div>
                        <dt>Average length</dt>
                        <dd>{(stats.stats.totalMs / stats.stats.recordings / 60000).toFixed(1)} min</dd>
                    </div>
                </dl>
            )}
            <div className="tools">
                {none && (
                    <p className="hint">
                        <>
                            Your readings from step 2 will appear here, week by week.{' '}
                            {today?.slug && (
                                <Link className="lnk gold" href={dedaPath(today.slug)}>
                                    Record today&rsquo;s reading
                                </Link>
                            )}
                        </>
                    </p>
                )}
                <Select
                    className="find"
                    showSearch
                    allowClear
                    placeholder="Go to a DEDA"
                    aria-label="Go to a DEDA"
                    optionFilterProp="label"
                    popupMatchSelectWidth={false}
                    options={allWeeks.map((w) => ({
                        value: w.dedaId,
                        label: w.week ? `W${w.week} · ${w.title}` : w.title,
                    }))}
                    onChange={(dedaId?: string) => dedaId !== undefined && goTo(dedaId)}
                />
            </div>
            <ul className="weeks">
                {weeks.map((w) => (
                    <WeekRow
                        key={w.dedaId}
                        w={w}
                        open={!!open[w.dedaId]}
                        onToggle={() => setOpen((o) => ({ ...o, [w.dedaId]: !o[w.dedaId] }))}
                        onRecs={onRecs}
                        playing={now?.id}
                        play={play}
                        onEnd={next}
                        stop={stop}
                    />
                ))}
            </ul>
        </div>
    );
};
