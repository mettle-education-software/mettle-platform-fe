// Acesso por produto (validade). Fonte: GET /accounts/v2/me/access (mettle-be #102).
// Transição: produto sem linha em product_access (ou endpoint indisponível) vale pelas `roles` do Firebase, como hoje.

export type AccessState = 'none' | 'active' | 'grace' | 'expired';

export interface ProductAccess {
    state: AccessState;
    expiresAt?: string | null;
    graceUntil?: string | null;
    expiring?: boolean;
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

export const resolveAccess = (
    product: string,
    roles: string[] | undefined,
    api?: MyAccessResponse | null,
): ProductAccess => {
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
