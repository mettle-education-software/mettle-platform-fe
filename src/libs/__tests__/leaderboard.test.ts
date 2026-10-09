// A página só mostra o retrato do lote (regras de André, 09-Out-2026): estes testes cobrem o que ela ainda faz —
// a ordem quando um filtro tira alunos (Score, depois dias feitos; empate = mesma posição) e as médias exibidas.
import { isCurrentSnapshot, LbStudent, order, overallAvg, recAvg, tenureWeekOf, weeklyOverall } from '../leaderboard';

const st = (id: string, score: number, daysDone: number, extra: Partial<LbStudent> = {}): LbStudent => ({
    id,
    name: id,
    level: 'MEDIUM',
    week: 10,
    overall: [1, 1, 1, 1, 1, 1, 1, 0.5, 0.5],
    score,
    rank: 0,
    comp: { O: 8, R: null, Run: 5, window: 9, recDays: 0, daysDone, F: 1, pO: 1, pR: null, pRun: 1 },
    ...extra,
});

test('ordem do lote: Score; empate → mais dias feitos; persistindo, mesma posição (1, 1, 3)', () => {
    const r = order([st('a', 100, 20), st('b', 100, 40), st('c', 300, 1), st('d', 100, 40), st('e', 5, 3)]);
    expect(r.map((x) => [x.st.id, x.rank])).toEqual([
        ['c', 1],
        ['b', 2],
        ['d', 2],
        ['a', 4],
        ['e', 5],
    ]);
});

test('filtro tira alunos: a posição é a ordem entre os que ficam; o Score não muda', () => {
    const all = [st('a', 900, 10), st('p', 950, 10, { status: 'DEDA_PAUSED' }), st('b', 800, 10)];
    const shown = order(all.filter((s) => s.status !== 'DEDA_PAUSED'));
    expect(shown.map((x) => [x.st.id, x.rank, x.st.score])).toEqual([
        ['a', 1, 900],
        ['b', 2, 800],
    ]);
});

test('médias exibidas e minigráfico; retrato antigo é reconhecido', () => {
    const s = st('a', 1, 1);
    expect(overallAvg(s)).toBeCloseTo(8 / 9, 12);
    expect(recAvg(s)).toBeNull();
    expect(recAvg({ ...s, comp: { ...s.comp, R: 3, recDays: 4 } })).toBeCloseTo(0.75, 12);
    expect(weeklyOverall(s)).toEqual([1, 0.5]);
    expect(tenureWeekOf({ ...s, tenureWeek: 30 })).toBe(30);
    expect(tenureWeekOf(s)).toBe(10);
    expect(isCurrentSnapshot({ students: [], version: 3 })).toBe(true);
    expect(isCurrentSnapshot({ students: [], version: 2 })).toBe(false);
    expect(isCurrentSnapshot({ students: [] })).toBe(false);
});
