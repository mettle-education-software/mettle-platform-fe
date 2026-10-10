/** @jest-environment node */
// Login com verificação em duas etapas: a senha certa devolve o desafio, e a tela pede o código (nada de erro).
import { handleLogin } from '../authentication/handleLogin';

const mockSignIn = jest.fn();
const mockResolver = { hints: [{ factorId: 'totp', uid: 't1' }] };
const mockResolverOf = jest.fn((_error: unknown) => mockResolver);
jest.mock('config/firebase', () => ({ auth: {}, googleProvider: {}, microsoftProvider: {} }), { virtual: true });
jest.mock('services', () => ({ accountService: { post: jest.fn() } }), { virtual: true });
jest.mock('firebase/auth', () => ({
    signInWithEmailAndPassword: (...args: unknown[]) => mockSignIn(...args),
    signInWithPopup: jest.fn(),
    AuthErrorCodes: { USER_DISABLED: 'auth/user-disabled', INVALID_EMAIL: 'auth/invalid-email' },
}));
jest.mock('../authentication/mfa', () => ({
    MFA_REQUIRED: 'auth/multi-factor-auth-required',
    mfaResolverOf: (error: unknown) => mockResolverOf(error),
}));

const failure = (code: string) => Object.assign(new Error(code), { code });

test('senha certa com segundo fator: a tela recebe o desafio, sem mensagem de erro', async () => {
    mockSignIn.mockRejectedValueOnce(failure('auth/multi-factor-auth-required'));
    const setLoginErrorMessage = jest.fn();
    const setIsSignInLoading = jest.fn();
    const onMfaRequired = jest.fn();
    await handleLogin({ email: 'a@x.test', password: 'x', setLoginErrorMessage, setIsSignInLoading, onMfaRequired });
    expect(onMfaRequired).toHaveBeenCalledWith(mockResolver);
    expect(setLoginErrorMessage).toHaveBeenCalledWith(null);
    expect(setIsSignInLoading).toHaveBeenCalledWith(false);
});

test('o desafio não se monta: uma frase, sem tela de código', async () => {
    mockSignIn.mockRejectedValueOnce(failure('auth/multi-factor-auth-required'));
    mockResolverOf.mockImplementationOnce(() => {
        throw new Error('sem resolver');
    });
    const setLoginErrorMessage = jest.fn();
    const onMfaRequired = jest.fn();
    await handleLogin({
        email: 'a@x.test',
        password: 'x',
        setLoginErrorMessage,
        setIsSignInLoading: jest.fn(),
        onMfaRequired,
    });
    expect(onMfaRequired).not.toHaveBeenCalled();
    expect(setLoginErrorMessage).toHaveBeenCalledWith(expect.stringContaining('algo deu errado'));
});
