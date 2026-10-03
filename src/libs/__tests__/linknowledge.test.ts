import { editionArticles, formatEditionDate, splitAtMiddle } from '../linknowledge';

describe('linknowledge', () => {

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

    it('artigos da edição: ordem por dia, nulos fora; vazio mantém os links externos', () => {
        expect(editionArticles([{ day: 3 }, null, { day: 1 }]).map((a) => a.day)).toEqual([1, 3]);
        expect(editionArticles([])).toEqual([]);
        expect(editionArticles(undefined)).toEqual([]);
        expect(editionArticles(null)).toEqual([]);
    });
});
