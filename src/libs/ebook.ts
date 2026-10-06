// E-book como produto da Plataforma (6-Out-2026): dados do produto e regras puras (testadas em libs/__tests__/ebook.test.ts).
// O acesso é o mesmo dos cursos (useProductAccess → /accounts/v2/me/access, roles na transição). O arquivo nunca tem
// endereço fixo: o Worker mettle-events confere o acesso do aluno e devolve um link de 10 min para ler/baixar o PDF.
// Sem entrada no Contentful por ora (cota do mês estourada até 1-Nov): os dados ficam aqui.
import type { AccessState } from './productAccess';

/** Produto em product_access / roles (mesmo nome que o Worker usa). */
export const EBOOK_PRODUCT = 'EBOOK_GUIA_COMPLETO';
export const EBOOK_PATH = '/guia';
export const EBOOK_LINK_URL = 'https://events.mettle.com.br/plataforma/guia/link';

export const EBOOK = {
    title: 'Guia Completo para Aprender Inglês na Fase Adulta',
    subtitle: 'com Estratégias Simples e Comprovadas',
    author: 'André Floriano',
    description:
        'As 21 mentiras que travam o adulto, o que a neurociência diz sobre aprender, as 12 regras e o método para organizar o seu estudo.',
    pages: 123,
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

export interface EbookBook {
    chapters: EbookChapter[];
    position: EbookPosition | null;
    /** token curto para gravar a posição no Worker (sincroniza aparelhos) */
    save: string;
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
