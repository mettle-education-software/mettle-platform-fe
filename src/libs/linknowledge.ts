import type { MelpSummaryResponse } from 'interfaces/melp';

// Artigos do DEDA LinKnowledge escritos pelo Mettle Editor (tipo `linKnowledgeArticle` no Contentful).

export const GENRE_LABELS: Record<string, string> = {
    report: 'Report',
    explainer: 'Explainer',
    history: 'History',
    'science-data': 'Science & Data',
    debate: 'Debate',
    profile: 'Profile',
    'practical-future': 'Practical & Future',
};

export const formatEditionDate = (date?: string | null) =>
    date
        ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
              new Date(date),
          )
        : null;

/** Divide os blocos do corpo ao meio (depois de um parágrafo) para a 2ª imagem entrar no meio do texto. */
export const splitAtMiddle = <T extends { nodeType: string }>(nodes: T[]): [T[], T[]] => {
    let cut = Math.ceil(nodes.length / 2);
    while (cut < nodes.length && nodes[cut - 1]?.nodeType !== 'paragraph') cut++;
    return [nodes.slice(0, cut), nodes.slice(cut)];
};

/** Artigos da edição na ordem dos dias; lista vazia = o DEDA ainda usa os links externos. */
export const editionArticles = <T extends { day: number }>(items?: (T | null)[] | null): T[] =>
    (items ?? []).filter((item): item is T => !!item).sort((a, b) => a.day - b.day);

/**
 * Dia (1 a 7) do card a destacar no LinKnowledge, ou null.
 * O backend conta `current_deda_day` do início do programa (1, 2, 3...) e `current_deda_week` = ceil(dia / 7);
 * o dia dentro do DEDA da semana é, portanto, ((dia - 1) % 7) + 1. O DEDA da semana é o último de `unlocked_dedas`
 * (mesma regra do `isTodaysDeda` do DedaSteps). Em qualquer dúvida, null.
 * Programa concluído (lista congelada; é o caso das contas da equipe): se o DEDA aberto é o da semana na rotação
 * (`rotationDedaId`), vale o dia do calendário em Brasília (segunda = 1 ... domingo = 7).
 */
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const calendarDedaDay = (now: Date = new Date()): number | null => {
    const day = WEEKDAYS.indexOf(
        new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', weekday: 'short' }).format(now),
    );
    return day < 0 ? null : day + 1;
};

export const todayCardDay = (
    summary:
        | Pick<
              MelpSummaryResponse['data'],
              | 'melp_status'
              | 'current_deda_day'
              | 'current_deda_week'
              | 'unlocked_dedas'
              | 'deda_clock'
              | 'deda_today'
              | 'deda_calendar_day'
          >
        | null
        | undefined,
    dedaId: string,
    rotationDedaId?: string | null,
    now?: Date,
): number | null => {
    // relógio novo: o DEDA segue o calendário em todo estado pós-start (pausa e espera da segunda incluídas)
    if (summary?.deda_clock === 'calendar')
        return dedaId && dedaId === summary.deda_today && summary.deda_calendar_day ? calendarDedaDay(now) : null;
    if (summary?.melp_status === 'DEDA_FINISHED')
        return dedaId && dedaId === rotationDedaId ? calendarDedaDay(now) : null;
    if (!summary || summary.melp_status !== 'DEDA_STARTED') return null;
    const { current_deda_day: day, current_deda_week: week, unlocked_dedas: unlocked } = summary;
    if (!Number.isInteger(day) || day < 1 || week !== Math.ceil(day / 7)) return null;
    if (!dedaId || unlocked?.[unlocked.length - 1] !== dedaId) return null;
    return ((day - 1) % 7) + 1;
};
