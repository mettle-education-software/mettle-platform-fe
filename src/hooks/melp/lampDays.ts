import { useQueries, useQuery } from '@tanstack/react-query';
import { InputDataResponse } from 'interfaces';
import { getDayToday } from 'libs';
import { bestStreak, countsForRun, dedaStreak, LampDay, runBeforeToday } from 'libs/newDesign';
import { useAppContext, useMelpContext } from 'providers';
import { useEffect, useMemo, useState } from 'react';
import { lampService } from 'services';

type Day = InputDataResponse['data'];

/** Uma linha de `GET /performance/<uid>/weekly/days`: o programa inteiro numa leitura, dias vazios omitidos. */
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
const fromInput = (data: Day | undefined): Omit<ProgramDay, 'week' | 'day'> => {
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

/** Semanas pedidas por vez: o histórico chega em lotes de 4 semanas (28 consultas), um lote depois do outro. */
const BATCH = 4;

/**
 * Dias da LAMP (plataforma nova) para a DEDA Run, Best e o mapa/calendário.
 * - Histórico (semanas anteriores): uma leitura do programa inteiro, `GET /performance/<uid>/weekly/days`
 *   (react-query `['lamp-days', uid]`).
 * - Semana atual: a MESMA leitura da aba Input (`GET /input/v2/<uid>/<semana>/<dia>`, mesma chave), para que uma
 *   gravação no Input apareça na hora.
 * - Se a leitura do programa falhar: volta ao modo antigo, um dia por consulta, `minWeeks` semanas em lotes; enquanto a
 *   Run atual chega ao dia mais antigo carregado, puxa mais. Dias passados ficam na sessão (sessionStorage) por 30 min.
 */
export const useLampDays = (minWeeks: number) => {
    const { user } = useAppContext();
    const { melpSummary } = useMelpContext();
    const uid = user?.uid;
    const currentWeek = melpSummary?.current_deda_week ?? 0;
    const today = Number(getDayToday().replace('day', ''));
    const [target, setTarget] = useState(minWeeks);
    useEffect(() => setTarget((t) => Math.max(t, minWeeks)), [minWeeks]);
    const [loaded, setLoaded] = useState(Math.min(BATCH, minWeeks));
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
    const perDay = program.isError; // reserva: o modo antigo, um dia por consulta
    const weeks = perDay ? Math.min(loaded, target, currentWeek) : currentWeek;

    const keys = useMemo(() => {
        const out: { week: number; day: number }[] = [];
        for (let w = currentWeek; w >= Math.max(1, currentWeek - weeks + 1); w--)
            for (let d = w === currentWeek ? today : 7; d >= 1; d--) out.push({ week: w, day: d });
        return out; // do mais recente (hoje) para trás
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
            const isToday = week === currentWeek && day === today;
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
    // datas: o dia da LAMP é o dia da semana (segunda = 1); sem pausa no programa, a semana N é N semanas atrás
    const noPause = !melpSummary?.deda_pause_dates?.length;
    const todayDate = new Date();
    todayDate.setHours(12, 0, 0, 0);
    const newestFirst: LampDay[] = keys.map(({ week, day }, i) => {
        const date = new Date(todayDate);
        date.setDate(todayDate.getDate() - ((currentWeek - week) * 7 + (today - day)));
        const fetched = perDay || week === currentWeek;
        const values = fetched
            ? fromInput(results[i]?.data) // a semana atual abre `keys`: mesmos índices
            : (program.data?.get(`${week}:${day}`) ?? EMPTY);
        return { ...values, week, day, date: noPause ? date : undefined };
    });

    const streak = dedaStreak(newestFirst);
    const oldest = keys[keys.length - 1]?.week ?? 1;
    // próximo lote quando o anterior terminou
    useEffect(() => {
        if (perDay && !loading && loaded < Math.min(target, currentWeek)) setLoaded((l) => l + BATCH);
    }, [perDay, loading, loaded, target, currentWeek]);
    // a Run atual chegou ao dia mais antigo: precisa de mais histórico
    useEffect(() => {
        if (perDay && !loading && streak.toEdge && oldest > 1 && weeks >= target) setTarget((t) => t + 2 * BATCH);
    }, [perDay, loading, streak.toEdge, oldest, weeks, target]);

    return {
        newestFirst,
        loading: loading || weeks < Math.min(target, currentWeek),
        streak,
        weeksLoaded: weeks,
        currentWeek,
        today,
        requests: fetchKeys.length + (perDay ? 0 : 1),
        more: (n: number) => setTarget((t) => Math.min(currentWeek, Math.max(t, weeks) + n)),
    };
};

/**
 * DEDA Run (o KPI principal do programa): dias seguidos com o DEDA a 80% ou mais. `beforeToday` = a Run até ontem;
 * `todayCounted` = hoje já contou. `best` vale para as semanas carregadas (`weeksLoaded`).
 */
export const useDedaRun = (minWeeks = 2) => {
    const days = useLampDays(minWeeks);
    const today = days.newestFirst[0];
    return {
        ...days,
        current: days.streak.current,
        beforeToday: runBeforeToday(days.newestFirst),
        todayCounted: !!today && countsForRun(today.deda),
        best: bestStreak([...days.newestFirst].reverse()),
    };
};
