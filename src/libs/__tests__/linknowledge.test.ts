import { formatEditionDate, linKnowledgeArticlePath, readingMinutes, splitAtMiddle } from '../linknowledge';

describe('linknowledge', () => {
    it('tempo de leitura ≈ palavras/200, mínimo 1', () => {
        expect(readingMinutes(1000)).toBe(5);
        expect(readingMinutes(0)).toBe(1);
        expect(readingMinutes(undefined)).toBe(1);
    });

    it('rota do leitor usa o slug do DEDA', () => {
        expect(linKnowledgeArticlePath('london', 3)).toBe('/imerso/deda/london/articles/3');
    });

    it('data da edição em inglês, sem deslocar o dia', () => {
        expect(formatEditionDate('2026-09-28')).toBe('28 September 2026');
        expect(formatEditionDate(null)).toBeNull();
    });

    it('corta o corpo ao meio logo depois de um parágrafo', () => {
        const n = (nodeType: string) => ({ nodeType });
        const [a, b] = splitAtMiddle([n('paragraph'), n('heading-2'), n('paragraph'), n('paragraph')]);
        expect(a.map((x) => x.nodeType)).toEqual(['paragraph', 'heading-2', 'paragraph']);
        expect(b).toHaveLength(1);
        expect(splitAtMiddle([])).toEqual([[], []]);
    });
});
