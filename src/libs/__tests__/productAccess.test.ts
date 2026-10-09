import { isImersoRouteAllowedWhenExpired, renewalNotice, resolveAccess } from '../productAccess';

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

describe('renewalNotice (faixa de vencimento do Imerso)', () => {
    const at = '2026-10-05T03:00:00Z'; // 5-Out, 0h em Brasília
    it('carência: venceu, com a data de Brasília (sem ponto duplo)', () => {
        expect(renewalNotice({ state: 'grace', expiresAt: at }, false)).toBe(
            'Seu acesso ao Imerso venceu em 5 de outubro.',
        );
        expect(renewalNotice({ state: 'grace', expiresAt: at }, true)).toBe('Your IMERSO access expired on Oct 5.');
    });
    it('vence em breve: com data, sem data e com data inválida', () => {
        expect(renewalNotice({ state: 'active', expiring: true, expiresAt: at }, false)).toBe(
            'Seu acesso ao Imerso vence em 5 de outubro.',
        );
        expect(renewalNotice({ state: 'active', expiring: true }, true)).toBe('Your IMERSO access expires soon.');
        expect(renewalNotice({ state: 'active', expiring: true, expiresAt: 'xx' }, false)).toBe(
            'Seu acesso ao Imerso vence em breve.',
        );
        expect(renewalNotice({ state: 'grace', expiresAt: 'xx' }, true)).toBe('Your IMERSO access expired.');
    });
    it('sem faixa: ativo sem aviso, vencido (o convite cuida) e sem produto', () => {
        expect(renewalNotice({ state: 'active' }, false)).toBeNull();
        expect(renewalNotice({ state: 'expired', expiresAt: at }, false)).toBeNull();
        expect(renewalNotice({ state: 'none' }, true)).toBeNull();
    });
});
