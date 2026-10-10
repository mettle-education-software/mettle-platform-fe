// Verificação em duas etapas (TOTP do Identity Platform, só administradores): entrar com o código do app autenticador e
// ativar/desativar nas Configurações. As chamadas do Firebase ficam aqui; as telas só mostram. Testes:
// libs/__tests__/mfa.test.ts.
import { auth } from 'config/firebase';
import {
    getMultiFactorResolver,
    multiFactor,
    type MultiFactorError,
    type MultiFactorInfo,
    type MultiFactorResolver,
    TotpMultiFactorGenerator,
    type TotpSecret,
    type User,
} from 'firebase/auth';

/** Senha certa, falta o segundo fator: o login pede o código. */
export const MFA_REQUIRED = 'auth/multi-factor-auth-required';

/** Só os 6 dígitos (colar "123 456" ou "123-456" também vale). */
export const cleanCode = (raw: string) => raw.replace(/\D/g, '').slice(0, 6);

/** Código do Firebase (ou undefined). */
export const authCode = (error: unknown) => (error as { code?: unknown } | null)?.code as string | undefined;

/** O tempo do desafio acabou: voltar para a senha (sem insistir no mesmo desafio). */
export const challengeExpired = (code?: string) =>
    code === 'auth/code-expired' ||
    code === 'auth/totp-challenge-timeout' ||
    code === 'auth/missing-multi-factor-session' ||
    code === 'auth/invalid-multi-factor-session';

/** Uma frase calma para cada erro do segundo fator. */
export const mfaErrorMessage = (code?: string) => {
    if (code === 'auth/invalid-verification-code' || code === 'auth/missing-code')
        return 'Código inválido. Confira o app autenticador e tente de novo.';
    if (challengeExpired(code)) return 'O tempo para confirmar acabou. Entre de novo com a senha.';
    if (code === 'auth/requires-recent-login') return 'Por segurança, saia e entre de novo antes desta alteração.';
    if (code === 'auth/too-many-requests') return 'Muitas tentativas. Espere alguns minutos e tente de novo.';
    if (code === 'auth/unverified-email') return 'Confirme o seu e-mail antes de ativar.';
    if (code === 'auth/network-request-failed') return 'Sem conexão. Tente de novo.';
    if (code === 'auth/operation-not-allowed' || code === 'auth/admin-restricted-operation')
        return 'A verificação em duas etapas não está disponível agora.';
    return 'Não foi possível concluir agora. Tente de novo.';
};

/** O desafio do login (senha certa, falta o código). */
export const mfaResolverOf = (error: unknown) => getMultiFactorResolver(auth, error as MultiFactorError);

/** O fator TOTP da conta (o único que a Plataforma usa). */
export const totpHint = (resolver: MultiFactorResolver) =>
    resolver.hints.find((hint) => hint.factorId === TotpMultiFactorGenerator.FACTOR_ID);

/** Conclui o login com o código de 6 dígitos. */
export const resolveTotp = (resolver: MultiFactorResolver, code: string) => {
    const hint = totpHint(resolver);
    if (!hint) return Promise.reject({ code: 'auth/unsupported-second-factor' });
    return resolver.resolveSignIn(TotpMultiFactorGenerator.assertionForSignIn(hint.uid, cleanCode(code)));
};

/** Fatores TOTP ativos da conta. */
export const totpFactors = (user: User): MultiFactorInfo[] =>
    multiFactor(user).enrolledFactors.filter((factor) => factor.factorId === TotpMultiFactorGenerator.FACTOR_ID);

/** Ativar, passo 1: a chave nova e o endereço do QR (otpauth://) para o app autenticador. */
export const startTotpEnrollment = async (user: User) => {
    const secret = await TotpMultiFactorGenerator.generateSecret(await multiFactor(user).getSession());
    return { secret, uri: secret.generateQrCodeUrl(user.email ?? 'conta', 'Mettle') };
};

/** Ativar, passo 2: confirma com o primeiro código do app. */
export const finishTotpEnrollment = (user: User, secret: TotpSecret, code: string) =>
    multiFactor(user).enroll(
        TotpMultiFactorGenerator.assertionForEnrollment(secret, cleanCode(code)),
        'App autenticador',
    );

/** Desativar (o Firebase pode pedir para entrar de novo). */
export const disableTotp = (user: User, factor: MultiFactorInfo) => multiFactor(user).unenroll(factor);

/** A chave em grupos de 4 (digitar à mão no app). */
export const groupedKey = (key: string) => key.replace(/(.{4})/g, '$1 ').trim();
