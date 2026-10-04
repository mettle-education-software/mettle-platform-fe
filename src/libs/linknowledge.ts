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
 * (mesma regra do `isTodaysDeda` do DedaSteps). Só com o programa em andamento; em qualquer dúvida, null.
 */
export const todayCardDay = (
    summary:
        | Pick<MelpSummaryResponse['data'], 'melp_status' | 'current_deda_day' | 'current_deda_week' | 'unlocked_dedas'>
        | null
        | undefined,
    dedaId: string,
): number | null => {
    if (!summary || summary.melp_status !== 'DEDA_STARTED') return null;
    const { current_deda_day: day, current_deda_week: week, unlocked_dedas: unlocked } = summary;
    if (!Number.isInteger(day) || day < 1 || week !== Math.ceil(day / 7)) return null;
    if (!dedaId || unlocked?.[unlocked.length - 1] !== dedaId) return null;
    return ((day - 1) % 7) + 1;
};
