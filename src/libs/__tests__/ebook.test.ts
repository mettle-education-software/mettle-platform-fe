import { ebookOpen, linkFresh, markId, pageLayout, searchBook, smartQuotes } from '../ebook';

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

    it('página: duas lado a lado no computador, uma no celular; proporções do Apple Books', () => {
        const d = pageLayout(1366, 900);
        expect(d.spread).toBe(true);
        expect(2 * d.margin + 2 * d.pageW + d.gap).toBeLessThanOrEqual(1366);
        expect(d.font).toBeGreaterThanOrEqual(16);
        expect(d.font).toBeLessThanOrEqual(22);
        const wide = pageLayout(1920, 1080);
        expect(wide.pageW).toBeLessThanOrEqual(Math.round(wide.font * 30)); // linha não passa de ~30 em
        const phone = pageLayout(390, 844);
        expect(phone.spread).toBe(false);
        expect(phone.margin).toBe(20);
        expect(phone.gap).toBe(40); // a página vizinha fica fora da tela
        expect(pageLayout(1024, 1366).spread).toBe(false); // tablet em pé
        expect(pageLayout(1366, 900, 1.3).font).toBeGreaterThan(d.font);
    });

    it('busca sem acento nem maiúscula, com trecho em volta e posição no texto original', () => {
        const texts = ['O cérebro aprende com repetição espaçada.', 'Nada aqui.', 'Cerebro de novo e CÉREBRO.'];
        const r = searchBook(texts, 'cerebro');
        expect(r.map((x) => x.i)).toEqual([0, 2, 2]);
        expect(r[0].hit).toBe('cérebro');
        expect(texts[0].slice(r[0].at, r[0].at + 7)).toBe('cérebro');
        expect(r[2].hit).toBe('CÉREBRO');
        expect(searchBook(texts, 'a')).toEqual([]);
        expect(searchBook(texts, 're', 2)).toHaveLength(2);
    });

    it('id de marca aceito pelo Worker', () => {
        for (let i = 0; i < 20; i++) expect(markId()).toMatch(/^[\w-]{8,40}$/);
    });

    it('aspas tipográficas sem mudar o comprimento do texto', () => {
        const t = 'Ele disse: "Senhores, (\'vamos\')" e d\'água - "fim".';
        const out = smartQuotes(t);
        expect(out).toBe('Ele disse: \u201cSenhores, (\u2018vamos\u2019)\u201d e d\u2019água - \u201cfim\u201d.');
        expect(out).toHaveLength(t.length);
    });
});
