import { useQueries } from '@tanstack/react-query';
import { InputDataResponse } from 'interfaces';
import { getDayToday } from 'libs';
import { bestStreak, countsForRun, dedaStreak, LampDay, runBeforeToday } from 'libs/newDesign';
import { useAppContext, useMelpContext } from 'providers';
import { useEffect, useMemo, useState } from 'react';
import { lampService } from 'services';

type Day = InputDataResponse['data'];

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
 * Dias da LAMP (plataforma nova) para a DEDA Run: a MESMA leitura da aba Input (`GET /input/v2/<uid>/<semana>/<dia>`,
 * mesma chave do react-query), um dia por consulta — não há consulta diária do programa inteiro. Carrega `minWeeks`
 * semanas em lotes; enquanto a Run atual chega ao dia mais antigo carregado, puxa mais (até o início do programa).
 * Dias passados ficam guardados na sessão (sessionStorage) e valem 30 min; alteração na aba Input invalida a chave e
 * a leitura volta ao servidor.
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
    const weeks = Math.min(loaded, target, currentWeek);

    const keys = useMemo(() => {
        const out: { week: number; day: number }[] = [];
        for (let w = currentWeek; w >= Math.max(1, currentWeek - weeks + 1); w--)
            for (let d = w === currentWeek ? today : 7; d >= 1; d--) out.push({ week: w, day: d });
        return out; // do mais recente (hoje) para trás
    }, [currentWeek, today, weeks]);

    const stored = useMemo(
        () =>
            keys.map(({ week, day }) =>
                uid && !(week === currentWeek && day === today) ? readStored(storeKey(uid, week, day)) : undefined,
            ),
        [keys, uid, currentWeek, today],
    );
    const results = useQueries({
        queries: keys.map(({ week, day }, i) => {
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

    const loading = results.some((r) => r.isLoading);
    // datas: o dia da LAMP é o dia da semana (segunda = 1); sem pausa no programa, a semana N é N semanas atrás
    const noPause = !melpSummary?.deda_pause_dates?.length;
    const todayDate = new Date();
    todayDate.setHours(12, 0, 0, 0);
    const newestFirst: LampDay[] = keys.map(({ week, day }, i) => {
        const data = results[i]?.data;
        const deda = data?.dedaInput;
        const date = new Date(todayDate);
        date.setDate(todayDate.getDate() - ((currentWeek - week) * 7 + (today - day)));
        return {
            week,
            day,
            date: noPause ? date : undefined,
            deda: Number(deda?.deda_concluded_score) || 0,
            active: Number(data?.activeInput?.concluded_score) || 0,
            passive: Number(data?.passiveInput?.concluded_score) || 0,
            activeMin: ['book', 'deda_notes', 'mooc', 'others', 'review'].reduce(
                (t, k) => t + (Number((data?.activeInput as Record<string, unknown> | undefined)?.[k]) || 0),
                0,
            ),
            passiveMin: [
                'audiobook',
                'conversation',
                'movie_doc',
                'news_shows',
                'others',
                'podcast',
                'series',
                'ted',
                'youtube',
            ].reduce((t, k) => t + (Number((data?.passiveInput as Record<string, unknown> | undefined)?.[k]) || 0), 0),
            ratings: [
                deda?.deda_pred_place,
                deda?.deda_steps,
                deda?.deda_state_mind,
                deda?.deda_state_being,
                deda?.deda_focus,
            ].map((v) => Number(v) || 0),
        };
    });

    const streak = dedaStreak(newestFirst);
    const oldest = keys[keys.length - 1]?.week ?? 1;
    // próximo lote quando o anterior terminou
    useEffect(() => {
        if (!loading && loaded < Math.min(target, currentWeek)) setLoaded((l) => l + BATCH);
    }, [loading, loaded, target, currentWeek]);
    // a Run atual chegou ao dia mais antigo: precisa de mais histórico
    useEffect(() => {
        if (!loading && streak.toEdge && oldest > 1 && weeks >= target) setTarget((t) => t + 2 * BATCH);
    }, [loading, streak.toEdge, oldest, weeks, target]);

    return {
        newestFirst,
        loading: loading || weeks < Math.min(target, currentWeek),
        streak,
        weeksLoaded: weeks,
        currentWeek,
        today,
        requests: keys.length,
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
