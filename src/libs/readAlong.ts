// Read-along (piloto, passo 4 da página nova do DEDA): destaque da palavra que o áudio original está dizendo.
// Os tempos vêm de align/<DEDA>.json no espelho de conteúdo (gerados na VPS por ~/.cache/readalong/align.py, com a
// MESMA tokenização daqui). O texto nunca muda: o destaque é só marcação na tela (CSS Custom Highlight API).

/** Palavra = letras/dígitos/apóstrofo; pontuação fica de fora. Igual ao align.py: `(?:[^\W_]|['’])+`. */
const WORD = /[\p{L}\p{M}\p{N}'’]+/gu;

/** [início, fim] de cada palavra dentro de um texto (um nó de texto: uma palavra nunca atravessa dois nós). */
export const wordSpans = (text: string): [number, number][] =>
    Array.from(text.matchAll(WORD), (m) => [m.index ?? 0, (m.index ?? 0) + m[0].length]);

type RichNode = { nodeType?: string; value?: string; content?: RichNode[] };

/** Palavras do rich text na ordem em que o ReaderProse as renderiza (nó a nó, como o align.py). */
export const wordsOfDocument = (doc: RichNode | null | undefined): string[] => {
    if (!doc) return [];
    if (doc.nodeType === 'text') return (doc.value ?? '').match(WORD) ?? [];
    return (doc.content ?? []).flatMap(wordsOfDocument);
};

export interface Alignment {
    dedaId: string;
    audioAssetId: string;
    durationMs: number;
    version: number;
    /** [início, fim] em ms, um por palavra da tokenização */
    words: [number, number][];
    /** palavras sem tempo próprio (interpoladas entre as vizinhas) */
    interpolated?: number[];
}

/** Versão pedida ao espelho: o cache do JSON é longo, trocar a versão troca a URL. */
export const READALONG_VERSION = 1;

/**
 * Endereço dos tempos: só quando o áudio vem do espelho (`<origem>/media/<assetId>/…`). Áudio do Contentful
 * (espelho desligado) = sem read-along.
 */
export const alignUrlFor = (audioUrl: string | undefined, dedaId: string): string | null => {
    if (!audioUrl || !/^DEDA\d{1,3}$/.test(dedaId)) return null;
    try {
        const u = new URL(audioUrl);
        return u.pathname.startsWith('/media/') ? `${u.origin}/align/${dedaId}.json?v=${READALONG_VERSION}` : null;
    } catch {
        return null;
    }
};

/** JSON confiável para este texto e este áudio? (mesma contagem de palavras, mesmo asset, tempos em ordem) */
export const isUsableAlignment = (a: unknown, dedaId: string, audioUrl: string, wordCount: number): a is Alignment => {
    const x = a as Alignment;
    if (!x || x.dedaId !== dedaId || !Array.isArray(x.words) || x.words.length !== wordCount || !wordCount)
        return false;
    if (!audioUrl.includes(`/media/${x.audioAssetId}/`)) return false;
    return x.words.every(
        (w, i) => Array.isArray(w) && Number.isFinite(w[0]) && w[1] >= w[0] && (i === 0 || w[0] >= x.words[i - 1][0]),
    );
};

/** Depois do fim de uma palavra, o destaque fica até a próxima começar, no máximo este tanto (pausas longas). */
const HOLD_MS = 1200;

/** Índice da palavra dita em `ms` (busca binária pelo início), ou -1 (antes da primeira ou numa pausa longa). */
export const wordAt = (words: [number, number][], ms: number): number => {
    let lo = 0;
    let hi = words.length - 1;
    let found = -1;
    while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (words[mid][0] <= ms) {
            found = mid;
            lo = mid + 1;
        } else hi = mid - 1;
    }
    return found >= 0 && ms <= words[found][1] + HOLD_MS ? found : -1;
};

/**
 * Faixas (Range) de cada palavra do texto renderizado em `root`, na ordem do documento. Notas de contexto abertas
 * (.inote) não fazem parte do texto do passo.
 */
export const wordRanges = (root: Element): Range[] => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: (n) => (n.parentElement?.closest('.inote') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    });
    const ranges: Range[] = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        for (const [s, e] of wordSpans((n as Text).data)) {
            const r = document.createRange();
            r.setStart(n, s);
            r.setEnd(n, e);
            ranges.push(r);
        }
    }
    return ranges;
};

/** Palavra (índice) que contém o ponto (nó, offset), por busca binária sobre as faixas em ordem; -1 se nenhuma. */
export const rangeIndexAt = (ranges: Range[], node: Node, offset: number): number => {
    let lo = 0;
    let hi = ranges.length - 1;
    while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        const c = ranges[mid].comparePoint(node, offset);
        if (c === 0) return mid;
        if (c < 0) hi = mid - 1;
        else lo = mid + 1;
    }
    return -1;
};

// ---------- marca do destaque: centrada nas letras ----------

/** Altura da marca (em) e folga lateral (em): centrada entre a linha de base e o topo das maiúsculas. */
export const MARK_EM = 1.3;
export const SIDE_EM = 0.14;

/** Posição da marca de uma palavra: centro óptico = linha de base − metade da altura das maiúsculas. */
export const markBox = (
    rect: { left: number; top: number; width: number },
    origin: { left: number; top: number },
    font: { size: number; ascent: number; cap: number },
) => {
    const baseline = rect.top + font.ascent;
    const height = MARK_EM * font.size;
    const center = baseline - font.cap / 2;
    return {
        left: rect.left - origin.left - SIDE_EM * font.size,
        top: center - height / 2 - origin.top,
        width: rect.width + 2 * SIDE_EM * font.size,
        height,
    };
};
