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

/** O servidor exige o segundo fator para o Admin (ADMIN_MFA_REQUIRED): 403 com este código. */
export const ADMIN_MFA_CODE = 'MFA_REQUIRED';
export const ADMIN_MFA_EVENT = 'mettle:admin-mfa-required';
let adminMfaMissing = false;
/** Algum pedido do Admin foi recusado por falta do segundo fator (vale para quem montar depois). */
export const adminMfaRequired = () => adminMfaMissing;
export const flagAdminMfa = () => {
    adminMfaMissing = true;
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(ADMIN_MFA_EVENT));
};

/** Códigos do Firebase usados aqui (os mesmos de AuthErrorCodes do SDK 10). */
export const MFA_CODES = {
    invalidCode: 'auth/invalid-verification-code',
    missingCode: 'auth/missing-verification-code',
    codeExpired: 'auth/code-expired',
    invalidSession: 'auth/invalid-multi-factor-session',
    missingSession: 'auth/missing-multi-factor-session',
    recentLogin: 'auth/requires-recent-login',
    tooMany: 'auth/too-many-requests',
    network: 'auth/network-request-failed',
    unverifiedEmail: 'auth/unverified-email',
    tokenExpired: 'auth/user-token-expired',
} as const;

/** Só os 6 dígitos (colar "123 456" ou "123-456" também vale). */
export const cleanCode = (raw: string) => raw.replace(/\D/g, '').slice(0, 6);

/** Código do Firebase (ou undefined). */
export const authCode = (error: unknown) => (error as { code?: unknown } | null)?.code as string | undefined;

/** Erro que se resolve tentando de novo no mesmo desafio (o resto volta para o começo). */
export const retryable = (code?: string) =>
    code === MFA_CODES.invalidCode ||
    code === MFA_CODES.missingCode ||
    code === MFA_CODES.tooMany ||
    code === MFA_CODES.network;

/** O desafio do login acabou (o SDK devolve sessão inválida; não há código próprio de tempo esgotado). */
export const challengeExpired = (code?: string) =>
    code === MFA_CODES.codeExpired || code === MFA_CODES.invalidSession || code === MFA_CODES.missingSession;

/** Uma frase calma para cada erro do segundo fator. */
export const mfaErrorMessage = (code?: string) => {
    if (code === MFA_CODES.invalidCode || code === MFA_CODES.missingCode)
        return 'Código inválido. Confira o app autenticador e tente de novo.';
    if (challengeExpired(code)) return 'O tempo para confirmar acabou. Entre de novo com a senha.';
    if (code === MFA_CODES.recentLogin) return 'Por segurança, saia e entre de novo antes desta alteração.';
    if (code === MFA_CODES.tooMany) return 'Muitas tentativas. Espere alguns minutos e tente de novo.';
    if (code === MFA_CODES.unverifiedEmail) return 'Confirme o seu e-mail antes de ativar.';
    if (code === 'auth/unsupported-first-factor') return 'Entre com e-mail e senha para ativar.';
    if (code === MFA_CODES.network) return 'Sem conexão. Tente de novo.';
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

/** Desativar (o Firebase pode encerrar a sessão: sair com o fator desativado também é sucesso). */
export const disableTotp = (user: User, factor: MultiFactorInfo) => multiFactor(user).unenroll(factor);

/** A chave em grupos de 4 (digitar à mão no app). */
export const groupedKey = (key: string) => key.replace(/(.{4})/g, '$1 ').trim();

/** "10 de outubro de 2026" (Brasília) a partir da data do Firebase; data inválida = null. */
export const enrolledOn = (value?: string | null) => {
    const time = value ? Date.parse(value) : NaN;
    return Number.isNaN(time)
        ? null
        : new Date(time).toLocaleDateString('pt-BR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              timeZone: 'America/Sao_Paulo',
          });
};
