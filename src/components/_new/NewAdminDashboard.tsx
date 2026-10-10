'use client';

import { css, Global } from '@emotion/react';
import { useAdminDashboard } from 'hooks/useAdmin';
import { useTheme } from 'hooks/useTheme';
import { brDay, eventWhen, ORIGINS, PRODUCT_NAMES } from 'libs/adminAccess';
import { changeLabel, type Dashboard, dayMonth } from 'libs/adminDashboard';
import { adminPanelPath, contasPath, lastAccessLabel } from 'libs/adminPanel';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import React from 'react';
import { DARK, LIGHT } from 'themes/newDesign';
import { AdminNav } from './AdminNav';
import { NewPage } from './NewPage';
import { useSoftChart } from './lampCharts';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

const styles = css`
    .db .kp {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 28px 32px;
        margin: 0 0 44px;
        padding: 0;
        list-style: none;
    }
    .db .kp li {
        min-width: 0;
        padding-top: 14px;
        border-top: 1px solid var(--r-line);
    }
    .db .kp small {
        display: block;
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
    }
    .db .two {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 44px 40px;
    }
    .db .two > section {
        margin-top: 0;
        min-width: 0;
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
    @media (max-width: 860px) {
        .db .kp {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 20px 20px;
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

// ponytail: o servidor manda no máximo 50 linhas de "vencem" e "sem acessar" (LIMIT 50) e não manda o total; com o
// total no servidor, o número exato.
const LIST_CAP = 50;
const listCount = (rows?: unknown[]) => (rows && rows.length >= LIST_CAP ? `${LIST_CAP}+` : rows?.length);

/** Os seis números do dia; sem a resposta (ou sem o campo), "—" (nunca números inventados). */
const Cards: React.FC<{ d: Dashboard | null }> = ({ d }) => {
    const v = (value?: number | string | null) =>
        d && typeof value === 'number'
            ? value.toLocaleString('pt-BR')
            : (d && typeof value === 'string' && value) || '—';
    const cards: [string, string, string | null][] = [
        ['Imerso ativo', v(d?.acessos.imerso.ativo), d ? `leitura ${v(d.acessos.imerso.leitura)}` : null],
        ['Estudaram hoje', v(d?.estudo.hoje), d ? `${v(d.estudo.d7)} em 7 dias, de ${v(d.estudo.base)}` : null],
        ['Vencem em 30 dias', v(listCount(d?.vencendo)), d ? `em carência ${v(d.acessos.imerso.carencia)}` : null],
        ['Sem acessar 14+ dias', v(listCount(d?.semAcesso)), null],
        ['Compras 30 dias', v(d?.compras30d), null],
        [
            'Masterclass / E-book ativos',
            d ? `${v(d.acessos.masterclass.ativo)} / ${v(d.acessos.ebook.ativo)}` : '—',
            null,
        ],
    ];
    return (
        <ul className="kp" aria-label="Números do dia">
            {cards.map(([label, value, sub]) => (
                <li key={label}>
                    <small>{label}</small>
                    <b>{value}</b>
                    {sub && <span>{sub}</span>}
                </li>
            ))}
        </ul>
    );
};

const StudyChart: React.FC<{ days: Dashboard['estudoPorDia'] }> = ({ days }) => {
    const soft = useSoftChart();
    const light = useTheme().resolved === 'light';
    const gold = (light ? LIGHT : DARK)['--r-gold'];
    const labels = days.map((day) => dayMonth(day.date));
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
                    xaxis: { categories: labels, tickAmount: 6 },
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

/**
 * Início do Admin: seis números, quem estudou por dia nos últimos 30 dias, quem vence em 30 dias, quem está sem acessar
 * há 14+ dias e as últimas mudanças de acesso. Cada linha abre a conta; "ver todos" abre o Contas já filtrado.
 */
export const NewAdminDashboard: React.FC = () => {
    const query = useAdminDashboard();
    const d = query.data ?? null;
    const empty = !query.isLoading && !d;

    return (
        <NewPage className="xwide db">
            <Global styles={styles} />
            <AdminNav />
            <Cards d={d} />

            <section aria-labelledby="db-study">
                <div className="sh">
                    <h2 id="db-study">Alunos que estudaram por dia, últimos 30 dias</h2>
                </div>
                {d?.estudoPorDia.length ? (
                    <StudyChart days={d.estudoPorDia} />
                ) : (
                    <p className="hint">{empty ? 'Sem dados no momento.' : 'Carregando…'}</p>
                )}
            </section>

            <div className="two">
                <section aria-labelledby="db-due">
                    <div className="sh">
                        <h2 id="db-due">Vencem em 30 dias</h2>
                        <Link href={contasPath({ product: 'imerso', state: 'ativo', sort: 'expiry', dir: 'asc' })}>
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
                        <p className="hint">{d ? 'Ninguém vence nos próximos 30 dias.' : '—'}</p>
                    )}
                </section>

                <section aria-labelledby="db-idle">
                    <div className="sh">
                        <h2 id="db-idle">Sem acessar há 14+ dias</h2>
                        <Link href={contasPath({ sort: 'lastAccess', dir: 'asc' })}>ver todos</Link>
                    </div>
                    {d?.semAcesso.length ? (
                        <ol className="rows">
                            {d.semAcesso.slice(0, 10).map((row) => (
                                <li key={row.uid}>
                                    <Link href={adminPanelPath(row.uid)}>
                                        <b>{row.name || 'Sem nome'}</b>
                                        <span>
                                            {row.dias !== null ? `${row.dias} dias` : lastAccessLabel(row.lastAccess)}
                                            {row.semana ? ` · sem. ${row.semana}` : ''}
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ol>
                    ) : (
                        <p className="hint">{d ? 'Todos acessaram nos últimos 14 dias.' : '—'}</p>
                    )}
                </section>
            </div>

            <section aria-labelledby="db-changes">
                <div className="sh">
                    <h2 id="db-changes">Últimas mudanças</h2>
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
                    <p className="hint">{d ? 'Sem mudanças recentes.' : '—'}</p>
                )}
            </section>
        </NewPage>
    );
};

export default NewAdminDashboard;
