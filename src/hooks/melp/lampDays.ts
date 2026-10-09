import { useQueries, useQuery } from '@tanstack/react-query';
import { InputDataResponse } from 'interfaces';
import { lampLastDay, lampRunning } from 'libs/dedaClock';
import { bestStreak, countsForRun, dedaStreak, LampDay, runBeforeToday } from 'libs/newDesign';
import { useAppContext, useMelpContext } from 'providers';
import { useMemo } from 'react';
import { lampService } from 'services';

type Day = InputDataResponse['data'];

/** Uma linha de `GET /performance/<uid>/weekly/days`: o programa inteiro numa leitura. */
export interface ProgramDay {
    week: number;
    day: number;
    deda: number;
    active: number;
    passive: number;
    activeMin: number;
    passiveMin: number;
    /** pred_place, steps, state_mind, state_being, focus */
    ratings: number[];
    /** relógio novo: a data (Brasília) e o DEDA da linha; o servidor manda também os dias em branco */
    date?: string | null;
    dedaId?: string | null;
}

const ACTIVE_KEYS = ['book', 'deda_notes', 'mooc', 'others', 'review'];
const PASSIVE_KEYS = [
    'audiobook',
    'conversation',
    'movie_doc',
    'news_shows',
    'others',
    'podcast',
    'series',
    'ted',
    'youtube',
];
const sum = (row: unknown, keys: string[]) =>
    keys.reduce((t, k) => t + (Number((row as Record<string, unknown> | undefined)?.[k]) || 0), 0);

/** A leitura por dia (aba Input) no mesmo formato da leitura do programa. */
const fromInput = (data: Day | undefined): Omit<LampDay, 'week' | 'day'> => {
    const deda = data?.dedaInput;
    return {
        deda: Number(deda?.deda_concluded_score) || 0,
        active: Number(data?.activeInput?.concluded_score) || 0,
        passive: Number(data?.passiveInput?.concluded_score) || 0,
        activeMin: sum(data?.activeInput, ACTIVE_KEYS),
        passiveMin: sum(data?.passiveInput, PASSIVE_KEYS),
        ratings: [
            deda?.deda_pred_place,
            deda?.deda_steps,
            deda?.deda_state_mind,
            deda?.deda_state_being,
            deda?.deda_focus,
        ].map((v) => Number(v) || 0),
        iso: deda?.date,
    };
};
const EMPTY = fromInput(undefined);

/** Guarda por sessão do navegador (dias passados): ao voltar à página, não pede tudo de novo. */
const STORE = 'lampDay:v1';
const storeKey = (uid: string, week: number, day: number) => `${STORE}:${uid}:${week}:${day}`;
const readStored = (key: string): { at: number; data: Day } | undefined => {
    try {
        const raw = window.sessionStorage.getItem(key);
        return raw ? JSON.parse(raw) : undefined;
    } catch {
        return undefined;
    }
};
const writeStored = (key: string, data: Day) => {
    try {
        window.sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), data }));
    } catch {
        // armazenamento cheio/bloqueado: só não guarda
    }
};

/** Teto da reserva dia a dia: 4 semanas (28 consultas), nunca mais (frente 4b, item 6). */
const BATCH = 4;

/**
 * Dias da LAMP (plataforma nova) para a DEDA Run, Best, a semana e o calendário.
 * - "Hoje" na LAMP é o último dia dela (libs/dedaClock.lampLastDay): o de hoje com ela contando; em pausa, fim ou
 *   espera, o último dia ativo (antes, o dia da semana de hoje caía numa semana congelada — PF-07).
 * - Histórico: uma leitura do programa inteiro, `GET /performance/<uid>/weekly/days` (react-query `['lamp-days', uid]`);
 *   no relógio novo cada linha traz a data e o DEDA.
 * - Semana atual: a MESMA leitura da aba Input (`GET /input/v2/<uid>/<semana>/<dia>`, mesma chave), para que uma
 *   gravação no Input apareça na hora.
 * - Reserva dia a dia só quando o servidor não tem a leitura do programa (404/501), e só as últimas semanas pedidas
 *   (no máximo 4). Em 5xx, tempo esgotado ou rede, não: o leque de pedidos realimentaria a sobrecarga — o histórico
 *   fica como falha (`historyFailed`, "Try again").
 */
export const useLampDays = (minWeeks: number) => {
    const { user } = useAppContext();
    const { melpSummary } = useMelpContext();
    const uid = user?.uid;
    const last = lampLastDay(melpSummary);
    const running = lampRunning(melpSummary);
    const currentWeek = last?.week ?? 0;
    const today = last?.day ?? 0;
    const program = useQuery({
        queryKey: ['lamp-days', uid],
        queryFn: () =>
            lampService
                .get<{ data: ProgramDay[] }>(`/performance/${uid}/weekly/days`)
                .then(({ data }) => new Map(data.data.map((d) => [`${d.week}:${d.day}`, d]))),
        enabled: !!uid && currentWeek > 0,
        staleTime: 5 * 60_000,
        retry: 1,
    });
    const status = (program.error as { response?: { status?: number } } | null)?.response?.status;
    const perDay = program.isError && (status === 404 || status === 501);
    const historyFailed = program.isError && !perDay;
    // sem histórico (falha que não é 404) só a semana atual existe: nada de dias zerados inventados para trás
    const weeks = perDay
        ? Math.min(BATCH, Math.max(1, minWeeks), currentWeek)
        : historyFailed
          ? Math.min(1, currentWeek)
          : currentWeek;

    const keys = useMemo(() => {
        const out: { week: number; day: number }[] = [];
        for (let w = currentWeek; w >= Math.max(1, currentWeek - weeks + 1); w--)
            for (let d = w === currentWeek ? today : 7; d >= 1; d--) out.push({ week: w, day: d });
        return out; // do mais recente (o último dia da LAMP) para trás
    }, [currentWeek, today, weeks]);

    // com a leitura do programa, só a semana atual vai dia a dia
    const fetchKeys = useMemo(
        () => (perDay ? keys : keys.filter(({ week }) => week === currentWeek)),
        [keys, perDay, currentWeek],
    );
    const stored = useMemo(
        () =>
            fetchKeys.map(({ week, day }) =>
                uid && !(week === currentWeek && day === today) ? readStored(storeKey(uid, week, day)) : undefined,
            ),
        [fetchKeys, uid, currentWeek, today],
    );
    const results = useQueries({
        queries: fetchKeys.map(({ week, day }, i) => {
            const isToday = running && week === currentWeek && day === today;
            return {
                queryKey: ['get-input-data', uid, `week${week}`, `day${day}`],
                queryFn: () =>
                    lampService.get<InputDataResponse>(`/input/v2/${uid}/week${week}/day${day}`).then(({ data }) => {
                        if (!isToday && uid) writeStored(storeKey(uid, week, day), data.data);
                        return data.data;
                    }),
                enabled: !!uid && currentWeek > 0,
                staleTime: isToday ? 60_000 : 30 * 60_000,
                initialData: stored[i]?.data,
                initialDataUpdatedAt: stored[i]?.at,
                retry: 1,
            };
        }),
    });

    const loading = results.some((r) => r.isLoading) || program.isLoading;
    const newestFirst: LampDay[] = keys.map(({ week, day }, i) => {
        const row = program.data?.get(`${week}:${day}`);
        const fromRow = { ...(row ?? EMPTY), week, day, iso: row?.date ?? undefined, dedaId: row?.dedaId };
        // semana atual dia a dia (mesmos índices de `keys`); sem a resposta do dia, vale a linha do programa
        const daily = (perDay || week === currentWeek) && results[i]?.data;
        return daily ? { ...fromRow, ...fromInput(daily), iso: daily.dedaInput?.date ?? fromRow.iso } : fromRow;
    });

    const streak = dedaStreak(newestFirst, running);
    // a janela lida não chega à semana 1 (reserva com teto, ou histórico em falha): a Run pode ser maior que a vista
    const truncated = (perDay || historyFailed) && currentWeek > weeks;
    return {
        newestFirst,
        loading,
        streak,
        currentWeek,
        today,
        /** a LAMP conta hoje (sem isso não há "hoje" na semana nem no calendário) */
        running,
        /** a leitura do programa falhou (não 404): o histórico não está aqui */
        historyFailed,
        /** os dias lidos não chegam ao começo do programa */
        truncated,
        retryHistory: () => void program.refetch(),
    };
};

/**
 * DEDA Run (o KPI principal do programa): dias seguidos com o DEDA a 80% ou mais. `beforeToday` = a Run até ontem;
 * `todayCounted` = hoje já contou. `best` vale para as semanas carregadas.
 */
export const useDedaRun = (minWeeks = 2) => {
    const days = useLampDays(minWeeks);
    const today = days.newestFirst[0];
    // a Run chega ao fim do que foi lido e o lido não chega ao começo do programa: o número sairia menor que o real —
    // fica "carregando" ("—") até o histórico voltar
    const partial = days.truncated && days.streak.toEdge;
    return {
        ...days,
        loading: days.loading || partial,
        current: partial ? 0 : days.streak.current,
        beforeToday: partial ? 0 : runBeforeToday(days.newestFirst),
        // "hoje contou" só existe com a LAMP contando
        todayCounted: days.running && !!today && countsForRun(today.deda),
        best: bestStreak([...days.newestFirst].reverse()),
    };
};
