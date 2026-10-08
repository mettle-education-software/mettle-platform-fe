// Python soma com compensação (sum() desde 3.12); o navegador soma em laço: diferença ~1e-12, Score idêntico.
import { components, LbSnapshot, LbStudent, Params, rankAll, scoreOf, weightedOverallByWeek } from '../leaderboard';
import fixture from './leaderboard.fixture.json';

// Paridade com mibe/tools/leaderboard/model.py: os casos e os números esperados foram gerados lá (padrão e outros pesos).
const DEFAULTS: Params = { wO: 0.55, wG: 0.25, wC: 0.2, fatigue: 0.3, tenure: 0.4, level: 0.5 };
const model = {
    goals: fixture.goals,
    goalRef: 240,
    refDays: 365,
    refLevel: 'MEDIUM',
    fullWeek: 104,
} as unknown as LbSnapshot;
const cases = fixture.cases as unknown as {
    st: LbStudent;
    def: Record<string, number | null>;
    alt: Record<string, number | null>;
}[];

test.each([
    ['padrão', DEFAULTS, 'def'],
    ['outros pesos', fixture.alt as Params, 'alt'],
] as const)('mesmos componentes e Score do lote (%s)', (_n, p, k) => {
    for (const cs of cases) {
        const st = { ...cs.st, runFrom: cs.st.runFrom ?? null, runTo: cs.st.runTo ?? null };
        const c = components(model, st, p);
        const want = cs[k];
        for (const key of ['O', 'C', 'S', 'T'] as const) expect(c[key]).toBeCloseTo(want[key] as number, 9);
        if (want.G === null) expect(c.G).toBeNull();
        else expect(c.G).toBeCloseTo(want.G as number, 9);
        expect(scoreOf(c, p, 104)).toBe(want.score);
    }
});

test('ranking: Score, depois Overall; empate exato divide a posição', () => {
    const base = cases[0].st;
    const snap = {
        ...model,
        students: [
            { ...base, id: 'a', name: 'A', runFrom: base.runFrom ?? null, runTo: base.runTo ?? null },
            { ...base, id: 'b', name: 'B', runFrom: base.runFrom ?? null, runTo: base.runTo ?? null },
            { ...base, id: 'c', name: 'C', overall: base.overall.map(() => 0.2), runFrom: null, runTo: null },
        ],
    } as LbSnapshot;
    const r = rankAll(snap, DEFAULTS);
    expect(r.map((x) => [x.st.id, x.rank])).toEqual([
        ['a', 1],
        ['b', 1],
        ['c', 3],
    ]);
});

test('minigráfico: um ponto por semana, o último é o Overall ponderado', () => {
    const st = cases[1].st;
    const pts = weightedOverallByWeek(model, st, DEFAULTS);
    expect(pts).toHaveLength(Math.ceil(st.overall.length / 7));
    expect(pts[pts.length - 1]).toBeCloseTo(cases[1].def.O as number, 12);
});
