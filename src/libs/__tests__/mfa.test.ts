/** @jest-environment node */
// Verificação em duas etapas: código limpo, frases calmas, desafio vencido volta para a senha, o fator TOTP no login.
import { challengeExpired, cleanCode, groupedKey, mfaErrorMessage, resolveTotp } from '../authentication/mfa';

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
    expect(mfaErrorMessage('auth/totp-challenge-timeout')).toBe(
        'O tempo para confirmar acabou. Entre de novo com a senha.',
    );
    expect(challengeExpired('auth/totp-challenge-timeout')).toBe(true);
    expect(challengeExpired('auth/invalid-verification-code')).toBe(false);
    expect(mfaErrorMessage('auth/requires-recent-login')).toContain('saia e entre de novo');
    expect(mfaErrorMessage('qualquer')).toBe('Não foi possível concluir agora. Tente de novo.');
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
