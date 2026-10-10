'use client';

import { css, Global } from '@emotion/react';
import { useAdminDashboard } from 'hooks/useAdmin';
import { useTheme } from 'hooks/useTheme';
import { brDay, brToday, eventWhen, ORIGINS, PRODUCT_NAMES } from 'libs/adminAccess';
import {
    changeLabel,
    count,
    type Dashboard,
    dayMonth,
    hoursMinutes,
    inRange,
    PRESETS,
    type PresetKey,
    presetRange,
    type Range,
    rangeFloor,
    type Split,
    validRange,
} from 'libs/adminDashboard';
import { adminPanelPath, contasPath, lastAccessLabel } from 'libs/adminPanel';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import React, { useState } from 'react';
import { DARK, LIGHT } from 'themes/newDesign';
import { AdminNav, chipStyles } from './AdminNav';
import { NewPage } from './NewPage';
import { useSoftChart } from './lampCharts';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

const styles = css`
    .db .kp {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 28px 32px;
        margin: 0;
        padding: 0;
        list-style: none;
    }
    .db .kp li {
        min-width: 0;
        padding-top: 14px;
        border-top: 1px solid var(--r-line);
    }
    .db .kp small,
    .db h3 {
        display: block;
        margin: 0;
        font-size: var(--r-label-size);
        font-weight: 500;
        letter-spacing: var(--r-label-track);
        text-transform: uppercase;
        color: var(--r-muted);
    }
    .db .kp b {
        display: block;
        margin-top: 6px;
        font-size: 32px;
        font-weight: 300;
        line-height: 1.1;
        font-variant-numeric: tabular-nums;
    }
    .db .kp span {
        display: block;
        margin-top: 4px;
        font-size: 13px;
        color: var(--r-muted);
        font-variant-numeric: tabular-nums;
    }
    .db .period {
        flex-wrap: wrap;
    }
    .db .pf {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px 12px;
    }
    .db .dt {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: var(--r-muted);
    }
    .db .dt input {
        min-height: 36px;
        padding: 0 10px;
        border: 1px solid var(--r-line);
        border-radius: 999px;
        background: none;
        color: var(--r-text);
        font: inherit;
        font-size: 13px;
        font-variant-numeric: tabular-nums;
    }
    .db .dt input[aria-invalid='true'] {
        border-color: var(--r-gold);
    }
    .db .bad {
        color: var(--r-text);
    }
    .db [aria-busy='true'] .kp,
    .db [aria-busy='true'] .study {
        opacity: 0.45;
        transition: opacity 0.2s;
    }
    .db .line {
        margin: 6px 0 0;
        font-size: 13.5px;
        color: var(--r-muted);
        font-variant-numeric: tabular-nums;
    }
    .db .study {
        margin-top: 28px;
    }
    .db .two {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 36px 40px;
    }
    .db .two > div,
    .db .two > section {
        min-width: 0;
        margin-top: 0;
    }
    .db .bars {
        margin: 12px 0 0;
        padding: 0;
        list-style: none;
    }
    .db .bars li {
        display: grid;
        grid-template-columns: 6.5em minmax(0, 1fr) auto;
        align-items: center;
        gap: 12px;
        min-height: 36px;
        font-size: 14px;
    }
    .db .bars i {
        display: block;
        height: 4px;
        border-radius: 2px;
        background: var(--r-line);
        overflow: hidden;
    }
    .db .bars i::after {
        content: '';
        display: block;
        width: var(--w);
        height: 100%;
        border-radius: 2px;
        background: var(--r-gold);
    }
    .db .bars b {
        font-weight: 500;
        font-variant-numeric: tabular-nums;
    }
    .db .kp.one {
        grid-template-columns: minmax(0, 1fr);
        margin-top: 28px;
    }
    .db ol.rows {
        margin: 0;
        padding: 0;
        list-style: none;
    }
    .db ol.rows a {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 12px;
        min-height: 44px;
        padding: 10px 0;
        border-bottom: 1px solid var(--r-line);
        color: var(--r-text);
        text-decoration: none;
    }
    .db ol.rows a:hover b {
        color: var(--r-gold-hi);
    }
    .db ol.rows b {
        min-width: 0;
        overflow: hidden;
        font-weight: 500;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .db ol.rows span {
        flex: none;
        font-size: 13px;
        color: var(--r-muted);
        font-variant-numeric: tabular-nums;
    }
    .db ol.rows em {
        margin-left: 6px;
        font-style: normal;
        color: var(--r-gold-hi);
    }
    .db .sh a {
        font-size: 13.5px;
        color: var(--r-gold-hi);
        text-decoration: none;
    }
    .db .sub {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 12px;
        min-height: 36px;
    }
    .db .sub a {
        font-size: 13.5px;
        color: var(--r-gold-hi);
        text-decoration: none;
    }
    @media (max-width: 860px) {
        .db .kp {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 20px;
        }
        .db .kp b {
            font-size: 26px;
        }
        .db .two {
            grid-template-columns: minmax(0, 1fr);
        }
    }
`;

const originLabel = (origin: string | null) => ORIGINS.find((o) => o.value === origin)?.label ?? 'origem a confirmar';
const splitLine = (split: Split) => `Ativos ${count(split.ativo)} · Leitura ${count(split.leitura)}`;

type Card = { label: string; value: string; sub?: string | null };
const Cards: React.FC<{ cards: Card[]; label: string; className?: string }> = ({ cards, label, className }) => (
    <ul className={`kp${className ? ` ${className}` : ''}`} aria-label={label}>
        {cards.map((card) => (
            <li key={card.label}>
                <small>{card.label}</small>
                <b>{card.value}</b>
                {card.sub && <span>{card.sub}</span>}
            </li>
        ))}
    </ul>
);

const useGold = () => (useTheme().resolved === 'light' ? LIGHT : DARK)['--r-gold'];

const StudyChart: React.FC<{ days: NonNullable<Dashboard['estudoPorDia']> }> = ({ days }) => {
    const soft = useSoftChart();
    const gold = useGold();
    return (
        <ReactApexChart
            type="area"
            height={220}
            width="100%"
            series={[{ name: 'Alunos', data: days.map((day) => day.alunos) }]}
            options={soft(
                {
                    chart: { toolbar: { show: false }, zoom: { enabled: false } },
                    colors: [gold],
                    stroke: { curve: 'smooth' as const, width: 2 },
                    fill: { type: 'gradient', gradient: { opacityFrom: 0.22, opacityTo: 0 } },
                    dataLabels: { enabled: false },
                    xaxis: { categories: days.map((day) => dayMonth(day.date)), tickAmount: 6 },
                    yaxis: {
                        min: 0,
                        forceNiceScale: true,
                        labels: { formatter: (value: number) => `${Math.round(value)}` },
                    },
                },
                (value, x) => [`${Math.round(value)} ${Math.round(value) === 1 ? 'aluno' : 'alunos'}`, x],
            )}
        />
    );
};

const TimeChart: React.FC<{ rows: NonNullable<Dashboard['tempoPrograma']> }> = ({ rows }) => {
    const soft = useSoftChart();
    const gold = useGold();
    return (
        <ReactApexChart
            type="bar"
            height={220}
            width="100%"
            series={[{ name: 'Alunos', data: rows.map((row) => row.alunos) }]}
            options={soft(
                {
                    chart: { toolbar: { show: false }, zoom: { enabled: false } },
                    colors: [gold],
                    plotOptions: { bar: { columnWidth: '42%', borderRadius: 2 } },
                    dataLabels: { enabled: false },
                    xaxis: { categories: rows.map((row) => row.label) },
                    yaxis: {
                        min: 0,
                        forceNiceScale: true,
                        labels: { formatter: (value: number) => `${Math.round(value)}` },
                    },
                },
                (value, x) => [`${Math.round(value)} ${Math.round(value) === 1 ? 'aluno' : 'alunos'}`, x],
                true,
            )}
        />
    );
};

/** O período só filtra o bloco "No período": botões prontos e De/Até (datas nativas). */
const PeriodPicker: React.FC<{
    preset: PresetKey | null;
    draft: Range;
    onPreset: (key: PresetKey) => void;
    onDraft: (range: Range) => void;
}> = ({ preset, draft, onPreset, onDraft }) => {
    const today = brToday();
    const invalid = !validRange(draft, today);
    return (
        <div className="pf">
            <div className="chips" role="group" aria-label="Período">
                {PRESETS.map((p) => (
                    <button key={p.key} type="button" aria-pressed={preset === p.key} onClick={() => onPreset(p.key)}>
                        {p.label}
                    </button>
                ))}
            </div>
            <label className="dt">
                De
                <input
                    type="date"
                    value={draft.from}
                    min={rangeFloor(today)}
                    max={draft.to || today}
                    aria-invalid={invalid}
                    onChange={(event) => onDraft({ ...draft, from: event.target.value })}
                />
            </label>
            <label className="dt">
                Até
                <input
                    type="date"
                    value={draft.to}
                    min={draft.from}
                    max={today}
                    aria-invalid={invalid}
                    onChange={(event) => onDraft({ ...draft, to: event.target.value })}
                />
            </label>
            {invalid && (
                <span className="dt bad" role="status">
                    Datas inválidas (até 2 anos, De antes de Até)
                </span>
            )}
        </div>
    );
};

/**
 * Início do Admin: a base (sem filtro), o período (Hoje a 12 meses, ou De/Até), o Imerso (planos ativos, tempo de
 * programa, renovações) e o que pede atenção (vencem, sem acessar, últimas mudanças). Cada linha abre a conta; "ver
 * todos" abre o Contas filtrado.
 */
export const NewAdminDashboard: React.FC = () => {
    const [preset, setPreset] = useState<PresetKey | null>('30d');
    const [range, setRange] = useState<Range>(() => presetRange('30d'));
    const [draft, setDraft] = useState<Range>(range);
    const query = useAdminDashboard(range);
    const d = query.data ?? null;
    const waiting = query.isLoading;
    const none = (text: string) => (waiting ? 'Carregando…' : d ? text : '—');

    const choose = (key: PresetKey) => {
        const next = presetRange(key);
        setPreset(key);
        setRange(next);
        setDraft(next);
    };
    const edit = (next: Range) => {
        setDraft(next);
        if (validRange(next)) {
            setPreset(null);
            setRange(next);
        }
    };

    const p = d?.periodo;
    const base: Card[] = [
        { label: 'Contas na Plataforma', value: count(d?.base.contas ?? null) },
        { label: 'Alunos Imerso', value: count(d?.base.imerso.total ?? null), sub: d && splitLine(d.base.imerso) },
        {
            label: 'Masterclass sem Imerso',
            value: count(d?.base.masterclassSemImerso.total ?? null),
            sub: d && splitLine(d.base.masterclassSemImerso),
        },
        {
            label: 'E-book sem Imerso',
            value: count(d?.base.ebookSemImerso.total ?? null),
            sub: d && splitLine(d.base.ebookSemImerso),
        },
    ];
    const recSeconds = p?.gravacoes.segundos ?? null;
    const period: Card[] = [
        {
            label: 'Gravações',
            value: count(p?.gravacoes.total ?? null),
            sub: d && hoursMinutes(recSeconds === null ? null : recSeconds / 60),
        },
        { label: 'DEDAs concluídos', value: count(p?.dedasConcluidos ?? null) },
        { label: 'Horas de Estudo Ativo', value: hoursMinutes(p?.estudoAtivoMin ?? null) },
        { label: 'Horas de Estudo Passivo', value: hoursMinutes(p?.estudoPassivoMin ?? null) },
    ];
    const plans = d?.planosImerso ?? null;
    // a série segue o período (a da rota anterior, fixa em 30 dias, não aparece: d.estudoPorDia é null)
    const days = d?.estudoPorDia ? inRange(d.estudoPorDia, range) : null;
    const widest = Math.max(1, ...(plans ?? []).map((plan) => plan.alunos));

    return (
        <NewPage className="xwide db">
            <Global styles={[styles, chipStyles]} />
            <h1 className="sr">Início</h1>
            <AdminNav />

            <section aria-labelledby="db-base">
                <div className="sh">
                    <h2 id="db-base">Base</h2>
                </div>
                <Cards cards={base} label="Base" />
            </section>

            <section aria-labelledby="db-period" aria-busy={query.isPlaceholderData}>
                <div className="sh period">
                    <h2 id="db-period">No período</h2>
                    <PeriodPicker preset={preset} draft={draft} onPreset={choose} onDraft={edit} />
                </div>
                <Cards cards={period} label="No período" />
                <div className="study">
                    <h3>Alunos que estudaram por dia</h3>
                    {days?.length ? (
                        <StudyChart days={days} />
                    ) : (
                        <p className="hint">
                            {days ? (query.isPlaceholderData ? 'Carregando…' : 'Sem dados no período.') : none('—')}
                        </p>
                    )}
                    {p && (
                        <p className="line">
                            {count(p.alunosEstudaram)} alunos estudaram · Compras: {count(p.compras.novas)} novas,{' '}
                            {count(p.compras.renovacoes)} renovações
                        </p>
                    )}
                </div>
            </section>

            <section aria-labelledby="db-imerso">
                <div className="sh">
                    <h2 id="db-imerso">Imerso</h2>
                </div>
                <div className="two">
                    <div>
                        <h3>Planos (ativos)</h3>
                        {plans?.length ? (
                            <ul className="bars">
                                {plans.map((plan) => (
                                    <li key={plan.label}>
                                        <span>{plan.label}</span>
                                        <i
                                            style={{ '--w': `${(plan.alunos / widest) * 100}%` } as React.CSSProperties}
                                            aria-hidden
                                        />
                                        <b>{count(plan.alunos)}</b>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="hint">{plans ? 'Sem planos ativos.' : none('—')}</p>
                        )}
                        <Cards
                            className="one"
                            label="Renovações"
                            cards={[{ label: 'Renovaram o Imerso', value: count(d?.renovaramImerso ?? null) }]}
                        />
                    </div>
                    <div>
                        <h3>Tempo de programa</h3>
                        {d?.tempoPrograma?.length ? (
                            <TimeChart rows={d.tempoPrograma} />
                        ) : (
                            <p className="hint">{d?.tempoPrograma ? 'Sem dados.' : none('—')}</p>
                        )}
                    </div>
                </div>
            </section>

            <section aria-labelledby="db-attention">
                <div className="sh">
                    <h2 id="db-attention">Atenção</h2>
                </div>
                <div className="two">
                    <div>
                        <div className="sub">
                            <h3>
                                Vencem em 30 dias
                                {d && d.vencendoTotal !== null && ` · ${count(d.vencendoTotal)}`}
                            </h3>
                            <Link href={contasPath({ product: 'imerso', state: 'ativo', sort: 'expiry' })}>
                                ver todos
                            </Link>
                        </div>
                        {d?.vencendo.length ? (
                            <ol className="rows">
                                {d.vencendo.slice(0, 10).map((row) => (
                                    <li key={`${row.uid}:${row.product}`}>
                                        <Link href={adminPanelPath(row.uid)}>
                                            <b>
                                                {row.name || 'Sem nome'}
                                                {row.inCarencia && <em>carência</em>}
                                            </b>
                                            <span>
                                                {PRODUCT_NAMES[row.product]} · {originLabel(row.origin)} ·{' '}
                                                {brDay(row.validUntil)}
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ol>
                        ) : (
                            <p className="hint">{none('Ninguém vence nos próximos 30 dias.')}</p>
                        )}
                    </div>
                    <div>
                        <div className="sub">
                            <h3>
                                Sem acessar há 14+ dias
                                {d && d.semAcessoTotal !== null && ` · ${count(d.semAcessoTotal)}`}
                            </h3>
                            <Link href={contasPath({ sort: 'lastAccess' })}>ver todos</Link>
                        </div>
                        {d?.semAcesso.length ? (
                            <ol className="rows">
                                {d.semAcesso.slice(0, 10).map((row) => (
                                    <li key={row.uid}>
                                        <Link href={adminPanelPath(row.uid)}>
                                            <b>{row.name || 'Sem nome'}</b>
                                            <span>
                                                {row.dias !== null
                                                    ? `${row.dias} dias`
                                                    : lastAccessLabel(row.lastAccess)}
                                                {row.semana ? ` · sem. ${row.semana}` : ''}
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ol>
                        ) : (
                            <p className="hint">{none('Todos acessaram nos últimos 14 dias.')}</p>
                        )}
                    </div>
                </div>
                <div className="sub">
                    <h3>Últimas mudanças</h3>
                </div>
                {d?.eventos.length ? (
                    <ol className="rows">
                        {d.eventos.slice(0, 10).map((event) => (
                            <li key={`${event.uid}:${event.at}:${event.product}`}>
                                <Link href={adminPanelPath(event.uid)}>
                                    <b>
                                        {event.name || 'Sem nome'} · {changeLabel(event)}
                                    </b>
                                    <span>
                                        {eventWhen(event.at)}
                                        {event.by ? ` · ${event.by}` : ''}
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ol>
                ) : (
                    <p className="hint">{none('Sem mudanças recentes.')}</p>
                )}
            </section>
        </NewPage>
    );
};

export default NewAdminDashboard;
