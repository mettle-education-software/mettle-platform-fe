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
    base: { contas: Count; imerso: Split; masterclassSemImerso: Split; ebookSemImerso: Split };
    periodo: {
        gravacoes: { total: Count; segundos: Count };
        dedasConcluidos: Count;
        estudoAtivoMin: Count;
        estudoPassivoMin: Count;
        alunosEstudaram: Count;
        compras: { novas: Count; renovacoes: Count };
    };
    estudoPorDia: { date: string; alunos: number }[];
    /** null = o servidor não mandou; "A confirmar" só entra com alguém */
    planosImerso: { label: string; alunos: number }[] | null;
    tempoPrograma: { label: string; alunos: number }[];
    renovaramImerso: Count;
    vencendo: {
        uid: string;
        name: string | null;
        product: Product;
        origin: Origin | null;
        validUntil: string | null;
        inCarencia: boolean;
    }[];
    vencendoTotal: Count;
    semAcesso: {
        uid: string;
        name: string | null;
        lastAccess: string | null;
        dias: number | null;
        semana: number | null;
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
const split = (value: unknown): Split => {
    const v = obj(value);
    return { total: nn(v.total), ativo: nn(v.ativo), leitura: nn(v.leitura) };
};

const PLANS: [string, string][] = [
    ['mensal', 'Mensal'],
    ['anual', 'Anual'],
    ['tresAnos', '3 anos'],
    ['vitalicio', 'Vitalício'],
    ['cortesia', 'Cortesia'],
    ['parceiro', 'Parceiro'],
    ['aConfirmar', 'A confirmar'],
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
            contas: nn(base.contas),
            imerso: split(base.imerso),
            masterclassSemImerso: split(base.masterclassSemImerso),
            ebookSemImerso: split(base.ebookSemImerso),
        },
        periodo: {
            gravacoes: { total: nn(obj(p.gravacoes).total), segundos: nn(obj(p.gravacoes).segundos) },
            dedasConcluidos: nn(p.dedasConcluidos),
            estudoAtivoMin: nn(p.estudoAtivoMin),
            estudoPassivoMin: nn(p.estudoPassivoMin),
            alunosEstudaram: nn(p.alunosEstudaram),
            compras: { novas: nn(obj(p.compras).novas), renovacoes: nn(obj(p.compras).renovacoes) },
        },
        estudoPorDia: list(d.estudoPorDia).flatMap((day) => {
            const date = s(day.date) ?? '';
            const alunos = nn(day.alunos);
            return ISO_DAY.test(date) && alunos !== null ? [{ date, alunos }] : [];
        }),
        planosImerso: plans
            ? PLANS.flatMap(([key, label]) => {
                  const alunos = nn(plans[key]);
                  return alunos === null || (key === 'aConfirmar' && alunos <= 0) ? [] : [{ label, alunos }];
              })
            : null,
        tempoPrograma: list(d.tempoPrograma).flatMap((row) => {
            const alunos = nn(row.alunos);
            const min = nn(row.min);
            const max = nn(row.max);
            return alunos === null ? [] : [{ label: programTimeLabel(min, max), alunos }];
        }),
        renovaramImerso: nn(d.renovaramImerso),
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
                      },
                  ]
                : [];
        }),
        vencendoTotal: nn(d.vencendoTotal),
        semAcesso: list(d.semAcesso).flatMap((v) => {
            const uid = s(v.uid);
            return uid
                ? [{ uid, name: s(v.name), lastAccess: s(v.lastAccess), dias: nn(v.dias), semana: nn(v.semana) }]
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

const STATE: Record<string, string> = { ativo: 'Total', leitura: 'Leitura', none: 'Sem acesso' };
export const stateLabel = (state: string | null) => (state && STATE[state]) || 'Sem acesso';

/** "Imerso: Leitura → Total". */
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

/** De/Até escolhidos à mão: datas válidas, De ≤ Até e nada depois de hoje. */
export const validRange = (range: Range, today = brToday()) =>
    ISO_DAY.test(range.from) && ISO_DAY.test(range.to) && range.from <= range.to && range.to <= today;
