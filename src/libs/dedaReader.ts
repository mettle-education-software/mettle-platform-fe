// Página nova do DEDA ("Direção A — Leitor focado"): chave por conta e regras puras (testadas em
// libs/__tests__/dedaReader.test.ts). Ponto único: quem vê a página nova é decidido só aqui.

/**
 * Contas com a página nova. Só a do André (dono do produto), por decisão dele: usa a própria conta em produção
 * como ambiente de teste e pede os ajustes ali. Todas as outras contas veem a página atual, sem nenhuma mudança.
 */
export const DEDA_READER_UIDS: readonly string[] = ['RBgG61nNKdgHUKCkxhR4vhaBLGU2'];

/** Variável de teste: DEDA_READER=off desliga a página nova para todo mundo (página atual em todas as contas). */
export const DEDA_READER_FORCED_OFF = process.env.DEDA_READER === 'off';

/** `uid` é o da conta realmente logada (Firebase), nunca o do aluno que um administrador está vendo. */
export const isDedaReaderAccount = (uid?: string | null, forcedOff = DEDA_READER_FORCED_OFF) =>
    !forcedOff && typeof uid === 'string' && DEDA_READER_UIDS.includes(uid);

// ---------- preferência "Classic view" / "New view" (só para as contas da lista) ----------

export type DedaReaderView = 'new' | 'classic';
export const DEDA_READER_VIEW_KEY = 'dedaReaderView';

export const readReaderView = (): DedaReaderView => {
    try {
        return window.localStorage.getItem(DEDA_READER_VIEW_KEY) === 'classic' ? 'classic' : 'new';
    } catch {
        return 'new';
    }
};

export const saveReaderView = (view: DedaReaderView) => {
    try {
        window.localStorage.setItem(DEDA_READER_VIEW_KEY, view);
    } catch {
        // modo privado / armazenamento bloqueado: vale só nesta visita
    }
};

// ---------- passos (mesmas regras de DedaActivity/DedaSteps.tsx) ----------

export const READER_STEPS = ['listen', 'readRecord', 'watch', 'listenRead', 'write', 'finish', 'completed'] as const;
export type ReaderStep = (typeof READER_STEPS)[number];

export interface StepRules {
    isTodaysDeda: boolean;
    todaysAndNotCompleted: boolean;
    notWeekZero: boolean;
    progress: Partial<Record<ReaderStep, boolean | null>>;
}

/** Botão "próximo" desabilitado neste passo (regra do computador em DedaSteps). */
export const nextBlocked = (step: ReaderStep, rules: StepRules) =>
    !rules.isTodaysDeda || !rules.todaysAndNotCompleted || !rules.notWeekZero
        ? step === 'write'
        : !rules.progress[step];

/**
 * Pode ir direto de `from` para `to`? Só se desse para chegar lá pelos botões de antes: voltar é sempre
 * possível; avançar exige que cada passo do caminho libere o "próximo". "completed" nunca é destino.
 */
export const canJumpTo = (from: ReaderStep, to: ReaderStep, rules: StepRules) => {
    const a = READER_STEPS.indexOf(from);
    const b = READER_STEPS.indexOf(to);
    if (from === 'completed' || to === 'completed') return false;
    for (let i = a; i < b; i += 1) if (nextBlocked(READER_STEPS[i], rules)) return false;
    return true;
};

// ---------- passo 5 (Write): dia 1 = segunda … 7 = domingo, como em steps/Write.tsx ----------

export const WRITE_DAY_KEYS = [
    'dedaWriteContentDayOne',
    'dedaWriteContentDayTwo',
    'dedaWriteContentDayThree',
    'dedaWriteContentDayFour',
    'dedaWriteContentDayFive',
    'dedaWriteContentDaySix',
    'dedaWriteContentDaySeven',
] as const;

export const writeDayToday = (date: Date = new Date()) => (date.getDay() === 0 ? 7 : date.getDay());

export type WriteDayState = 'today' | 'past' | 'locked';
export const writeDayState = (day: number, today: number): WriteDayState =>
    day === today ? 'today' : day < today ? 'past' : 'locked';

/** Dia mostrado: hoje por padrão; um dia anterior abre só para consulta; dia futuro nunca abre. */
export const openWriteDay = (requested: number | null | undefined, today: number) =>
    requested && Number.isInteger(requested) && requested >= 1 && requested < today ? requested : today;
