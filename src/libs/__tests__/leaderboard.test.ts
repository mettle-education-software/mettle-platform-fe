// Python soma com compensação (sum() desde 3.12); o navegador soma em laço: diferença ~1e-12, Score idêntico.
import {
    breakdown,
    components,
    DEFAULT_PENALTIES,
    LbSnapshot,
    LbStudent,
    Params,
    penalty,
    rankAll,
    scoreOf,
    weightedOverallByWeek,
} from '../leaderboard';
import fixture from './leaderboard.fixture.json';

// Paridade com mibe/tools/leaderboard/model.py: os casos e os números esperados foram gerados lá (padrão e outros pesos).
const DEFAULTS: Params = { wO: 0.55, wG: 0.25, wC: 0.2, fatigue: 0.3, tenure: 0.4, level: 0.5 };
const model = {
    goals: fixture.goals,
    goalRef: 240,
    refDays: 365,
    refLevel: 'MEDIUM',
    fullWeek: 104,
    penalties: fixture.penalties,
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
        for (const key of ['O', 'C', 'S', 'T', 'F'] as const) expect(c[key]).toBeCloseTo(want[key] as number, 9);
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

test('pausa × reset: 1% por semana pausada pelo aluno, mínimo 0,85; 5% por reset; retrato antigo sem o campo', () => {
    const st = { ...cases[0].st, runFrom: null, runTo: null } as LbStudent;
    expect(penalty(st)).toBe(1);
    expect(penalty({ ...st, pausedDays: 28 })).toBeCloseTo(0.99 ** 4, 12);
    expect(penalty({ ...st, pausedDays: 16 * 7 })).toBeGreaterThan(0.85);
    expect(penalty({ ...st, pausedDays: 17 * 7 })).toBe(0.85);
    expect(penalty({ ...st, pausedDays: 400 * 7, resetsArchived: 2 })).toBeCloseTo(0.85 * 0.95 ** 2, 12);
    expect(penalty({ ...st, systemPausedDays: 700 })).toBe(1); // intervalo do sistema não conta
    expect(DEFAULT_PENALTIES).toEqual(fixture.penalties);
});

test('os pontos de cada ingrediente somam o Score (tempo de casa e pausa × reset já dentro)', () => {
    for (const cs of cases) {
        const st = { ...cs.st, runFrom: cs.st.runFrom ?? null, runTo: cs.st.runTo ?? null };
        const c = components(model, st, DEFAULTS);
        const b = breakdown(c, DEFAULTS, 104);
        const sum = b.parts.reduce((t, x) => t + (x.points ?? 0), 0);
        expect(Math.abs(sum - scoreOf(c, DEFAULTS, 104))).toBeLessThanOrEqual(0.5 + 1e-9);
        expect(b.factor).toBeCloseTo(b.tenureFactor * b.penalty, 12);
    }
});

test('pesos padrão: Score e posição do lote (oficial); controles mexidos: recálculo; retrato antigo: recálculo', () => {
    const mk = (id: string, score: number, F?: number) => ({
        ...cases[0].st,
        id,
        name: id,
        runFrom: null,
        runTo: null,
        score,
        comp: { O: 0.5, G: null, C: 0.1, S: 1, T: 1.1, ...(F === undefined ? {} : { F }) },
    });
    const snap = {
        ...model,
        defaults: DEFAULTS,
        students: [mk('a', 10, 1), mk('b', 900, 0.9)],
    } as unknown as LbSnapshot;
    expect(rankAll(snap, DEFAULTS).map((r) => [r.st.id, r.score, r.rank])).toEqual([
        ['b', 900, 1],
        ['a', 10, 2],
    ]);
    const tuned = { ...DEFAULTS, wO: 0.6 };
    const recalc = rankAll(snap, tuned);
    expect(recalc.every((r) => r.score === scoreOf(components(model, r.st, tuned), tuned, 104))).toBe(true);
    const old = { ...snap, students: [mk('a', 10), mk('b', 900)] } as unknown as LbSnapshot;
    expect(rankAll(old, DEFAULTS).every((r) => r.score !== 10 && r.score !== 900)).toBe(true);
});
