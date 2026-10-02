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
