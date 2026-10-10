/** @jest-environment node */
// Verificação em duas etapas: código limpo, frases calmas, desafio vencido volta para a senha, o fator TOTP no login.
import {
    adminMfaRequired,
    challengeExpired,
    clearAdminMfa,
    cleanCode,
    enrolledOn,
    flagAdminMfa,
    groupedKey,
    mfaErrorMessage,
    resolveTotp,
    retryable,
} from '../authentication/mfa';

const mockAssertion = jest.fn((uid: string, code: string) => ({ uid, code }));
jest.mock('config/firebase', () => ({ auth: {} }), { virtual: true });
jest.mock('firebase/auth', () => ({
    getMultiFactorResolver: jest.fn(),
    multiFactor: jest.fn(),
    TotpMultiFactorGenerator: {
        FACTOR_ID: 'totp',
        assertionForSignIn: (uid: string, code: string) => mockAssertion(uid, code),
    },
}));

test('só os 6 dígitos (colar com espaço ou traço vale); a chave em grupos de 4', () => {
    expect(cleanCode(' 123-456 ')).toBe('123456');
    expect(cleanCode('1234567')).toBe('123456');
    expect(cleanCode('abc')).toBe('');
    expect(groupedKey('ABCDEFGHIJKLMNOP')).toBe('ABCD EFGH IJKL MNOP');
});

test('frases calmas; o desafio vencido manda de volta para a senha', () => {
    expect(mfaErrorMessage('auth/invalid-verification-code')).toBe(
        'Código inválido. Confira o app autenticador e tente de novo.',
    );
    // o SDK devolve sessão inválida quando o desafio acaba (não há código próprio de tempo esgotado)
    expect(mfaErrorMessage('auth/invalid-multi-factor-session')).toBe(
        'O tempo para confirmar acabou. Entre de novo com a senha.',
    );
    expect(challengeExpired('auth/invalid-multi-factor-session')).toBe(true);
    expect(challengeExpired('auth/invalid-verification-code')).toBe(false);
    // tenta de novo no mesmo desafio só com código errado, muitas tentativas ou sem conexão
    expect(
        ['auth/invalid-verification-code', 'auth/too-many-requests', 'auth/network-request-failed'].every((c) =>
            retryable(c),
        ),
    ).toBe(true);
    expect(retryable('auth/invalid-multi-factor-session')).toBe(false);
    expect(retryable(undefined)).toBe(false);
    expect(mfaErrorMessage('auth/requires-recent-login')).toContain('saia e entre de novo');
    expect(mfaErrorMessage('qualquer')).toBe('Não foi possível concluir agora. Tente de novo.');
    // sessão sem senha (link mágico, conta criada pelo servidor): o Firebase não deixa ativar
    expect(mfaErrorMessage('auth/unsupported-first-factor')).toBe('Entre com e-mail e senha para ativar.');
});

test('aviso do Admin: liga no 403 MFA_REQUIRED e desliga ao ativar ou sair', () => {
    expect(adminMfaRequired()).toBe(false);
    flagAdminMfa();
    expect(adminMfaRequired()).toBe(true);
    clearAdminMfa();
    expect(adminMfaRequired()).toBe(false);
});

test('login: o código vai para o fator TOTP da conta; sem ele, recusa calma', async () => {
    const resolveSignIn = jest.fn().mockResolvedValue('ok');
    const resolver = {
        hints: [
            { factorId: 'phone', uid: 'p' },
            { factorId: 'totp', uid: 't1' },
        ],
        resolveSignIn,
    };
    await expect(resolveTotp(resolver as never, '123 456')).resolves.toBe('ok');
    expect(mockAssertion).toHaveBeenCalledWith('t1', '123456');
    await expect(resolveTotp({ hints: [], resolveSignIn } as never, '123456')).rejects.toEqual({
        code: 'auth/unsupported-second-factor',
    });
});

test('desde quando: data do Firebase em Brasília; inválida = nada (a página não cai)', () => {
    expect(enrolledOn('Sun, 11 Oct 2026 02:00:00 GMT')).toBe('10 de outubro de 2026');
    expect(enrolledOn('Invalid Date')).toBeNull();
    expect(enrolledOn(undefined)).toBeNull();
});
