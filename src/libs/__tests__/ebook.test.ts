import { ebookOpen, linkFresh } from '../ebook';

describe('ebook', () => {
    it('lê e baixa só com acesso ativo ou em carência', () => {
        expect(ebookOpen('active')).toBe(true);
        expect(ebookOpen('grace')).toBe(true);
        expect(ebookOpen('expired')).toBe(false);
        expect(ebookOpen('none')).toBe(false);
    });

    it('link curto vale até 30 s antes de vencer', () => {
        const now = Date.parse('2026-10-06T12:00:00Z');
        const link = (s: number) => ({ read: 'r', download: 'd', expiresAt: new Date(now + s * 1000).toISOString() });
        expect(linkFresh(link(600), now)).toBe(true);
        expect(linkFresh(link(20), now)).toBe(false);
        expect(linkFresh(null, now)).toBe(false);
    });
});
