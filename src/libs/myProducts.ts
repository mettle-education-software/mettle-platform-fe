// "Meus produtos" nas Configurações (desenho de 10-Out-2026): só do modelo de acesso (GET /accounts/me, accessDetails),
// nunca do catálogo de cursos em cache (abrir a página direto não pode sumir com a Masterclass). Para o aluno: nada de
// "a confirmar" nem de origem desconhecida. Testes: libs/__tests__/myProducts.test.ts.
import { EBOOK_SALES_URL } from './ebook';
import { MASTERCLASS_SALES_URL } from './masterclass';
import { IMERSO_PRODUCT, RENEWAL_URLS } from './productAccess';

/** Linha de `accessDetails` (accessDto do servidor); `firstPurchase` chega depois (mostrado só se vier). */
export interface MyAccessRow {
    product: string;
    state: string;
    origin?: string | null;
    plan?: string | null;
    validUntil?: string | null;
    dateToConfirm?: boolean;
    graceUntil?: string | null;
    leituraSince?: string | null;
    firstPurchase?: string | null;
}

export interface ProductLine {
    key: string;
    name: string;
    /** Ativo (destaque) ou Leitura (neutro) */
    pill: 'Ativo' | 'Leitura';
    plan: string | null;
    term: string | null;
    /** " · faltam N dias" (≤ 60 dias), no tom de destaque */
    soon: string | null;
    renew: string | null;
}

const NAMES: Record<string, string> = { imerso: 'Programa Imerso', masterclass: 'Masterclass', ebook: 'E-book' };
const RENEW: Record<string, string> = {
    imerso: RENEWAL_URLS[IMERSO_PRODUCT],
    masterclass: MASTERCLASS_SALES_URL,
    ebook: EBOOK_SALES_URL,
};
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const day = (value?: string | null) => (value && ISO_DAY.test(value.slice(0, 10)) ? value.slice(0, 10) : null);

/** "12 de março de 2027" (dia civil, sem fuso). */
export const longDate = (iso?: string | null) => {
    const d = day(iso);
    return d
        ? new Date(`${d}T12:00:00Z`).toLocaleDateString('pt-BR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              timeZone: 'UTC',
          })
        : null;
};

const daysBetween = (from: string, to: string) =>
    Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);

const fold = (value?: string | null) => (value ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Linha 2 pela origem: o plano da compra (MELP avulso conta como 3 anos), Vitalício, Cortesia, Parceiro, Equipe. */
export const planLabel = (origin?: string | null, plan?: string | null) => {
    if (origin === 'vitalicio') return 'Vitalício';
    if (origin === 'cortesia') return 'Cortesia';
    if (origin === 'parceiro') return 'Parceiro';
    if (origin === 'equipe') return 'Equipe';
    if (origin !== 'compra') return null;
    const p = fold(plan);
    if (p.includes('vital')) return 'Vitalício';
    if (/\b3 anos?\b/.test(p) || p.includes('trianual') || p.includes('melp') || p.includes('avulso'))
        return 'Plano 3 anos';
    if (/\b2 anos?\b/.test(p) || p.includes('bianual')) return 'Plano 2 anos';
    if (p.includes('mensal')) return 'Plano mensal';
    if (p.includes('anual') || /\b1 ano\b/.test(p)) return 'Plano anual';
    return null;
};

const noTerm = (row: MyAccessRow) =>
    row.origin === 'vitalicio' ||
    row.origin === 'parceiro' ||
    row.origin === 'equipe' ||
    planLabel(row.origin, row.plan) === 'Vitalício';

/** Hoje em Brasília (AAAA-MM-DD): os prazos são dias de Brasília. */
const brToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());

/** Uma linha por produto que o aluno tem (Ativo ou Leitura), na ordem Imerso, Masterclass, E-book. */
export const productLines = (rows: MyAccessRow[] | null | undefined, today = brToday()): ProductLine[] =>
    Object.keys(NAMES).flatMap((key): ProductLine[] => {
        const row = (rows ?? []).find((candidate) => candidate?.product === key);
        if (!row || (row.state !== 'ativo' && row.state !== 'leitura')) return [];
        const label = planLabel(row.origin, row.plan);
        const since = longDate(row.firstPurchase);
        const plan = label ? (since ? `${label} · desde ${since}` : label) : null;
        const base = { key, name: NAMES[key], plan, soon: null as string | null, renew: null as string | null };
        const valid = day(row.validUntil);
        const grace = day(row.graceUntil);
        if (row.state === 'leitura') {
            // o último dia de acesso que já passou (Leitura posta antes do prazo não anuncia uma data futura)
            const ended = longDate([grace, valid].find((d) => d && d <= today) ?? row.leituraSince);
            return [
                {
                    ...base,
                    pill: 'Leitura' as const,
                    term: ended
                        ? `Acesso encerrado em ${ended}. Você ainda pode navegar.`
                        : 'Acesso encerrado. Você ainda pode navegar.',
                    renew: RENEW[key],
                },
            ];
        }
        // carência da compra: venceu, mas o acesso segue total até o fim da carência
        if (valid && valid < today && grace && grace >= today)
            return [
                {
                    ...base,
                    pill: 'Ativo' as const,
                    term: `Seu plano venceu em ${longDate(valid)}. Acesso total até ${longDate(grace)}.`,
                    renew: RENEW[key],
                },
            ];
        // venceu e ainda está Ativo (a rotina da noite não passou): o aviso e o Renovar
        if (valid && valid < today && !row.dateToConfirm)
            return [
                { ...base, pill: 'Ativo' as const, term: `Seu plano venceu em ${longDate(valid)}.`, renew: RENEW[key] },
            ];
        if (row.dateToConfirm) return [{ ...base, pill: 'Ativo' as const, term: null }];
        if (valid) {
            const left = daysBetween(today, valid);
            const soon =
                left > 60 || left < 0
                    ? null
                    : left === 0
                      ? ' · vence hoje'
                      : left === 1
                        ? ' · falta 1 dia'
                        : ` · faltam ${left} dias`;
            return [{ ...base, pill: 'Ativo' as const, term: `Válido até ${longDate(valid)}`, soon }];
        }
        return [{ ...base, pill: 'Ativo' as const, term: noTerm(row) ? 'Sem prazo' : null }];
    });
