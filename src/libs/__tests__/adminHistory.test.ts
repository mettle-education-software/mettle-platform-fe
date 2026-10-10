import { type HistoryStudent, studentHistory } from '../adminHistory';

const student = (extra: Partial<HistoryStudent> = {}): HistoryStudent => ({
    uid: 'test',
    name: 'Aluno',
    email: 'aluno@example.test',
    status: 'DEDA_STARTED',
    clock: 'calendar',
    startedAt: null,
    lampWeek: 1,
    pausesUsed: 0,
    pausesLeft: 3,
    resetsUsed: 0,
    resetsLeft: 3,
    pausedSince: null,
    lastPauseFrom: null,
    lastPauseTo: null,
    lastResetAt: null,
    events: [],
    ...extra,
});

test('eventos sem id reutilizam rótulos e resets antigos sem criar chaves repetidas', () => {
    const event = {
        kind: 'lamp_reactivated',
        at: '2026-10-12',
        effectiveAt: null,
        actor: 'system',
        backfilled: false,
        reason: 'cap_bridge',
        lampWeek: 105,
    };
    const rows = studentHistory(
        student({ resetsUsed: 1, resetsLeft: 2, events: [event, { ...event, at: '2026-10-19', lampWeek: 106 }] }),
    );
    expect(rows.map(({ label, when }) => [label, when])).toEqual([
        ['Reset', 'data não registrada'],
        ['LAMP retomada na semana 105', '12/10/2026'],
        ['LAMP retomada na semana 106', '19/10/2026'],
    ]);
    expect(new Set(rows.map((row) => row.key)).size).toBe(rows.length);
});
