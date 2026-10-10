// Início do Admin (/admin; desenho do André, 10-Out-2026): a base (sem filtro), o período escolhido (Hoje, 7, 30, 90
// dias, 12 meses ou De/Até), o Imerso (planos, tempo de programa, renovações) e o que pede atenção. Uma chamada:
// GET /admin/dashboard?from=&to= (datas de Brasília, inclusivas; sem elas, 30 dias). Campo que falta = "—", nunca um
// número inventado. Testes: libs/__tests__/adminDashboard.test.ts.
import { brToday, ORIGINS, plusDays, PRODUCT_NAMES, type Origin, type Product } from './adminAccess';

/** Contagem do servidor; null = não veio (a tela mostra "—"). */
export type Count = number | null;
export interface Split {
    total: Count;
    ativo: Count;
    leitura: Count;
}

export interface Dashboard {
    /** contas: com login; null se o servidor não conseguiu contar (Firebase fora) */
    base: { contas: Split & { semProduto: Count }; imerso: Split; masterclass: Split; ebook: Split };
    /** quantas pessoas em cada combinação de produtos (ativo ou leitura); null = não veio */
    combinacoes: { label: string; alunos: number }[] | null;
    periodo: {
        gravacoes: { total: Count; segundos: Count };
        dedasConcluidos: Count;
        estudoAtivoMin: Count;
        estudoPassivoMin: Count;
        alunosEstudaram: Count;
        compras: { novas: Count; renovacoes: Count };
    };
    /** null = resposta sem o período (rota anterior: série fixa de 30 dias, que não segue o filtro) */
    estudoPorDia: { date: string; alunos: number }[] | null;
    /** null = o servidor não mandou; "A confirmar" só entra com alguém */
    planosImerso: { label: string; alunos: number }[] | null;
    tempoPrograma: { label: string; alunos: number }[] | null;
    renovaramImerso: Count;
    /** LTV médio do Imerso: o dinheiro e os dias com acesso ativo (null = não veio) */
    ltvMedio: { valor: Count; dias: Count } | null;
    vencendo: {
        uid: string;
        name: string | null;
        product: Product;
        origin: Origin | null;
        validUntil: string | null;
        inCarencia: boolean;
        /** fim da carência (quando está nela) */
        graceUntil: string | null;
    }[];
    vencendoTotal: Count;
    /** pessoas que vencem em 30 dias (o vencendoTotal conta produtos) */
    vencendoPessoas: Count;
    semAcesso: {
        uid: string;
        name: string | null;
        lastAccess: string | null;
        dias: number | null;
        semana: number | null;
        /** login recriado: sem data = "sem registro" (o histórico se perdeu), não "nunca entrou" */
        loginRecriado: boolean;
    }[];
    semAcessoTotal: Count;
    eventos: {
        at: string;
        uid: string;
        name: string | null;
        product: Product;
        from: string | null;
        to: string | null;
        origin: Origin | null;
        by: string | null;
    }[];
}

type Raw = Record<string, unknown>;
const obj = (value: unknown): Raw =>
    value && typeof value === 'object' && !Array.isArray(value) ? (value as Raw) : {};
const nn = (value: unknown): Count => (typeof value === 'number' && Number.isFinite(value) ? value : null);
const s = (value: unknown) => (typeof value === 'string' && value ? value : null);
const list = (value: unknown): Raw[] => (Array.isArray(value) ? value.map(obj) : []);
const PRODUCTS: readonly string[] = ['imerso', 'masterclass', 'ebook'];
const product = (value: unknown) => (PRODUCTS.includes(value as string) ? (value as Product) : null);
const origin = (value: unknown) => (ORIGINS.some((o) => o.value === value) ? (value as Origin) : null);
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
/** Dia civil AAAA-MM-DD (o começo de um carimbo também serve); outra coisa vira null. */
const day = (value: unknown) => {
    const text = typeof value === 'string' ? value.slice(0, 10) : '';
    return ISO_DAY.test(text) ? text : null;
};
const split = (value: unknown): Split => {
    const v = obj(value);
    return { total: nn(v.total), ativo: nn(v.ativo), leitura: nn(v.leitura) };
};

const PLANS: [string, string][] = [
    ['mensal', 'Mensal'],
    ['anual', 'Anual'],
    ['doisAnos', '2 anos'],
    ['tresAnos', '3 anos'],
    ['vitalicio', 'Vitalício'],
    ['cortesia', 'Cortesia'],
    ['parceiro', 'Parceiro'],
    ['aConfirmar', 'A confirmar'],
];

const OPTIONAL_PLANS = ['doisAnos', 'aConfirmar'];

const COMBOS: [string, string][] = [
    ['imerso', 'Só Imerso'],
    ['masterclass', 'Só Masterclass'],
    ['ebook', 'Só E-book'],
    ['imerso+masterclass', 'Imerso + Masterclass'],
    ['imerso+ebook', 'Imerso + E-book'],
    ['masterclass+ebook', 'Masterclass + E-book'],
    ['imerso+masterclass+ebook', 'Imerso + Masterclass + E-book'],
];

/** "Não começou", "1–3 meses", "24+ meses". */
export const programTimeLabel = (min: number | null, max: number | null) =>
    min === null && max === null ? 'Não começou' : max === null ? `${min}+ meses` : `${min ?? 0}–${max} meses`;

/** A resposta, conferida; null quando não é a do painel (rota antiga no mesmo endereço, ou nada). */
export const readDashboard = (data: unknown): Dashboard | null => {
    const d = obj(data);
    if (!['base', 'periodo', 'vencendo', 'semAcesso', 'eventos'].some((key) => key in d)) return null;
    const base = obj(d.base);
    const p = obj(d.periodo);
    const plans = d.planosImerso && typeof d.planosImerso === 'object' ? obj(d.planosImerso) : null;
    return {
        base: {
            contas: { ...split(base.contas), semProduto: nn(obj(base.contas).semProduto) },
            imerso: split(base.imerso),
            masterclass: split(base.masterclass),
            ebook: split(base.ebook),
        },
        combinacoes:
            d.combinacoes && typeof d.combinacoes === 'object'
                ? COMBOS.flatMap(([key, label]) => {
                      const alunos = nn(obj(d.combinacoes)[key]);
                      return alunos === null ? [] : [{ label, alunos }];
                  })
                : null,
        periodo: {
            gravacoes: { total: nn(obj(p.gravacoes).total), segundos: nn(obj(p.gravacoes).segundos) },
            dedasConcluidos: nn(p.dedasConcluidos),
            estudoAtivoMin: nn(p.estudoAtivoMin),
            estudoPassivoMin: nn(p.estudoPassivoMin),
            alunosEstudaram: nn(p.alunosEstudaram),
            compras: { novas: nn(obj(p.compras).novas), renovacoes: nn(obj(p.compras).renovacoes) },
        },
        estudoPorDia:
            'periodo' in d
                ? list(d.estudoPorDia).flatMap((day) => {
                      const date = s(day.date) ?? '';
                      const alunos = nn(day.alunos);
                      return ISO_DAY.test(date) && alunos !== null ? [{ date, alunos }] : [];
                  })
                : null,
        planosImerso: plans
            ? PLANS.flatMap(([key, label]) => {
                  const alunos = nn(plans[key]);
                  // "2 anos" e "A confirmar" só aparecem com alguém
                  return alunos === null || (OPTIONAL_PLANS.includes(key) && alunos <= 0) ? [] : [{ label, alunos }];
              })
            : null,
        tempoPrograma: Array.isArray(d.tempoPrograma)
            ? list(d.tempoPrograma).flatMap((row) => {
                  const alunos = nn(row.alunos);
                  return alunos === null ? [] : [{ label: programTimeLabel(nn(row.min), nn(row.max)), alunos }];
              })
            : null,
        renovaramImerso: nn(d.renovaramImerso),
        ltvMedio:
            d.ltvMedio && typeof d.ltvMedio === 'object'
                ? { valor: nn(obj(d.ltvMedio).valor), dias: nn(obj(d.ltvMedio).dias) }
                : null,
        vencendo: list(d.vencendo).flatMap((v) => {
            const uid = s(v.uid);
            const p2 = product(v.product);
            return uid && p2
                ? [
                      {
                          uid,
                          name: s(v.name),
                          product: p2,
                          origin: origin(v.origin),
                          validUntil: s(v.validUntil),
                          inCarencia: v.inCarencia === true,
                          graceUntil: day(v.graceUntil),
                      },
                  ]
                : [];
        }),
        vencendoTotal: nn(d.vencendoTotal),
        vencendoPessoas: nn(d.vencendoPessoas),
        semAcesso: list(d.semAcesso).flatMap((v) => {
            const uid = s(v.uid);
            return uid
                ? [
                      {
                          uid,
                          name: s(v.name),
                          lastAccess: s(v.lastAccess),
                          dias: nn(v.dias),
                          semana: nn(v.semana),
                          loginRecriado: v.loginRecriado === true,
                      },
                  ]
                : [];
        }),
        semAcessoTotal: nn(d.semAcessoTotal),
        eventos: list(d.eventos).flatMap((v) => {
            const uid = s(v.uid);
            const p2 = product(v.product);
            const at = s(v.at);
            return uid && p2 && at
                ? [
                      {
                          at,
                          uid,
                          name: s(v.name),
                          product: p2,
                          from: s(v.from),
                          to: s(v.to),
                          origin: origin(v.origin),
                          by: s(v.by),
                      },
                  ]
                : [];
        }),
    };
};

/**
 * Quem vence, uma linha por pessoa: os produtos juntos, o fim mais cedo e, se algum produto está em carência, até
 * quando ela vai (a data antiga do produto não aparece).
 */
export interface DuePerson {
    uid: string;
    name: string | null;
    products: Product[];
    /** o fim mais cedo dos produtos fora da carência */
    validUntil: string | null;
    inCarencia: boolean;
    /** o fim mais cedo das carências (null enquanto o servidor não manda) */
    graceUntil: string | null;
}
const earliest = (a: string | null, b: string | null) => (a && (!b || a < b) ? a : b);
export const duePeople = (rows: Dashboard['vencendo']): DuePerson[] => {
    const people = new Map<string, DuePerson>();
    for (const row of rows) {
        const person = people.get(row.uid) ?? {
            uid: row.uid,
            name: row.name,
            products: [],
            validUntil: null,
            inCarencia: false,
            graceUntil: null,
        };
        people.set(row.uid, person);
        if (!person.products.includes(row.product)) person.products.push(row.product);
        if (row.inCarencia) {
            person.inCarencia = true;
            person.graceUntil = earliest(row.graceUntil, person.graceUntil);
        } else person.validUntil = earliest(row.validUntil, person.validUntil);
    }
    // a ordem do servidor é pelo fim do produto; reordena pelo fim mais cedo de cada pessoa (carência sem o fim, primeiro)
    const due = (person: DuePerson) =>
        person.inCarencia && !person.graceUntil ? '' : (earliest(person.graceUntil, person.validUntil) ?? '');
    return [...people.values()].sort((a, b) => due(a).localeCompare(due(b)));
};

/** "Masterclass e E-book"; "Imerso, Masterclass e E-book". */
export const productList = (products: Product[]) =>
    new Intl.ListFormat('pt-BR', { type: 'conjunction' }).format(products.map((p) => PRODUCT_NAMES[p]));

/**
 * Quantas pessoas vencem: exato quando a lista veio inteira (o total do servidor conta produtos, e cabe nela); com a
 * lista cortada (50 linhas), "N+" pelas pessoas que vieram.
 */
export const duePeopleCount = (d: Pick<Dashboard, 'vencendo' | 'vencendoTotal' | 'vencendoPessoas'>) => {
    // o total de pessoas do servidor, quando vem, é exato
    if (d.vencendoPessoas !== null) return count(d.vencendoPessoas);
    const people = new Set(d.vencendo.map((row) => row.uid)).size;
    if (d.vencendoTotal === null) return null;
    return d.vencendoTotal <= d.vencendo.length ? count(people) : `${count(people)}+`;
};

const STATE: Record<string, string> = { ativo: 'Ativo', leitura: 'Leitura', none: 'Sem acesso' };
export const stateLabel = (state: string | null) => (state && STATE[state]) || 'Sem acesso';

/** "Imerso: Leitura → Ativo". */
export const changeLabel = (event: Dashboard['eventos'][number]) =>
    `${PRODUCT_NAMES[event.product]}: ${stateLabel(event.from)} → ${stateLabel(event.to)}`;

/** Dia civil AAAA-MM-DD como DD/MM (eixo do gráfico). */
export const dayMonth = (iso: string) => (ISO_DAY.test(iso) ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : iso);

/** Contagem com separador de milhar, ou "—". */
export const count = (value: Count) => (value === null ? '—' : value.toLocaleString('pt-BR'));

/** Minutos como "Xh Ym" (ou "—"). */
export const hoursMinutes = (minutes: Count) => {
    if (minutes === null || minutes < 0) return '—';
    const total = Math.round(minutes);
    return `${Math.floor(total / 60).toLocaleString('pt-BR')}h ${total % 60}m`;
};

// ---------- período (só o bloco "No período") ----------

export type Range = { from: string; to: string };
export const PRESETS = [
    { key: 'hoje', label: 'Hoje', days: 1 },
    { key: '7d', label: '7 dias', days: 7 },
    { key: '30d', label: '30 dias', days: 30 },
    { key: '90d', label: '90 dias', days: 90 },
    { key: '12m', label: '12 meses', days: 365 },
] as const;
export type PresetKey = (typeof PRESETS)[number]['key'];

/** Os últimos N dias até hoje (Brasília), inclusive. */
export const presetRange = (key: PresetKey, today = brToday()): Range => {
    const days = PRESETS.find((preset) => preset.key === key)?.days ?? 30;
    return { from: plusDays(today, -(days - 1)), to: today };
};

/** Até onde o De/Até volta (2 anos): uma data digitada errada não pede o histórico inteiro. */
export const rangeFloor = (today = brToday()) => plusDays(today, -730);

/** De/Até escolhidos à mão: datas válidas, De ≤ Até, de 2 anos para cá e nada depois de hoje. */
export const validRange = (range: Range, today = brToday()) =>
    ISO_DAY.test(range.from) &&
    ISO_DAY.test(range.to) &&
    range.from >= rangeFloor(today) &&
    range.from <= range.to &&
    range.to <= today;

/** Os dias da série dentro do período escolhido. */
export const inRange = (days: { date: string; alunos: number }[], range: Range) =>
    days.filter((day) => day.date >= range.from && day.date <= range.to);
