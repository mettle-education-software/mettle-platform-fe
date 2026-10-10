// Painel de Contas v2 (/admin/contas, 10-Out-2026): a lista de todas as contas com o resumo de auditoria no topo
// (números iguais aos do Início, cada um aplica o seu filtro), filtros no endereço (produto e estado, origem,
// situação, arquivadas, Lixeira do dono), LTV e a conta ao lado. Fonte: GET /admin/accounts (admin-service).
// Testes: libs/__tests__/adminPanel.test.ts.
import {
    type AccessStateNew,
    brDay,
    brToday,
    inGrace,
    type Origin,
    ORIGINS,
    PRODUCT_NAMES,
    type Product,
} from './adminAccess';
import { historyStatusLabel } from './adminHistory';

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

export const PAGE_SIZES = [25, 50, 100] as const;
export type PageSize = (typeof PAGE_SIZES)[number];
export type SortKey = 'name' | 'lastAccess' | 'expiry' | 'ltv';
export type Sort = { key: SortKey; dir: 'asc' | 'desc' };
export type OriginFilter = Origin | 'aconfirmar';
export type Situacao =
    | 'vence30'
    | 'carencia'
    | 'semAcesso14'
    | 'nuncaEntrou'
    | 'dataAConfirmar'
    | 'pausados'
    | 'naoComecou'
    | 'semProduto';

export const ORIGIN_FILTERS: { value: OriginFilter; label: string }[] = [
    { value: 'compra', label: 'Compra' },
    { value: 'cortesia', label: 'Cortesia' },
    { value: 'parceiro', label: 'Parceiro' },
    { value: 'equipe', label: 'Equipe' },
    { value: 'vitalicio', label: 'Vitalício' },
    { value: 'aconfirmar', label: 'A confirmar' },
];
export const SITUACOES: { value: Situacao; label: string }[] = [
    { value: 'vence30', label: 'Vence em 30 dias' },
    { value: 'carencia', label: 'Em carência' },
    { value: 'semAcesso14', label: 'Sem acessar 14+ dias' },
    { value: 'nuncaEntrou', label: 'Nunca entrou' },
    { value: 'dataAConfirmar', label: 'Data a confirmar' },
    { value: 'pausados', label: 'Pausados' },
    { value: 'naoComecou', label: 'Não começou' },
    { value: 'semProduto', label: 'Sem produto' },
];

export interface ProductAccessSummary {
    state: AccessStateNew;
    origin: Origin | null;
    plan: string | null;
    validUntil: string | null;
    graceUntil: string | null;
    dateToConfirm: boolean;
}

export interface AccountRow {
    uid: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    photoURL: string | null;
    /** conta da equipe (selo "Equipe") */
    team: boolean;
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
    /** LTV: total em R$ e quantas compras; null = não veio */
    ltv: { total: number | null; compras: number | null } | null;
    status: string | null;
    lastPurchase: string | null;
}

/** Resumo de auditoria (a base inteira, independente da página e dos filtros); null = não veio. */
export interface AccountsSummary {
    contas: number | null;
    imerso: { ativo: number | null; leitura: number | null };
    masterclass: { ativo: number | null; leitura: number | null };
    ebook: { ativo: number | null; leitura: number | null };
    semProduto: number | null;
    /** só do dono; null para os outros */
    lixeira: number | null;
    arquivadas: number | null;
}

export interface AccountsPage {
    rows: AccountRow[];
    total: number;
    summary: AccountsSummary | null;
}

export interface AccountsQuery {
    product?: Product;
    state?: AccessStateNew;
    origin?: OriginFilter;
    situacao?: Situacao;
    /** incluir arquivadas (scope=todas) */
    todas?: boolean;
    q?: string;
    sort: Sort;
    page: number;
    pageSize: PageSize;
}

const PRODUCTS: readonly Product[] = ['imerso', 'masterclass', 'ebook'];
const SORT_KEYS: readonly SortKey[] = ['name', 'lastAccess', 'expiry', 'ltv'];
const STATES: readonly string[] = ['ativo', 'leitura', 'none'];

/** O que fica no endereço (recarregar mantém; links do Início e da Lixeira chegam filtrados). */
export interface ContasView {
    product?: Product;
    state?: AccessStateNew;
    origin?: OriginFilter;
    situacao?: Situacao;
    todas?: boolean;
    /** busca (nome, e-mail, telefone ou uid) */
    q?: string;
    sort?: SortKey;
    dir?: 'asc' | 'desc';
    pageSize?: PageSize;
    lixeira?: boolean;
    conta?: string | null;
}

/** Filtros vindos do endereço; valor desconhecido é ignorado. */
export const queryFromUrl = (
    params: URLSearchParams | null,
): Required<Pick<ContasView, 'sort' | 'dir' | 'pageSize'>> & ContasView & { trash: boolean } => {
    const product = params?.get('product') as Product | null;
    const state = params?.get('state');
    const origin = params?.get('origin');
    const situacao = params?.get('situacao');
    const sort = params?.get('sort') as SortKey | null;
    const size = Number(params?.get('pageSize'));
    const okProduct = product && PRODUCTS.includes(product) ? product : undefined;
    return {
        product: okProduct,
        state: okProduct && state && STATES.includes(state) ? (state as AccessStateNew) : undefined,
        origin: ORIGIN_FILTERS.some((o) => o.value === origin) ? (origin as OriginFilter) : undefined,
        situacao: SITUACOES.some((s) => s.value === situacao) ? (situacao as Situacao) : undefined,
        todas: params?.get('scope') === 'todas',
        q: params?.get('q')?.slice(0, 100) || undefined,
        sort: sort && SORT_KEYS.includes(sort) ? sort : 'name',
        dir: params?.get('dir') === 'desc' ? 'desc' : 'asc',
        pageSize: (PAGE_SIZES as readonly number[]).includes(size) ? (size as PageSize) : 25,
        trash: params?.get('lixeira') === '1',
    };
};

/** Endereço do Contas a partir da vista (o padrão fica de fora: nome crescente, 25 por página, só contas). */
export const contasPath = (view: ContasView) => {
    const params = new URLSearchParams();
    if (view.lixeira) params.set('lixeira', '1');
    else {
        if (view.product) params.set('product', view.product);
        if (view.product && view.state) params.set('state', view.state);
        if (view.origin) params.set('origin', view.origin);
        if (view.situacao) params.set('situacao', view.situacao);
        if (view.todas) params.set('scope', 'todas');
        if (view.q?.trim()) params.set('q', view.q.trim().slice(0, 100));
        if (view.sort && view.sort !== 'name') params.set('sort', view.sort);
        if (view.dir === 'desc') params.set('dir', 'desc');
        if (view.pageSize && view.pageSize !== 25) params.set('pageSize', String(view.pageSize));
    }
    if (view.conta) params.set('conta', view.conta);
    const qs = params.toString();
    return qs ? `${ADMIN_PANEL_PATH}?${qs}` : ADMIN_PANEL_PATH;
};

const num = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : null);
const text = (value: unknown) => (typeof value === 'string' && value ? value : null);
const obj = (value: unknown): Record<string, unknown> =>
    value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

const productSummary = (raw: unknown): ProductAccessSummary => {
    const a = obj(raw);
    return {
        state: (STATES.includes(a.state as string) ? a.state : 'none') as AccessStateNew,
        origin: (text(a.origin) as Origin | null) ?? null,
        plan: text(a.plan),
        validUntil: text(a.validUntil),
        graceUntil: text(a.graceUntil),
        dateToConfirm: a.dateToConfirm === true,
    };
};

/** Linha de GET /admin/accounts, conferida (campos ausentes viram null; programa em camelCase ou snake_case). */
export const accountRow = (raw: unknown): AccountRow | null => {
    const r = obj(raw);
    const uid = text(r.uid);
    if (!uid) return null;
    const access = r.access && typeof r.access === 'object' ? obj(r.access) : null;
    const p = r.program && typeof r.program === 'object' ? obj(r.program) : null;
    const ltv = r.ltv && typeof r.ltv === 'object' ? obj(r.ltv) : null;
    return {
        uid,
        name: text(r.name),
        email: text(r.email),
        phone: text(r.phone),
        photoURL: text(r.photoURL),
        team: r.team === true,
        access: access
            ? {
                  imerso: productSummary(access.imerso),
                  masterclass: productSummary(access.masterclass),
                  ebook: productSummary(access.ebook),
              }
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
        ltv: ltv ? { total: num(ltv.total), compras: num(ltv.compras) } : null,
        status: text(r.status),
        lastPurchase: text(r.lastPurchase),
    };
};

/** O resumo de auditoria da resposta; null quando não veio. */
export const readSummary = (raw: unknown): AccountsSummary | null => {
    if (!raw || typeof raw !== 'object') return null;
    const s = obj(raw);
    const pair = (value: unknown) => ({ ativo: num(obj(value).ativo), leitura: num(obj(value).leitura) });
    return {
        contas: num(s.contas),
        imerso: pair(s.imerso),
        masterclass: pair(s.masterclass),
        ebook: pair(s.ebook),
        semProduto: num(s.semProduto),
        lixeira: num(s.lixeira),
        arquivadas: num(s.arquivadas),
    };
};

/** Parâmetros de GET /admin/accounts (estado só com o produto, como o servidor exige). */
export const accountsParams = ({
    product,
    state,
    origin,
    situacao,
    todas,
    q,
    sort,
    page,
    pageSize,
}: AccountsQuery) => ({
    ...(product ? { product } : {}),
    ...(product && state ? { state } : {}),
    ...(origin ? { origin } : {}),
    ...(situacao ? { situacao } : {}),
    scope: todas ? 'todas' : 'contas',
    ...(q?.trim() ? { q: q.trim().slice(0, 100) } : {}),
    sort: sort.key,
    dir: sort.dir,
    page,
    pageSize,
});

/** Estado do programa: "Sem. 12", "Pausado", "Não começou", "Formado", "Suspenso" ou "—". */
export const programLabel = (program: AccountRow['program']) => {
    const status = program?.melpStatus;
    if (!status) return '—';
    if (status === 'DEDA_STARTED') return program?.lampWeek ? `Sem. ${program.lampWeek}` : 'Em andamento';
    if (status === 'DEDA_PAUSED') return 'Pausado';
    if (['MELP_BEGIN', 'CAN_START_DEDA', 'DEDA_STARTED_NOT_BEGUN', 'WEEK_ZERO'].includes(status)) return 'Não começou';
    return historyStatusLabel(status);
};

/** Último acesso em DD/MM/AAAA (Brasília); sem nenhum, "nunca entrou". */
export const lastAccessLabel = (at: string | null) => {
    const date = at ? new Date(at) : null;
    return date && !Number.isNaN(date.getTime())
        ? date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
        : 'nunca entrou';
};

/** Selo de cada produto na lista: Ativo, Leitura ou nada (nunca "Total"). */
export const accessBadge = (summary: ProductAccessSummary | undefined) =>
    summary?.state === 'ativo' ? 'Ativo' : summary?.state === 'leitura' ? 'Leitura' : null;

/**
 * Linha miúda sob o selo: plano ou origem e o fim ("Anual · até 22/04/2027", "Parceiro", "Vitalício"); em carência, o
 * fim dela ("Anual · carência até 11/10/2026"), nunca o prazo antigo.
 */
export const accessDetail = (summary: ProductAccessSummary | undefined, today = brToday()) => {
    if (!summary || summary.state === 'none') return null;
    const vital = summary.origin === 'vitalicio' || /vital/i.test(summary.plan ?? '');
    const what = vital
        ? 'Vitalício'
        : (summary.origin === 'compra' && summary.plan) || ORIGINS.find((o) => o.value === summary.origin)?.label;
    if (!vital && inGrace(summary, today))
        return [what, `carência até ${brDay(summary.graceUntil?.slice(0, 10))}`].filter(Boolean).join(' · ');
    const until = !vital && !summary.dateToConfirm ? brDay(summary.validUntil?.slice(0, 10)) : '—';
    return [what, until !== '—' && `até ${until}`].filter(Boolean).join(' · ') || null;
};

/** R$ 1.234,56 (ou "—"). */
export const brl = (value: number | null | undefined) =>
    typeof value === 'number'
        ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
        : '—';

export const productName = (product: Product) => PRODUCT_NAMES[product];

// ---------- CSV (só o dono): a lista do filtro atual, página por página ----------

const CSV_HEADER = [
    'uid',
    'nome',
    'e-mail',
    'telefone',
    'equipe',
    'imerso',
    'imerso_detalhe',
    'masterclass',
    'masterclass_detalhe',
    'ebook',
    'ebook_detalhe',
    'programa',
    'ultimo_acesso',
    'ltv_total',
    'ltv_compras',
    'na_lixeira',
];
const cell = (value: unknown) => {
    const s = value === null || value === undefined ? '' : String(value);
    // planilha não executa fórmula vinda de dado (=, +, -, @); aspas duplicadas
    const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
    return /[",;\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};
export const accountsCsv = (rows: AccountRow[]) =>
    [
        CSV_HEADER.join(','),
        ...rows.map((row) =>
            [
                row.uid,
                row.name,
                row.email,
                row.phone,
                row.team ? 'sim' : '',
                ...PRODUCTS.flatMap((p) => [accessBadge(row.access?.[p]) ?? '', accessDetail(row.access?.[p]) ?? '']),
                programLabel(row.program),
                row.lastAccess ? lastAccessLabel(row.lastAccess) : 'nunca entrou',
                row.ltv?.total ?? '',
                row.ltv?.compras ?? '',
                row.inTrash ? 'sim' : '',
            ]
                .map(cell)
                .join(','),
        ),
    ].join('\r\n');
