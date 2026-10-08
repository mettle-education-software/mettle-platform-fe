// Histórico do programa (perfil do aluno e /admin/historico): o registro de eventos do Imerso (melp_event, be #143/#147)
// virado em linhas curtas. Puro: sem React, sem rede.
//
// Regras (André, 08-Out-2026):
// - início; cada pausa de–até (até = a segunda em que a LAMP voltou); cada reset com a data; LAMP retomada;
// - "Pausa" só quando foi do aluno; intervalo do sistema nunca vira "Pausa" — a ponte do teto do passo 3
//   (reason 'cap_bridge') aparece como "LAMP retomada na semana 105";
// - linha da carga inicial sem data efetiva mostra só a data que se conhece (`at`);
// - resets anteriores ao registro (o reset antigo apagava tudo) aparecem sem data, pela contagem gasta;
// - tipo de evento desconhecido é ignorado (nunca quebra a tela).
import type { ProgramEvent } from 'interfaces/melp';

export type HistoryRow = { key: string; label: string; when: string };

/** Resets que todo aluno recebe hoje (padrão de melp_program.remaining_resets). */
export const RESET_ALLOWANCE = 3;

/** dd/mm/aaaa no horário de Brasília (a segunda 00:00 de Brasília é a própria segunda). */
export const brDate = (iso: string | null | undefined) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
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
 */
export const programHistory = (
    events: ProgramEvent[] | null | undefined,
    remainingResets?: number | null,
    allowance = RESET_ALLOWANCE,
): HistoryRow[] => {
    const list = (Array.isArray(events) ? events : [])
        .filter((e) => e && typeof e.kind === 'string' && !Number.isNaN(new Date(e.at).getTime()))
        .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime() || Number(a.id) - Number(b.id));

    const items: Item[] = [];
    const used = typeof remainingResets === 'number' ? Math.max(0, allowance - remainingResets) : 0;
    const undated = Math.max(0, used - list.filter((e) => e.kind === 'reset').length);
    for (let i = 0; i < undated; i++) items.push({ key: `reset-${i}`, label: 'Reset', when: 'data não registrada' });

    let open: Pause | 'bridge' | null = null;

    for (const e of list) {
        const key = `${e.kind}-${e.id}`;
        switch (e.kind) {
            case 'start':
                items.push({ key, label: 'Início', when: brDate(e.effectiveAt ?? e.at) });
                break;
            case 'pause':
                if (e.reason === BRIDGE) {
                    open = 'bridge';
                } else {
                    const p: Pause = {
                        key,
                        label: SYSTEM_ACTORS.has(e.actor) ? 'LAMP pausada pelo sistema' : 'Pausa',
                        from: e.at,
                        to: null,
                        planned: null,
                    };
                    items.push(p);
                    open = p;
                }
                break;
            case 'resume':
                if (open && open !== 'bridge') open.planned = e.effectiveAt ?? null;
                break;
            case 'lamp_reactivated':
                if (open && open !== 'bridge' && e.reason !== BRIDGE) open.to = e.at;
                else items.push({ key, label: backLabel(e.lampWeek), when: brDate(e.at) });
                open = null;
                break;
            case 'reset':
                items.push({ key, label: 'Reset', when: brDate(e.at) });
                break;
            case 'lamp_restarted':
                if (open && open !== 'bridge') open.to = e.at;
                open = null;
                items.push({ key, label: 'LAMP recomeçou na semana 1', when: brDate(e.at) });
                break;
            default:
                break; // tipo novo: ignorado
        }
    }

    return items.map((it) => ('from' in it ? { key: it.key, label: it.label, when: pauseText(it) } : it));
};
