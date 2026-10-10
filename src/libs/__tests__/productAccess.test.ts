import {
    accessKey,
    accessSource,
    blockedWhenReadOnly,
    isImersoRouteAllowedWhenExpired,
    levelsFromMe,
    MASTERCLASS_ROLE,
    readLevels,
    renewalNotice,
    resolveAccess,
    rolesFromLevels,
    shellGate,
} from '../productAccess';

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

describe('modelo novo (claims `access`: ativo | leitura | none)', () => {
    const MC = 'MASTERCLASS_"AS_7_REGRAS"_9c466a35-2685-4d1e-8434-b29044628056';

    it('readLevels aceita só chaves e valores conhecidos; nada válido = undefined', () => {
        expect(readLevels({ imerso: 'leitura', masterclass: 'ativo', ebook: 'none' })).toEqual({
            imerso: 'leitura',
            masterclass: 'ativo',
            ebook: 'none',
        });
        expect(readLevels({ imerso: 'active', ebook: 'leitura', outro: 'ativo' })).toEqual({ ebook: 'leitura' });
        expect(readLevels({ imerso: 1 })).toBeUndefined();
        expect(readLevels(undefined)).toBeUndefined();
        expect(readLevels('ativo')).toBeUndefined();
    });

    it('accessKey: Imerso, e-book e qualquer Masterclass', () => {
        expect(accessKey('METTLE_STUDENT')).toBe('imerso');
        expect(accessKey('EBOOK_GUIA_COMPLETO')).toBe('ebook');
        expect(accessKey(MC)).toBe('masterclass');
        expect(accessKey('METTLE_ADMIN')).toBeUndefined();
        expect(accessKey(undefined)).toBeUndefined();
    });

    it('cada estado vira o do front (leitura = expired) e vence a linha antiga e as roles', () => {
        const api = { products: { METTLE_STUDENT: { state: 'active' as const } }, imerso: null };
        const levels = { imerso: 'leitura', masterclass: 'ativo', ebook: 'none' } as const;
        expect(resolveAccess('METTLE_STUDENT', ['METTLE_STUDENT'], api, levels).state).toBe('expired');
        expect(resolveAccess(MC, [], undefined, levels).state).toBe('active');
        expect(resolveAccess('EBOOK_GUIA_COMPLETO', ['EBOOK_GUIA_COMPLETO'], undefined, levels).state).toBe('none');
        // produto fora das claims: o comportamento de antes
        expect(resolveAccess('METTLE_STUDENT', ['METTLE_STUDENT'], undefined, { ebook: 'ativo' }).state).toBe('active');
        expect(resolveAccess('OUTRO_CURSO', ['OUTRO_CURSO'], undefined, levels).state).toBe('active');
    });

    it('levelsFromMe: `access` (ou a claim do fbData) só se a resposta for da conta vista', () => {
        const me = { fbData: { uid: 'aluno', customClaims: { access: { imerso: 'leitura' } } } };
        expect(levelsFromMe(me, 'aluno')).toEqual({ imerso: 'leitura' });
        expect(levelsFromMe({ ...me, access: { imerso: 'ativo' } }, 'aluno')).toEqual({ imerso: 'ativo' });
        // servidor sem a impersonação devolve o administrador: não vale para o aluno visto
        expect(levelsFromMe(me, 'outro')).toBeUndefined();
        expect(levelsFromMe({ access: { imerso: 'ativo' } }, 'aluno')).toBeUndefined();
        expect(levelsFromMe(undefined, 'aluno')).toBeUndefined();
        expect(levelsFromMe(me, undefined)).toBeUndefined();
    });

    it('levelsFromMe: conta sem nenhuma linha (antes da carga) vale pelas roles DELA; com uma linha, o /me decide', () => {
        const none = { access: { imerso: 'none', masterclass: 'none', ebook: 'none' } };
        const rows = (updatedAt: string | null) =>
            ['imerso', 'masterclass', 'ebook'].map((product) => ({ product, state: 'none', updatedAt }));
        const unloaded = (roles?: string[]) => ({
            ...none,
            fbData: { uid: 'aluno', customClaims: roles ? { roles } : undefined },
            accessDetails: rows(null),
        });
        expect(levelsFromMe(unloaded(['METTLE_STUDENT', 'MASTERCLASS_X']), 'aluno')).toEqual({
            imerso: 'ativo',
            masterclass: 'ativo',
            ebook: 'none',
        });
        // sem produto nenhum (nem role): nada abre — inclusive para o administrador que navega como o aluno
        expect(levelsFromMe(unloaded([]), 'aluno')).toEqual({ imerso: 'none', masterclass: 'none', ebook: 'none' });
        expect(levelsFromMe(unloaded(), 'aluno')).toEqual({ imerso: 'none', masterclass: 'none', ebook: 'none' });
        const admin = resolveAccess(
            'METTLE_STUDENT',
            ['METTLE_ADMIN'],
            { products: {}, imerso: null },
            levelsFromMe(unloaded(['EBOOK_GUIA_COMPLETO']), 'aluno'),
        );
        expect(admin).toEqual({ state: 'none', final: true });
        const loaded = [
            { product: 'imerso', state: 'leitura', updatedAt: '2026-10-11T03:00:00Z' },
            ...rows(null).slice(1),
        ];
        expect(
            levelsFromMe(
                {
                    access: { imerso: 'leitura', masterclass: 'none', ebook: 'none' },
                    fbData: { uid: 'aluno' },
                    accessDetails: loaded,
                },
                'aluno',
            ),
        ).toEqual({ imerso: 'leitura', masterclass: 'none', ebook: 'none' });
    });

    it('accessSource: claim da própria conta; /me na impersonação ou sem claim; nada para o admin na própria conta', () => {
        const access = { imerso: 'leitura' };
        expect(accessSource({ roles: ['METTLE_STUDENT'], access })).toEqual({ claim: access, me: false });
        expect(accessSource({ roles: ['METTLE_STUDENT'] })).toEqual({ claim: undefined, me: true });
        expect(accessSource({ roles: ['METTLE_STUDENT'], access: { imerso: 'x' } })).toEqual({
            claim: undefined,
            me: true,
        });
        // impersonação: o acesso do aluno vem no token (impersonatedUser.access); sem ele, o /me (da conta vista)
        expect(accessSource({ impersonating: true, roles: ['METTLE_STUDENT'], access })).toEqual({
            claim: access,
            me: false,
        });
        expect(accessSource({ impersonating: true, roles: ['METTLE_ADMIN'] })).toEqual({ claim: undefined, me: true });
        expect(accessSource({ roles: ['METTLE_ADMIN'], access })).toEqual({ claim: undefined, me: false });
        expect(accessSource(undefined)).toEqual({ claim: undefined, me: false });
    });

    it('o estado das claims é final (manda sobre a role antiga, inclusive o none); sem claims, não', () => {
        expect(resolveAccess('METTLE_STUDENT', ['METTLE_STUDENT'], undefined, { imerso: 'none' })).toEqual({
            state: 'none',
            final: true,
        });
        expect(resolveAccess('METTLE_STUDENT', ['METTLE_STUDENT'], undefined).final).toBeUndefined();
    });

    it('shellGate: espera o /me que decide; leitura bloqueia DEDA aberto e Comunidade; o resto abre', () => {
        expect(shellGate('active', true, '/imerso/lamp')).toBe('loading');
        expect(shellGate('expired', true, '/imerso/deda/london')).toBe('loading');
        expect(shellGate('expired', false, '/imerso/deda/london')).toBe('renew');
        expect(shellGate('expired', false, '/comunidade')).toBe('renew');
        expect(shellGate('expired', false, '/imerso/lamp')).toBe('page');
        expect(shellGate('active', false, '/imerso/deda/london')).toBe('page');
        expect(shellGate('none', false, '/comunidade')).toBe('page');
    });

    it('rolesFromLevels: os produtos que o aluno tem (leitura conta), para a impersonação sem as roles no token', () => {
        expect(rolesFromLevels({ imerso: 'leitura', masterclass: 'ativo', ebook: 'none' })).toEqual([
            'METTLE_STUDENT',
            MASTERCLASS_ROLE,
        ]);
        expect(rolesFromLevels({ ebook: 'ativo' })).toEqual(['EBOOK_GUIA_COMPLETO']);
        expect(rolesFromLevels(undefined)).toBeUndefined();
    });

    it.each(['/imerso/deda/DEDA74', '/imerso/deda/london', '/comunidade', '/comunidade/'])(
        'leitura: %s dá lugar à renovação',
        (path) => expect(blockedWhenReadOnly(path)).toBe(true),
    );

    it.each(['/', '/imerso', '/imerso/deda', '/imerso/lamp', '/imerso/hpec/welcome', '/settings', '/suporte', '/guia'])(
        'leitura: %s abre só para ver',
        (path) => expect(blockedWhenReadOnly(path)).toBe(false),
    );
});
