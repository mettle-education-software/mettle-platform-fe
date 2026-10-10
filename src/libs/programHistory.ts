// Histórico do programa (perfil do aluno e a conta no Painel de Contas): o registro de eventos do Imerso (melp_event,
// be #143/#147/#158) virado em linhas curtas. Puro: sem React, sem rede.
//
// Regras (André, 08-Out-2026):
// - início; cada pausa de–até (até = a segunda em que a LAMP voltou); cada reset com a data; LAMP retomada;
// - "Pausa" só quando foi do aluno; intervalo do sistema nunca vira "Pausa" — a ponte do teto do passo 3
//   (reason 'cap_bridge') aparece como "LAMP retomada na semana 105";
// - linha da carga inicial sem data efetiva mostra só a data que se conhece (`at`);
// - resets anteriores ao registro (o reset antigo apagava tudo) aparecem sem data, pela contagem gasta:
//   3 + resets a mais (`allowance`) − restantes − registrados, contados desde o último reset de fábrica;
// - pausas/resets a mais: "2 pausas e 1 reset a mais"; reset de fábrica fecha a pausa aberta e recomeça a contagem;
// - tipo de evento desconhecido, ou sem data válida, é ignorado (nunca quebra a tela).
import type { ProgramEvent } from 'interfaces/melp';

export type HistoryRow = { key: string; label: string; when: string };

/** Resets que todo aluno recebe hoje (padrão de melp_program.remaining_resets). */
export const RESET_ALLOWANCE = 3;

/** Data válida (texto ISO do servidor) ou null: `null`, número, objeto e texto inválido não contam como data. */
const validDate = (value: unknown): string | null =>
    typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? value : null;

const time = (iso: string) => Date.parse(iso);

/** dd/mm/aaaa no horário de Brasília (a segunda 00:00 de Brasília é a própria segunda). */
export const brDate = (iso: string | null | undefined) => {
    const ok = validDate(iso);
    if (!ok) return '';
    return new Date(ok).toLocaleDateString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

/** "14 de outubro de 2024" no horário de Brasília (Configurações do aluno). */
export const brLongDate = (iso: string | null | undefined) => {
    const ok = validDate(iso);
    if (!ok) return '';
    return new Date(ok).toLocaleDateString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
};

/** Ids são bigint do Postgres (texto): compara pelo valor exato, sem passar por Number. */
const cmpId = (a: unknown, b: unknown) => {
    const x = String(a);
    const y = String(b);
    if (/^\d+$/.test(x) && /^\d+$/.test(y)) return x.length - y.length || (x < y ? -1 : x > y ? 1 : 0);
    return x < y ? -1 : x > y ? 1 : 0;
};

const SYSTEM_ACTORS = new Set(['system', 'admin']);
const BRIDGE = 'cap_bridge';

const backLabel = (week?: number | null) =>
    typeof week === 'number' && Number.isInteger(week) && week > 0
        ? `LAMP retomada na semana ${week}`
        : 'LAMP retomada';

/** Quantidade dada pela equipe (inteiro positivo); o resto não conta. */
const extra = (value: unknown) => (typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : 0);
const plural = (n: number, one: string, many: string) => (n ? `${n} ${n === 1 ? one : many}` : '');

type Pause = { key: string; label: string; from: string; to: string | null; planned: string | null };
type Item = HistoryRow | Pause;

const pauseText = (p: Pause, format: (iso: string | null | undefined) => string) => {
    const until = p.to ?? p.planned;
    return until ? `${format(p.from)} – ${format(until)}` : `desde ${format(p.from)}`;
};

/**
 * Linhas do histórico, em ordem de data. `remainingResets` vem do resumo: os resets gastos sem evento (anteriores ao
 * registro) entram primeiro, sem data. `allowance` = resets recebidos (padrão 3); nunca conta negativo.
 *
 * Intervalos abertos: a volta (`resume`) agenda a segunda; a segunda chega com `lamp_reactivated` (ou
 * `lamp_restarted`, depois de um reset), que fecha todos os abertos. Uma pausa nova antes da segunda agendada (ex.:
 * a validade venceu nesse meio-tempo) cancela o agendamento: o intervalo anterior continua aberto até a LAMP voltar
 * de fato. Se a segunda agendada já tinha passado, o intervalo anterior fechou nela.
 */
export const programHistory = (
    events: ProgramEvent[] | null | undefined,
    remainingResets?: number | null,
    allowance = RESET_ALLOWANCE,
    /** formato das datas: dd/mm/aaaa (padrão) ou brLongDate */
    format: (iso: string | null | undefined) => string = brDate,
): HistoryRow[] => {
    const list = (Array.isArray(events) ? events : [])
        .filter((e): e is ProgramEvent => !!e && typeof e.kind === 'string' && !!validDate(e.at))
        .sort((a, b) => time(a.at) - time(b.at) || cmpId(a.id, b.id));

    const items: Item[] = [];
    // a contagem vale desde o último reset de fábrica (era atual)
    const era = list.slice(list.map((e) => e.kind).lastIndexOf('factory_reset') + 1);
    const granted = allowance + era.reduce((sum, e) => sum + (e.kind === 'allowance' ? extra(e.addResets) : 0), 0);
    const used = typeof remainingResets === 'number' ? Math.max(0, granted - remainingResets) : 0;
    const undated = Math.max(0, used - era.filter((e) => e.kind === 'reset').length);
    for (let i = 0; i < undated; i++) items.push({ key: `reset-${i}`, label: 'Reset', when: 'data não registrada' });

    let open: Pause[] = [];
    let bridge = false;
    const closeAll = (at: string) => {
        open.forEach((p) => (p.to = at));
        open = [];
    };

    for (const e of list) {
        const key = `${e.kind}-${e.id}`;
        switch (e.kind) {
            case 'start':
                items.push({ key, label: 'Início', when: format(validDate(e.effectiveAt) ?? e.at) });
                break;
            case 'pause': {
                // agendamento anterior: já passou → a LAMP voltou nele; ainda não → cancelado por esta pausa
                open = open.filter((p) => {
                    if (p.planned && time(p.planned) <= time(e.at)) {
                        p.to = p.planned;
                        return false;
                    }
                    p.planned = null;
                    return true;
                });
                if (e.reason === BRIDGE) {
                    bridge = true;
                    break;
                }
                const p: Pause = {
                    key,
                    label: SYSTEM_ACTORS.has(e.actor) ? 'LAMP pausada pelo sistema' : 'Pausa',
                    from: e.at,
                    to: null,
                    planned: null,
                };
                items.push(p);
                open.push(p);
                break;
            }
            case 'resume': {
                const planned = validDate(e.effectiveAt);
                open.forEach((p) => (p.planned = planned));
                break;
            }
            case 'lamp_reactivated':
                if (bridge || e.reason === BRIDGE || !open.length) {
                    items.push({ key, label: backLabel(e.lampWeek), when: format(e.at) });
                }
                closeAll(e.at);
                bridge = false;
                break;
            case 'reset':
                items.push({ key, label: 'Reset', when: format(e.at) });
                break;
            case 'lamp_restarted':
                closeAll(e.at);
                bridge = false;
                items.push({ key, label: 'LAMP recomeçou na semana 1', when: format(e.at) });
                break;
            case 'allowance': {
                const parts = [
                    plural(extra(e.addPauses), 'pausa', 'pausas'),
                    plural(extra(e.addResets), 'reset', 'resets'),
                ].filter(Boolean);
                if (parts.length) items.push({ key, label: `${parts.join(' e ')} a mais`, when: format(e.at) });
                break;
            }
            case 'factory_reset':
                closeAll(e.at);
                bridge = false;
                items.push({ key, label: 'Reset de fábrica', when: format(e.at) });
                break;
            default:
                break; // tipo novo: ignorado
        }
    }

    return items.map((it) => ('from' in it ? { key: it.key, label: it.label, when: pauseText(it, format) } : it));
};
