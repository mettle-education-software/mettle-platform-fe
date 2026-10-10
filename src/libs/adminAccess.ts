// Admin: acesso por produto de um aluno (modelo de 10-Out-2026, vault "Acessos — Modelo e Lançamento"). Servidor:
// GET/PUT /accounts/:uid/access(/:product) e GET /accounts/:uid/access-events (accounts-service, só admin). As regras
// de prazo são as do servidor (mettle-common/helpers/access.nextAccess); aqui só o que a tela precisa para montar o
// pedido. O servidor decide e recusa com { code, message }. Testes: libs/__tests__/adminAccess.test.ts.

export type Product = 'imerso' | 'masterclass' | 'ebook';
export type Origin = 'compra' | 'vitalicio' | 'cortesia' | 'parceiro' | 'equipe';
export type AccessStateNew = 'ativo' | 'leitura' | 'none';

export interface AccessRow {
    product: Product;
    state: AccessStateNew;
    /** null = origem a confirmar (carga inicial) */
    origin: Origin | null;
    plan: string | null;
    /** dia de Brasília AAAA-MM-DD */
    validUntil: string | null;
    dateToConfirm: boolean;
    graceUntil: string | null;
    leituraSince?: string | null;
    updatedAt: string | null;
    updatedBy: string | null;
}

/** Quem é o aluno (GET /accounts/:uid/access); `disabled` null = sem login no Firebase. */
export interface StudentUser {
    uid: string;
    name: string | null;
    email: string | null;
    photoURL: string | null;
    disabled: boolean | null;
}

/** Antes/depois do registro: a linha gravada, com os nomes do banco. */
export interface EventFields {
    state?: AccessStateNew | null;
    origin?: Origin | null;
    valid_until?: string | null;
    date_to_confirm?: boolean | null;
}

export interface AccessEvent {
    id: number;
    product: Product;
    at: string;
    /** 'carga' | 'rotina' | 'hook:herospark' | uid de quem mudou */
    actor: string | null;
    actorName: string | null;
    reason: string | null;
    before: EventFields | null;
    after: EventFields | null;
}

/** Página do aluno no Admin (aberta pela linha de /admin/historico). */
export const studentPath = (uid: string) => `/admin/aluno/${encodeURIComponent(uid)}`;

export const PRODUCT_NAMES: Record<Product, string> = { imerso: 'Imerso', masterclass: 'Masterclass', ebook: 'E-book' };

export const ORIGINS: { value: Origin; label: string }[] = [
    { value: 'compra', label: 'Compra' },
    { value: 'vitalicio', label: 'Vitalício' },
    { value: 'cortesia', label: 'Cortesia' },
    { value: 'parceiro', label: 'Parceiro' },
    { value: 'equipe', label: 'Equipe' },
];
const ORIGIN_LABEL = Object.fromEntries(ORIGINS.map((o) => [o.value, o.label])) as Record<Origin, string>;

export const MONTHS = [1, 3, 6, 12] as const;

/** Prazo de cada origem: data (Compra), meses (Cortesia) ou nenhum (Vitalício, Parceiro, Equipe). */
export const termKind = (origin: Origin | null) =>
    origin === 'compra' ? 'date' : origin === 'cortesia' ? 'months' : origin ? 'none' : null;

/** Cortesia: o Imerso concede 1, 3, 6 ou 12 meses; Masterclass e E-book, sempre 1. */
export const grantOptions = (product: Product): readonly number[] => (product === 'imerso' ? MONTHS : [1]);

/** Estender +1/+3/+6/+12: Imerso ativo com prazo (Compra ou Cortesia). */
export const canExtend = (row: AccessRow) =>
    row.product === 'imerso' && row.state === 'ativo' && termKind(row.origin) !== 'none' && !!row.origin;

export type Term =
    | { kind: 'keep' }
    | { kind: 'date'; value: string }
    | { kind: 'grant'; months: number }
    | { kind: 'extend'; months: number };

export interface Draft {
    state: 'ativo' | 'leitura';
    origin: Origin | null;
    term: Term;
}

/** O rascunho começa igual ao servidor (sem acesso: Total, a origem por escolher). */
export const draftOf = (row: AccessRow): Draft => ({
    state: row.state === 'leitura' ? 'leitura' : 'ativo',
    origin: row.origin,
    term: { kind: 'keep' },
});

export interface AccessBody {
    state: 'ativo' | 'leitura';
    origin: Origin;
    validUntil?: string | null;
    grantMonths?: number;
    extendMonths?: number;
}

/** Hoje em Brasília (AAAA-MM-DD): os prazos são dias de Brasília. */
export const brToday = (now = new Date()) =>
    new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(now);

const plusDays = (iso: string, days: number) =>
    new Date(Date.parse(`${iso}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);

/**
 * Total com um prazo que já passou (o servidor recusaria com ALREADY_EXPIRED): a frase do que falta, ou null. Compra
 * vale até a data + 14 dias de carência; Cortesia, até a data.
 */
export const termProblem = (draft: Draft, row: AccessRow, today = brToday()) => {
    const { state, origin, term } = draft;
    if (state !== 'ativo' || !origin || termKind(origin) === 'none') return null;
    if (term.kind === 'date' && term.value) {
        const until = origin === 'compra' ? plusDays(term.value, 14) : term.value;
        return until < today ? 'Data já vencida: escolha uma data futura.' : null;
    }
    if (term.kind !== 'keep' || origin !== row.origin) return null;
    const until = row.graceUntil ?? row.validUntil;
    return until && until < today ? 'Prazo vencido: escolha um prazo novo.' : null;
};

/**
 * O PUT do rascunho, ou null se falta escolher (origem; prazo da Cortesia do Imerso quando ela começa agora; prazo
 * novo quando o atual já venceu). Sem prazo escolhido e com a mesma origem, o servidor mantém a data; Compra sem
 * data = "data a confirmar".
 */
export const accessBody = (draft: Draft, row: AccessRow, today = brToday()): AccessBody | null => {
    const { state, origin, term } = draft;
    if (!origin || termProblem(draft, row, today)) return null;
    const body: AccessBody = { state, origin };
    const kind = termKind(origin);
    if (kind === 'none') return body;
    if (term.kind === 'date') return { ...body, validUntil: term.value || null };
    if (term.kind === 'grant') return { ...body, grantMonths: term.months };
    if (term.kind === 'extend') return { ...body, extendMonths: term.months };
    // Cortesia do Imerso que começa agora precisa dos meses (Masterclass e E-book: o servidor dá 1 mês)
    if (origin === 'cortesia' && row.product === 'imerso' && row.origin !== 'cortesia') return null;
    return body;
};

export const isDirty = (draft: Draft, row: AccessRow) =>
    row.state === 'none' || draft.state !== row.state || draft.origin !== row.origin || draft.term.kind !== 'keep';

/** Dia de Brasília (AAAA-MM-DD) como DD/MM/AAAA, sem fuso (é uma data civil). */
export const brDay = (iso: string | null | undefined) =>
    iso && /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso.split('-').reverse().join('/') : '—';

/** Selos da linha: data a confirmar e até quando vai a cortesia. */
export const accessBadges = (row: AccessRow) => [
    ...(row.state === 'ativo' && row.dateToConfirm ? ['data a confirmar'] : []),
    ...(row.origin === 'cortesia' && row.validUntil ? [`cortesia até ${brDay(row.validUntil)}`] : []),
];

const STATE_LABEL: Record<AccessStateNew, string> = { ativo: 'Total', leitura: 'Leitura', none: 'Sem acesso' };

/** "Total · Cortesia até 10/01/2027", "Leitura · Compra", "Sem acesso". */
export const accessLabel = (fields: EventFields | null | undefined) => {
    if (!fields?.state || fields.state === 'none') return 'Sem acesso';
    const origin = fields.origin ? ORIGIN_LABEL[fields.origin] : 'origem a confirmar';
    const term = fields.valid_until
        ? ` até ${brDay(fields.valid_until)}`
        : fields.state === 'ativo' && fields.date_to_confirm
          ? ', data a confirmar'
          : '';
    return `${STATE_LABEL[fields.state]} · ${origin}${term}`;
};

const ACTORS: Record<string, string> = {
    carga: 'Carga inicial',
    rotina: 'Rotina diária',
    'hook:herospark': 'Compra (HeroSpark)',
};

/** Quem mudou: o nome da conta, ou a rotina/carga/compra; uid sem nome = equipe. */
export const actorLabel = (event: AccessEvent) =>
    event.actorName || (event.actor && ACTORS[event.actor]) || (event.actor ? 'Equipe' : '—');

/** Quando, no relógio de Brasília. */
export const eventWhen = (at: string) => {
    const date = new Date(at);
    return Number.isNaN(date.getTime())
        ? '—'
        : date.toLocaleString('pt-BR', {
              timeZone: 'America/Sao_Paulo',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
          });
};

/** Recusa do servidor ({ code, message }) para a tela: a frase dele, ou uma genérica. */
export const serverProblem = (error: unknown) => {
    const data = (error as { response?: { status?: number; data?: { code?: string; message?: string } } } | null)
        ?.response;
    if (data?.data?.message) return data.data.message;
    if (data?.status === 403) return 'Sem permissão para esta ação.';
    return 'Não foi possível gravar. Tente de novo.';
};
