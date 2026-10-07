import { useQueries } from '@tanstack/react-query';
import { InputDataResponse } from 'interfaces';
import { getDayToday } from 'libs';
import { dedaStreak, LampDay } from 'libs/newDesign';
import { useAppContext, useMelpContext } from 'providers';
import { useEffect, useMemo, useState } from 'react';
import { lampService } from 'services';

/**
 * Dias recentes da LAMP (plataforma nova): a MESMA leitura da aba Input (`GET /input/v2/<uid>/<semana>/<dia>`, mesma
 * chave do react-query), um dia por consulta — não há consulta diária do programa inteiro. Começa com `minWeeks`
 * semanas e, enquanto a sequência de DEDA chega ao dia mais antigo carregado, puxa mais 4 (até o início do programa).
 * Guardado por 5 min e dividido com a aba Input.
 */
export const useLampDays = (minWeeks: number) => {
    const { user } = useAppContext();
    const { melpSummary } = useMelpContext();
    const currentWeek = melpSummary?.current_deda_week ?? 0;
    const today = Number(getDayToday().replace('day', ''));
    const [weeks, setWeeks] = useState(minWeeks);
    useEffect(() => setWeeks((w) => Math.max(w, minWeeks)), [minWeeks]);

    const keys = useMemo(() => {
        const out: { week: number; day: number }[] = [];
        for (let w = currentWeek; w >= Math.max(1, currentWeek - weeks + 1); w--)
            for (let d = w === currentWeek ? today : 7; d >= 1; d--) out.push({ week: w, day: d });
        return out; // do mais recente (hoje) para trás
    }, [currentWeek, today, weeks]);

    const results = useQueries({
        queries: keys.map(({ week, day }) => ({
            queryKey: ['get-input-data', user?.uid, `week${week}`, `day${day}`],
            queryFn: () =>
                lampService
                    .get<InputDataResponse>(`/input/v2/${user?.uid}/week${week}/day${day}`)
                    .then(({ data }) => data.data),
            enabled: !!user?.uid && currentWeek > 0,
            staleTime: 5 * 60_000,
            retry: 1,
        })),
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
            ratings: [
                deda?.deda_pred_place,
                deda?.deda_steps,
                deda?.deda_state_mind,
                deda?.deda_state_being,
                deda?.deda_focus,
            ].map((v) => Number(v) || 0),
        };
    });

    // sequência no limite do que foi carregado: puxa mais 4 semanas
    const streak = dedaStreak(newestFirst);
    const oldest = keys[keys.length - 1]?.week ?? 1;
    useEffect(() => {
        if (!loading && streak.toEdge && oldest > 1) setWeeks((w) => w + 4);
    }, [loading, streak.toEdge, oldest]);

    return { newestFirst, loading, streak, weeksLoaded: Math.min(weeks, currentWeek), currentWeek, today };
};
