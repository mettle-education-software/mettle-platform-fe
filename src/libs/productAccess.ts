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
