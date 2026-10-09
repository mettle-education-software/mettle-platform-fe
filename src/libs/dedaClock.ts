// Relógio de dois ponteiros no front (vault "LAMP × Rotação — Desenho (out-2026)", §2.3 e §4.3): funções puras sobre o
// resumo do IMERSO. Com `deda_clock: 'calendar'` (uid ligado no servidor) o DEDA segue o calendário (`deda_today`,
// `deda_weeks`) e a LAMP conta os dias ativos; sem a chave, o caminho de hoje (posição em `unlocked_dedas`).
// Testes: libs/__tests__/dedaClock.test.ts.
import type { MelpSummaryResponse } from 'interfaces/melp';

type Summary = MelpSummaryResponse['data'];

export const isCalendarClock = (s?: Summary | null) => s?.deda_clock === 'calendar';

/** A LAMP conta hoje (lançar o dia, concluir o DEDA): só em DEDA_STARTED, da semana 1 em diante, com o programa são. */
export const lampRunning = (s?: Summary | null) =>
    s?.melp_status === 'DEDA_STARTED' && s.current_deda_week > 0 && s.program_health !== 'inconsistent';

/**
 * A LAMP abre (rota e menu). Legado: em andamento, pausada ou concluída. Relógio novo: em todo estado depois do start,
 * menos suspenso — histórico, calendário e gravações sempre visíveis; lançar só com ela contando (§4.3).
 */
export const lampOpen = (s?: Summary | null) =>
    !!s &&
    (isCalendarClock(s)
        ? !!s.deda_first_monday && s.melp_status !== 'MELP_SUSPENDED'
        : ['DEDA_STARTED', 'DEDA_PAUSED', 'DEDA_FINISHED'].includes(s.melp_status));

/**
 * Semana e dia de hoje na LAMP, pelos contadores do próprio resumo (nunca pelo relógio do aparelho nem pela posição do
 * DEDA na lista): `null` com a LAMP parada (pausa, fim, aguardando a segunda, semana zero).
 */
export const lampToday = (s?: Summary | null) => (lampRunning(s) ? lampLastDay(s) : null);

/**
 * O último dia que a LAMP tem: hoje, com a LAMP contando; em pausa, fim ou espera, o último dia ativo (a semana
 * congelada). `null` antes do primeiro dia. Abre a aba Input e limita os dias navegáveis da semana atual.
 */
export const lampLastDay = (s?: Summary | null) => {
    if (!s) return null;
    const { current_deda_day: day, current_deda_week: week } = s;
    if (!Number.isInteger(day) || day < 1 || week !== Math.ceil(day / 7)) return null;
    return { week, day: ((day - 1) % 7) + 1 };
};

/**
 * O DEDA de hoje. Relógio novo: `deda_today` (`null` enquanto a rotação da semana não sai); antes da primeira segunda,
 * o DEDA0 de treino. Legado: o último liberado. Depois da volta do círculo o de hoje não é o último de `unlocked_dedas`.
 */
export const todaysDedaId = (s?: Summary | null): string | null => {
    if (!s) return null;
    if (isCalendarClock(s)) return s.deda_today ?? (s.deda_calendar_day ? null : 'DEDA0');
    return s.unlocked_dedas?.[s.unlocked_dedas.length - 1] ?? null;
};

/**
 * Semana da LAMP em que o aluno fez o DEDA (aba Review, rótulo "Week n"). Relógio novo: a exibição mais recente com
 * semana na LAMP — uma repetição em pausa ou na volta do círculo não esconde a semana em que ele o fez; `null` = sem
 * semana na LAMP (liberado em pausa, DEDA0). Legado: a posição em `unlocked_dedas`, como sempre foi.
 */
export const dedaLampWeek = (s: Summary | null | undefined, dedaId: string): number | null => {
    if (!s) return null;
    if (isCalendarClock(s)) {
        const weeks = s.deda_weeks ?? [];
        for (let i = weeks.length - 1; i >= 0; i--)
            if (weeks[i].deda_id === dedaId && weeks[i].lamp_week) return weeks[i].lamp_week;
        return null;
    }
    const position = s.unlocked_dedas?.indexOf(dedaId) ?? -1;
    return position > 0 ? position : null;
};

/**
 * Os `n` DEDAs mais recentes, do mais novo para trás, sem repetir. Relógio novo: as exibições datadas (`deda_weeks`,
 * só semanas publicadas) e, por último, o DEDA0 de treino (como no legado, e o único antes da primeira segunda);
 * legado: o fim de `unlocked_dedas`.
 */
export const recentDedaIds = (s: Summary | null | undefined, n: number): string[] => {
    if (!s) return [];
    if (!isCalendarClock(s)) return (s.unlocked_dedas ?? []).slice(-n).reverse();
    const out: string[] = [];
    const weeks = s.deda_weeks ?? [];
    for (let i = weeks.length - 1; i >= 0 && out.length < n; i--) {
        const id = weeks[i].deda_id;
        if (id && !out.includes(id)) out.push(id);
    }
    if (out.length < n && s.unlocked_dedas?.includes('DEDA0') && !out.includes('DEDA0')) out.push('DEDA0');
    return out;
};

/** Seletor de semana da LAMP ("W4 · título"): só as semanas que a LAMP já teve, da primeira à atual. */
export const lampWeekOptions = (s: Summary | null | undefined, titles: Record<string, string>) => {
    if (!s) return [];
    const weeks: [number, string | null][] = isCalendarClock(s)
        ? (s.deda_weeks ?? []).flatMap((e) =>
              e.lamp_week ? [[e.lamp_week, e.deda_id] as [number, string | null]] : [],
          )
        : (s.unlocked_dedas ?? []).slice(1).map((id, i) => [i + 1, id]);
    return weeks.map(([n, id]) => ({
        value: `week${n}`,
        label: id && titles[id] ? `W${n} · ${titles[id]}` : `W${n}`,
    }));
};

const DAY_MS = 86_400_000;
const brasiliaDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' });
const isoPlus = (iso: string, n: number) =>
    new Date(Date.parse(`${iso}T12:00:00Z`) + n * DAY_MS).toISOString().slice(0, 10);
const isoDiff = (from: string, to: string) =>
    Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / DAY_MS);
/** segunda(d): a própria, se é segunda; senão a próxima (o início de um trecho da LAMP). */
const mondayOnOrAfter = (iso: string) => isoPlus(iso, (8 - (new Date(`${iso}T12:00:00Z`).getUTCDay() || 7)) % 7);

/**
 * Legado: a data (Brasília) do último dia da LAMP, o `current_deda_day`-ésimo dia ativo pelos trechos
 * [segunda(início_i), pausa_i] (ambos inclusos; o último aberto) — a mesma conta de calculateDays (§3.2). Ancora o
 * calendário da LAMP quando ela está parada (pausa, fim): o último dia não é hoje.
 */
export const legacyLampLastDate = (s?: Summary | null): string | null => {
    const n = s?.current_deda_day;
    if (!s || !Number.isInteger(n) || (n as number) < 1) return null;
    const day = (value: string) => brasiliaDay.format(new Date(value));
    const starts = (s.deda_start_dates ?? []).map((value) => mondayOnOrAfter(day(value)));
    const pauses = (s.deda_pause_dates ?? []).map(day);
    let left = n as number;
    for (let i = 0; i < starts.length; i++) {
        const len = pauses[i] ? Math.max(0, isoDiff(starts[i], pauses[i]) + 1) : Infinity;
        if (left <= len) return isoPlus(starts[i], left - 1);
        left -= len;
    }
    return null;
};

/**
 * Dia que goteja o HPEC depois do start (§3.5). Relógio novo: o dia de calendário desde a primeira segunda, em todo
 * estado depois dela (pausa não muda nada; voltar da pausa não tranca de novo). Legado: o dia ativo da LAMP — congelado
 * (`frozen`) em pausa, fim ou espera, em vez de abrir tudo (PF-19). `null` = antes do start: gotejamento pré-start.
 */
export const hpecDay = (s?: Summary | null): { day: number; frozen: boolean } | null => {
    if (!s) return null;
    if (isCalendarClock(s)) return s.deda_calendar_day ? { day: s.deda_calendar_day, frozen: false } : null;
    if (s.melp_status === 'DEDA_STARTED') return { day: s.current_deda_day, frozen: false };
    if (['DEDA_PAUSED', 'DEDA_FINISHED'].includes(s.melp_status) || s.current_deda_day > 0)
        return { day: s.current_deda_day ?? 0, frozen: true };
    return null;
};

/**
 * Relógio novo: os DEDAs exibidos a partir de `since` (AAAA-MM-DD), do mais recente para trás, sem repetir — as
 * linhas da aba Recordings (antes de o gravador existir não há gravação nem pedido).
 */
export const dedaIdsSince = (s: Summary | null | undefined, since: string): string[] => {
    const out: string[] = [];
    const weeks = s?.deda_weeks ?? [];
    for (let i = weeks.length - 1; i >= 0 && weeks[i].monday >= since; i--) {
        const id = weeks[i].deda_id;
        if (id && !out.includes(id)) out.push(id);
    }
    return out;
};

/** "Week 4 · Day 4": o único formato de semana e dia (inglês, sem zero à esquerda). */
export const weekDayLabel = (week: number, day: number) => `Week ${week} · Day ${day}`;

/**
 * Recusas da gravação da LAMP (corpo `{ code, message }`): 409 `LAMP_DAY_REPLACED` (a linha do dia foi substituída:
 * recarregar e tentar de novo), 409 `PROGRAM_INCONSISTENT` (LAMP em manutenção, sem saída para o aluno), 409
 * `LAMP_FINISHED` (be #148, legado) e 400 `EXPECTED_ROW_ID_REQUIRED`. Qualquer outro erro (rede, 5xx): tentar de novo.
 */
export const lampSaveError = (error: unknown): string | undefined =>
    (error as { response?: { data?: { code?: unknown } } } | null)?.response?.data?.code as string | undefined;

/** A frase do erro e se "Try again" faz sentido (inglês: tudo no Imerso é em inglês). */
export const lampSaveProblem = (error: unknown): { text: string; retry: boolean } => {
    switch (lampSaveError(error)) {
        case 'LAMP_FINISHED':
            return { text: 'Your LAMP has ended, so this can’t be saved.', retry: false };
        case 'PROGRAM_INCONSISTENT':
            return { text: 'LAMP under maintenance. The team has been notified.', retry: false };
        case 'LAMP_DAY_REPLACED':
        case 'EXPECTED_ROW_ID_REQUIRED':
            return { text: 'This LAMP day was updated. Please try again.', retry: true };
        // recusas do próprio front, conferidas na hora de gravar (hooks/melp/lamp.useSaveDedaInput)
        case 'LAMP_DAY_CHANGED':
            return { text: 'A new LAMP day has started. Please try again.', retry: true };
        case 'DEDA_NOT_TODAY':
            return { text: 'This DEDA can no longer be completed today.', retry: false };
        default:
            return { text: 'We couldn’t save. Check your connection and try again.', retry: true };
    }
};
