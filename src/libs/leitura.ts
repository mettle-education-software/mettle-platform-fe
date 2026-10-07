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
export type Word = { i: number; w: string; st: WordState; p: number | null; heard: string | null; hard?: boolean };
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
};
export type TakeDetail = { words: Word[]; inserted: { w: string }[]; transcript: string };

export type Week = {
    dedaId: string;
    week: string;
    detail: string;
    first: Take;
    last: Take | null;
    compare?: {
        accuracyDelta: number | null;
        commonWords: number;
        becameClear: string[];
        practice: { w: string; first: WordState; last: WordState }[];
        worse: string[];
    };
};
export type Student = { uid: string; firstName: string; weeks: Week[]; persistent: [string, string[]][] };
export type LeituraIndex = {
    generatedAt?: string;
    caveat?: string;
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
