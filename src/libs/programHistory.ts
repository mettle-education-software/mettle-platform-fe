// Histórico do programa (perfil do aluno e /admin/historico): o registro de eventos do Imerso (melp_event, be #143/#147)
// virado em linhas curtas. Puro: sem React, sem rede.
//
// Regras (André, 08-Out-2026):
// - início; cada pausa de–até (até = a segunda em que a LAMP voltou); cada reset com a data; LAMP retomada;
// - "Pausa" só quando foi do aluno; intervalo do sistema nunca vira "Pausa" — a ponte do teto do passo 3
//   (reason 'cap_bridge') aparece como "LAMP retomada na semana 105";
// - linha da carga inicial sem data efetiva mostra só a data que se conhece (`at`);
// - resets anteriores ao registro (o reset antigo apagava tudo) aparecem sem data, pela contagem gasta;
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

type Pause = { key: string; label: string; from: string; to: string | null; planned: string | null };
type Item = HistoryRow | Pause;

const pauseText = (p: Pause) => {
    const until = p.to ?? p.planned;
    return until ? `${brDate(p.from)} – ${brDate(until)}` : `desde ${brDate(p.from)}`;
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
): HistoryRow[] => {
    const list = (Array.isArray(events) ? events : [])
        .filter((e): e is ProgramEvent => !!e && typeof e.kind === 'string' && !!validDate(e.at))
        .sort((a, b) => time(a.at) - time(b.at) || cmpId(a.id, b.id));

    const items: Item[] = [];
    const used = typeof remainingResets === 'number' ? Math.max(0, allowance - remainingResets) : 0;
    const undated = Math.max(0, used - list.filter((e) => e.kind === 'reset').length);
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
                items.push({ key, label: 'Início', when: brDate(validDate(e.effectiveAt) ?? e.at) });
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
                    items.push({ key, label: backLabel(e.lampWeek), when: brDate(e.at) });
                }
                closeAll(e.at);
                bridge = false;
                break;
            case 'reset':
                items.push({ key, label: 'Reset', when: brDate(e.at) });
                break;
            case 'lamp_restarted':
                closeAll(e.at);
                bridge = false;
                items.push({ key, label: 'LAMP recomeçou na semana 1', when: brDate(e.at) });
                break;
            default:
                break; // tipo novo: ignorado
        }
    }

    return items.map((it) => ('from' in it ? { key: it.key, label: it.label, when: pauseText(it) } : it));
};
