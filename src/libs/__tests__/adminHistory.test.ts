import {
    filterHistory,
    historyDate,
    historyStatusLabel,
    HistorySortKey,
    HistoryStudent,
    paginateHistory,
    sortHistory,
    studentHistory,
} from '../adminHistory';

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
const ids = (rows: HistoryStudent[]) => rows.map((row) => row.uid);

describe('ordenação do histórico', () => {
    test('nome em português, sem mutar a fonte; empate por uid', () => {
        const rows = [
            student({ uid: 'z', name: 'Zélia' }),
            student({ uid: 'b', name: 'Álvaro' }),
            student({ uid: 'a', name: 'Álvaro' }),
        ];
        expect(ids(sortHistory(rows, { key: 'name', direction: 'asc' }))).toEqual(['a', 'b', 'z']);
        expect(ids(sortHistory(rows, { key: 'name', direction: 'desc' }))).toEqual(['z', 'a', 'b']);
        expect(ids(rows)).toEqual(['z', 'b', 'a']);
    });

    test('status pela legenda humana, não pelo código', () => {
        const rows = [
            student({ uid: 'paused', status: 'DEDA_PAUSED' }),
            student({ uid: 'done', status: 'DEDA_FINISHED' }),
            student({ uid: 'active' }),
        ];
        expect(ids(sortHistory(rows, { key: 'status', direction: 'asc' }))).toEqual(['active', 'done', 'paused']);
        expect(ids(sortHistory(rows, { key: 'status', direction: 'desc' }))).toEqual(['paused', 'done', 'active']);
        expect(historyStatusLabel('MELP_BEGIN')).toBe('Pré-início');
        expect(historyStatusLabel('DEDA_FINISHED')).toBe('Formado');
        expect(historyStatusLabel('future_status')).toBe('Não informado');
    });

    test.each<HistorySortKey>(['lampWeek', 'pausesUsed', 'resetsUsed'])('%s é numérico nas duas direções', (key) => {
        const rows = [
            student({ uid: '10', [key]: 10 }),
            student({ uid: '2', [key]: 2 }),
            student({ uid: '0', [key]: 0 }),
        ];
        expect(ids(sortHistory(rows, { key, direction: 'asc' }))).toEqual(['0', '2', '10']);
        expect(ids(sortHistory(rows, { key, direction: 'desc' }))).toEqual(['10', '2', '0']);
    });

    test.each<HistorySortKey>(['startedAt', 'pausedSince', 'lastPauseFrom', 'lastResetAt'])(
        '%s é cronológico; ausências no fim',
        (key) => {
            const rows = [
                student({ uid: 'none', [key]: null }),
                student({ uid: 'new', [key]: '2026-01-01' }),
                student({ uid: 'old', [key]: '2025-12-31T03:00:00Z' }),
            ];
            expect(ids(sortHistory(rows, { key, direction: 'asc' }))).toEqual(['old', 'new', 'none']);
            expect(ids(sortHistory(rows, { key, direction: 'desc' }))).toEqual(['new', 'old', 'none']);
        },
    );

    test('última pausa desempata pelo fim do intervalo', () => {
        const rows = [
            student({ uid: 'long', lastPauseFrom: '2026-01-01', lastPauseTo: '2026-02-01' }),
            student({ uid: 'open', lastPauseFrom: '2026-01-01' }),
            student({ uid: 'short', lastPauseFrom: '2026-01-01', lastPauseTo: '2026-01-10' }),
        ];
        expect(ids(sortHistory(rows, { key: 'lastPauseFrom', direction: 'asc' }))).toEqual(['short', 'long', 'open']);
    });
});

describe('filtros do histórico', () => {
    const rows = [
        student({ uid: 'a', name: 'Álvaro Silva', email: 'alvaro@example.test' }),
        student({ uid: 'b', name: 'Ana Silva', email: 'ana@example.test', status: 'DEDA_PAUSED' }),
        student({ uid: 'c', name: 'Beatriz', email: 'contato@example.test', status: 'DEDA_PAUSED' }),
    ];
    test('busca nome e e-mail sem diferença de caixa, acento e espaços externos', () => {
        expect(ids(filterHistory(rows, ' ALVARO ', null))).toEqual(['a']);
        expect(ids(filterHistory(rows, 'CONTATO@', null))).toEqual(['c']);
        expect(filterHistory(rows, '   ', null)).toHaveLength(3);
    });
    test('combina busca e status; Todos remove apenas o filtro de status', () => {
        expect(ids(filterHistory(rows, 'silva', 'DEDA_PAUSED'))).toEqual(['b']);
        expect(ids(filterHistory(rows, 'silva', null))).toEqual(['a', 'b']);
        expect(ids(filterHistory(rows, '', 'DEDA_PAUSED'))).toEqual(['b', 'c']);
        expect(filterHistory(rows, 'alvaro', 'DEDA_PAUSED')).toEqual([]);
    });
});

describe('paginação do histórico', () => {
    const rows = Array.from({ length: 51 }, (_, index) => student({ uid: String(index), name: `Aluno ${index}` }));
    test('25 por página, total e última página sem duplicar ou perder alunos', () => {
        const first = paginateHistory(rows, 1);
        const second = paginateHistory(rows, 2);
        const last = paginateHistory(rows, 3);
        expect(first).toMatchObject({ total: 51, pages: 3, page: 1, from: 1, to: 25 });
        expect(second).toMatchObject({ from: 26, to: 50 });
        expect(last).toMatchObject({ from: 51, to: 51 });
        expect(first.rows).toHaveLength(25);
        expect(second.rows).toHaveLength(25);
        expect(last.rows).toHaveLength(1);
        expect([...first.rows, ...second.rows, ...last.rows]).toEqual(rows);
    });
    test('lista vazia, limites e quantidade exata de páginas', () => {
        expect(paginateHistory([], 10)).toEqual({ rows: [], total: 0, pages: 1, page: 1, from: 0, to: 0 });
        expect(paginateHistory(rows, 0).page).toBe(1);
        expect(paginateHistory(rows, 99).page).toBe(3);
        expect(paginateHistory(rows.slice(0, 50), 99)).toMatchObject({ page: 2, pages: 2, from: 26, to: 50 });
    });
    test('filtra e ordena antes de paginar; página antiga é limitada ao resultado', () => {
        const filtered = sortHistory(filterHistory(rows, 'Aluno 4', null), { key: 'name', direction: 'desc' });
        const result = paginateHistory(filtered, 3);
        expect(result).toMatchObject({ total: 11, page: 1, pages: 1 });
        expect(ids(result.rows)).toEqual(['49', '48', '47', '46', '45', '44', '43', '42', '41', '40', '4']);
    });
});

test('datas civis preservam o dia; instantes usam Brasília', () => {
    expect(historyDate('2026-10-09')).toBe('09/10/2026');
    expect(historyDate('2026-10-09T02:59:00Z')).toBe('08/10/2026');
    expect(historyDate('2026-10-09T03:00:00Z')).toBe('09/10/2026');
    expect(historyDate(null)).toBe('—');
    expect(historyDate('inválida')).toBe('—');
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
