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
 * Faixas (Range) de cada palavra do texto renderizado em `root`, na ordem do documento, e os textos dos nós (`runs`,
 * com "\n" entre parágrafos) para os blocos. Notas de contexto abertas (.inote) não fazem parte do texto do passo.
 */
export const wordRanges = (root: Element): { ranges: Range[]; runs: string[] } => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: (n) => (n.parentElement?.closest('.inote') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    });
    const ranges: Range[] = [];
    const runs: string[] = [];
    let block: Element | null | undefined;
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const b = n.parentElement?.closest('p, li, h1, h2, h3, h4, h5, h6, blockquote');
        if (block !== undefined && b !== block) runs.push('\n');
        block = b;
        runs.push((n as Text).data);
        for (const [s, e] of wordSpans((n as Text).data)) {
            const r = document.createRange();
            r.setStart(n, s);
            r.setEnd(n, e);
            ranges.push(r);
        }
    }
    return { ranges, runs };
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

// ---------- modos: palavra, bloco de sentido, sentença ----------

export type ReadAlongMode = 'word' | 'phrase' | 'sentence';
export const READALONG_MODES: ReadAlongMode[] = ['word', 'phrase', 'sentence'];

/** [primeira, última] palavra de um bloco (índices da tokenização). */
export type Block = [number, number];

/** Palavras que não fecham bem um bloco (artigo, preposição, conjunção, possessivo): o corte prefere outro ponto. */
const WEAK_END = new Set(
    (
        'a an the of to in on at for with from by about into onto over under as than and or but nor so if that ' +
        'my your our their his her its this these those who which what when where whose i we they he she ' +
        'all some any every each no very do does did will would can could should'
    ).split(' '),
);
/** Bons começos de bloco: conjunção, preposição, relativo ("…ten years | and the others | to tell us…"). */
const STARTERS = new Set(
    (
        'and but or so because although though while when where which who whom whose that what how why if than as ' +
        'to of in on at for with from by about into over under after before until without through during like'
    ).split(' '),
);
/** Partícula de verbo frasal: não começa bloco ("does slow down", "back up"). */
const PARTICLES = new Set(['up', 'down', 'out', 'off', 'away', 'back']);
const ABBREV = new Set(['mr', 'mrs', 'ms', 'dr', 'st', 'vs', 'jr', 'sr']);
const MIN_CHUNK = 4;
const MAX_CHUNK = 7;

/**
 * Palavras e o texto entre elas (gaps[i] = o que vem depois da palavra i), a partir dos textos na ordem renderizada.
 * `runs` = um texto por nó; "\n" entre parágrafos. Mesma tokenização de wordSpans.
 */
export const wordsAndGaps = (runs: string[]) => {
    const words: string[] = [];
    const gaps: string[] = [];
    let pending = '';
    for (const run of runs) {
        let last = 0;
        for (const [s, e] of wordSpans(run)) {
            if (words.length) gaps[words.length - 1] = pending + run.slice(last, s);
            words.push(run.slice(s, e));
            pending = '';
            last = e;
        }
        pending += run.slice(last);
    }
    if (words.length) gaps[words.length - 1] = pending;
    return { words, gaps };
};

const startsSentence = (w: string | undefined) => w === undefined || /^[\p{Lu}\p{N}]/u.test(w);

/** Fim de sentença depois da palavra i: . ? ! … seguidos de maiúscula (ou fim); parágrafo novo sempre. */
const endsSentence = (words: string[], gaps: string[], i: number) => {
    const g = gaps[i] ?? '';
    if (g.includes('\n')) return true;
    if (!/[.?!…]/.test(g) || !startsSentence(words[i + 1])) return false;
    if (/^\.$/.test(g) && /\d$/.test(words[i]) && /^\d/.test(words[i + 1] ?? '')) return false; // 1.5
    return !(/^\.\s/.test(g) && ABBREV.has(words[i].toLowerCase()));
};

/** Pausa de sentido depois da palavra i: pontuação (, ; : . ? ! … — parênteses) ou travessão entre espaços. */
const endsPhrase = (words: string[], gaps: string[], i: number) => {
    const g = gaps[i] ?? '';
    if (endsSentence(words, gaps, i) || /[,;:?!…—()]/.test(g) || /\s[–-]\s/.test(g)) return true;
    if (/\s["“]$/.test(g)) return true; // abre aspas: We call this | "The End of History Illusion."
    return /\.\s/.test(g) && !ABBREV.has(words[i].toLowerCase()); // ponto seguido de minúscula ("e.g. this")
};

/**
 * Corta [s, e] (sem pontuação dentro) em pedaços de 4–7 palavras com o menor custo: evita terminar em artigo ou
 * preposição, prefere começar o pedaço seguinte por conjunção/preposição/pronome relativo e nunca parte palavra com
 * hífen. Um pedaço de 3 só entra quando poupa um corte ruim ("to the reports | of people who were 28").
 */
const splitLong = (words: string[], gaps: string[], s: number, e: number, out: Block[]) => {
    const n = e - s + 1;
    if (n <= MAX_CHUNK) {
        out.push([s, e]);
        return;
    }
    const cost = (end: number, size: number) => {
        if (end === e) return size < MIN_CHUNK ? 2 : 0;
        if (!/\s/.test(gaps[end] ?? '')) return 100; // decision-making, Here['s]
        return (
            0.3 * Math.abs(size - 5.5) +
            (size < MIN_CHUNK ? 2 : 0) +
            (WEAK_END.has(words[end].toLowerCase()) || /^\d/.test(words[end]) ? 3 : 0) + // "pay 129 | dollars"
            (STARTERS.has(words[end + 1].toLowerCase()) ? 0 : 1.5) +
            (PARTICLES.has(words[end + 1].toLowerCase()) ? 2 : 0) // "slow | down as we age"
        );
    };
    // best[k] = menor custo para cortar as k primeiras palavras; size[k] = tamanho do último pedaço
    const best = [0];
    const last = [0];
    for (let k = 1; k <= n; k++) {
        best[k] = Infinity;
        for (let size = MIN_CHUNK - 1; size <= Math.min(MAX_CHUNK, k); size++) {
            const c = best[k - size] + cost(s + k - 1, size);
            if (c < best[k]) [best[k], last[k]] = [c, size];
        }
    }
    const cuts: Block[] = [];
    for (let k = n; k > 0; k -= last[k]) cuts.unshift([s + k - last[k], s + k - 1]);
    out.push(...cuts);
};

/** Blocos do modo: 'sentence' = sentenças; 'phrase' = pausas de sentido, e trechos longos em pedaços de 4–7. */
export const blocksOf = (words: string[], gaps: string[], mode: ReadAlongMode): Block[] => {
    const out: Block[] = [];
    let start = 0;
    for (let i = 0; i < words.length; i++) {
        if (mode === 'word') out.push([i, i]);
        else if (i === words.length - 1 || (mode === 'sentence' ? endsSentence : endsPhrase)(words, gaps, i)) {
            if (mode === 'phrase') splitLong(words, gaps, start, i, out);
            else out.push([start, i]);
            start = i + 1;
        }
    }
    if (mode !== 'phrase') return out;
    // "So," "Now," "You see,": bloco de 1–2 palavras (sem fim de sentença) vai junto com o seguinte, se couber em 7
    const merged: Block[] = [];
    for (const b of out) {
        const prev = merged[merged.length - 1];
        if (prev && prev[1] - prev[0] < 2 && !endsSentence(words, gaps, prev[1]) && b[1] - prev[0] < MAX_CHUNK)
            prev[1] = b[1];
        else merged.push(b);
    }
    return merged;
};

/** Índice do bloco que contém a palavra i (busca binária), ou -1. */
export const blockAt = (blocks: Block[], i: number): number => {
    let lo = 0;
    let hi = blocks.length - 1;
    while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (blocks[mid][1] < i) lo = mid + 1;
        else if (blocks[mid][0] > i) hi = mid - 1;
        else return mid;
    }
    return -1;
};

type Rect = { left: number; top: number; width: number; height: number };

/** Junta os retângulos das palavras de um bloco numa faixa por linha visual (mesmo topo, com tolerância). */
export const lineRects = (rects: Rect[], tolerance: number): Rect[] => {
    const lines: Rect[] = [];
    for (const r of rects) {
        if (!r.width) continue;
        const line = lines.find((l) => Math.abs(l.top - r.top) <= tolerance);
        if (!line) {
            lines.push({ left: r.left, top: r.top, width: r.width, height: r.height }); // DOMRect: getters, sem spread
            continue;
        }
        const right = Math.max(line.left + line.width, r.left + r.width);
        line.left = Math.min(line.left, r.left);
        line.width = right - line.left;
        line.top = Math.min(line.top, r.top);
        line.height = Math.max(line.height, r.height);
    }
    return lines;
};
