// Acesso por produto (validade). Fonte: GET /accounts/v2/me/access (mettle-be #102).
// Transição: produto sem linha em product_access (ou endpoint indisponível) vale pelas `roles` do Firebase, como hoje.
// Modelo novo (10-Out-2026, vault "Acessos — Modelo e Lançamento"): claims `access` (ativo | leitura | none) na
// plataforma nova; ver readLevels/resolveAccess.
import { EBOOK_PRODUCT } from './ebook';

export type AccessState = 'none' | 'active' | 'grace' | 'expired';

export interface ProductAccess {
    state: AccessState;
    expiresAt?: string | null;
    graceUntil?: string | null;
    expiring?: boolean;
    /** veio do modelo novo (claims): manda sobre as roles, inclusive o "none" */
    final?: boolean;
}

export interface MyAccessResponse {
    products: Record<string, ProductAccess>;
    imerso: { week: number; dedasConcluded: number } | null;
}

export const IMERSO_PRODUCT = 'METTLE_STUDENT';

// Disparado pelo ApiClient quando melp/lamp respondem 403 ACCESS_EXPIRED; o AccessProvider abre o modal.
export const ACCESS_DENIED_EVENT = 'mettle:access-expired';

// TODO(André): definir os links de renovação por produto (checkout HeroSpark). Até lá, página de venda atual.
export const RENEWAL_URLS: Record<string, string> = {
    [IMERSO_PRODUCT]:
        'https://mettle.com.br/programa-imerso/?utm_medium=organic&utm_source=plataforma&utm_campaign=renovacao',
};
/** Página de vendas do Imerso: um destino só para todo convite; `surface` = de onde o aluno veio (utm_medium). */
export const imersoSalesUrl = (surface: string) =>
    `https://mettle.com.br/programa-imerso/?utm_source=plataforma&utm_medium=${encodeURIComponent(surface)}&utm_campaign=imerso`;
export const IMERSO_SALES_URL = imersoSalesUrl('organic');

// ---------- modelo novo: claims `access` do Firebase (GET /accounts/me como reserva) ----------

export type AccessLevel = 'ativo' | 'leitura' | 'none';
export type AccessKey = 'imerso' | 'masterclass' | 'ebook';
export type AccessLevels = Partial<Record<AccessKey, AccessLevel>>;

const ACCESS_KEYS: readonly AccessKey[] = ['imerso', 'masterclass', 'ebook'];
const ACCESS_LEVELS: readonly string[] = ['ativo', 'leitura', 'none'];

/** `access` vindo do servidor, validado: só chaves e valores conhecidos; nada válido = undefined (vale o de antes). */
export const readLevels = (raw: unknown): AccessLevels | undefined => {
    if (!raw || typeof raw !== 'object') return undefined;
    const levels: AccessLevels = {};
    for (const key of ACCESS_KEYS) {
        const value = (raw as Record<string, unknown>)[key];
        if (typeof value === 'string' && ACCESS_LEVELS.includes(value)) levels[key] = value as AccessLevel;
    }
    return Object.keys(levels).length ? levels : undefined;
};

/**
 * `access` de GET /accounts/me, só se a resposta for da conta vista (servidor sem a impersonação devolve o admin). Conta
 * ainda sem nenhuma linha de acesso (`accessDetails` sem `updatedAt`: antes da carga inicial) não decide nada: o
 * servidor responde "none" para tudo, e a conta seguiria pelas roles de antes, sem trancar quem tem o produto.
 */
export const levelsFromMe = (data: unknown, uid?: string): AccessLevels | undefined => {
    const me = data as
        | {
              access?: unknown;
              accessDetails?: { updatedAt?: unknown }[];
              fbData?: { uid?: string; customClaims?: { access?: unknown } };
          }
        | undefined;
    if (!uid || me?.fbData?.uid !== uid) return undefined;
    if (Array.isArray(me.accessDetails) && !me.accessDetails.some((row) => row?.updatedAt)) return undefined;
    return readLevels(me.access ?? me.fbData.customClaims?.access);
};

/**
 * De onde vem o `access` na plataforma nova: a claim do token da própria conta (renovada a cada carga); GET
 * /accounts/me quando o administrador navega como o aluno (as claims são as do administrador) ou a conta ainda não
 * tem a claim. Administrador na própria conta: nenhum (segue vendo tudo, regra de resolveAccess).
 */
export const accessSource = (user?: { impersonating?: boolean; roles?: unknown; access?: unknown } | null) => {
    if (!user) return { claim: undefined, me: false };
    if (user.impersonating) return { claim: undefined, me: true };
    if (Array.isArray(user.roles) && user.roles.includes('METTLE_ADMIN')) return { claim: undefined, me: false };
    const claim = readLevels(user.access);
    return { claim, me: !claim };
};

/** Produto do front (role / coursePurchaseId) → chave do modelo novo. */
export const accessKey = (product?: string): AccessKey | undefined => {
    if (product === IMERSO_PRODUCT) return 'imerso';
    if (product === EBOOK_PRODUCT) return 'ebook';
    return product?.startsWith('MASTERCLASS') ? 'masterclass' : undefined;
};

/** Leitura = o "expired" do front: só navega; o que grava sai da tela e os cliques bloqueados levam à renovação. */
const STATE_OF: Record<AccessLevel, AccessState> = { ativo: 'active', leitura: 'expired', none: 'none' };

/** Imerso em leitura: estas rotas dão lugar à renovação (abrir um DEDA e a Comunidade); as demais só para ver. */
export const blockedWhenReadOnly = (pathname: string) =>
    /^\/comunidade(\/|$)/.test(pathname) || !isImersoRouteAllowedWhenExpired(pathname);

/**
 * O que a casca nova mostra no lugar da página: espera o /accounts/me quando é ele quem decide (nada abre nem grava
 * antes), a renovação nas rotas bloqueadas da leitura, ou a própria página.
 */
export const shellGate = (imerso: AccessState, levelsLoading: boolean, pathname: string) =>
    levelsLoading ? 'loading' : imerso === 'expired' && blockedWhenReadOnly(pathname) ? 'renew' : 'page';

export const resolveAccess = (
    product: string,
    roles: string[] | undefined,
    api?: MyAccessResponse | null,
    levels?: AccessLevels,
): ProductAccess => {
    // Modelo novo primeiro (o provedor só o passa na plataforma nova, já com a conta vista na impersonação).
    const key = accessKey(product);
    const level = key && levels?.[key];
    if (level) return { state: STATE_OF[level], final: true };
    // A linha do backend vem primeiro: admin impersonando um aluno expirado vê o que o aluno vê.
    const fromApi = api?.products?.[product];
    if (fromApi) return fromApi;
    if (roles?.includes('METTLE_ADMIN')) return { state: 'active' };
    return { state: roles?.includes(product) ? 'active' : 'none' };
};

// Imerso expirado: pode ver a home do Imerso, a lista de DEDAs, a LAMP e o HPEC (conteúdo trancado na própria página).
const IMERSO_OPEN_ROUTES = [/^\/imerso\/?$/, /^\/imerso\/deda\/?$/, /^\/imerso\/lamp\/?$/, /^\/imerso\/hpec(\/.*)?$/];

export const isImersoRouteAllowedWhenExpired = (pathname: string) =>
    !pathname.startsWith('/imerso') || IMERSO_OPEN_ROUTES.some((route) => route.test(pathname));

/**
 * Faixa de vencimento do Imerso: carência (venceu, ainda abre) ou "vence em breve" (o servidor marca expiring).
 * O motivo do vencimento não é conhecido (fim do plano ou cobrança recusada): o texto não supõe nenhum.
 * Data de Brasília; sem data válida, sem data. null = sem faixa.
 */
export const renewalNotice = (access: ProductAccess, en: boolean): string | null => {
    const date = access.expiresAt ? new Date(access.expiresAt) : null;
    const when =
        date && !Number.isNaN(date.getTime())
            ? date.toLocaleDateString(en ? 'en-US' : 'pt-BR', {
                  timeZone: 'America/Sao_Paulo',
                  day: 'numeric',
                  month: en ? 'short' : 'long',
              })
            : null;
    if (access.state === 'grace')
        return en
            ? `Your IMERSO access expired${when ? ` on ${when}` : ''}.`
            : `Seu acesso ao Imerso venceu${when ? ` em ${when}` : ''}.`;
    if (access.state === 'active' && access.expiring)
        return en
            ? `Your IMERSO access expires ${when ? `on ${when}` : 'soon'}.`
            : `Seu acesso ao Imerso vence ${when ? `em ${when}` : 'em breve'}.`;
    return null;
};
