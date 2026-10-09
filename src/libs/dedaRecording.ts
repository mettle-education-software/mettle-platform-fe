// Gravador de voz do DEDA (Fase 1): regras puras, sem navegador — testadas em libs/__tests__/dedaRecording.test.ts.

/** Versão do texto de consentimento mostrado em RecordingConsent; tem de ser igual a DEDA_RECORDING.CONSENT_VERSION do servidor (mettle-common). */
export const CONSENT_VERSION = '2026-10';
export const MIN_RECORDING_MS = 5_000;
export const WARN_RECORDING_MS = 15 * 60_000;
export const MAX_RECORDING_MS = 20 * 60_000;

/** Ordem do plano (seção 6.2): MP4/AAC toca em todo lugar; depois WebM/Opus; por último Ogg/Opus. */
const MIME_PREFERENCE = [
    'audio/mp4;codecs=mp4a.40.2',
    'audio/mp4',
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
];

/** Formato que o navegador sabe gravar, ou null (sem suporte). Recebe MediaRecorder.isTypeSupported. */
export const pickRecordingFormat = (isTypeSupported: (type: string) => boolean) => {
    const mimeType = MIME_PREFERENCE.find((type) => {
        try {
            return isTypeSupported(type);
        } catch {
            return false;
        }
    });
    if (!mimeType) return null;
    // Voz mono: Opus a 32 kbps; AAC precisa de um pouco mais (seção 2.1).
    return { mimeType, audioBitsPerSecond: mimeType.startsWith('audio/mp4') ? 48_000 : 32_000 };
};

/** Tipo sem parâmetros, como vai no Content-Type do envio ("audio/webm;codecs=opus" → "audio/webm"). */
export const baseMimeType = (mimeType: string) => mimeType.split(';')[0].trim();

// ---------- estado do gravador ----------

export type RecorderPhase = 'ready' | 'recording' | 'paused' | 'review' | 'uploading' | 'saved' | 'queued';
export type RecorderProblem =
    | 'denied' // microfone negado
    | 'unsupported' // navegador sem gravador
    | 'nomic' // nenhum microfone
    | 'interrupted' // ligação, troca de app, fone desconectado: pausou sozinho
    | 'offline' // sem internet ao salvar: ficou no aparelho
    | 'upload' // envio falhou: ficou no aparelho
    | 'daily' // limite diário de envios do servidor (429): ficou no aparelho, sobe a partir de amanhã
    | 'expired' // acesso vencido: não grava
    | 'tooShort' // menos de 5 s
    | 'limit'; // chegou aos 20 min e parou

export interface RecorderState {
    phase: RecorderPhase;
    problem: RecorderProblem | null;
    /** Tempo gravado antes do trecho atual (pausas descontadas). */
    accumulatedMs: number;
    /** Início do trecho atual (relógio real), quando gravando. */
    segmentStart: number | null;
}

export type RecorderAction =
    | { type: 'start'; now: number }
    | { type: 'pause'; now: number; interrupted?: boolean }
    | { type: 'resume'; now: number }
    | { type: 'stop'; now: number; limit?: boolean; interrupted?: boolean }
    | { type: 'restore'; durationMs: number; problem?: 'daily' }
    | { type: 'problem'; problem: RecorderProblem }
    | { type: 'upload' }
    | { type: 'saved' }
    | { type: 'queued'; problem: 'offline' | 'upload' | 'expired' | 'daily' }
    | { type: 'reset' };

export const initialRecorderState: RecorderState = {
    phase: 'ready',
    problem: null,
    accumulatedMs: 0,
    segmentStart: null,
};

export const elapsedMs = (state: RecorderState, now: number) =>
    state.accumulatedMs + (state.segmentStart === null ? 0 : Math.max(0, now - state.segmentStart));

/** Transições válidas; qualquer outra ação devolve o mesmo estado (clique duplo, evento atrasado). */
export const recorderReducer = (state: RecorderState, action: RecorderAction): RecorderState => {
    switch (action.type) {
        case 'start':
            if (state.phase !== 'ready') return state;
            return { phase: 'recording', problem: null, accumulatedMs: 0, segmentStart: action.now };
        case 'pause':
            if (state.phase !== 'recording') return state;
            return {
                phase: 'paused',
                problem: action.interrupted ? 'interrupted' : null,
                accumulatedMs: elapsedMs(state, action.now),
                segmentStart: null,
            };
        case 'resume':
            if (state.phase !== 'paused') return state;
            return { ...state, phase: 'recording', problem: null, segmentStart: action.now };
        case 'stop': {
            if (state.phase !== 'recording' && state.phase !== 'paused') return state;
            const total = Math.min(elapsedMs(state, action.now), MAX_RECORDING_MS);
            return {
                phase: 'review',
                problem: action.limit
                    ? 'limit'
                    : total < MIN_RECORDING_MS
                      ? 'tooShort'
                      : action.interrupted
                        ? 'interrupted'
                        : null,
                accumulatedMs: total,
                segmentStart: null,
            };
        }
        case 'restore':
            // Gravação que ficou no aparelho numa visita anterior: volta como "não enviada".
            if (state.phase !== 'ready') return state;
            return {
                phase: 'queued',
                problem: action.problem ?? null,
                accumulatedMs: action.durationMs,
                segmentStart: null,
            };
        case 'problem':
            // Problema de microfone/navegador só faz sentido antes de gravar; os demais vêm com a própria ação.
            if (state.phase !== 'ready') return state;
            return { ...state, problem: action.problem };
        case 'upload':
            if (state.phase !== 'review' && state.phase !== 'queued') return state;
            if (state.accumulatedMs < MIN_RECORDING_MS) return { ...state, problem: 'tooShort' };
            return { ...state, phase: 'uploading', problem: null };
        case 'saved':
            return state.phase === 'uploading' ? { ...state, phase: 'saved', problem: null } : state;
        case 'queued':
            return state.phase === 'uploading' ? { ...state, phase: 'queued', problem: action.problem } : state;
        case 'reset':
            return initialRecorderState;
    }
};

// ---------- limite diário de envios ----------

/**
 * O servidor aceita 3 gravações salvas por aluno por dia (as tentativas; 429 RATE_LIMITED em upload-url e confirm;
 * zera à meia-noite de Brasília ou pelo Mercy Mode do administrador). Tentar de novo no mesmo dia não adianta: a gravação fica no aparelho e sobe a partir do
 * dia seguinte.
 */
export const isDailyLimit = (error: unknown) => {
    const response = (error as { response?: { status?: number; data?: { code?: string } } })?.response;
    return response?.status === 429 || response?.data?.code === 'RATE_LIMITED';
};

export const DAILY_LIMIT_KEY = 'dedaRecordingLimitDay';

/** O limite já foi atingido hoje (dia de Brasília) neste aparelho? Então nada é reenviado até amanhã. */
export const dailyLimitHit = (today: string) => {
    try {
        return window.localStorage.getItem(DAILY_LIMIT_KEY) === today;
    } catch {
        return false;
    }
};

export const markDailyLimit = (today: string) => {
    try {
        window.localStorage.setItem(DAILY_LIMIT_KEY, today);
    } catch {
        // armazenamento bloqueado: vale só a mensagem; a próxima abertura tenta uma vez e para de novo
    }
};

// ---------- microfone (computador) ----------

export const MIC_KEY = 'dedaRecorderMic';
export interface MicDevice {
    deviceId: string;
    label: string;
    kind?: string;
}

const PSEUDO_MICS = ['', 'default', 'communications']; // entradas-atalho do navegador, não aparelhos
const PHONE_MIC = /iphone|ipad|continuity/i;
const BUILT_IN_MIC = /built-?in|internal|macbook|imac|embutido|integrado|interno/i;

/** Entradas de áudio reais e com nome (os nomes só existem depois da permissão do microfone). */
export const listMicrophones = (devices: readonly MicDevice[]) =>
    devices.filter((d) => (d.kind ?? 'audioinput') === 'audioinput' && !PSEUDO_MICS.includes(d.deviceId) && !!d.label);

/**
 * Microfone a pedir ao navegador (deviceId exato) ou null = o padrão do sistema.
 * 1) a escolha guardada, se o aparelho ainda existe; 2) sem escolha (ou o aparelho sumiu): o padrão do sistema — a não
 * ser que só haja indício de iPhone no padrão (Continuity do Mac) e exista alternativa: aí o embutido, ou o primeiro
 * que não seja iPhone.
 * ponytail: heurística por nome do aparelho (iPhone/iPad no rótulo); se o aluno renomeou o iPhone ou o navegador não
 * dá nomes (antes da permissão), fica o padrão do sistema — o seletor resolve à mão.
 */
export const pickMicrophone = (devices: readonly MicDevice[], savedId?: string | null): string | null => {
    const mics = listMicrophones(devices);
    if (savedId && mics.some((d) => d.deviceId === savedId)) return savedId;
    // Chrome nomeia o padrão ("Default - iPhone … Microphone"); nos outros, o primeiro da lista é o padrão.
    const systemDefault = devices.find((d) => d.deviceId === 'default' && d.label) ?? mics[0];
    if (!systemDefault || !PHONE_MIC.test(systemDefault.label)) return null;
    const others = mics.filter((d) => !PHONE_MIC.test(d.label));
    return (others.find((d) => BUILT_IN_MIC.test(d.label)) ?? others[0])?.deviceId ?? null;
};

export const readSavedMic = (): string | null => {
    try {
        return window.localStorage.getItem(MIC_KEY) || null;
    } catch {
        return null;
    }
};

export const saveMic = (deviceId: string | null) => {
    try {
        if (deviceId) window.localStorage.setItem(MIC_KEY, deviceId);
        else window.localStorage.removeItem(MIC_KEY);
    } catch {
        // armazenamento bloqueado: a escolha vale só nesta visita
    }
};

// ---------- datas ----------

const BRASILIA = 'America/Sao_Paulo';

/** "AAAA-MM-DD" do dia em Brasília — a data da gravação que o servidor espera. */
export const brasiliaDate = (date: Date) =>
    new Intl.DateTimeFormat('en-CA', { timeZone: BRASILIA, year: 'numeric', month: '2-digit', day: '2-digit' }).format(
        date,
    );

// O Programa Imerso é todo em inglês (só a introdução do DEDA é em português).
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-09-30" → "Wednesday, Sep 30". Datas inválidas devolvem "". */
export const formatRecordedOn = (recordedOn: string) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(recordedOn);
    if (!match) return '';
    const date = new Date(Date.UTC(+match[1], +match[2] - 1, +match[3]));
    if (Number.isNaN(date.getTime())) return '';
    return `${WEEKDAYS[date.getUTCDay()]}, ${MONTHS[date.getUTCMonth()]} ${Number(match[3])}`;
};

/** Duração para o aluno: "6:12" (ou "1:02:03"). */
export const formatDuration = (ms: number) => {
    const total = Number.isFinite(ms) && ms > 0 ? Math.floor(ms / 1000) : 0;
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = String(total % 60).padStart(2, '0');
    return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
};

/** Para leitores de tela: "6 minutes and 12 seconds". */
export const spokenDuration = (ms: number) => {
    const total = Number.isFinite(ms) && ms > 0 ? Math.floor(ms / 1000) : 0;
    const m = Math.floor(total / 60);
    const s = total % 60;
    const parts = [];
    if (m) parts.push(`${m} ${m === 1 ? 'minute' : 'minutes'}`);
    if (s || !m) parts.push(`${s} ${s === 1 ? 'second' : 'seconds'}`);
    return parts.join(' and ');
};

// ---------- endereços ----------

/**
 * Só aceitamos endereços assinados do Google Cloud Storage, em https, vindos do backend.
 * Qualquer outra coisa (http, outro domínio, javascript:, data:) é recusada antes de chegar a um <audio> ou a um envio.
 */
export const isSignedStorageUrl = (value: unknown): value is string => {
    if (typeof value !== 'string') return false;
    try {
        const url = new URL(value);
        return (
            url.protocol === 'https:' &&
            (url.hostname === 'storage.googleapis.com' || url.hostname.endsWith('.storage.googleapis.com'))
        );
    } catch {
        return false;
    }
};

// ---------- contrato com o backend (plano, seção 4.1) ----------

export interface DedaRecording {
    id: string;
    dedaId: string;
    week: string;
    weekDay: string; // day1..day7
    recordedOn: string; // AAAA-MM-DD
    durationMs: number;
    mimeType: string;
    status?: 'ready' | 'replaced' | 'hidden'; // o aluno só recebe 'ready' (substituídas e removidas são apagadas)
    createdAt?: string;
}

/** Tentativas de hoje (gravações salvas por dia de Brasília; 3 por aluno). Ausente = servidor antigo: nada aparece. */
export interface RecordingAttempts {
    limit: number;
    used: number;
    left: number;
}

export interface DedaRecordingsResponse {
    enabled: boolean;
    consent: { accepted: boolean; version: string | null; acceptedAt?: string | null };
    recordings: DedaRecording[];
    attempts?: RecordingAttempts;
}

/** "3 attempts left today" → "1 attempt left today" → "No attempts left today". */
export const attemptsLabel = (left: number) =>
    left <= 0 ? 'No attempts left today' : `${left} ${left === 1 ? 'attempt' : 'attempts'} left today`;

/**
 * O servidor responde 404 a toda rota do gravador para a conta fora de DEDA_RECORDING_ENABLED_UIDS (e o portão
 * da API, 404 se a rota ainda não foi publicada): vira "desligado", sem erro e sem nova tentativa.
 */
export const recordingsOrDisabled = (error: unknown): DedaRecordingsResponse => {
    if ((error as { response?: { status?: number } })?.response?.status === 404) {
        return { enabled: false, consent: { accepted: false, version: null }, recordings: [] };
    }
    throw error;
};

// ---------- indicadores (seção 5.4) ----------

export const WEEK_DAYS = ['day1', 'day2', 'day3', 'day4', 'day5', 'day6', 'day7'] as const;

export interface RecordingIndicators {
    /** Uma posição por dia (day1..day7): a gravação mais recente daquele dia, ou null. */
    days: (DedaRecording | null)[];
    recordedDays: number;
    /** Primeiro e último dia gravados (por ordem do dia na semana) e a variação entre eles. */
    first: DedaRecording | null;
    last: DedaRecording | null;
    deltaMs: number | null;
    totalMs: number;
}

export const computeIndicators = (recordings: DedaRecording[]): RecordingIndicators => {
    const days = WEEK_DAYS.map((day) =>
        recordings
            .filter((r) => (r.status ?? 'ready') === 'ready' && r.weekDay === day)
            .reduce<DedaRecording | null>(
                (latest, r) => (!latest || r.recordedOn > latest.recordedOn ? r : latest),
                null,
            ),
    );
    const recorded = days.filter((d): d is DedaRecording => d !== null);
    const first = recorded[0] ?? null;
    const last = recorded.length > 1 ? recorded[recorded.length - 1] : null;
    return {
        days,
        recordedDays: recorded.length,
        first,
        last,
        deltaMs: first && last ? last.durationMs - first.durationMs : null,
        totalMs: recorded.reduce((sum, r) => sum + r.durationMs, 0),
    };
};

/** Variação sem cor de melhor/pior: "+0:42" / "−1:08" / "0:00". */
export const formatDelta = (ms: number) => {
    if (Math.abs(ms) < 1000) return '0:00';
    return `${ms > 0 ? '+' : '−'}${formatDuration(Math.abs(ms))}`;
};

/** A gravação que "Minha leitura" toca: a de hoje no DEDA da semana; a mais recente num DEDA antigo. */
export const pickMyReading = (recordings: DedaRecording[], today: string, isCurrentDeda: boolean) => {
    const ready = recordings.filter((r) => (r.status ?? 'ready') === 'ready');
    if (isCurrentDeda) return ready.find((r) => r.recordedOn === today) ?? null;
    return ready.reduce<DedaRecording | null>((a, r) => (!a || r.recordedOn > a.recordedOn ? r : a), null);
};

// ---------- KPIs de gravação (LAMP) ----------

/** Primeiro dia em que o gravador existiu para alguém (o piso da contagem): nada antes disso é "dia de gravar". */
export const RECORDER_SINCE = '2026-10-05';

/** Semanas desde o gravador (+2 de folga para pausas): o teto das semanas que a LAMP pede (frente 4b, item 5). */
export const weeksSinceRecorder = (now = Date.now()) =>
    Math.ceil((now - Date.parse(`${RECORDER_SINCE}T00:00:00-03:00`)) / (7 * 864e5)) + 2;

/**
 * Intervalos de pausa [início, fim) em AAAA-MM-DD, a partir das datas de pausa e de (re)início do programa. A data de
 * pausa é o ÚLTIMO dia ativo (o domingo que fecha o trecho, inclusive — desenho §3.2): a pausa começa no dia seguinte.
 */
export const pausedIntervals = (pauses: string[] = [], starts: string[] = []) => {
    const d = (x: string) => brasiliaDate(new Date(x));
    const ss = starts.map(d).sort();
    return pauses
        .map(d)
        .sort()
        .map((p) => ({ from: nextDay(p), to: ss.find((s) => s > p) }));
};

const nextDay = (iso: string) => {
    const t = new Date(`${iso}T12:00:00Z`);
    t.setUTCDate(t.getUTCDate() + 1);
    return t.toISOString().slice(0, 10);
};

/**
 * KPIs de gravação: dias em que dava para gravar desde a primeira gravação do aluno (sem pausas; hoje só conta se já
 * tem gravação — o dia ainda não acabou), gravações mantidas (uma por dia), taxa e tempo total.
 */
export const recordingStats = (
    recordings: { recordedOn: string; durationMs: number }[],
    today: string,
    paused: { from: string; to?: string }[] = [],
) => {
    const byDay = new Map<string, number>();
    for (const r of recordings) if (r.recordedOn >= RECORDER_SINCE) byDay.set(r.recordedOn, r.durationMs || 0);
    const days = [...byDay.keys()].sort();
    if (!days.length) return undefined;
    const since = days[0];
    const isPaused = (iso: string) => paused.some((p) => iso >= p.from && (!p.to || iso < p.to));
    let possible = 0;
    for (let d = since; d <= today; d = nextDay(d)) {
        if (isPaused(d)) continue;
        if (d < today || byDay.has(d)) possible++;
    }
    const total = [...byDay.values()].reduce((a, b) => a + b, 0);
    return {
        since,
        recordingDays: possible,
        recordings: byDay.size,
        rate: possible ? byDay.size / possible : 0,
        totalMs: total,
    };
};
