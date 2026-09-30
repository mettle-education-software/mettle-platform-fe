import { JSDOM } from 'jsdom';

// Allowlist: tudo que não estiver aqui sai. Tags de DROP somem com o conteúdo;
// as demais tags desconhecidas são desembrulhadas (fica só o texto/filhos).
const ALLOWED_TAGS = new Set([
    'a',
    'abbr',
    'article',
    'b',
    'blockquote',
    'br',
    'caption',
    'cite',
    'code',
    'dd',
    'del',
    'div',
    'dl',
    'dt',
    'em',
    'figcaption',
    'figure',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'hr',
    'i',
    'ins',
    'kbd',
    'li',
    'mark',
    'ol',
    'p',
    'pre',
    'q',
    's',
    'section',
    'small',
    'span',
    'strong',
    'sub',
    'sup',
    'table',
    'tbody',
    'td',
    'tfoot',
    'th',
    'thead',
    'time',
    'tr',
    'u',
    'ul',
]);
const DROP_WITH_CONTENT = new Set([
    'script',
    'style',
    'iframe',
    'frame',
    'frameset',
    'object',
    'embed',
    'form',
    'input',
    'button',
    'textarea',
    'select',
    'template',
    'noscript',
    'svg',
    'math',
    'img',
    'image',
    'picture',
    'video',
    'audio',
    'source',
    'link',
    'meta',
    'base',
]);
const ALLOWED_ATTRS: Record<string, Set<string>> = {
    '*': new Set(['title', 'lang', 'dir']),
    a: new Set(['href']),
    td: new Set(['colspan', 'rowspan']),
    th: new Set(['colspan', 'rowspan', 'scope']),
    time: new Set(['datetime']),
    ol: new Set(['start']),
};
const SAFE_HREF = /^(https?:|mailto:)/i;

export const sanitizeHtml = (html: string) => {
    const { document, Node } = new JSDOM(`<body>${html}</body>`).window;

    const clean = (parent: Element) => {
        [...parent.childNodes].forEach((node) => {
            if (node.nodeType === Node.COMMENT_NODE) return node.remove();
            if (node.nodeType !== Node.ELEMENT_NODE) return;
            const el = node as Element;
            const tag = el.tagName.toLowerCase();

            if (DROP_WITH_CONTENT.has(tag)) return el.remove();
            clean(el);
            if (!ALLOWED_TAGS.has(tag)) return el.replaceWith(...el.childNodes);

            [...el.attributes].forEach(({ name }) => {
                if (!ALLOWED_ATTRS['*'].has(name) && !ALLOWED_ATTRS[tag]?.has(name)) el.removeAttribute(name);
            });
            if (tag === 'a') {
                // Remove espaços/controles que navegadores ignoram (ex.: "java\tscript:").
                const href = (el.getAttribute('href') ?? '').replace(/[\u0000- ]/g, '');
                if (SAFE_HREF.test(href)) {
                    el.setAttribute('target', '_blank');
                    el.setAttribute('rel', 'noopener noreferrer nofollow');
                } else {
                    el.removeAttribute('href');
                }
            }
        });
    };

    clean(document.body);
    return document.body.innerHTML;
};
