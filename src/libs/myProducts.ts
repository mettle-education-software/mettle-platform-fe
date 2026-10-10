// "Meus produtos" nas Configurações (desenho de 10-Out-2026): só do modelo de acesso (GET /accounts/me, accessDetails),
// nunca do catálogo de cursos em cache (abrir a página direto não pode sumir com a Masterclass). Para o aluno: nada de
// "a confirmar" nem de origem desconhecida. Testes: libs/__tests__/myProducts.test.ts.
import { EBOOK_RENEW_URL, IMERSO_RENEW_URL, MASTERCLASS_RENEW_URL } from './checkout';

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
    /** Ativo (destaque), Carência (âmbar) ou Leitura (neutro) */
    pill: 'Ativo' | 'Carência' | 'Leitura';
    /** uma linha: plano/origem · desde … · válido até … (ou sem prazo); só as partes que existem */
    details: string | null;
    /** linha extra só para avisos: faltam N dias (destaque), carência, leitura, venceu */
    alert: string | null;
    /** o aviso no tom de destaque (faltam N dias) */
    soon: boolean;
    renew: string | null;
}

const NAMES: Record<string, string> = { imerso: 'Programa Imerso', masterclass: 'Masterclass', ebook: 'E-book' };
const RENEW: Record<string, string> = {
    imerso: IMERSO_RENEW_URL,
    masterclass: MASTERCLASS_RENEW_URL,
    ebook: EBOOK_RENEW_URL,
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
        const since = longDate(row.firstPurchase);
        const head = [planLabel(row.origin, row.plan), since && `desde ${since}`];
        const line = (...parts: (string | null | false | undefined)[]) =>
            [...head, ...parts].filter(Boolean).join(' · ') || null;
        const valid = day(row.validUntil);
        const grace = day(row.graceUntil);
        const base = { key, name: NAMES[key], soon: false, renew: null as string | null };
        if (row.state === 'leitura') {
            // "encerrado em": só a validade (ou o fim da carência) e só se já passou; a data em que a conta entrou em
            // Leitura (leituraSince) nunca é fim de acesso (decisão de 10-Out-2026); sem data, "Acesso em Leitura."
            const ended = longDate([grace, valid].find((d) => d && d <= today));
            // navegar é só do Imerso; Masterclass e E-book em Leitura ficam trancados (PF2-05)
            const alert =
                key === 'imerso'
                    ? `${ended ? `Acesso encerrado em ${ended}.` : 'Acesso em Leitura.'} Você ainda pode navegar.`
                    : `${ended ? `Acesso encerrado em ${ended}.` : 'Acesso em Leitura.'} Renove para voltar a ${
                          key === 'ebook' ? 'ler' : 'assistir'
                      }.`;
            return [{ ...base, pill: 'Leitura', details: line(), alert, renew: RENEW[key] }];
        }
        // carência da compra: venceu, mas o acesso segue total até o fim da carência
        if (valid && valid < today && grace && grace >= today)
            return [
                {
                    ...base,
                    pill: 'Carência',
                    details: line(),
                    alert: `Seu plano venceu em ${longDate(valid)}. Acesso total até ${longDate(grace)}.`,
                    renew: RENEW[key],
                },
            ];
        // venceu e ainda está Ativo (a rotina da noite não passou): o aviso e o Renovar
        if (valid && valid < today && !row.dateToConfirm)
            return [
                {
                    ...base,
                    pill: 'Ativo',
                    details: line(),
                    alert: `Seu plano venceu em ${longDate(valid)}.`,
                    renew: RENEW[key],
                },
            ];
        if (row.dateToConfirm) return [{ ...base, pill: 'Ativo', details: line(), alert: null }];
        if (valid) {
            const left = daysBetween(today, valid);
            const alert =
                left > 60 ? null : left === 0 ? 'Vence hoje' : left === 1 ? 'Falta 1 dia' : `Faltam ${left} dias`;
            return [{ ...base, pill: 'Ativo', details: line(`válido até ${longDate(valid)}`), alert, soon: !!alert }];
        }
        return [{ ...base, pill: 'Ativo', details: line(noTerm(row) && 'sem prazo'), alert: null }];
    });

/**
 * Carência (a compra venceu, o acesso segue total até o fim dela): o aviso do Início e do /imerso, com "Renovar"
 * (PF2-03). As claims dizem "ativo"; a carência vem do /accounts/me. `only` limita a um produto (o /imerso).
 */
export const graceNotices = (
    rows: MyAccessRow[] | null | undefined,
    { en = false, only }: { en?: boolean; only?: string } = {},
    today = brToday(),
) =>
    (rows ?? []).flatMap((row) => {
        const valid = day(row?.validUntil);
        const grace = day(row?.graceUntil);
        if (!row || row.state !== 'ativo' || !valid || !grace || !(valid < today && grace >= today)) return [];
        if (!NAMES[row.product] || (only && row.product !== only)) return [];
        const when = (iso: string) =>
            en
                ? new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      timeZone: 'UTC',
                  })
                : longDate(iso);
        const text = en
            ? `Your plan expired on ${when(valid)}. Full access until ${when(grace)}.`
            : `Seu plano venceu em ${when(valid)}. Acesso total até ${when(grace)}.`;
        // mais de um produto (só no Início): o nome na frente
        const named =
            row.product === 'imerso' || only ? text : `${NAMES[row.product]}: ${text[0].toLowerCase()}${text.slice(1)}`;
        return [{ key: row.product, name: NAMES[row.product], text: named, renew: RENEW[row.product] }];
    });
