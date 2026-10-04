import { INLINES, BLOCKS } from '@contentful/rich-text-types';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { RichTextRenderer, transformRichTextToString } from '../../components/atoms/RichTextRenderer/RichTextRenderer';
import { findContextNote, safeNoteImageUrl, splitParagraphs } from '../contextNotes';

const text = (value: string) => ({ nodeType: 'text', value, marks: [], data: {} });
const doc = (inline: object) => ({
    nodeType: BLOCKS.DOCUMENT,
    data: {},
    content: [{ nodeType: BLOCKS.PARAGRAPH, data: {}, content: [text('Veio o '), inline, text(' depois.')] }],
});
const entryLink = (id: string) => ({
    nodeType: INLINES.ENTRY_HYPERLINK,
    data: { target: { sys: { id, type: 'Link', linkType: 'Entry' } } },
    content: [text('Brexit')],
});
const links = {
    assets: { block: [] },
    entries: {
        hyperlink: [
            { sys: { id: 'note-brexit' }, term: 'Brexit', body: 'Primeiro.\n\nSegundo.' },
            { sys: { id: 'outro-tipo' } },
        ],
    },
};
const render = (rawContent: any, l?: any) =>
    renderToStaticMarkup(createElement(RichTextRenderer, { rawContent, links: l }));

describe('contextNotes', () => {
    it('divide o corpo em parágrafos por linha em branco', () => {
        expect(splitParagraphs('a\n\nb\r\n\r\n  c  \n\n')).toEqual(['a', 'b', 'c']);
    });

    it('só aceita imagem https de images.ctfassets.net', () => {
        expect(safeNoteImageUrl('https://images.ctfassets.net/x/y.png')).not.toBeNull();
        expect(safeNoteImageUrl('https://evil.example/x.png')).toBeNull();
        expect(safeNoteImageUrl('http://images.ctfassets.net/x.png')).toBeNull();
        expect(safeNoteImageUrl('javascript:alert(1)')).toBeNull();
        expect(safeNoteImageUrl(undefined)).toBeNull();
    });

    it('acha a nota; outro tipo, ausente ou incompleta dá null', () => {
        expect(findContextNote('note-brexit', links)?.paragraphs).toEqual(['Primeiro.', 'Segundo.']);
        expect(findContextNote('outro-tipo', links)).toBeNull();
        expect(findContextNote('nao-existe', links)).toBeNull();
        expect(findContextNote('note-brexit', undefined)).toBeNull();
        expect(findContextNote(undefined, links)).toBeNull();
    });
});

describe('RichTextRenderer: entry-hyperlink', () => {
    it('nota presente vira botão acessível', () => {
        const html = render(doc(entryLink('note-brexit')), links);
        expect(html).toContain('role="button"');
        expect(html).toContain('aria-expanded="false"');
        expect(html).toContain('aria-haspopup="dialog"');
        expect(html).toContain('Brexit');
        expect(html).not.toContain('<a ');
    });

    it('nota ausente ou de outro tipo vira texto simples, sem quebrar', () => {
        for (const id of ['nao-existe', 'outro-tipo']) {
            const html = render(doc(entryLink(id)), links);
            expect(html).toContain('Veio o Brexit depois.');
            expect(html).not.toContain('role="button"');
            expect(html).not.toContain('type: entry-hyperlink');
        }
        expect(render(doc(entryLink('note-brexit')))).toContain('Veio o Brexit depois.');
    });

    it('hyperlink externo continua como antes', () => {
        const ext = { nodeType: INLINES.HYPERLINK, data: { uri: 'https://example.com/x' }, content: [text('site')] };
        const html = render(doc(ext), links);
        expect(html).toContain('href="https://example.com/x"');
        expect(html).toContain('target="_blank"');
    });
});

describe('transformRichTextToString (citação do cabeçalho)', () => {
    const quote = (l?: any) =>
        renderToStaticMarkup(
            createElement(
                'div',
                null,
                transformRichTextToString({ rawContent: doc(entryLink('note-brexit')) as any, links: l }),
            ),
        );

    it('nota presente vira botão; ausente ou sem links vira texto simples', () => {
        expect(quote(links)).toContain('role="button"');
        expect(quote(links)).toContain('>Brexit<');
        expect(quote({ entries: { hyperlink: [] } })).not.toContain('role="button"');
        expect(quote()).toContain('Brexit');
    });
});
