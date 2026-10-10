import type { MelpStatus, ProgramEvent } from 'interfaces/melp';
import { programHistory } from './programHistory';

export const ADMIN_HISTORY_URL = 'https://events.mettle.com.br/plataforma/admin/historico';

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
