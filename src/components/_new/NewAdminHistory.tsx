'use client';

import { css, Global } from '@emotion/react';
import { useQuery } from '@tanstack/react-query';
import { Input } from 'antd';
import { auth } from 'config/firebase';
import {
    ADMIN_HISTORY_URL,
    filterHistory,
    historyDate,
    HistorySnapshot,
    HistorySort,
    HistorySortKey,
    historyStatusLabel,
    HistoryStudent,
    paginateHistory,
    sortHistory,
    studentHistory,
} from 'libs/adminHistory';
import { isLeituraOwner } from 'libs/leitura';
import { ChevronDown, ChevronRight, ChevronUp, ChevronsUpDown } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { NewPage } from './NewPage';
import { PageHead } from './PageHead';

const getHistory = async (): Promise<HistorySnapshot> => {
    const user = auth.currentUser;
    if (!isLeituraOwner(user?.uid) || !user) throw new Error('Acesso restrito');
    const token = await user.getIdToken();
    const response = await fetch(ADMIN_HISTORY_URL, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
    });
    if (!response.ok) throw new Error(String(response.status));
    return response.json();
};

const COLUMNS: { key: HistorySortKey; label: string; numeric?: boolean }[] = [
    { key: 'name', label: 'Aluno' },
    { key: 'status', label: 'Status' },
    { key: 'startedAt', label: 'Início' },
    { key: 'lampWeek', label: 'Semana da LAMP', numeric: true },
    { key: 'pausesUsed', label: 'Pausas', numeric: true },
    { key: 'resetsUsed', label: 'Resets', numeric: true },
    { key: 'pausedSince', label: 'Pausado desde' },
    { key: 'lastPauseFrom', label: 'Última pausa' },
    { key: 'lastResetAt', label: 'Último reset' },
];
const EMPTY: HistoryStudent[] = [];

const styles = css`
    .ui-new-page.ah-page {
        min-width: 0;
        width: 100%;
        box-sizing: border-box;
    }
    .ah {
        min-width: 0;
    }
    .ah .ah-tools {
        display: grid;
        gap: 16px;
        margin-bottom: 20px;
    }
    .ah .ah-search {
        width: 340px;
        max-width: 100%;
    }
    .ah .seg {
        margin: 0;
        flex-wrap: wrap;
        border-radius: 20px;
        width: fit-content;
    }
    .ah .seg button {
        min-height: 40px;
        padding: 0 14px;
        font-size: 13px;
    }
    .ah .seg button[aria-pressed='true'] {
        background: var(--r-gold);
        color: var(--r-on-gold);
    }
    .ah .ah-scroll {
        width: 100%;
        max-width: 100%;
        overflow-x: auto;
        border: 1px solid var(--r-line);
        border-radius: var(--r-radius);
    }
    .ah table {
        width: 100%;
        min-width: 1200px;
        border-collapse: collapse;
        font-size: 13.5px;
        font-variant-numeric: tabular-nums;
    }
    .ah th,
    .ah td {
        padding: 12px 16px;
        text-align: left;
        white-space: nowrap;
        border-bottom: 1px solid var(--r-line);
    }
    .ah th {
        padding: 0;
        background: var(--r-surf);
        font-weight: 500;
    }
    .ah th button {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        min-height: 48px;
        padding: 12px 16px;
        background: none;
        border: 0;
        color: var(--r-muted);
        font: inherit;
        font-size: 12px;
        cursor: pointer;
        white-space: nowrap;
    }
    .ah th[aria-sort='ascending'] button,
    .ah th[aria-sort='descending'] button {
        color: var(--r-gold-hi);
    }
    .ah .ah-num {
        text-align: right;
    }
    .ah th.ah-num button {
        justify-content: flex-end;
    }
    .ah .ah-student {
        cursor: pointer;
    }
    .ah .ah-student:hover,
    .ah .ah-student.ah-open {
        background: var(--r-hover);
    }
    .ah .ah-name {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 0;
        min-height: 44px;
        max-width: 300px;
        border: 0;
        background: none;
        color: var(--r-text);
        text-align: left;
        font: inherit;
        cursor: pointer;
    }
    .ah .ah-name svg {
        flex-shrink: 0;
        color: var(--r-muted);
    }
    .ah .ah-name span {
        min-width: 0;
    }
    .ah .ah-name b,
    .ah .ah-name small {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .ah .ah-name b {
        font-weight: 500;
    }
    .ah .ah-name small {
        margin-top: 3px;
        font-size: 12px;
        color: var(--r-muted);
    }
    .ah .ah-status {
        display: inline-block;
        padding: 4px 9px;
        border: 1px solid var(--r-line);
        border-radius: 999px;
        font-size: 12px;
    }
    .ah .ah-student[data-status='DEDA_PAUSED'] .ah-status {
        color: var(--r-gold-hi);
        background: var(--r-gold-tint);
    }
    .ah .ah-events td {
        padding: 8px 24px 20px;
        background: var(--r-surf);
        white-space: normal;
    }
    .ah .history {
        margin: 0;
        max-width: 700px;
    }
    .ah .history .rows {
        border-top: 0;
    }
    .ah .history .row {
        grid-template-columns: minmax(0, 1fr) auto;
        padding: 12px 0;
    }
    .ah .history .row:last-child,
    .ah tbody tr:last-child td {
        border-bottom: 0;
    }
    .ah .ah-pagination {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 8px 20px;
        margin-top: 16px;
        font-variant-numeric: tabular-nums;
    }
    .ah .ah-pages {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
    }
    .ah .ah-message {
        padding: 24px 0;
    }
`;

const Timeline: React.FC<{ student: HistoryStudent }> = ({ student }) => {
    const rows = studentHistory(student);
    return rows.length ? (
        <section className="history" aria-label={`Histórico de ${student.name || student.email}`}>
            <ol className="rows">
                {rows.map((row) => (
                    <li className="row" key={row.key}>
                        <span className="lab">
                            <b>{row.label}</b>
                        </span>
                        <span className="field">{row.when}</span>
                    </li>
                ))}
            </ol>
        </section>
    ) : (
        <p className="hint">Sem eventos.</p>
    );
};

export const NewAdminHistory: React.FC = () => {
    const uid = auth.currentUser?.uid;
    const query = useQuery({
        queryKey: ['admin-history', uid],
        queryFn: getHistory,
        enabled: isLeituraOwner(uid),
        staleTime: 5 * 60_000,
        retry: 1,
    });
    const [term, setTerm] = useState('');
    const [status, setStatus] = useState<string | null>(null);
    const [sort, setSort] = useState<HistorySort>({ key: 'name', direction: 'asc' });
    const [page, setPage] = useState(1);
    const [expanded, setExpanded] = useState<string | null>(null);
    const students = query.data?.students ?? EMPTY;
    const statuses = useMemo(
        () =>
            Array.from(new Set(students.map((student) => student.status))).sort((a, b) =>
                historyStatusLabel(a).localeCompare(historyStatusLabel(b), 'pt-BR'),
            ),
        [students],
    );
    const filtered = useMemo(
        () => sortHistory(filterHistory(students, term, status), sort),
        [students, term, status, sort],
    );
    const result = paginateHistory(filtered, page);
    const toggle = (studentUid: string) => setExpanded((current) => (current === studentUid ? null : studentUid));
    const sortBy = (key: HistorySortKey) => {
        setSort((current) => ({ key, direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc' }));
        setPage(1);
    };

    return (
        <NewPage className="ah-page xwide">
            <Global styles={styles} />
            <PageHead title="Histórico do programa" />
            <div className="ah">
                <div className="ah-tools">
                    <Input
                        className="ah-search"
                        allowClear
                        placeholder="Buscar nome ou e-mail"
                        aria-label="Buscar nome ou e-mail"
                        value={term}
                        onChange={(event) => {
                            setTerm(event.target.value);
                            setPage(1);
                        }}
                    />
                    <div className="seg" role="group" aria-label="Filtrar por status">
                        {[null, ...statuses].map((value) => (
                            <button
                                key={value ?? 'all'}
                                type="button"
                                aria-pressed={status === value}
                                onClick={() => {
                                    setStatus(value);
                                    setPage(1);
                                }}
                            >
                                {value === null ? 'Todos' : historyStatusLabel(value)}
                            </button>
                        ))}
                    </div>
                </div>
                {query.isLoading && (
                    <p className="hint ah-message" role="status">
                        Carregando…
                    </p>
                )}
                {query.isError && (
                    <div className="ah-message" role="alert">
                        <span className="hint">Não foi possível carregar o histórico.</span>{' '}
                        <button className="btn line" type="button" onClick={() => query.refetch()}>
                            Tentar novamente
                        </button>
                    </div>
                )}
                {query.data && (
                    <>
                        <div className="ah-scroll" role="region" aria-label="Histórico dos alunos" tabIndex={0}>
                            <table aria-label="Histórico do programa">
                                <thead>
                                    <tr>
                                        {COLUMNS.map((column) => (
                                            <th
                                                key={column.key}
                                                scope="col"
                                                className={column.numeric ? 'ah-num' : undefined}
                                                aria-sort={
                                                    sort.key === column.key
                                                        ? sort.direction === 'asc'
                                                            ? 'ascending'
                                                            : 'descending'
                                                        : 'none'
                                                }
                                            >
                                                <button type="button" onClick={() => sortBy(column.key)}>
                                                    {column.label}
                                                    {sort.key === column.key ? (
                                                        sort.direction === 'asc' ? (
                                                            <ChevronUp size={14} aria-hidden="true" />
                                                        ) : (
                                                            <ChevronDown size={14} aria-hidden="true" />
                                                        )
                                                    ) : (
                                                        <ChevronsUpDown size={14} aria-hidden="true" />
                                                    )}
                                                </button>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.rows.map((student) => {
                                        const open = expanded === student.uid;
                                        const detailId = `history-${student.uid}`;
                                        return (
                                            <React.Fragment key={student.uid}>
                                                <tr
                                                    className={`ah-student${open ? ' ah-open' : ''}`}
                                                    data-status={student.status}
                                                    onClick={() => toggle(student.uid)}
                                                >
                                                    <td>
                                                        <button
                                                            className="ah-name"
                                                            type="button"
                                                            aria-expanded={open}
                                                            aria-controls={open ? detailId : undefined}
                                                            aria-label={`Histórico de ${student.name || student.email}`}
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                toggle(student.uid);
                                                            }}
                                                        >
                                                            {open ? (
                                                                <ChevronDown size={16} aria-hidden="true" />
                                                            ) : (
                                                                <ChevronRight size={16} aria-hidden="true" />
                                                            )}
                                                            <span>
                                                                <b>{student.name || student.email}</b>
                                                                <small>{student.email}</small>
                                                            </span>
                                                        </button>
                                                    </td>
                                                    <td>
                                                        <span className="ah-status">
                                                            {historyStatusLabel(student.status)}
                                                        </span>
                                                    </td>
                                                    <td>{historyDate(student.startedAt)}</td>
                                                    <td className="ah-num">{student.lampWeek}</td>
                                                    <td className="ah-num">
                                                        {student.pausesUsed} <span className="hint">de 3</span>
                                                    </td>
                                                    <td className="ah-num">
                                                        {student.resetsUsed} <span className="hint">de 3</span>
                                                    </td>
                                                    <td>{historyDate(student.pausedSince)}</td>
                                                    <td>
                                                        {student.lastPauseFrom
                                                            ? `${historyDate(student.lastPauseFrom)} – ${historyDate(student.lastPauseTo)}`
                                                            : '—'}
                                                    </td>
                                                    <td>
                                                        {student.lastResetAt
                                                            ? historyDate(student.lastResetAt)
                                                            : 'não registrada'}
                                                    </td>
                                                </tr>
                                                {open && (
                                                    <tr className="ah-events" id={detailId}>
                                                        <td colSpan={COLUMNS.length}>
                                                            <Timeline student={student} />
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                    {!result.total && (
                                        <tr>
                                            <td colSpan={COLUMNS.length} className="hint">
                                                Nenhum aluno encontrado.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <nav className="ah-pagination" aria-label="Paginação do histórico">
                            <span className="hint" role="status">
                                {result.from}–{result.to} de {result.total} alunos
                                {result.total !== students.length ? ` · ${students.length} no total` : ''}
                            </span>
                            <div className="ah-pages">
                                <button
                                    type="button"
                                    className="btn line"
                                    disabled={result.page === 1}
                                    onClick={() => setPage(result.page - 1)}
                                >
                                    Anterior
                                </button>
                                <span className="hint">
                                    {result.page} / {result.pages}
                                </span>
                                <button
                                    type="button"
                                    className="btn line"
                                    disabled={result.page === result.pages}
                                    onClick={() => setPage(result.page + 1)}
                                >
                                    Próxima
                                </button>
                            </div>
                        </nav>
                    </>
                )}
            </div>
        </NewPage>
    );
};

export default NewAdminHistory;
