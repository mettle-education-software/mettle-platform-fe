// Página nova do DEDA ("Direção A — Leitor focado"): chave por conta e regras puras (testadas em
// libs/__tests__/dedaReader.test.ts). Ponto único: quem vê a página nova é decidido só aqui.
import type { MelpSummaryResponse } from 'interfaces/melp';
import { dedaLampWeek } from './dedaClock';
import { saoPauloWeekday } from './helpers';

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

/** Dia de hoje no passo 5, em Brasília (o dia do servidor, nunca o do aparelho). */
export const writeDayToday = (date: Date = new Date()) => saoPauloWeekday(date);

export type WriteDayState = 'today' | 'past' | 'locked';
/** `pastDeda`: DEDA que não é o da semana — já passou, os 7 dias ficam abertos para consulta (nenhum é "hoje"). */
export const writeDayState = (day: number, today: number, pastDeda = false): WriteDayState =>
    pastDeda ? 'past' : day === today ? 'today' : day < today ? 'past' : 'locked';

/**
 * Dia mostrado. DEDA da semana: hoje por padrão; um dia anterior abre só para consulta; dia futuro nunca abre.
 * DEDA que já passou: qualquer dia de 1 a 7; Day 1 por padrão.
 */
export const openWriteDay = (requested: number | null | undefined, today: number, pastDeda = false) => {
    const valid = !!requested && Number.isInteger(requested) && requested >= 1;
    if (pastDeda) return valid && (requested as number) <= 7 ? (requested as number) : 1;
    return valid && (requested as number) < today ? (requested as number) : today;
};

// ---------- aba Review: só quando há revisão liberada ----------

/**
 * A mesma regra de DedaReview/ReaderReview ("No reviews available at this stage"): as revisões começam na semana 4 da
 * LAMP (o servidor só cria review1 a partir dela). A semana do DEDA vem de `dedaLampWeek` (relógio novo: a exibição mais
 * recente com semana na LAMP; legado: a posição em unlocked_dedas). `undefined` = resumo ainda não chegou (sem piscar).
 */
export const REVIEW_FROM_WEEK = 4;
export const hasReviews = (
    summary: MelpSummaryResponse['data'] | null | undefined,
    dedaId: string,
): boolean | undefined => (summary ? (dedaLampWeek(summary, dedaId) ?? 0) >= REVIEW_FROM_WEEK : undefined);

// ---------- tamanho do texto de leitura ("Aa" na barra do topo): preferência por aparelho ----------

/**
 * Fatores aplicados ao texto de leitura (variável CSS --r-scale). O padrão é o primeiro da lista (o menor); os
 * demais são aumentos. Os valores não mudaram quando o padrão passou de 1 para 0,9: quem já tinha escolhido um
 * tamanho continua vendo exatamente o mesmo; quem nunca escolheu passa a ver o novo padrão.
 */
export const TEXT_SCALES = [0.9, 1, 1.1, 1.2, 1.3] as const;
export const DEFAULT_TEXT_SCALE: number = TEXT_SCALES[0];
export const TEXT_SCALE_KEY = 'dedaReaderTextScale';

/** Só os fatores da lista valem; qualquer outra coisa guardada (ou armazenamento bloqueado) cai no padrão. */
export const readTextScale = (): number => {
    try {
        const saved = Number(window.localStorage.getItem(TEXT_SCALE_KEY));
        return (TEXT_SCALES as readonly number[]).includes(saved) ? saved : DEFAULT_TEXT_SCALE;
    } catch {
        return DEFAULT_TEXT_SCALE;
    }
};

export const saveTextScale = (scale: number) => {
    try {
        window.localStorage.setItem(TEXT_SCALE_KEY, String(scale));
    } catch {
        // modo privado / armazenamento bloqueado: vale só nesta visita
    }
};

// ---------- vídeo que começa sozinho (passo 3 e card de vídeo do LinKnowledge) ----------

/**
 * Endereço do player (Vimeo/YouTube) com autoplay=1 — com som: nunca pedimos mudo. Se o navegador recusar tocar com
 * som (iPhone), o player fica pronto, com o play grande. Endereço inválido volta como veio.
 */
export const withAutoplay = (embedUrl: string) => {
    try {
        const url = new URL(embedUrl);
        url.searchParams.set('autoplay', '1');
        return url.toString();
    } catch {
        return embedUrl;
    }
};

// ---------- Summary: tempos que seguem para o servidor sem campo na tela ----------

/**
 * Mesmos campos e unidades do Summary atual (DedaActivitySummary + InputWithTime): `dedaTime` em minutos inteiros
 * (cronômetro do dia) e `readingTime` em segundos inteiros (duração da gravação de hoje no passo 2, como o aluno a vê: 6:12 → 372). Sem gravação hoje
 * ("I can’t record right now" ou conta sem gravador): zero — decisão do dono; nenhum tempo é inventado.
 */
export const summaryTimes = (stopwatchSeconds: number, recordingMs?: number | null) => ({
    dedaTime: Number.isFinite(stopwatchSeconds) && stopwatchSeconds > 0 ? Math.floor(stopwatchSeconds / 60) : 0,
    readingTime: recordingMs && Number.isFinite(recordingMs) && recordingMs > 0 ? Math.floor(recordingMs / 1000) : 0,
});
