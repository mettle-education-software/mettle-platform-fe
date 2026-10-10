// Início do Admin (/admin, 10-Out-2026): os números do dia numa chamada só (GET /admin/dashboard, admin-service). A
// rota antiga do mesmo endereço devolve outro formato (usersCount…): sem `acessos` e `estudo`, a tela fica vazia, nunca
// com números inventados. Testes: libs/__tests__/adminDashboard.test.ts.
import { ORIGINS, PRODUCT_NAMES, type Origin, type Product } from './adminAccess';

/** Contagem do servidor; null = não veio (a tela mostra "—", nunca um zero inventado). */
type Count = number | null;

export interface Dashboard {
    acessos: {
        imerso: { ativo: Count; leitura: Count; carencia: Count; aConfirmar: Count };
        masterclass: { ativo: Count; leitura: Count };
        ebook: { ativo: Count; leitura: Count };
        lixeira: Count;
    };
    estudo: { hoje: Count; d7: Count; d30: Count; base: Count; pausados: Count };
    estudoPorDia: { date: string; alunos: number }[];
    compras30d: Count;
    vencendo: {
        uid: string;
        name: string | null;
        product: Product;
        origin: Origin | null;
        validUntil: string | null;
        inCarencia: boolean;
    }[];
    semAcesso: {
        uid: string;
        name: string | null;
        lastAccess: string | null;
        dias: number | null;
        semana: number | null;
    }[];
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
const nn = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : null);
const s = (value: unknown) => (typeof value === 'string' && value ? value : null);
const list = (value: unknown): Raw[] => (Array.isArray(value) ? value.map(obj) : []);
const PRODUCTS: readonly string[] = ['imerso', 'masterclass', 'ebook'];
const product = (value: unknown) => (PRODUCTS.includes(value as string) ? (value as Product) : null);
const origin = (value: unknown) => (ORIGINS.some((o) => o.value === value) ? (value as Origin) : null);

/** A resposta nova, conferida; null quando não é ela (rota ainda não publicada ou a antiga no mesmo endereço). */
export const readDashboard = (data: unknown): Dashboard | null => {
    const d = obj(data);
    if (!d.acessos || !d.estudo) return null;
    const a = obj(d.acessos);
    const e = obj(d.estudo);
    const im = obj(a.imerso);
    return {
        acessos: {
            imerso: {
                ativo: nn(im.ativo),
                leitura: nn(im.leitura),
                carencia: nn(im.carencia),
                aConfirmar: nn(im.aConfirmar),
            },
            masterclass: { ativo: nn(obj(a.masterclass).ativo), leitura: nn(obj(a.masterclass).leitura) },
            ebook: { ativo: nn(obj(a.ebook).ativo), leitura: nn(obj(a.ebook).leitura) },
            lixeira: nn(a.lixeira),
        },
        estudo: { hoje: nn(e.hoje), d7: nn(e.d7), d30: nn(e.d30), base: nn(e.base), pausados: nn(e.pausados) },
        estudoPorDia: list(d.estudoPorDia).flatMap((day) => {
            const date = s(day.date) ?? '';
            const alunos = nn(day.alunos);
            return /^\d{4}-\d{2}-\d{2}$/.test(date) && alunos !== null ? [{ date, alunos }] : [];
        }),
        compras30d: nn(d.compras30d),
        vencendo: list(d.vencendo).flatMap((v) => {
            const uid = s(v.uid);
            const p = product(v.product);
            return uid && p
                ? [
                      {
                          uid,
                          name: s(v.name),
                          product: p,
                          origin: origin(v.origin),
                          validUntil: s(v.validUntil),
                          inCarencia: v.inCarencia === true,
                      },
                  ]
                : [];
        }),
        semAcesso: list(d.semAcesso).flatMap((v) => {
            const uid = s(v.uid);
            return uid
                ? [{ uid, name: s(v.name), lastAccess: s(v.lastAccess), dias: nn(v.dias), semana: nn(v.semana) }]
                : [];
        }),
        eventos: list(d.eventos).flatMap((v) => {
            const uid = s(v.uid);
            const p = product(v.product);
            const at = s(v.at);
            return uid && p && at
                ? [
                      {
                          at,
                          uid,
                          name: s(v.name),
                          product: p,
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
export const dayMonth = (iso: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : iso;
