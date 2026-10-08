import type { ProgramEvent } from 'interfaces/melp';
import { brDate, programHistory } from '../programHistory';

let n = 0;
const ev = (kind: string, at: string, extra: Partial<ProgramEvent> = {}): ProgramEvent => ({
    id: String(++n),
    kind,
    at,
    effectiveAt: null,
    actor: 'student',
    backfilled: false,
    reason: null,
    lampWeek: null,
    ...extra,
});
const lines = (rows: { label: string; when: string }[]) => rows.map((r) => `${r.label} | ${r.when}`);

test('data em Brasília: a segunda 00:00 de Brasília (03:00 UTC) é a própria segunda; a 00:01 também', () => {
    expect(brDate('2026-11-02T03:00:00.000Z')).toBe('02/11/2026');
    expect(brDate('2026-11-02T03:01:00.000Z')).toBe('02/11/2026');
    expect(brDate('2026-11-02T02:59:00.000Z')).toBe('01/11/2026');
    expect(brDate('nada')).toBe('');
    expect(brDate(null)).toBe('');
});

test('carga inicial (como a conta do dono hoje): só o início, pela data efetiva', () => {
    const rows = programHistory(
        [
            ev('start', '2024-10-14T03:00:00.000Z', {
                effectiveAt: '2024-10-14T03:00:00.000Z',
                actor: 'backfill',
                backfilled: true,
            }),
        ],
        3,
    );
    expect(lines(rows)).toEqual(['Início | 14/10/2024']);
});

test('ciclo completo: início pela 1ª segunda, pausa de–até (até = segunda da volta), reset com data', () => {
    const rows = programHistory(
        [
            ev('start', '2026-10-07T13:00:00.000Z', { effectiveAt: '2026-10-12T03:00:00.000Z' }),
            ev('pause', '2026-10-22T12:00:00.000Z', { effectiveAt: '2026-10-18T03:00:00.000Z' }),
            ev('resume', '2026-10-28T18:00:00.000Z', { effectiveAt: '2026-11-02T03:00:00.000Z' }),
            ev('lamp_reactivated', '2026-11-02T03:01:00.000Z', { actor: 'system', lampWeek: 2 }),
            ev('reset', '2026-11-18T14:00:00.000Z'),
        ],
        2,
    );
    expect(lines(rows)).toEqual(['Início | 12/10/2026', 'Pausa | 22/10/2026 – 02/11/2026', 'Reset | 18/11/2026']);
});

test('pausa em andamento: "desde"; voltou e espera a segunda: a segunda agendada', () => {
    expect(lines(programHistory([ev('pause', '2026-10-22T12:00:00.000Z')], 3))).toEqual(['Pausa | desde 22/10/2026']);
    expect(
        lines(
            programHistory(
                [
                    ev('pause', '2026-10-22T12:00:00.000Z'),
                    ev('resume', '2026-10-28T18:00:00.000Z', { effectiveAt: '2026-11-02T03:00:00.000Z' }),
                ],
                3,
            ),
        ),
    ).toEqual(['Pausa | 22/10/2026 – 02/11/2026']);
});

test('intervalo do sistema nunca é "Pausa"', () => {
    const rows = programHistory(
        [
            ev('pause', '2026-10-22T12:00:00.000Z', { actor: 'system' }),
            ev('resume', '2026-10-27T12:00:00.000Z', { actor: 'system', effectiveAt: '2026-11-02T03:00:00.000Z' }),
            ev('lamp_reactivated', '2026-11-02T03:01:00.000Z', { actor: 'system', lampWeek: 9 }),
            ev('pause', '2026-11-20T12:00:00.000Z', { actor: 'admin' }),
        ],
        3,
    );
    expect(lines(rows)).toEqual([
        'LAMP pausada pelo sistema | 22/10/2026 – 02/11/2026',
        'LAMP pausada pelo sistema | desde 20/11/2026',
    ]);
    expect(rows.some((r) => r.label === 'Pausa')).toBe(false);
});

test('ponte do teto (passo 3): uma linha "LAMP retomada na semana 105", sem pausa', () => {
    const bridge = programHistory(
        [
            ev('pause', '2026-10-09T10:00:00.000Z', { actor: 'system', reason: 'cap_bridge' }),
            ev('resume', '2026-10-09T10:00:01.000Z', {
                actor: 'system',
                reason: 'cap_bridge',
                effectiveAt: '2026-10-12T03:00:00.000Z',
            }),
            ev('lamp_reactivated', '2026-10-12T03:01:00.000Z', { actor: 'system', lampWeek: 105 }),
        ],
        3,
    );
    expect(lines(bridge)).toEqual(['LAMP retomada na semana 105 | 12/10/2026']);
    // o motivo pode vir só no próprio evento de volta
    const alone = programHistory(
        [ev('lamp_reactivated', '2026-10-12T03:01:00.000Z', { actor: 'system', reason: 'cap_bridge', lampWeek: 105 })],
        3,
    );
    expect(lines(alone)).toEqual(['LAMP retomada na semana 105 | 12/10/2026']);
});

test('carga inicial sem data efetiva: só a data conhecida; volta sem semana: "LAMP retomada"', () => {
    const rows = programHistory(
        [
            ev('pause', '2025-03-04T15:22:10.000Z', { actor: 'backfill', backfilled: true }),
            ev('lamp_reactivated', '2025-03-10T03:01:00.000Z', { actor: 'backfill', backfilled: true }),
            ev('lamp_reactivated', '2025-06-02T03:01:00.000Z', { actor: 'backfill', backfilled: true }),
        ],
        3,
    );
    expect(lines(rows)).toEqual(['Pausa | 04/03/2025 – 10/03/2025', 'LAMP retomada | 02/06/2025']);
});

test('resets anteriores ao registro: sem data, primeiro; nunca negativo', () => {
    const one = programHistory([ev('reset', '2026-11-18T14:00:00.000Z')], 1);
    expect(lines(one)).toEqual(['Reset | data não registrada', 'Reset | 18/11/2026']);
    expect(lines(programHistory([], 0))).toEqual([
        'Reset | data não registrada',
        'Reset | data não registrada',
        'Reset | data não registrada',
    ]);
    expect(programHistory([], 5)).toEqual([]); // mais resets que o padrão (crédito futuro): nada inventado
    expect(programHistory([], undefined)).toEqual([]);
});

test('reset com a LAMP pausada (passo 3): a pausa termina quando a LAMP recomeça', () => {
    const rows = programHistory(
        [
            ev('pause', '2026-10-22T12:00:00.000Z'),
            ev('reset', '2026-10-28T12:00:00.000Z'),
            ev('lamp_restarted', '2026-11-02T03:01:00.000Z', { actor: 'system' }),
        ],
        2,
    );
    expect(lines(rows)).toEqual([
        'Pausa | 22/10/2026 – 02/11/2026',
        'Reset | 28/10/2026',
        'LAMP recomeçou na semana 1 | 02/11/2026',
    ]);
});

test('tolerante: ordem pela data (empate pelo id), tipo desconhecido e evento malformado ignorados', () => {
    const rows = programHistory(
        [
            ev('reset', '2026-11-18T14:00:00.000Z', { id: '10' }),
            ev('finish', '2026-12-01T12:00:00.000Z'),
            { ...ev('pause', 'não é data') },
            null as unknown as ProgramEvent,
            ev('start', '2026-10-07T13:00:00.000Z', { id: '2', effectiveAt: '2026-10-12T03:00:00.000Z' }),
            ev('reset', '2026-11-18T14:00:00.000Z', { id: '9' }),
        ],
        1,
    );
    expect(rows.map((r) => r.key)).toEqual(['start-2', 'reset-9', 'reset-10']);
    expect(programHistory(null, 3)).toEqual([]);
    expect(programHistory(undefined, undefined)).toEqual([]);
});
