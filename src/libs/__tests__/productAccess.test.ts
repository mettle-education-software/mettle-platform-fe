import { isImersoRouteAllowedWhenExpired, resolveAccess } from '../productAccess';

describe('resolveAccess', () => {
    const api = {
        products: { METTLE_STUDENT: { state: 'expired' as const, expiresAt: '2026-01-01' } },
        imerso: { week: 74, dedasConcluded: 83 },
    };

    it('usa a validade do backend quando existe linha do produto', () => {
        expect(resolveAccess('METTLE_STUDENT', ['METTLE_STUDENT'], api).state).toBe('expired');
    });

    it('cai nas roles quando o produto não tem linha ou o endpoint falhou', () => {
        expect(resolveAccess('MASTERCLASS_X', ['MASTERCLASS_X'], api).state).toBe('active');
        expect(resolveAccess('METTLE_STUDENT', ['METTLE_STUDENT'], undefined).state).toBe('active');
        expect(resolveAccess('METTLE_STUDENT', [], undefined).state).toBe('none');
    });

    it('admin tem acesso a tudo, salvo quando o backend devolve a linha (impersonação)', () => {
        expect(resolveAccess('METTLE_STUDENT', ['METTLE_ADMIN'], undefined).state).toBe('active');
        expect(resolveAccess('METTLE_STUDENT', ['METTLE_ADMIN'], api).state).toBe('expired');
    });
});

describe('isImersoRouteAllowedWhenExpired', () => {
    it.each([
        '/',
        '/imerso',
        '/imerso/',
        '/imerso/deda',
        '/imerso/lamp',
        '/imerso/hpec/HPEC1/welcome',
        '/imerso/hpec/welcome',
        '/settings',
    ])('libera %s', (path) => expect(isImersoRouteAllowedWhenExpired(path)).toBe(true));

    it.each(['/imerso/deda/DEDA74', '/imerso/deda/london', '/imerso/qualquer-outra'])('bloqueia %s', (path) =>
        expect(isImersoRouteAllowedWhenExpired(path)).toBe(false),
    );
});
