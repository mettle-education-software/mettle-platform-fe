// Leaderboard do Imerso: só o dono vê; alunos não veem (nem com a plataforma nova para todos).
// O retrato vem do Worker mettle-events (/plataforma/leaderboard), que confere o uid do token e só responde ao dono.
// Gerado à noite por mibe/tools/leaderboard (lote só leitura). As regras moram só lá e no Livro de Regras (André,
// 09-Out-2026: nada de ajustar regras na plataforma): esta página só MOSTRA o Score, a posição e os componentes do lote.
// O único cálculo aqui é a ordem quando um filtro tira alunos da lista (mesma ordem do lote: Score, depois dias feitos).

export const LEADERBOARD_URL = 'https://events.mettle.com.br/plataforma/leaderboard';

export type Level = 'EASY' | 'MEDIUM' | 'HARD';
export const LEVEL_NAME: Record<Level, string> = { EASY: 'Flow', MEDIUM: 'Boost', HARD: 'Turbo' };

/** Componentes do lote (retrato versão 3). Somas na janela dos últimos H dias de LAMP; pontos já ÷ H × 1000. */
export type LbComp = {
    /** Overall somado (0–1 por dia) */
    O: number;
    /** Gravação somada nos dias com gravador; null = sem gravador */
    R: number | null;
    /** dias da Run atual dentro da janela */
    Run: number;
    /** dias de LAMP na janela (≤ H) e, deles, com gravador e com algo feito */
    window: number;
    recDays: number;
    daysDone: number;
    /** pausa × reset */
    F: number;
    pO: number;
    pR: number | null;
    pRun: number;
};

export type LbStudent = {
    id: string;
    name: string;
    level: Level;
    /** semana da LAMP */
    week: number;
    status?: string;
    /** Overall de cada dia de LAMP (0–1), dia 1 primeiro */
    overall: number[];
    score: number;
    rank: number;
    comp: LbComp;
    runFrom?: number | null;
    runTo?: number | null;
    dedaToday?: number;
    /** semanas desde a última pausa (só com o DEDA pausado); pausas e resets gastos (3 − restantes) */
    pausedWeeks?: number | null;
    pausesUsed?: number | null;
    resetsUsed?: number | null;
    /** dias pausados pelo aluno (multiplicador); resets que arquivaram; semana de vida (filtro) */
    pausedDays?: number;
    resetsArchived?: number;
    tenureWeek?: number;
};

export type LbSnapshot = {
    generatedAt?: string;
    version?: number;
    /** dias de LAMP do programa inteiro (1000 = perfeito em todos) */
    H?: number;
    students: LbStudent[];
    rulebook?: string;
    empty?: boolean;
};

export type Ranked = { st: LbStudent; rank: number };

/** O retrato traz o modelo atual (versão 3: Score acumulado)? Retrato antigo: a página espera o próximo. */
export const isCurrentSnapshot = (snap: LbSnapshot) => (snap.version ?? 0) >= 3;

/** Ordem do lote: Score; empate → mais dias de LAMP feitos; persistindo, mesma posição (1, 1, 3). */
export const order = (students: LbStudent[]): Ranked[] => {
    const rows = [...students].sort((a, b) => b.score - a.score || b.comp.daysDone - a.comp.daysDone);
    const same = (a: LbStudent, b: LbStudent) => a.score === b.score && a.comp.daysDone === b.comp.daysDone;
    const out: Ranked[] = [];
    rows.forEach((st, i) => out.push({ st, rank: i > 0 && same(rows[i - 1], st) ? out[i - 1].rank : i + 1 }));
    return out;
};

export const isPaused = (st: LbStudent) => st.status === 'DEDA_PAUSED';

/** Semana do filtro de tempo de programa: a de vida (desde a 1ª segunda de DEDA); sem ela, a da LAMP. */
export const tenureWeekOf = (st: LbStudent) => st.tenureWeek || st.week;

/** Média simples do Overall nos dias da janela (exibição). */
export const overallAvg = (st: LbStudent) => (st.comp.window ? st.comp.O / st.comp.window : 0);

/** Média da gravação nos dias com gravador (exibição); null = sem gravador. */
export const recAvg = (st: LbStudent) => (st.comp.R === null || !st.comp.recDays ? null : st.comp.R / st.comp.recDays);

/** Overall médio de cada semana do programa (minigráfico do "por quê"). */
export const weeklyOverall = (st: LbStudent) => {
    const out: number[] = [];
    for (let i = 0; i < st.overall.length; i += 7) {
        const week = st.overall.slice(i, i + 7);
        out.push(week.reduce((t, x) => t + x, 0) / week.length);
    }
    return out;
};

/** Faixas de tempo de programa do filtro. */
export const TENURE_BANDS = [
    { key: 'all', label: 'Todas', test: () => true },
    { key: 'b1', label: 'Sem. 1–12', test: (w: number) => w <= 12 },
    { key: 'b2', label: '13–52', test: (w: number) => w >= 13 && w <= 52 },
    { key: 'b3', label: '53+', test: (w: number) => w >= 53 },
] as const;
