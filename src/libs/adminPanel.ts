// Painel de Contas (/admin/contas, 10-Out-2026): a lista de todas as contas (todos os produtos) e o detalhe de cada uma
// ao lado. Substitui /admin/historico, /admin/aluno/[uid], /admin/lixeira (agora um filtro, só do dono) e o painel
// antigo (impersonar, segmentos, Mercy Mode). Fonte: GET /admin/accounts (admin-service); até ele sair, o retrato
// noturno do histórico (Worker, só o dono). Testes: libs/__tests__/adminPanel.test.ts.
import { PRODUCT_NAMES, type AccessStateNew, type Origin, type Product } from './adminAccess';
import { historyStatusLabel, type HistoryStudent } from './adminHistory';

export const ADMIN_PANEL_PATH = '/admin/contas';
/** O painel com o detalhe de uma conta aberto (links antigos, saída da impersonação, linhas do Início). */
export const adminPanelPath = (uid?: string | null) =>
    uid ? `${ADMIN_PANEL_PATH}?conta=${encodeURIComponent(uid)}` : ADMIN_PANEL_PATH;

/** Menu do Admin: exatamente estes quatro (os dois últimos só do dono). */
export const ADMIN_NAV: readonly { key: string; label: string; href: string; owner?: boolean }[] = [
    { key: 'inicio', label: 'Início', href: '/admin' },
    { key: 'contas', label: 'Contas', href: ADMIN_PANEL_PATH },
    { key: 'leaderboard', label: 'Leaderboard', href: '/admin/leaderboard', owner: true },
    { key: 'leitura', label: 'Gestão de Leituras', href: '/admin/leitura', owner: true },
];

export const PAGE_SIZE = 25;
export type SortKey = 'name' | 'lastAccess' | 'expiry';
export type Sort = { key: SortKey; dir: 'asc' | 'desc' };

export interface ProductAccessSummary {
    state: AccessStateNew;
    origin: Origin | null;
    validUntil: string | null;
    dateToConfirm: boolean;
}

export interface AccountRow {
    uid: string;
    name: string | null;
    email: string | null;
    photoURL: string | null;
    /** null: sem a informação (retrato noturno, antes do endpoint) */
    access: Record<Product, ProductAccessSummary> | null;
    program: {
        melpStatus: string;
        lampWeek: number | null;
        remainingPauses: number | null;
        remainingResets: number | null;
    } | null;
    lastAccess: string | null;
    hasLogin: boolean | null;
    inTrash: boolean;
}

export interface AccountsPage {
    rows: AccountRow[];
    total: number;
    /** veio do retrato noturno (sem acesso por produto nem último acesso) */
    snapshot: boolean;
}

export interface AccountsQuery {
    product?: Product;
    state?: AccessStateNew;
    q?: string;
    sort: Sort;
    page: number;
}

const PRODUCTS: readonly Product[] = ['imerso', 'masterclass', 'ebook'];
const SORT_KEYS: readonly SortKey[] = ['name', 'lastAccess', 'expiry'];

/** Filtros vindos do endereço (o Início abre "ver todos" já filtrado); valor desconhecido é ignorado. */
export const queryFromUrl = (params: URLSearchParams | null): Omit<AccountsQuery, 'page'> & { trash: boolean } => {
    const product = params?.get('product') as Product | null;
    const state = params?.get('state') as AccessStateNew | null;
    const sort = params?.get('sort') as SortKey | null;
    const okProduct = product && PRODUCTS.includes(product) ? product : undefined;
    return {
        product: okProduct,
        state: okProduct && state && ['ativo', 'leitura', 'none'].includes(state) ? state : undefined,
        q: params?.get('q')?.slice(0, 100) || undefined,
        sort: {
            key: sort && SORT_KEYS.includes(sort) ? sort : 'name',
            dir: params?.get('dir') === 'desc' ? 'desc' : 'asc',
        },
        trash: params?.get('lixeira') === '1',
    };
};

/**
 * Endereço do Contas: filtros, ordem, Lixeira e a conta aberta ficam no endereço (recarregar mantém; os "ver todos" do
 * Início e o link da Lixeira chegam já filtrados). O padrão (conta, crescente) fica de fora.
 */
export const contasPath = (view: {
    product?: Product;
    state?: AccessStateNew;
    sort?: SortKey;
    dir?: 'asc' | 'desc';
    lixeira?: boolean;
    conta?: string | null;
}) => {
    const params = new URLSearchParams();
    if (view.lixeira) params.set('lixeira', '1');
    else {
        if (view.product) params.set('product', view.product);
        if (view.product && view.state) params.set('state', view.state);
        if (view.sort && view.sort !== 'name') params.set('sort', view.sort);
        if (view.dir === 'desc') params.set('dir', 'desc');
    }
    if (view.conta) params.set('conta', view.conta);
    const qs = params.toString();
    return qs ? `${ADMIN_PANEL_PATH}?${qs}` : ADMIN_PANEL_PATH;
};

export const productName = (product: Product) => PRODUCT_NAMES[product];

const num = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : null);
const text = (value: unknown) => (typeof value === 'string' && value ? value : null);
const STATES: readonly string[] = ['ativo', 'leitura', 'none'];

const summary = (raw: unknown): ProductAccessSummary => {
    const a = (raw ?? {}) as Record<string, unknown>;
    return {
        state: (STATES.includes(a.state as string) ? a.state : 'none') as AccessStateNew,
        origin: (text(a.origin) as Origin | null) ?? null,
        validUntil: text(a.validUntil),
        dateToConfirm: a.dateToConfirm === true,
    };
};

/** Linha de GET /admin/accounts, conferida (campos ausentes viram null; programa em camelCase ou snake_case). */
export const accountRow = (raw: unknown): AccountRow | null => {
    const r = (raw ?? {}) as Record<string, unknown>;
    const uid = text(r.uid);
    if (!uid) return null;
    const access = (r.access ?? null) as Record<string, unknown> | null;
    const p = (r.program ?? null) as Record<string, unknown> | null;
    return {
        uid,
        name: text(r.name),
        email: text(r.email),
        photoURL: text(r.photoURL),
        access: access
            ? { imerso: summary(access.imerso), masterclass: summary(access.masterclass), ebook: summary(access.ebook) }
            : null,
        program: p
            ? {
                  melpStatus: text(p.melpStatus ?? p.melp_status) ?? '',
                  lampWeek: num(p.lampWeek ?? p.lamp_week ?? p.current_deda_week),
                  remainingPauses: num(p.remainingPauses ?? p.remaining_pauses),
                  remainingResets: num(p.remainingResets ?? p.remaining_resets),
              }
            : null,
        lastAccess: text(r.lastAccess),
        hasLogin: typeof r.hasLogin === 'boolean' ? r.hasLogin : null,
        inTrash: r.inTrash === true,
    };
};

/** Parâmetros de GET /admin/accounts (estado só com o produto, como o servidor exige). */
export const accountsParams = ({ product, state, q, sort, page }: AccountsQuery) => ({
    ...(product ? { product } : {}),
    ...(product && state ? { state } : {}),
    ...(q?.trim() ? { q: q.trim().slice(0, 100) } : {}),
    sort: sort.key,
    dir: sort.dir,
    page,
    pageSize: PAGE_SIZE,
});

const fold = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('pt-BR');

/**
 * Retrato noturno (só o dono) no formato da lista, enquanto GET /admin/accounts não sai: só alunos do Imerso, sem acesso
 * por produto nem último acesso; busca e ordem por nome aqui, e a página também.
 */
export const snapshotPage = (students: HistoryStudent[], { q, sort, page }: AccountsQuery): AccountsPage => {
    const query = q?.trim() ? fold(q.trim()) : '';
    const rows = students
        .filter((s) => !query || fold(`${s.name} ${s.email}`).includes(query))
        .sort((a, b) => {
            const x = fold(a.name || a.email);
            const y = fold(b.name || b.email);
            return (x < y ? -1 : x > y ? 1 : 0) * (sort.key === 'name' && sort.dir === 'desc' ? -1 : 1);
        })
        .map(
            (s): AccountRow => ({
                uid: s.uid,
                name: s.name || null,
                email: s.email || null,
                photoURL: null,
                access: null,
                program: {
                    melpStatus: s.status,
                    lampWeek: s.lampWeek,
                    remainingPauses: s.pausesLeft,
                    remainingResets: s.resetsLeft,
                },
                lastAccess: null,
                hasLogin: null,
                inTrash: false,
            }),
        );
    const start = (page - 1) * PAGE_SIZE;
    return { rows: rows.slice(start, start + PAGE_SIZE), total: rows.length, snapshot: true };
};

/** Estado do programa em uma palavra (mesma tabela do histórico) e a semana da LAMP, quando houver. */
export const programLabel = (program: AccountRow['program']) => {
    if (!program?.melpStatus) return '—';
    const label = historyStatusLabel(program.melpStatus);
    return program.lampWeek ? `${label} · sem. ${program.lampWeek}` : label;
};

/** Último acesso em DD/MM/AAAA (Brasília). */
export const lastAccessLabel = (at: string | null) => {
    const date = at ? new Date(at) : null;
    return date && !Number.isNaN(date.getTime())
        ? date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
        : '—';
};

/** Selo curto de cada produto na lista: T (Total), L (Leitura) ou nada. */
export const accessBadge = (summary: ProductAccessSummary | undefined) =>
    summary?.state === 'ativo' ? 'Total' : summary?.state === 'leitura' ? 'Leitura' : null;
