'use client';

import { css, Global } from '@emotion/react';
import { useDedasGrid } from 'components/_melp/_deda/DedasGrid/DedasGrid';
import { useGetGoalByLevel } from 'hooks';
import { brasiliaDate, pausedIntervals } from 'libs/dedaRecording';
import {
    calendarDays,
    countsForRun,
    dayBreakdown,
    GoalDayStatus,
    goalDayStatus,
    goalDays,
    LampDay,
    monthGrid,
} from 'libs/newDesign';
import { Check, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useMelpContext } from 'providers';
import React, { useMemo, useState } from 'react';
import { ICON } from 'themes/newDesign';

/*
 * Calendário da LAMP (mês e ano), no lugar do mapa de constância. Cada dia segue a regra da meta do dia (a mesma das
 * bolinhas da semana): verde ✓ = as três metas; amarelo = algo feito; vermelho ✗ = o dia acabou sem nada; hoje neutro
 * até cumprir; futuro vazio; pausa à parte. O ponto dourado marca o DEDA a 80%+ (a DEDA Run lida em sequência).
 * Os dados são os mesmos da DEDA Run (useLampDays: o programa inteiro numa leitura).
 */

const styles = css`
    .rcal {
        --dg-met: #4f8a5c;
        --dg-part: #a8801f;
        --dg-none: var(--r-danger);
        margin-top: 8px;
    }
    html:not([data-theme='light']) .rcal {
        --dg-met: #86bf93;
        --dg-part: #d6b45e;
    }
    .rcal .cal-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 10px 16px;
        margin: 0 0 6px;
    }
    .rcal .cal-title {
        display: flex;
        align-items: center;
        gap: 4px;
    }
    .rcal .cal-title h3 {
        min-width: 9.5em;
        margin: 0 6px;
        font-size: 18px;
        font-weight: 400;
    }
    .rcal .cal-title .ib {
        width: 40px;
        height: 40px;
        color: var(--r-muted);
    }
    .rcal .cal-title .ib:disabled {
        opacity: 0.3;
    }
    .rcal .cal-tools {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .rcal .sum {
        margin: 0 0 14px;
        font-size: 13px;
        color: var(--r-muted);
    }
    .rcal .sum b {
        font-weight: 500;
        color: var(--r-text);
    }
    /* mês */
    .rcal .mgrid {
        display: grid;
        grid-template-columns: repeat(7, minmax(0, 1fr));
        gap: 6px;
    }
    .rcal .mgrid .dow {
        padding: 0 0 4px;
        font-size: 11px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--r-muted);
        text-align: center;
    }
    .rcal .cell {
        position: relative;
        display: grid;
        grid-template-rows: auto 1fr;
        min-height: 72px;
        padding: 8px 10px;
        border: 1px solid var(--r-line);
        border-radius: 10px;
        background: none;
        color: var(--r-text);
        font: inherit;
        text-align: left;
        cursor: default;
    }
    .rcal .cell .n {
        font-size: 13px;
        font-variant-numeric: tabular-nums;
    }
    .rcal .cell .mk {
        align-self: end;
        justify-self: end;
        display: grid;
        place-items: center;
        width: 24px;
        height: 24px;
        border-radius: 50%;
    }
    .rcal .cell.met .mk {
        background: var(--dg-met);
        color: var(--r-bg);
    }
    .rcal .cell.partial .mk {
        border: 1.5px solid var(--dg-part);
        background: linear-gradient(90deg, var(--dg-part) 50%, transparent 50%);
    }
    .rcal .cell.nothing .mk {
        border: 1.5px solid var(--dg-none);
        color: var(--dg-none);
    }
    /* hoje: o número num círculo dourado cheio (como no Google Agenda) */
    .rcal .cell .n.td {
        display: inline-grid;
        place-items: center;
        width: 24px;
        height: 24px;
        margin: -4px 0 0 -6px;
        border-radius: 50%;
        background: var(--r-gold);
        color: var(--r-bg);
        font-weight: 600;
    }
    .rcal .cell.today {
        border-color: var(--r-line-strong);
        border-style: dashed;
    }
    /* hoje: fundo próprio, além do círculo dourado na data */
    .rcal .cell.is-today {
        background: var(--r-gold-tint);
    }
    .rcal .cell.today .mk {
        border: 1.5px dashed var(--r-line-strong);
    }
    .rcal .cell.future,
    .rcal .cell.pre {
        cursor: default;
    }
    .rcal .cell.future {
        border-color: transparent;
        box-shadow: inset 0 0 0 1px var(--r-line);
    }
    .rcal .cell.future .n {
        color: var(--r-muted);
    }
    .rcal .cell.pre {
        border-color: transparent;
        background: var(--r-hover);
    }
    .rcal .cell.pre .n {
        color: var(--r-muted);
    }
    .rcal .cell.paused {
        border-style: dotted;
        background: repeating-linear-gradient(135deg, transparent 0 6px, var(--r-hover) 6px 12px);
    }
    .rcal .cell.sel {
        outline: 2px solid var(--r-gold-hi);
        outline-offset: 1px;
    }
    .rcal .cell .run {
        position: absolute;
        top: 10px;
        right: 10px;
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--r-gold);
    }
    .rcal .blank {
        min-height: 72px;
    }
    .rcal .detail {
        min-height: 22px;
        margin: 12px 0 0;
        font-size: 13.5px;
        color: var(--r-text);
    }
    .rcal .key {
        display: flex;
        flex-wrap: wrap;
        gap: 6px 16px;
        margin: 8px 0 0;
        font-size: 12.5px;
        color: var(--r-muted);
    }
    .rcal .key i {
        display: inline-block;
        width: 10px;
        height: 10px;
        margin-right: 5px;
        border-radius: 50%;
        vertical-align: -1px;
    }
    .rcal .key .m i {
        background: var(--dg-met);
    }
    .rcal .key .p i {
        background: linear-gradient(90deg, var(--dg-part) 50%, transparent 50%);
        box-shadow: inset 0 0 0 1.5px var(--dg-part);
    }
    .rcal .key .x i {
        box-shadow: inset 0 0 0 1.5px var(--dg-none);
    }
    .rcal .key .g i {
        width: 7px;
        height: 7px;
        background: var(--r-gold);
    }
    .rcal .key .z i {
        border-radius: 2px;
        background: repeating-linear-gradient(135deg, transparent 0 2px, var(--r-line-strong) 2px 4px);
    }
    /* ano: 12 meses pequenos */
    .rcal .ygrid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 20px 28px;
    }
    .rcal .mini {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: flex-start;
        align-self: start;
        padding: 6px;
        border: 0;
        border-radius: 10px;
        background: none;
        color: var(--r-text);
        font: inherit;
        text-align: left;
        cursor: pointer;
    }
    .rcal .mini:hover {
        background: var(--r-hover);
    }
    .rcal .mini b {
        display: block;
        margin-bottom: 6px;
        font-size: 13px;
        font-weight: 500;
    }
    .rcal .mini .mg {
        display: grid;
        grid-template-columns: repeat(7, 12px);
        gap: 3px;
    }
    .rcal .mini i {
        position: relative;
        width: 12px;
        height: 12px;
        border-radius: 3px;
        background: var(--r-track);
    }
    .rcal .mini i.e {
        background: none;
    }
    .rcal .mini i.pre,
    .rcal .mini i.future {
        background: var(--r-hover);
    }
    .rcal .mini i.met {
        background: var(--dg-met);
    }
    .rcal .mini i.partial {
        background: var(--dg-part);
        opacity: 0.75;
    }
    .rcal .mini i.nothing {
        background: color-mix(in oklab, var(--dg-none) 55%, transparent);
    }
    .rcal .mini i.today {
        box-shadow: inset 0 0 0 1.5px var(--r-line-strong);
        background: none;
    }
    .rcal .mini i.td {
        border-radius: 50%;
        background: var(--r-gold);
        box-shadow: none;
    }
    .rcal .mini i.paused {
        background: repeating-linear-gradient(135deg, transparent 0 2px, var(--r-line-strong) 2px 4px);
    }
    .rcal .mini i.run::after {
        content: '';
        position: absolute;
        top: 1px;
        right: 1px;
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: var(--r-gold-hi);
    }
    @media (max-width: 760px) {
        .rcal .mgrid {
            gap: 3px;
        }
        .rcal .cell,
        .rcal .blank {
            min-height: 48px;
        }
        .rcal .cell {
            padding: 4px 5px;
            border-radius: 8px;
        }
        .rcal .cell .n {
            font-size: 11.5px;
        }
        .rcal .cell .n.td {
            width: 20px;
            height: 20px;
            margin: -2px 0 0 -3px;
        }
        .rcal .cell .mk {
            width: 18px;
            height: 18px;
        }
        .rcal .cell .mk svg {
            width: 11px;
            height: 11px;
        }
        .rcal .cell .run {
            top: 6px;
            right: 6px;
            width: 5px;
            height: 5px;
        }
        .rcal .ygrid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
        }
        .rcal .mini .mg {
            grid-template-columns: repeat(7, minmax(0, 1fr));
        }
        .rcal .mini i {
            width: auto;
            aspect-ratio: 1;
            height: auto;
        }
        .rcal .cal-title h3 {
            min-width: 0;
        }
    }
`;

type Cell = { iso: string; st: GoalDayStatus | 'pre' | 'paused'; day?: LampDay; run: boolean };

const MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const prettyDay = (iso: string) =>
    new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
    });

export const LampCalendar: React.FC<{ newestFirst: LampDay[] }> = ({ newestFirst }) => {
    const { melpSummary } = useMelpContext();
    const goals = goalDays(useGetGoalByLevel(melpSummary?.deda_difficulty).data);
    const today = brasiliaDate(new Date());
    const { byDate, pausedDays, start } = useMemo(
        () =>
            calendarDays(
                newestFirst,
                today,
                pausedIntervals(melpSummary?.deda_pause_dates, melpSummary?.deda_start_dates),
            ),
        [newestFirst, today, melpSummary?.deda_pause_dates, melpSummary?.deda_start_dates],
    );
    const [ty, tm] = [Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1];
    const [sy, sm] = [Number(start.slice(0, 4)), Number(start.slice(5, 7)) - 1];
    const [mode, setMode] = useState<'month' | 'year'>('month');
    const [cur, setCur] = useState({ y: ty, m: tm });
    // clique escolhe o dia (fica até outro clique ou "Today"); passar o mouse só antecipa a linha de detalhe
    const [sel, setSel] = useState<string>(today);
    const [hover, setHover] = useState<string>();
    const blockedDEDAs = melpSummary?.melp_status === 'MELP_SUSPENDED' || melpSummary?.days_since_melp_start < 2;
    const dg = useDedasGrid('allDedas', blockedDEDAs);
    const dedaName = (week: number) => {
        const ids = dg.unlockedDEDAs;
        const id = ids[ids.length - 1 - ((dg.currentWeek as number) - week)];
        return dg.allDedas?.find((d) => d.dedaId === id)?.dedaTitle;
    };

    const cell = (iso: string): Cell => {
        if (iso < start) return { iso, st: 'pre', run: false };
        if (iso > today) return { iso, st: 'future', run: false };
        if (pausedDays.has(iso)) return { iso, st: 'paused', run: false };
        const day = byDate.get(iso);
        const goal = day ? goals[Math.min(day.week, goals.length) - 1] : undefined;
        return { iso, st: goalDayStatus(day, iso === today, false, goal), day, run: !!day && countsForRun(day.deda) };
    };

    const canPrev = mode === 'month' ? cur.y * 12 + cur.m > sy * 12 + sm : cur.y > sy;
    const canNext = mode === 'month' ? cur.y * 12 + cur.m < ty * 12 + tm : cur.y < ty;
    const step = (n: number) =>
        setCur((c) =>
            mode === 'month'
                ? { y: Math.floor((c.y * 12 + c.m + n) / 12), m: (((c.m + n) % 12) + 12) % 12 }
                : { ...c, y: c.y + n },
        );

    const grid = monthGrid(cur.y, cur.m);
    const monthCells = grid
        .flat()
        .filter((x): x is string => !!x)
        .map(cell);
    const counted = monthCells.filter((c) => ['met', 'partial', 'nothing'].includes(c.st));
    const met = monthCells.filter((c) => c.st === 'met').length;
    const ran = monthCells.filter((c) => c.run).length;
    const shown = hover ?? sel;
    const selCell = shown ? cell(shown) : undefined;
    const detail = (c: Cell) => {
        if (c.st === 'paused') return `${prettyDay(c.iso)} · Paused`;
        const name = c.day && dedaName(c.day.week);
        return [
            prettyDay(c.iso),
            c.day && `W${c.day.week}`,
            name,
            dayBreakdown(c.day, c.day ? goals[Math.min(c.day.week, goals.length) - 1] : undefined),
        ]
            .filter(Boolean)
            .join(' · ');
    };

    return (
        <section className="rcal" aria-label="Calendar">
            <Global styles={styles} />
            <div className="cal-head">
                <div className="cal-title">
                    <button
                        type="button"
                        className="ib"
                        aria-label={mode === 'month' ? 'Previous month' : 'Previous year'}
                        disabled={!canPrev}
                        onClick={() => step(-1)}
                    >
                        <ChevronLeft {...ICON} size={18} />
                    </button>
                    <h3>{mode === 'month' ? `${MONTHS[cur.m]} ${cur.y}` : cur.y}</h3>
                    <button
                        type="button"
                        className="ib"
                        aria-label={mode === 'month' ? 'Next month' : 'Next year'}
                        disabled={!canNext}
                        onClick={() => step(1)}
                    >
                        <ChevronRight {...ICON} size={18} />
                    </button>
                </div>
                <div className="cal-tools">
                    <button
                        type="button"
                        className="lnk gold"
                        onClick={() => {
                            setMode('month');
                            setCur({ y: ty, m: tm });
                            setSel(today);
                            setHover(undefined);
                        }}
                    >
                        Today
                    </button>
                    <div className="toggle" role="group" aria-label="Calendar view">
                        <button type="button" aria-pressed={mode === 'month'} onClick={() => setMode('month')}>
                            Month
                        </button>
                        <button type="button" aria-pressed={mode === 'year'} onClick={() => setMode('year')}>
                            Year
                        </button>
                    </div>
                </div>
            </div>

            {mode === 'month' ? (
                <>
                    <p className="sum">
                        <b>{met}</b> of {counted.length} {counted.length === 1 ? 'day' : 'days'} met · DEDA 80%+ on{' '}
                        <b>{ran}</b>
                    </p>
                    <div
                        className="mgrid"
                        role="grid"
                        aria-label={`${MONTHS[cur.m]} ${cur.y}`}
                        onMouseLeave={() => setHover(undefined)}
                    >
                        {DOW.map((d) => (
                            <span key={d} className="dow" aria-hidden>
                                {d}
                            </span>
                        ))}
                        {grid.flat().map((iso, i) => {
                            if (!iso) return <span key={`b${i}`} className="blank" aria-hidden />;
                            const c = cell(iso);
                            const said =
                                c.st === 'pre'
                                    ? 'before you started'
                                    : c.st === 'future'
                                      ? 'ahead'
                                      : c.st === 'paused'
                                        ? 'paused'
                                        : `${c.st === 'met' ? 'goal met' : c.st === 'partial' ? 'partial' : c.st === 'nothing' ? 'nothing done' : 'today, pending'}${c.run ? ', DEDA 80%+' : ''}`;
                            const live = !['pre', 'future'].includes(c.st);
                            return (
                                <button
                                    key={iso}
                                    type="button"
                                    className={`cell ${c.st}${iso === today ? ' is-today' : ''}${sel === iso ? ' sel' : ''}`}
                                    aria-current={iso === today ? 'date' : undefined}
                                    aria-label={`${prettyDay(iso)}: ${said}`}
                                    disabled={!live}
                                    onClick={() => setSel(iso)}
                                    aria-pressed={sel === iso}
                                    onMouseEnter={() => live && setHover(iso)}
                                >
                                    <span className={iso === today ? 'n td' : 'n'}>{Number(iso.slice(8))}</span>
                                    {c.run && <i className="run" aria-hidden />}
                                    <span className="mk" aria-hidden>
                                        {c.st === 'met' && <Check {...ICON} size={14} strokeWidth={2.4} />}
                                        {c.st === 'nothing' && <X {...ICON} size={14} strokeWidth={2.4} />}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                    <p className="detail" aria-live="polite">
                        {selCell && selCell.st !== 'pre' && selCell.st !== 'future' && detail(selCell)}
                    </p>
                </>
            ) : (
                <div className="ygrid">
                    {MONTHS.map((name, m) => {
                        const g = monthGrid(cur.y, m);
                        return (
                            <button
                                key={name}
                                type="button"
                                className="mini"
                                aria-label={`Open ${name} ${cur.y}`}
                                onClick={() => {
                                    setCur({ y: cur.y, m });
                                    setMode('month');
                                }}
                            >
                                <b>{name}</b>
                                <span className="mg" aria-hidden>
                                    {g.flat().map((iso, i) => {
                                        if (!iso) return <i key={`b${i}`} className="e" />;
                                        const c = cell(iso);
                                        return (
                                            <i
                                                key={iso}
                                                className={`${c.st}${c.run ? ' run' : ''}${iso === today ? ' td' : ''}`}
                                            />
                                        );
                                    })}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}
            <p className="key" aria-hidden>
                <span className="m">
                    <i />
                    Goal met
                </span>
                <span className="p">
                    <i />
                    Partial
                </span>
                <span className="x">
                    <i />
                    Nothing
                </span>
                <span className="g">
                    <i />
                    DEDA 80%+
                </span>
                {pausedDays.size > 0 && (
                    <span className="z">
                        <i />
                        Paused
                    </span>
                )}
            </p>
        </section>
    );
};
