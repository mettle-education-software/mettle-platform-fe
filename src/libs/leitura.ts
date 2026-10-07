// Análise de leitura do DEDA — piloto INTERNO (7-Out-2026): só o dono vê; alunos não veem nada.
// Os dados vêm do Worker mettle-events (/plataforma/leitura), que confere o uid do token e só responde a OWNERS.
// Gerados no VPS da Mettle por mibe/tools/leitura (faster-whisper + alinhamento ao texto do DEDA).
import { isNewDesignAccount } from './newDesign';

export const LEITURA_URL = 'https://events.mettle.com.br/plataforma/leitura';

/** Mesma lista do Worker (OWNERS em plataforma-leitura.ts). Não é segredo: o Worker é quem barra. */
export const LEITURA_OWNERS = ['RBgG61nNKdgHUKCkxhR4vhaBLGU2'];

/** Página só para o dono, e só com a plataforma nova ligada para ele. */
export const isLeituraOwner = (uid?: string | null) => !!uid && LEITURA_OWNERS.includes(uid) && isNewDesignAccount(uid);

export type WordState = 'ok' | 'unclear' | 'sub' | 'del' | 'skip';
/** `sep`: pontuação e espaço do texto original depois da palavra (texto marcado legível). */
export type Word = {
    i: number;
    w: string;
    st: WordState;
    p: number | null;
    heard: string | null;
    hard?: boolean;
    sep?: string;
};
export type Counts = Partial<Record<WordState | 'ins' | 'repeat' | 'hard', number>>;

export type Take = {
    id: string;
    recordedOn: string;
    weekDay: string;
    coverage: number;
    accuracy: number | null;
    clarity: number | null;
    counts: Counts;
    audioSec: number;
    /** palavras por minuto de fala no trecho lido (pausas > 0,6 s fora) */
    wpm?: number | null;
    /** wpm ÷ ritmo da narração nativa do DEDA (mesma regra) */
    paceRatio?: number | null;
};
export type TakeDetail = { words: Word[]; inserted: { w: string }[]; transcript: string };

export type Week = {
    dedaId: string;
    week: string;
    detail: string;
    nativeWpm?: number | null;
    first: Take;
    last: Take | null;
    compare?: {
        accuracyDelta: number | null;
        paceDelta?: number | null;
        /** mais rápido e menos preciso: alerta, não progresso */
        paceUpAccuracyDown?: boolean;
        commonWords: number;
        becameClear: string[];
        practice: { w: string; first: WordState; last: WordState }[];
        worse: string[];
    };
};
export type SeriesPoint = {
    week: string;
    dedaId: string;
    firstPace: number | null;
    firstAcc: number | null;
    firstOn: string | null;
    lastPace: number | null;
    lastAcc: number | null;
    lastOn: string | null;
};
export type Student = {
    uid: string;
    firstName: string;
    weeks: Week[];
    persistent: [string, string[]][];
    series?: SeriesPoint[];
};
export type LeituraIndex = {
    generatedAt?: string;
    caveat?: string;
    paceCaveat?: string;
    model?: string[];
    students: Student[];
    empty?: boolean;
};

/** Classe da marca de cada palavra no texto (cores em NewLeitura). Palavra difícil até na narração: neutra. */
export const markOf = (w: Pick<Word, 'st' | 'hard'>) => (w.hard ? 'h' : w.st === 'ok' ? '' : w.st);

export const pct = (x: number | null | undefined) => (x == null ? '—' : `${Math.round(x * 100)}%`);

/** Variação em pontos percentuais: "+4 pp", "−2 pp", "0 pp". */
export const deltaPp = (d: number | null | undefined) => {
    if (d == null) return '—';
    const v = Math.round(d * 100);
    return `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v)} pp`;
};

/** Lista de prática sem repetir a mesma palavra (o texto pode tê-la várias vezes). */
export const uniqueWords = (list: { w: string }[]) => [...new Set(list.map((x) => x.w.toLowerCase()))];

/** Ponto do gráfico de uma semana: a ÚLTIMA gravação com leitura (ou a única). */
export const weekPoint = (p: SeriesPoint) => ({
    pace: p.lastPace ?? p.firstPace,
    acc: p.lastAcc ?? p.firstAcc,
});

/** Texto exibido de uma palavra: ela mais a pontuação seguinte do original; sem separador, um espaço. */
export const withSep = (w: Pick<Word, 'w' | 'sep'>) => w.w + (w.sep ?? ' ');
