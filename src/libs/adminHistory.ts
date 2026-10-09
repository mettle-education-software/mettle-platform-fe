import type { MelpStatus, ProgramEvent } from 'interfaces/melp';
import { brDate, programHistory } from './programHistory';

export const ADMIN_HISTORY_URL = 'https://events.mettle.com.br/plataforma/admin/historico';
export const HISTORY_PAGE_SIZE = 25;

export type HistoryStudent = {
    uid: string;
    name: string;
    email: string;
    status: string;
    clock: 'calendar' | 'legacy';
    startedAt: string | null;
    lampWeek: number;
    pausesUsed: number;
    pausesLeft: number;
    resetsUsed: number;
    resetsLeft: number;
    pausedSince: string | null;
    lastPauseFrom: string | null;
    lastPauseTo: string | null;
    lastResetAt: string | null;
    events: Omit<ProgramEvent, 'id'>[];
};

export type HistorySnapshot = { generatedAt: string; students: HistoryStudent[] };
export type HistorySortKey =
    | 'name'
    | 'status'
    | 'startedAt'
    | 'lampWeek'
    | 'pausesUsed'
    | 'resetsUsed'
    | 'pausedSince'
    | 'lastPauseFrom'
    | 'lastResetAt';
export type HistorySort = { key: HistorySortKey; direction: 'asc' | 'desc' };

const STATUS: Record<MelpStatus, string> = {
    MELP_BEGIN: 'Pré-início',
    CAN_START_DEDA: 'Pode começar',
    DEDA_STARTED_NOT_BEGUN: 'Aguardando início',
    DEDA_STARTED: 'Em andamento',
    DEDA_PAUSED: 'Pausado',
    DEDA_FINISHED: 'Formado',
    MELP_SUSPENDED: 'Suspenso',
    WEEK_ZERO: 'Semana zero',
};

export const historyStatusLabel = (status: string) => STATUS[status as MelpStatus] ?? 'Não informado';

// Datas civis do retrato não são instantes UTC; preservar o dia ao formatar e ao reutilizar o histórico.
const civilDate = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date);
const asInstant = (date: string) => (civilDate(date) ? `${date}T00:00:00-03:00` : date);
export const historyDate = (date: string | null) => (date ? brDate(asInstant(date)) || '—' : '—');

export const studentHistory = (student: HistoryStudent) =>
    programHistory(
        student.events.map((event, index) => ({
            ...event,
            id: index,
            at: asInstant(event.at),
            effectiveAt: event.effectiveAt ? asInstant(event.effectiveAt) : null,
        })),
        student.resetsLeft,
    );

const collator = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true });
const searchText = (value: string) =>
    value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('pt-BR')
        .trim();

export const filterHistory = (students: HistoryStudent[], term: string, status: string | null) => {
    const query = searchText(term);
    return students.filter(
        (student) =>
            (!status || student.status === status) &&
            (!query || searchText(`${student.name} ${student.email}`).includes(query)),
    );
};

const sortValue = (student: HistoryStudent, key: HistorySortKey | 'lastPauseTo'): string | number | null => {
    if (key === 'status') return historyStatusLabel(student.status);
    if (key === 'name') return student.name || student.email;
    const value = student[key];
    if (typeof value !== 'string') return value;
    const timestamp = Date.parse(asInstant(value));
    return Number.isNaN(timestamp) ? null : timestamp;
};

/** Ausências ficam no fim nas duas direções; empates têm ordem estável por nome e uid. */
export const sortHistory = (students: HistoryStudent[], sort: HistorySort): HistoryStudent[] => {
    const compare = (a: string | number | null, b: string | number | null) => {
        if (a === null || b === null) return a === b ? 0 : a === null ? 1 : -1;
        const order = typeof a === 'number' && typeof b === 'number' ? a - b : collator.compare(String(a), String(b));
        return sort.direction === 'asc' ? order : -order;
    };
    return [...students].sort(
        (a, b) =>
            compare(sortValue(a, sort.key), sortValue(b, sort.key)) ||
            (sort.key === 'lastPauseFrom' ? compare(sortValue(a, 'lastPauseTo'), sortValue(b, 'lastPauseTo')) : 0) ||
            collator.compare(a.name || a.email, b.name || b.email) ||
            collator.compare(a.uid, b.uid),
    );
};

export const paginateHistory = (students: HistoryStudent[], requestedPage: number) => {
    const total = students.length;
    const pages = Math.max(1, Math.ceil(total / HISTORY_PAGE_SIZE));
    const page = Math.min(pages, Math.max(1, Math.trunc(requestedPage) || 1));
    const offset = (page - 1) * HISTORY_PAGE_SIZE;
    return {
        rows: students.slice(offset, offset + HISTORY_PAGE_SIZE),
        total,
        pages,
        page,
        from: total ? offset + 1 : 0,
        to: Math.min(offset + HISTORY_PAGE_SIZE, total),
    };
};
