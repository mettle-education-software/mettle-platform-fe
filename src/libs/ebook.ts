// E-book como produto da Plataforma (6-Out-2026): dados do produto e regras puras (testadas em libs/__tests__/ebook.test.ts).
// O acesso é o mesmo dos cursos (useProductAccess → /accounts/v2/me/access, roles na transição). O arquivo nunca tem
// endereço fixo: o Worker mettle-events confere o acesso do aluno e devolve um link de 10 min para ler/baixar o PDF.
// Sem entrada no Contentful por ora (cota do mês estourada até 1-Nov): os dados ficam aqui.
import type { AccessState } from './productAccess';

/** Produto em product_access / roles (mesmo nome que o Worker usa). */
export const EBOOK_PRODUCT = 'EBOOK_GUIA_COMPLETO';
export const EBOOK_PATH = '/guia';
/** Compra e renovação: o checkout do próprio e-book (libs/checkout). */
export { EBOOK_RENEW_URL, EBOOK_SALES_URL } from './checkout';
export const EBOOK_LINK_URL = 'https://events.mettle.com.br/plataforma/guia/link';

export const EBOOK = {
    title: 'Guia Completo para Aprender Inglês na Fase Adulta',
    subtitle: 'com Estratégias Simples e Comprovadas',
    author: 'André Floriano',
    description:
        'As 21 mentiras que travam o adulto, o que a neurociência diz sobre aprender, as 12 regras e o método para organizar o seu estudo.',
    pages: 136, // PDF em forma de livro (content/livro/build_book.py, 8-Out-2026)
    /** Folha de rosto e página de créditos: os mesmos textos de content/livro/00-abertura.md (o PDF usa os mesmos). */
    tagline:
        'Tudo o que nunca te contaram sobre como desenvolver as quatro habilidades — ler, escrever, falar e compreender — enquanto treina corretamente o seu cérebro para alcançar a fluência no inglês.',
    copyright: [
        ['© Mettle Educação — Todos os direitos reservados.', 'CNPJ: 26.157.146/0001-39'],
        [
            'Edição revisada e ampliada — 2026.',
            'Nenhuma parte desta obra pode ser reproduzida ou distribuída sem autorização prévia por escrito.',
        ],
        ['mettle.com.br'],
    ],
    /** Capa (frente, sem a lombada) e logos do leitor. */
    cover: '/img/ebook-capa-v2.webp',
    logoDark: '/img/ebook-logo-escuro.webp',
    logoLight: '/img/ebook-logo-claro.webp',
} as const;

export interface EbookLink {
    read: string;
    download: string;
    expiresAt: string;
}

/** Pode ler e baixar: ativo ou em carência (expirado e estornado não). */
export const ebookOpen = (state: AccessState) => state === 'active' || state === 'grace';

/** O link curto ainda serve para um clique (margem de 30 s antes de vencer). */
export const linkFresh = (link: EbookLink | null | undefined, now = Date.now()) =>
    !!link && Date.parse(link.expiresAt) - now > 30_000;

// ---------- leitor da Plataforma (edição web, 6-Out-2026) ----------
// Os capítulos vêm do Worker (GET /plataforma/guia/livro, com o token do aluno; nada público). O PDF ("Baixar") só
// aparece do 8º dia da compra em diante: o Worker recusa o link antes disso (403 NOT_YET) e a página não mostra nada.

export const EBOOK_READ_PATH = '/guia/ler';
export const EBOOK_BOOK_URL = 'https://events.mettle.com.br/plataforma/guia/livro';
export const EBOOK_POSITION_URL = 'https://events.mettle.com.br/plataforma/guia/posicao';
export const EBOOK_MARKS_URL = 'https://events.mettle.com.br/plataforma/guia/marcas';

export interface EbookChapter {
    slug: string;
    eyebrow: string;
    title: string;
    part: string;
    html: string;
}

/** Onde parou: capítulo, fração rolada (0..1) e quando. */
export interface EbookPosition {
    c: string;
    y: number;
    at: string;
}

/** Marcador: página marcada pelo deslocamento (caracteres) do seu primeiro caractere no capítulo. */
export interface EbookBookmark {
    id: string;
    c: string;
    o: number;
    x: string;
}
export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink';
export const HIGHLIGHT_COLORS: readonly HighlightColor[] = ['yellow', 'green', 'blue', 'pink'];
/** Destaque (com nota opcional): intervalo [s, e) de caracteres no texto do capítulo. */
export interface EbookHighlight {
    id: string;
    c: string;
    s: number;
    e: number;
    k: HighlightColor;
    n: string;
    x: string;
}

export interface EbookBook {
    chapters: EbookChapter[];
    position: EbookPosition | null;
    marks?: { bookmarks: EbookBookmark[]; highlights: EbookHighlight[] };
    /** token curto para gravar a posição e as marcas no Worker (sincroniza aparelhos); null = só leitura (impersonação) */
    save: string | null;
}

export const EBOOK_POSITION_KEY = 'ebookPosition';

export const readLocalPosition = (): EbookPosition | null => {
    try {
        const p = JSON.parse(window.localStorage.getItem(EBOOK_POSITION_KEY) ?? 'null');
        return p && typeof p.c === 'string' && typeof p.y === 'number' && typeof p.at === 'string' ? p : null;
    } catch {
        return null;
    }
};

export const saveLocalPosition = (p: EbookPosition) => {
    try {
        window.localStorage.setItem(EBOOK_POSITION_KEY, JSON.stringify(p));
    } catch {
        // modo privado / armazenamento bloqueado: vale só nesta visita
    }
};

/** Onde abrir: a posição mais recente entre a do aparelho e a do servidor (outro aparelho), se o capítulo existe. */
export const resumePosition = (
    chapters: Pick<EbookChapter, 'slug'>[],
    local: EbookPosition | null,
    server: EbookPosition | null,
): { index: number; y: number } => {
    const newest = [local, server]
        .filter((p): p is EbookPosition => !!p && chapters.some((c) => c.slug === p.c))
        .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))[0];
    if (!newest) return { index: 0, y: 0 };
    return { index: chapters.findIndex((c) => c.slug === newest.c), y: Math.min(1, Math.max(0, newest.y)) };
};

const ALLOWED_TAGS = new Set([
    'P',
    'H2',
    'H3',
    'H4',
    'STRONG',
    'EM',
    'B',
    'I',
    'U',
    'S',
    'SUP',
    'SUB',
    'BR',
    'HR',
    'UL',
    'OL',
    'LI',
    'BLOCKQUOTE',
    'A',
    'SPAN',
    'DIV',
    'TABLE',
    'THEAD',
    'TBODY',
    'TR',
    'TH',
    'TD',
]);
/** Removidos com o conteúdo (o resto que não está na lista perde só a tag e fica o texto). */
const DROP_TAGS = new Set([
    'SCRIPT',
    'STYLE',
    'IFRAME',
    'OBJECT',
    'EMBED',
    'LINK',
    'META',
    'FORM',
    'INPUT',
    'BUTTON',
    'TEXTAREA',
    'SELECT',
    'SVG',
    'MATH',
    'TEMPLATE',
    'NOSCRIPT',
    'IMG',
    'VIDEO',
    'AUDIO',
    'SOURCE',
    'PICTURE',
    'CANVAS',
    'BASE',
    'TITLE',
]);
const ALLOWED_CLASSES = new Set([
    'mentira-open',
    'refs', // lista das Referências (ABNT)
    'badge',
    'badge-red',
    'planos',
    'plano',
    'plano-nome',
    'plano-desc',
    'plano-btn',
]);

/**
 * HTML de um capítulo, limpo para entrar na página: só tags de texto, nada de script/estilo/mídia/eventos, classes
 * conhecidas do livro, ids de âncora. Links: externos (http/https/mailto) abrem em nova aba; "#âncora" e
 * "/guia/<capítulo>" ficam no leitor (data-anchor / data-chapter); qualquer outro endereço perde o link.
 * `parser` é o DOMParser do navegador (ou do jsdom nos testes).
 */
export const sanitizeChapter = (html: string, parser: DOMParser): string => {
    const doc = parser.parseFromString(`<body>${html}</body>`, 'text/html');
    const clean = (el: Element) => {
        for (const child of Array.from(el.children)) {
            const tag = child.tagName.toUpperCase();
            if (DROP_TAGS.has(tag)) {
                child.remove();
                continue;
            }
            clean(child);
            if (!ALLOWED_TAGS.has(tag)) {
                child.replaceWith(...Array.from(child.childNodes));
                continue;
            }
            const href = tag === 'A' ? (child.getAttribute('href') ?? '').trim() : '';
            const id = child.getAttribute('id');
            const classes = (child.getAttribute('class') ?? '').split(/\s+/).filter((c) => ALLOWED_CLASSES.has(c));
            for (const attr of Array.from(child.attributes)) child.removeAttribute(attr.name);
            if (classes.length) child.setAttribute('class', classes.join(' '));
            if (id && /^[\w-]{1,80}$/.test(id)) child.setAttribute('id', id);
            if (tag !== 'A') continue;
            const chapter = /^\/guia\/([a-z0-9-]+)\/?(?:#([\w-]+))?$/.exec(href);
            if (/^(https?:\/\/|mailto:)/i.test(href)) {
                child.setAttribute('href', href);
                child.setAttribute('target', '_blank');
                child.setAttribute('rel', 'noopener noreferrer');
            } else if (/^#[\w-]{1,80}$/.test(href)) {
                child.setAttribute('href', href);
                child.setAttribute('data-anchor', href.slice(1));
            } else if (chapter) {
                child.setAttribute('href', `${EBOOK_READ_PATH}?c=${chapter[1]}`);
                child.setAttribute('data-chapter', chapter[1]);
            }
        }
        // comentários e instruções de processamento fora
        for (const node of Array.from(el.childNodes)) if (node.nodeType !== 1 && node.nodeType !== 3) node.remove();
    };
    clean(doc.body);
    return doc.body.innerHTML;
};

// ---------- leitor paginado (8-Out-2026, como o Apple Books) ----------

/**
 * Medidas da página para a janela: duas páginas lado a lado no computador (≥ 1024 px, paisagem), uma no celular e no
 * tablet em pé. Proporções medidas no Apple Books: margem externa ≈ 9,4 % da largura, entre páginas ≈ 12,4 %, letra
 * ≈ 1/24 da largura da página com a Literata, mais larga que a do Apple Books (16–21 px), linha de no máximo ~30 em (a margem cresce nas telas largas).
 */
export const pageLayout = (width: number, height: number, scale = 1) => {
    const spread = width >= 1024 && width > height;
    if (spread) {
        let margin = Math.round(width * 0.094);
        const gap = Math.round(width * 0.124);
        let pageW = Math.floor((width - 2 * margin - gap) / 2);
        const font = Math.round(Math.min(21, Math.max(16, pageW / 24)) * scale * 10) / 10;
        const maxW = Math.round(font * 30);
        if (pageW > maxW) {
            pageW = maxW;
            margin = Math.floor((width - 2 * pageW - gap) / 2);
        }
        const top = Math.max(72, Math.round(height * 0.15));
        const bottom = Math.max(72, Math.round(height * 0.12));
        return { spread, margin, gap, pageW, pageH: height - top - bottom, top, bottom, font };
    }
    const margin = width < 600 ? 20 : Math.round(width * 0.1);
    const font = Math.round((width < 600 ? 18 : 19) * scale * 10) / 10;
    const top = 64;
    const bottom = 56;
    return {
        spread,
        margin,
        gap: 2 * margin,
        pageW: width - 2 * margin,
        pageH: height - top - bottom,
        top,
        bottom,
        font,
    };
};

/** Busca no texto dos capítulos (sem distinguir maiúsculas nem acentos): até `max` resultados com um trecho em volta. */
export const searchBook = (texts: string[], query: string, max = 100) => {
    const fold = (t: string) =>
        t
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();
    const q = fold(query.trim());
    const out: { i: number; at: number; before: string; hit: string; after: string }[] = [];
    if (q.length < 2) return out;
    texts.forEach((text, i) => {
        const folded = fold(text);
        let from = 0;
        while (out.length < max) {
            const at = folded.indexOf(q, from);
            if (at < 0) break;
            // posição no texto original: conta as marcas removidas antes de `at`
            const orig = originalIndex(text, at);
            const end = originalIndex(text, at + q.length);
            out.push({
                i,
                at: orig,
                before: (orig > 40 ? '…' : '') + text.slice(Math.max(0, orig - 40), orig).trimStart(),
                hit: text.slice(orig, end),
                after: text.slice(end, end + 60).trimEnd() + (end + 60 < text.length ? '…' : ''),
            });
            from = at + q.length;
        }
    });
    return out;
};

/** Índice no texto original correspondente ao índice `k` no texto sem acentos (NFD sem marcas). */
const originalIndex = (text: string, k: number) => {
    let seen = 0;
    for (let i = 0; i < text.length; i++) {
        if (seen === k) return i;
        seen += text[i].normalize('NFD').replace(/[\u0300-\u036f]/g, '').length;
    }
    return text.length;
};

/** Id de marca gerado no aparelho (aceito pelo Worker: 8–40 caracteres [A-Za-z0-9_-]). */
export const markId = () =>
    `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`.replace(/[^\w-]/g, '').slice(0, 40);

/** Aspas e apóstrofos tipográficos (um caractere por outro: os deslocamentos das marcas não mudam). */
export const smartQuotes = (text: string) =>
    text
        .replace(/(^|[\s([{\u2014\u2013-])"/g, '$1\u201c')
        .replace(/"/g, '\u201d')
        .replace(/(\p{L})'(\p{L})/gu, '$1\u2019$2')
        .replace(/(^|[\s([{\u2014\u2013-])'/g, '$1\u2018')
        .replace(/'/g, '\u2019');
