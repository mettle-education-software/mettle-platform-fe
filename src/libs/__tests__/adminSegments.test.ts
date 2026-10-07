import { ADMIN_SEGMENTS, onlyBuyers } from '../adminSegments';

describe('segmentos do painel de administração', () => {
    it('três segmentos, na ordem da tela; o do e-book usa no_imerso no servidor', () => {
        expect(ADMIN_SEGMENTS.map((s) => s.label)).toEqual(['Imerso', 'Masterclass sem Imerso', 'E-book sem Imerso']);
        expect(ADMIN_SEGMENTS.find((s) => s.ebook)?.server).toBe('no_imerso');
    });
    it('cruza por e-mail sem diferença de maiúsculas e espaços', () => {
        const users = [{ email: 'Ana@X.test ' }, { email: 'bia@x.test' }, { email: null }, {}];
        expect(onlyBuyers(users, [' ana@x.test', 'cai@x.test'])).toEqual([{ email: 'Ana@X.test ' }]);
        expect(onlyBuyers(users, [])).toEqual([]);
    });
});
