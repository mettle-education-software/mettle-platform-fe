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
import { NOT_STARTED, programStarted } from './dedaClock';

export { programStarted };

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
export type SortKey =
    | 'name'
    | 'lastAccess'
    | 'expiry'
    | 'ltv'
    | 'ltvDias'
    | 'overall'
    | 'dedaRun'
    | 'leaderboardPos'
    | 'level';
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

/** Nível do programa (intensidade escolhida no início): Flow, Boost, Turbo — nomes, em inglês como no programa. */
export type Level = 'flow' | 'boost' | 'turbo';
export const LEVELS: { value: Level; label: string }[] = [
    { value: 'flow', label: 'Flow' },
    { value: 'boost', label: 'Boost' },
    { value: 'turbo', label: 'Turbo' },
];
export const levelLabel = (level: Level | null | undefined) => LEVELS.find((l) => l.value === level)?.label ?? null;

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
        /** nível (Flow/Boost/Turbo); ausente nas contas montadas fora da lista */
        level?: Level | null;
    } | null;
    lastAccess: string | null;
    hasLogin: boolean | null;
    /** o login foi recriado (o histórico de acesso anterior se perdeu): sem data = "sem registro", não "nunca entrou" */
    loginRecriado: boolean;
    inTrash: boolean;
    /** LTV: total em R$, quantas compras e dias com acesso ativo a algum produto; null = não veio */
    ltv: { total: number | null; compras: number | null; dias?: number | null } | null;
    /** Overall da LAMP (%), DEDA Run (dias) e posição no leaderboard geral; null = sem dado */
    overall: number | null;
    dedaRun: number | null;
    leaderboardPos: number | null;
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
    /** quando as métricas (Overall, Run, posição) e a foto da base (LTV) foram calculadas */
    metricsAt: string | null;
    snapshotAt: string | null;
}

export interface AccountsQuery {
    product?: Product;
    state?: AccessStateNew;
    origin?: OriginFilter;
    situacao?: Situacao;
    level?: Level;
    /** incluir arquivadas (scope=todas) */
    todas?: boolean;
    q?: string;
    sort: Sort;
    page: number;
    /** 25, 50 ou 100 na tela; o CSV pede 200 (o máximo do servidor) */
    pageSize: number;
}

const PRODUCTS: readonly Product[] = ['imerso', 'masterclass', 'ebook'];
const SORT_KEYS: readonly SortKey[] = [
    'name',
    'lastAccess',
    'expiry',
    'ltv',
    'ltvDias',
    'overall',
    'dedaRun',
    'leaderboardPos',
    'level',
];
const STATES: readonly string[] = ['ativo', 'leitura', 'none'];

/**
 * O que fica no endereço (recarregar mantém; links do Início e da Lixeira chegam filtrados). A busca não: nome, e-mail
 * e telefone de aluno não vão para o endereço (que a telemetria registra).
 */
export interface ContasView {
    product?: Product;
    state?: AccessStateNew;
    origin?: OriginFilter;
    situacao?: Situacao;
    level?: Level;
    todas?: boolean;
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
    const level = params?.get('level');
    const sort = params?.get('sort') as SortKey | null;
    const size = Number(params?.get('pageSize'));
    const okProduct = product && PRODUCTS.includes(product) ? product : undefined;
    return {
        product: okProduct,
        state: okProduct && state && STATES.includes(state) ? (state as AccessStateNew) : undefined,
        origin: ORIGIN_FILTERS.some((o) => o.value === origin) ? (origin as OriginFilter) : undefined,
        situacao: SITUACOES.some((s) => s.value === situacao) ? (situacao as Situacao) : undefined,
        level: LEVELS.some((l) => l.value === level) ? (level as Level) : undefined,
        todas: params?.get('scope') === 'todas',
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
        if (view.level) params.set('level', view.level);
        if (view.todas) params.set('scope', 'todas');
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
                  level: LEVELS.some((l) => l.value === p.level) ? (p.level as Level) : null,
              }
            : null,
        lastAccess: text(r.lastAccess),
        hasLogin: typeof r.hasLogin === 'boolean' ? r.hasLogin : null,
        loginRecriado: r.loginRecriado === true,
        inTrash: r.inTrash === true,
        ltv: ltv ? { total: num(ltv.total), compras: num(ltv.compras), dias: num(ltv.dias) } : null,
        overall: num(r.overall),
        dedaRun: num(r.dedaRun),
        leaderboardPos: num(r.leaderboardPos),
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
    level,
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
    ...(level ? { level } : {}),
    scope: todas ? 'todas' : 'contas',
    ...(q?.trim() ? { q: q.trim().slice(0, 100) } : {}),
    sort: sort.key,
    dir: sort.dir,
    page,
    pageSize,
});

/** Programa (em semanas): só o número ("12"), ou "Pausado", "Não começou", "Formado", "Suspenso", "—". */
export const programLabel = (program: AccountRow['program']) => {
    const status = program?.melpStatus;
    if (!status) return '—';
    if (status === 'DEDA_STARTED') return program?.lampWeek ? String(program.lampWeek) : 'Em andamento';
    if (status === 'DEDA_PAUSED') return 'Pausado';
    if (NOT_STARTED.includes(status)) return 'Não começou';
    return historyStatusLabel(status);
};

/** O programa por extenso (a conta aberta): "Semana 12 · Boost", "Pausado · Flow", "Não começou"… */
export const programText = (program: AccountRow['program']) => {
    const label = programLabel(program);
    const started = programStarted(program?.melpStatus);
    return [/^\d+$/.test(label) ? `Semana ${label}` : label, started && levelLabel(program?.level)]
        .filter(Boolean)
        .join(' · ');
};

/**
 * Último acesso em DD/MM/AAAA (Brasília); sem nenhum, "nunca entrou" — ou "sem registro" quando o login foi recriado
 * (a pessoa entrou antes, mas o histórico de acesso se perdeu com o login novo).
 */
export const lastAccessLabel = (at: string | null, loginRecriado = false) => {
    const date = at ? new Date(at) : null;
    if (date && !Number.isNaN(date.getTime()))
        return date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    return loginRecriado ? 'sem registro' : 'nunca entrou';
};

/** Selo de cada produto na lista: Ativo, Leitura ou nada (nunca "Total"). */
export const accessBadge = (summary: ProductAccessSummary | undefined) =>
    summary?.state === 'ativo' ? 'Ativo' : summary?.state === 'leitura' ? 'Leitura' : null;

/**
 * Linha miúda sob o selo: plano ou origem e o fim ("Anual · até 22/04/2027", "Parceiro", "Vitalício"); em carência, o
 * fim dela ("Anual · carência até 11/10/2026"), nunca o prazo antigo. `plan: false` (Masterclass e E-book): sem a
 * palavra do plano — compra mostra só "até 22/04/2027"; fora de compra, a origem (Cortesia, Parceiro, Equipe).
 */
export const accessDetail = (summary: ProductAccessSummary | undefined, today = brToday(), plan = true) => {
    if (!summary || summary.state === 'none') return null;
    // como o servidor: vitalício pela origem, ou compra com plano vitalício
    const vital = summary.origin === 'vitalicio' || (summary.origin === 'compra' && /vital/i.test(summary.plan ?? ''));
    const what = vital
        ? 'Vitalício'
        : summary.origin === 'compra'
          ? (plan && (summary.plan || 'Compra')) || null
          : ORIGINS.find((o) => o.value === summary.origin)?.label;
    if (!vital && inGrace(summary, today))
        return [what, `carência até ${brDay(summary.graceUntil?.slice(0, 10))}`].filter(Boolean).join(' · ');
    const until = !vital && !summary.dateToConfirm ? brDay(summary.validUntil?.slice(0, 10)) : '—';
    return [what, until !== '—' && `até ${until}`].filter(Boolean).join(' · ') || null;
};

/**
 * LTV em duas linhas: o dinheiro ("R$ 1.363,00") e "3 compras · 742 dias" (dias com acesso ativo a algum produto).
 * Compra sem compra achada na conciliação: "—" no dinheiro, nunca "R$ 0,00"; R$ 0,00 só para cortesia, parceiro e
 * equipe (quem não pagou de fato).
 */
export const ltvCell = (row: Pick<AccountRow, 'ltv' | 'access'>) => {
    const ltv = row.ltv;
    const days =
        typeof ltv?.dias === 'number' ? `${ltv.dias.toLocaleString('pt-BR')} ${ltv.dias === 1 ? 'dia' : 'dias'}` : null;
    if (!ltv) return { money: '—', line: null };
    // pagou: há compras (ou um total, mesmo sem a contagem); grátis: todo produto que a pessoa tem é cortesia, parceiro
    // ou equipe (origem desconhecida não conta como grátis)
    const paid = (ltv.compras ?? 0) > 0 || (ltv.total ?? 0) > 0;
    const held = PRODUCTS.map((p) => row.access?.[p]).filter((a) => a && (a.state !== 'none' || a.origin));
    const free =
        !paid && held.length > 0 && held.every((a) => ['cortesia', 'parceiro', 'equipe'].includes(a?.origin ?? ''));
    const money = paid ? brl(ltv.total) : free ? brl(0) : '—';
    const buys = (ltv.compras ?? 0) > 0 ? `${ltv.compras} ${ltv.compras === 1 ? 'compra' : 'compras'}` : null;
    return { money, line: [buys, days].filter(Boolean).join(' · ') || null };
};

/** Overall (%), DEDA Run (dias) e posição no leaderboard: número curto, "—" sem dado. */
export const metricLabel = {
    overall: (v: number | null) =>
        typeof v === 'number' ? `${v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%` : '—',
    dedaRun: (v: number | null) => (typeof v === 'number' ? v.toLocaleString('pt-BR') : '—'),
    leaderboardPos: (v: number | null) => (typeof v === 'number' ? `${v.toLocaleString('pt-BR')}º` : '—'),
};

/** R$ 1.234,56 (ou "—"). */
export const brl = (value: number | null | undefined) =>
    typeof value === 'number'
        ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
        : '—';

// ---------- CSV (só o dono): a lista do filtro atual, página por página ----------
// Separador ";" e vírgula decimal: o Excel em português abre em colunas (o Google Planilhas detecta sozinho).

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
    'programa_semanas',
    'nivel',
    'overall',
    'deda_run',
    'leaderboard',
    'ultimo_acesso',
    'ltv_total',
    'ltv_compras',
    'ltv_dias',
    'na_lixeira',
];
const cell = (value: unknown) => {
    const s = value === null || value === undefined ? '' : String(value);
    // planilha não executa fórmula vinda de dado (=, +, -, @, tab, CR: lista da OWASP); aspas duplicadas
    const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
    return /[";\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};
export const accountsCsv = (rows: AccountRow[]) =>
    [
        CSV_HEADER.join(';'),
        ...rows.map((row) =>
            [
                row.uid,
                row.name,
                row.email,
                row.phone,
                row.team ? 'sim' : '',
                ...PRODUCTS.flatMap((p) => [
                    accessBadge(row.access?.[p]) ?? '',
                    accessDetail(row.access?.[p], undefined, p === 'imerso') ?? '',
                ]),
                programLabel(row.program),
                (programStarted(row.program?.melpStatus) && levelLabel(row.program?.level)) || '',
                typeof row.overall === 'number' ? String(row.overall).replace('.', ',') : '',
                row.dedaRun ?? '',
                row.leaderboardPos ?? '',
                lastAccessLabel(row.lastAccess, row.loginRecriado),
                ltvCell(row).money === '—' || typeof row.ltv?.total !== 'number'
                    ? ''
                    : row.ltv.total.toFixed(2).replace('.', ','),
                ltvCell(row).money === '—' ? '' : (row.ltv?.compras ?? ''),
                row.ltv?.dias ?? '',
                row.inTrash ? 'sim' : '',
            ]
                .map(cell)
                .join(';'),
        ),
    ].join('\r\n');
