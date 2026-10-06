import { JSDOM } from 'jsdom';
import { resumePosition, sanitizeChapter } from '../ebook';

const parser = new new JSDOM('').window.DOMParser();
const clean = (html: string) => sanitizeChapter(html, parser);

describe('sanitizeChapter', () => {
    it('mantém o texto do livro e as classes conhecidas', () => {
        const html =
            '<div class="mentira-open" id="mentira-1"><span class="badge badge-red">Mentira nº 01</span><h3>…que é possível.</h3></div><p>Texto <strong>forte</strong> e <em>itálico</em>.</p>';
        expect(clean(html)).toBe(html);
    });

    it('tira script, estilo, mídia, eventos e classes estranhas', () => {
        const out = clean(
            '<p onclick="x()" style="color:red" class="ui-new">a<script>alert(1)</script><img src=x onerror="y()">b</p><style>p{}</style><iframe src="//x"></iframe><svg><script>z()</script></svg>',
        );
        expect(out).toBe('<p>ab</p>');
    });

    it('desembrulha tags desconhecidas sem perder o texto', () => {
        expect(clean('<div><font color="red">texto</font> <section>mais</section></div>')).toBe(
            '<div>texto mais</div>',
        );
    });

    it('links: externos em nova aba; âncora e capítulo ficam no leitor; javascript: perde o link', () => {
        expect(clean('<a href="https://www.edx.org" onclick="x">edX</a>')).toBe(
            '<a href="https://www.edx.org" target="_blank" rel="noopener noreferrer">edX</a>',
        );
        expect(clean('<a href="mailto:hello@mettle.com.br">e-mail</a>')).toContain('target="_blank"');
        expect(clean('<a href="#mentira-3">nº 3</a>')).toBe('<a href="#mentira-3" data-anchor="mentira-3">nº 3</a>');
        expect(clean('<a href="/guia/regra-2">Regra 2</a>')).toBe(
            '<a href="/guia/ler?c=regra-2" data-chapter="regra-2">Regra 2</a>',
        );
        expect(clean('<a href="javascript:alert(1)">x</a>')).toBe('<a>x</a>');
        expect(clean('<a href="//evil.com">x</a>')).toBe('<a>x</a>');
    });
});

describe('resumePosition', () => {
    const chapters = [{ slug: 'a' }, { slug: 'b' }, { slug: 'c' }];
    it('abre na posição mais recente entre aparelho e servidor', () => {
        const local = { c: 'b', y: 0.3, at: '2026-10-07T10:00:00Z' };
        const server = { c: 'c', y: 0.6, at: '2026-10-07T11:00:00Z' };
        expect(resumePosition(chapters, local, server)).toEqual({ index: 2, y: 0.6 });
        expect(resumePosition(chapters, { ...local, at: '2026-10-07T12:00:00Z' }, server)).toEqual({
            index: 1,
            y: 0.3,
        });
    });
    it('sem posição ou capítulo que não existe mais: começo do livro', () => {
        expect(resumePosition(chapters, null, null)).toEqual({ index: 0, y: 0 });
        expect(resumePosition(chapters, { c: 'zz', y: 0.5, at: '2026-10-07T10:00:00Z' }, null)).toEqual({
            index: 0,
            y: 0,
        });
    });
});
