// Leaderboard do Imerso (8-Out-2026): só o dono vê; alunos não veem (nem com a plataforma nova para todos).
// O retrato vem do Worker mettle-events (/plataforma/leaderboard), que confere o uid do token e só responde ao dono.
// Gerado à noite por mibe/tools/leaderboard (lote só leitura). As contas abaixo repetem mibe/tools/leaderboard/model.py
// para os controles deslizantes recalcularem no navegador; o teste de paridade usa números gerados lá.

export const LEADERBOARD_URL = 'https://events.mettle.com.br/plataforma/leaderboard';

export type Level = 'EASY' | 'MEDIUM' | 'HARD';
export const LEVEL_NAME: Record<Level, string> = { EASY: 'Flow', MEDIUM: 'Boost', HARD: 'Turbo' };

export type Params = { wO: number; wG: number; wC: number; fatigue: number; tenure: number; level: number };

/** Pausa e reset (fixos, vêm no retrato): × pauseRate por semana pausada pelo aluno (mín. pauseFloor); × resetRate por
 * reset feito depois que o reset passou a arquivar (08-Out-2026). Retrato antigo, sem o campo: estes valores. */
export type Penalties = { pauseRate: number; pauseFloor: number; resetRate: number };
export const DEFAULT_PENALTIES: Penalties = { pauseRate: 0.99, pauseFloor: 0.85, resetRate: 0.95 };

export type LbStudent = {
    id: string;
    name: string;
    level: Level;
    week: number;
    status?: string;
    /** Overall de cada dia do programa (0–1), dia 1 primeiro; dia sem registro = 0 */
    overall: number[];
    /** 1º dia do programa com gravador e o valor (0–1) de cada dia desde ele; ausente = sem gravador */
    recFrom?: number | null;
    rec?: number[];
    runFrom: number | null;
    runTo: number | null;
    /** nota do DEDA de hoje (a Run de hoje já contou?) */
    dedaToday?: number;
    /** semanas desde a última pausa (só com o DEDA pausado); pausas e resets gastos (melp_program: 3 − restantes) */
    pausedWeeks?: number | null;
    pausesUsed?: number | null;
    resetsUsed?: number | null;
    /** dias com a LAMP pausada pelo aluno, na vida (o multiplicador); intervalos do sistema ficam em systemPausedDays */
    pausedDays?: number;
    systemPausedDays?: number;
    /** resets que arquivaram o histórico (o multiplicador) */
    resetsArchived?: number;
    /** semana de vida desde a 1ª segunda de DEDA (tempo de casa); ausente = `week` */
    tenureWeek?: number;
    score?: number;
    rank?: number;
};

export type LbSnapshot = {
    generatedAt?: string;
    defaults: Params;
    penalties?: Penalties;
    goals: Record<Level, number[]>;
    goalRef: number;
    refDays: number;
    refLevel: Level;
    fullWeek: number;
    students: LbStudent[];
    rulebook?: string;
    empty?: boolean;
};

type Model = Pick<LbSnapshot, 'goals' | 'goalRef' | 'refDays' | 'refLevel' | 'fullWeek' | 'penalties'>;
/** F = pausa × reset (1 sem nenhum) */
export type Components = { O: number; G: number | null; C: number; S: number; T: number; F: number };

export const weekOf = (n: number) => Math.floor((n - 1) / 7) + 1;
const goal = (m: Model, level: Level, week: number) => {
    const g = m.goals[level];
    return g[Math.min(Math.max(week, 1), g.length) - 1];
};

/** Peso do dia n: (meta ÷ referência)^expoente × (1 + desgaste × ln(1 + n/28)). */
export const weight = (m: Model, level: Level, n: number, p: Params) =>
    (goal(m, level, weekOf(n)) / m.goalRef) ** p.level * (1 + p.fatigue * Math.log(1 + n / 28));

/** Pesos dos dias 1..max de um nível (uma vez por mudança de controle). */
const weights = (m: Model, level: Level, max: number, p: Params) => {
    const w = new Array<number>(max + 1);
    w[0] = 0;
    for (let n = 1; n <= max; n++) w[n] = weight(m, level, n, p);
    return w;
};

export const sRef = (m: Model, p: Params) => {
    let s = 0;
    for (let n = 1; n <= m.refDays; n++) s += weight(m, m.refLevel, n, p);
    return s;
};

export const tenure = (week: number, p: Params, fullWeek: number) =>
    1 + (p.tenure * Math.log(Math.max(week, 1))) / Math.log(fullWeek);

/** Semanas pausadas pelo aluno (dias ÷ 7). */
export const pausedWeeksOf = (st: LbStudent) => (st.pausedDays ?? 0) / 7;

/** Multiplicador de pausa × reset (model.penalty). */
export const penalty = (st: LbStudent, k: Penalties = DEFAULT_PENALTIES) =>
    Math.max(k.pauseFloor, k.pauseRate ** pausedWeeksOf(st)) * k.resetRate ** (st.resetsArchived ?? 0);

/** Semana do tempo de casa: a de vida (desde a 1ª segunda de DEDA); retrato antigo, a da LAMP. */
export const tenureWeekOf = (st: LbStudent) => st.tenureWeek || st.week;

export const components = (m: Model, st: LbStudent, p: Params, sref = sRef(m, p), w?: number[]): Components => {
    const ws = w ?? weights(m, st.level, Math.max(st.overall.length, st.runTo ?? 0), p);
    let sw = 0;
    let so = 0;
    for (let i = 0; i < st.overall.length; i++) {
        sw += ws[i + 1];
        so += ws[i + 1] * st.overall[i];
    }
    let G: number | null = null;
    if (st.rec?.length && st.recFrom) {
        let a = 0;
        let b = 0;
        for (let i = 0; i < st.rec.length; i++) {
            const x = ws[st.recFrom + i] ?? weight(m, st.level, st.recFrom + i, p);
            a += x * st.rec[i];
            b += x;
        }
        G = a / b;
    }
    let S = 0;
    if (st.runFrom && st.runTo) for (let n = st.runFrom; n <= st.runTo; n++) S += ws[n];
    return {
        O: sw ? so / sw : 0,
        G,
        C: Math.log(1 + S) / Math.log(1 + sref),
        S,
        T: tenure(tenureWeekOf(st), p, m.fullWeek),
        F: penalty(st, m.penalties ?? DEFAULT_PENALTIES),
    };
};

/** Peso efetivo de cada ingrediente (sem gravador, Ō e Ĉ são renormalizados) e os pontos que ele dá ao Score. */
export const breakdown = (c: Components, p: Params, fullWeek: number) => {
    const parts = [
        { key: 'O' as const, label: 'Overall ponderado', w: p.wO, v: c.O },
        { key: 'G' as const, label: 'Gravação', w: p.wG, v: c.G },
        { key: 'C' as const, label: 'DEDA Run', w: p.wC, v: c.C },
    ];
    const tw = parts.reduce((t, x) => t + (x.v === null ? 0 : x.w), 0);
    // tempo de casa e pausa × reset já entram nos pontos de cada ingrediente (a soma dá o Score)
    const factor = (c.T / tenure(fullWeek, p, fullWeek)) * c.F;
    return {
        factor,
        tenureFactor: c.T / tenure(fullWeek, p, fullWeek),
        penalty: c.F,
        parts: parts.map((x) => {
            const eff = x.v === null || !tw ? 0 : x.w / tw;
            return { ...x, eff, points: x.v === null ? null : 1000 * eff * x.v * factor };
        }),
    };
};

/** Mesma ordem de operações de model.score_of (paridade exata com o lote). */
export const scoreOf = (c: Components, p: Params, fullWeek: number) => {
    const parts: [number, number][] = [
        [p.wO, c.O],
        [p.wC, c.C],
    ];
    if (c.G !== null) parts.push([p.wG, c.G]);
    const tw = parts.reduce((t, [a]) => t + a, 0);
    const base = tw ? parts.reduce((t, [a, b]) => t + a * b, 0) / tw : 0;
    return Math.floor(((1000 * base * c.T) / tenure(fullWeek, p, fullWeek)) * c.F + 0.5);
};

export type Ranked = { st: LbStudent; c: Components; score: number; rank: number };

/** Ordem: Score; empate → Overall ponderado, Run (soma de pesos), semana; persistindo, mesma posição (1, 1, 3). */
export const rankAll = (snap: LbSnapshot, p: Params): Ranked[] => {
    const sref = sRef(snap, p);
    const max = Math.max(
        1,
        ...snap.students.map((s) => Math.max(s.overall.length, s.runTo ?? 0, (s.recFrom ?? 0) + (s.rec?.length ?? 0))),
    );
    const byLevel = Object.fromEntries(
        (Object.keys(snap.goals) as Level[]).map((l) => [l, weights(snap, l, max, p)]),
    ) as Record<Level, number[]>;
    const r6 = (x: number) => Math.round(x * 1e6) / 1e6;
    const rows = snap.students.map((st) => {
        const c = components(snap, st, p, sref, byLevel[st.level]);
        return { st, c, score: scoreOf(c, p, snap.fullWeek), rank: 0 };
    });
    const key = (r: Ranked) => [r.score, r6(r.c.O), r6(r.c.S), r.st.week];
    const cmp = (a: Ranked, b: Ranked) => {
        const ka = key(a);
        const kb = key(b);
        for (let i = 0; i < ka.length; i++) if (ka[i] !== kb[i]) return kb[i] - ka[i];
        return 0;
    };
    rows.sort(cmp);
    rows.forEach((r, i) => (r.rank = i > 0 && cmp(rows[i - 1], r) === 0 ? rows[i - 1].rank : i + 1));
    return rows;
};

/** Overall ponderado acumulado no fim de cada semana (minigráfico do "por quê"). */
export const weightedOverallByWeek = (m: Model, st: LbStudent, p: Params) => {
    const out: number[] = [];
    let sw = 0;
    let so = 0;
    st.overall.forEach((o, i) => {
        const x = weight(m, st.level, i + 1, p);
        sw += x;
        so += x * o;
        if ((i + 1) % 7 === 0 || i === st.overall.length - 1) out.push(sw ? so / sw : 0);
    });
    return out;
};

export const isPaused = (st: LbStudent) => st.status === 'DEDA_PAUSED';

export const runDays = (st: LbStudent) => (st.runFrom && st.runTo ? st.runTo - st.runFrom + 1 : 0);

export const sameParams = (a: Params, b: Params) =>
    (Object.keys(a) as (keyof Params)[]).every((k) => Math.abs(a[k] - b[k]) < 1e-9);

/** Faixas de tempo de casa do filtro. */
export const TENURE_BANDS = [
    { key: 'all', label: 'Todas', test: () => true },
    { key: 'b1', label: 'Sem. 1–12', test: (w: number) => w <= 12 },
    { key: 'b2', label: '13–52', test: (w: number) => w >= 13 && w <= 52 },
    { key: 'b3', label: '53+', test: (w: number) => w >= 53 },
] as const;
