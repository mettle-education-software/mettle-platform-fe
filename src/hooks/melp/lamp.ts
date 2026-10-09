import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    GoalLevels,
    GoalTableDataResponse,
    GraphConfig,
    InputDataDTO,
    InputDataResponse,
    OverallPerformanceResponse,
    OverallStatsReportResponse,
    WeeklyPerformanceResponse,
    WeeklyStatisticsResponse,
} from 'interfaces';
import { DedaDifficulty } from 'interfaces/melp';
import { statisticsColors } from 'libs';
import { isCalendarClock, lampSaveError, lampSaveProblem, lampToday, todaysDedaId } from 'libs/dedaClock';
import { useAppContext, useMelpContext } from 'providers';
import { useEffect, useState } from 'react';
import { lampService } from 'services';
import { font } from 'themes';

export interface SaveDedaInputMutationDedaData {
    dedaFocus: number;
    dedaSteps: number;
    dedaPredPlace: number;
    dedaStateBeing: number;
    dedaStateMind: number;
    readingTime: number;
    dedaTime: number;
}

interface SaveDedaInputMutation {
    userUid: string;
    week: string;
    day: string;
    inputData: SaveDedaInputMutationDedaData;
    /**
     * Relógio novo (§4.2): `rowId` da linha do dia lida quando o estudo abriu. Com ele, salvamento parcial — só o
     * bloco do DEDA e a identidade da linha, sem GET no salvar e sem reenviar ativo/passivo/revisão.
     */
    expectedRowId?: string;
}

export const useSaveDedaInput = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ userUid, week, day, inputData, expectedRowId }: SaveDedaInputMutation) => {
            const dedaInputData = {
                dedaFocus: inputData.dedaFocus,
                dedaSteps: inputData.dedaSteps,
                dedaPredPlace: inputData.dedaPredPlace,
                dedaStateBeing: inputData.dedaStateBeing,
                dedaStateMind: inputData.dedaStateMind,
                readingTime: inputData.readingTime,
                dedaTime: inputData.dedaTime,
            };
            const path = `/input/v2/${userUid}/${week}/${day}`;
            if (expectedRowId) return lampService.patch(path, { inputData: { dedaInputData }, expectedRowId });

            // legado: o servidor regrava os três blocos a cada PATCH, então reenvia os valores atuais do dia
            const { data: currentInputData } = await lampService.get<InputDataResponse>(path).then(({ data }) => data);

            const inputDTO: InputDataDTO = {
                inputData: {
                    activeInputData: {
                        book: currentInputData.activeInput.book,
                        dedaNotes: currentInputData.activeInput.deda_notes,
                        mooc: currentInputData.activeInput.mooc,
                        others: currentInputData.activeInput.others,
                        review: currentInputData.activeInput.review,
                    },
                    passiveInputData: {
                        audiobook: currentInputData.passiveInput.audiobook,
                        conversation: currentInputData.passiveInput.conversation,
                        movieDoc: currentInputData.passiveInput.movie_doc,
                        newsShows: currentInputData.passiveInput.news_shows,
                        others: currentInputData.passiveInput.others,
                        podcast: currentInputData.passiveInput.podcast,
                        series: currentInputData.passiveInput.series,
                        ted: currentInputData.passiveInput.ted,
                        youtube: currentInputData.passiveInput.youtube,
                    },
                    dedaInputData,
                },
            };

            if (currentInputData.reviewInput) {
                inputDTO.inputData.reviewInputData = {
                    review1: {
                        status: currentInputData.reviewInput.review1.status,
                    },
                };

                if (currentInputData.reviewInput.review2) {
                    inputDTO.inputData.reviewInputData.review2 = {
                        status: currentInputData.reviewInput.review2.status,
                    };
                }

                if (currentInputData.reviewInput.review3) {
                    inputDTO.inputData.reviewInputData.review3 = {
                        status: currentInputData.reviewInput.review3.status,
                    };
                }
            }

            return lampService.patch(path, { ...inputDTO });
        },
        // a conclusão aparece no app inteiro sem recarregar a página: "feito hoje", o dia na LAMP e a DEDA Run
        onSuccess: (_data, { userUid, week, day }) =>
            Promise.all([
                queryClient.invalidateQueries({ queryKey: ['get-deda-status'] }),
                queryClient.invalidateQueries({ queryKey: ['get-input-data', userUid, week, day] }),
                queryClient.invalidateQueries({ queryKey: ['lamp-days', userUid] }),
            ]),
    });
};

/**
 * Conclusão do DEDA de hoje (leitor novo e DedaSteps). Só o DEDA de hoje e só com a LAMP contando: em pausa, fim, espera
 * da segunda e semana zero os passos ficam abertos e nada vai para a LAMP (QA PF-20/PF-32). Semana e dia vêm do resumo
 * (lampToday), nunca da posição do DEDA na lista (PF-09: na 2ª volta do círculo a posição aponta a semana 1).
 * Relógio novo: lê a linha do dia ao abrir o estudo e salva só o DEDA com o `rowId` dela (§4.2).
 */
export const useDedaCompletion = (dedaId: string) => {
    const { user } = useAppContext();
    const { melpSummary, isTodaysDedaCompleted } = useMelpContext();
    const isTodaysDeda = todaysDedaId(melpSummary) === dedaId;
    const lampDay = isTodaysDeda ? lampToday(melpSummary) : null;
    const completable = !!lampDay && !isTodaysDedaCompleted;
    const calendar = isCalendarClock(melpSummary);
    const week = lampDay ? `week${lampDay.week}` : '';
    const day = lampDay ? `day${lampDay.day}` : '';
    const row = useGetInputData(calendar && completable ? week : '', day);
    const rowId = row.data?.dedaInput?.rowId;
    const save = useSaveDedaInput();

    const complete = (inputData: SaveDedaInputMutationDedaData, onDone: () => void) => {
        if (!lampDay || !user?.uid || save.isPending) return;
        if (calendar && !rowId) return void row.refetch();
        save.mutate(
            { userUid: user.uid, week, day, inputData, expectedRowId: calendar ? rowId : undefined },
            {
                onSuccess: onDone,
                // a linha do dia foi trocada (pausa e volta na mesma segunda): relê para o próximo "Try again"
                onError: (error) => void (lampSaveError(error) === 'LAMP_DAY_REPLACED' && row.refetch()),
            },
        );
    };

    const failure = save.isError ? save.error : calendar && completable && row.isError ? row.error : undefined;
    return {
        isTodaysDeda,
        lampDay,
        /** pode concluir hoje (o passo Summary aparece) */
        completable,
        /** relógio novo: a linha do dia já foi lida (sem ela não há como salvar) */
        ready: !calendar || (!!rowId && !row.isFetching),
        saving: save.isPending,
        problem: failure ? lampSaveProblem(failure) : undefined,
        complete,
    };
};

const graphLabelsStyles = {
    colors: '#FFF',
    fontFamily: font.style.fontFamily,
    fontWeight: 700,
};

export const useOverallProgress = (userUid?: string) => {
    const [overallGraph, setOverallGraph] = useState<GraphConfig>({
        series: [],
        options: {
            colors: [statisticsColors.DEDA, statisticsColors.Active, statisticsColors.Passive, statisticsColors.Review],
            chart: {
                type: 'radialBar',
            },
            stroke: {
                lineCap: 'round',
            },
            plotOptions: {
                radialBar: {
                    hollow: {
                        size: '35%',
                    },
                    track: {
                        background: ['#582133', '#365421', '#205550', '#F7C0341A'],
                    },
                    dataLabels: {
                        name: {
                            show: false,
                        },
                        value: {
                            show: false,
                        },
                    },
                },
            },
            labels: ['DEDA', 'ACTIVE', 'PASSIVE', 'REVIEW'],
        },
    });

    const { data, isLoading } = useQuery({
        queryKey: ['get-overall-progress', userUid],
        queryFn: () =>
            lampService.get<OverallPerformanceResponse>(`/performance/${userUid}/general`).then(({ data }) => data),
        enabled: !!userUid,
    });

    useEffect(() => {
        if (data) {
            setOverallGraph((previousConfig) => ({
                ...previousConfig,
                series: [
                    data.byActivity.deda,
                    data.byActivity.active,
                    data.byActivity.passive,
                    ...(data.byActivity.review ? [data.byActivity.review] : []),
                ],
            }));
        }
    }, [data]);

    return {
        overallGraph,
        overallData: data,
        isLoading,
    };
};

export const useGeneralWeeklyDevelopment = (userUid?: string) => {
    const [weeklyDevelopment, setWeeklyDevelopment] = useState<GraphConfig>({
        series: [],
        options: {
            colors: ['#ABF2B7'],
            grid: {
                borderColor: '#F2F0EE0D',
                xaxis: {
                    lines: {
                        show: true,
                    },
                },
            },
            chart: {
                zoom: {
                    enabled: false,
                },
                selection: {
                    enabled: false,
                },
                type: 'area',
                toolbar: {
                    show: false,
                },
            },
            dataLabels: {
                enabled: false,
            },
            stroke: {
                curve: 'smooth',
            },
            xaxis: {
                labels: {
                    style: graphLabelsStyles,
                },
            },
            yaxis: {
                labels: {
                    style: graphLabelsStyles,
                    formatter: (value) => {
                        return `${value.toFixed(0)}%`;
                    },
                },
                min: 0,
                max: 100,
            },
        },
    });

    const { data, isLoading } = useQuery({
        queryKey: ['get-general-weekly-development', userUid],
        queryFn: () =>
            lampService
                .get<WeeklyPerformanceResponse>(`/performance/${userUid}/general/weekly`)
                .then(({ data }) => data.data),
        enabled: !!userUid,
    });

    useEffect(() => {
        if (data) {
            setWeeklyDevelopment((previousConfig) => ({
                ...previousConfig,
                series: [
                    {
                        name: 'Weekly Progress',
                        data: data[1],
                    },
                ],
                options: {
                    ...previousConfig.options,
                    xaxis: {
                        ...previousConfig.options.xaxis,
                        categories: data[0],
                    },
                },
            }));
        }
    }, [data]);

    return {
        weeklyDevelopment,
        weeklyDevelopmentData: data,
        isLoading,
    };
};

export const useGetWeeklyPerformance = (dailyView: 'dedaTime' | 'readingTime', week?: string) => {
    const { user } = useAppContext();

    const [weeklyPerformanceGraph, setWeeklyPerformanceGraph] = useState<GraphConfig>({
        series: [],
        options: {
            grid: {
                borderColor: '#F2F0EE0D',
                xaxis: {
                    lines: {
                        show: true,
                    },
                },
            },
            colors: [statisticsColors.DEDA, statisticsColors.Active, statisticsColors.Passive, statisticsColors.Review],
            chart: {
                toolbar: {
                    show: false,
                },
                type: 'bar',
            },
            plotOptions: {
                bar: {
                    columnWidth: '45%',
                    borderRadius: 5,
                    borderRadiusApplication: 'end',
                    distributed: true,
                },
            },
            dataLabels: {
                enabled: false,
            },
            legend: {
                show: false,
            },
            xaxis: {
                labels: {
                    style: graphLabelsStyles,
                },
            },
            yaxis: {
                labels: {
                    style: graphLabelsStyles,
                    formatter: (value) => {
                        return `${value.toFixed(0)}%`;
                    },
                },
                min: 0,
                max: 100,
            },
        },
    });

    const [dailyPerformanceGraph, setDailyPerformanceGraph] = useState<GraphConfig>({
        series: [],
        options: {
            grid: {
                borderColor: '#F2F0EE0D',
                xaxis: {
                    lines: {
                        show: true,
                    },
                },
            },
            colors: ['var(--secondary)'],
            chart: {
                type: 'bar',
                toolbar: {
                    show: false,
                },
            },
            dataLabels: {
                enabled: false,
            },
            legend: {
                show: false,
            },
            plotOptions: {
                bar: {
                    columnWidth: '65%',
                    borderRadius: 5,
                    borderRadiusApplication: 'end',
                    distributed: true,
                },
            },
            xaxis: {
                type: 'category',
                labels: {
                    style: graphLabelsStyles,
                },
            },
            yaxis: {
                labels: {
                    style: graphLabelsStyles,
                    formatter: (value) => {
                        return `${value.toFixed(0)} min`;
                    },
                },
                min: 0,
            },
        },
    });

    const { data, isLoading } = useQuery({
        queryKey: ['get-weekly-performance', user?.uid, week],
        queryFn: () =>
            lampService
                .get<WeeklyStatisticsResponse>(`/performance/${user?.uid}/weekly/${week}`)
                .then(({ data }) => data.data),
        enabled: !!user?.uid && !!week,
    });

    useEffect(() => {
        if (data && user?.uid) {
            const weeklySeries = [
                {
                    x: 'DEDA',
                    y: data.dedaAverage,
                },
                {
                    x: 'ACTIVE',
                    y: data.activeAverage,
                },
                {
                    x: 'PASSIVE',
                    y: data.passiveAverage,
                },
            ];

            if (data.reviewAverages) {
                weeklySeries.push({
                    x: 'REVIEW',
                    y: data.reviewAverages,
                });
            }

            setWeeklyPerformanceGraph((previousConfig) => ({
                series: [
                    {
                        name: 'Weekly Performance',
                        data: weeklySeries,
                    },
                ],
                options: {
                    ...previousConfig.options,
                },
            }));

            if (dailyView === 'dedaTime') {
                const responseDedaTimeSeries = data.dedaDaily.map((daily) => ({
                    x: daily.weekDay,
                    y: daily.dedaTime,
                }));

                const dedaTimeSeries = [
                    {
                        x: 'D01',
                        y: 0,
                    },
                    {
                        x: 'D02',
                        y: 0,
                    },
                    {
                        x: 'D03',
                        y: 0,
                    },
                    {
                        x: 'D04',
                        y: 0,
                    },
                    {
                        x: 'D05',
                        y: 0,
                    },
                    {
                        x: 'D06',
                        y: 0,
                    },
                    {
                        x: 'D07',
                        y: 0,
                    },
                ];

                responseDedaTimeSeries.forEach((daily, index) => {
                    dedaTimeSeries[index] = daily;
                });

                const maximumDedaTimeValue = Math.max(...data.dedaDaily.map((daily) => daily.dedaTime));
                const DEFAULT_DEDA_TIME_MAX = 60;

                setDailyPerformanceGraph((previousConfig) => ({
                    series: [
                        {
                            name: 'DEDA Time (HH:MM)',
                            data: dedaTimeSeries,
                        },
                    ],
                    options: {
                        ...previousConfig.options,
                        yaxis: {
                            ...previousConfig.options.yaxis,
                            max:
                                maximumDedaTimeValue > DEFAULT_DEDA_TIME_MAX
                                    ? maximumDedaTimeValue + 10
                                    : DEFAULT_DEDA_TIME_MAX,
                            labels: {
                                style: graphLabelsStyles,
                                formatter: (value) => {
                                    return `${value.toFixed(0)} min`;
                                },
                            },
                        },
                    },
                }));
            }

            if (dailyView === 'readingTime') {
                const responseReadingTimeSeries = data.dedaDaily.map((daily) => ({
                    x: daily.weekDay,
                    y: daily.readingTime / 60,
                }));

                const readingTimeSeries = [
                    {
                        x: 'D01',
                        y: 0,
                    },
                    {
                        x: 'D02',
                        y: 0,
                    },
                    {
                        x: 'D03',
                        y: 0,
                    },
                    {
                        x: 'D04',
                        y: 0,
                    },
                    {
                        x: 'D05',
                        y: 0,
                    },
                    {
                        x: 'D06',
                        y: 0,
                    },
                    {
                        x: 'D07',
                        y: 0,
                    },
                ];

                responseReadingTimeSeries.forEach((daily, index) => {
                    readingTimeSeries[index] = daily;
                });

                const maxReadingTime = Math.max(...data.dedaDaily.map((daily) => daily.readingTime / 60));
                const DEFAULT_READING_TIME_MAX = 10;

                setDailyPerformanceGraph((previousConfig) => ({
                    series: [
                        {
                            name: 'Reading Time (MM:SS)',
                            data: readingTimeSeries,
                        },
                    ],
                    options: {
                        ...previousConfig.options,
                        yaxis: {
                            ...previousConfig.options.yaxis,
                            max:
                                maxReadingTime > DEFAULT_READING_TIME_MAX
                                    ? maxReadingTime + 10
                                    : DEFAULT_READING_TIME_MAX,
                            labels: {
                                style: graphLabelsStyles,
                                formatter: (value) => {
                                    return `${value.toFixed(0)} min`;
                                },
                            },
                        },
                    },
                }));
            }
        }
    }, [data, user?.uid, dailyView]);

    return {
        weeklyPerformanceGraph,
        dailyPerformanceGraph,
        graphsData: data,
        isLoading,
    };
};

export const useGetInputData = (week: string, day: string) => {
    const { user } = useAppContext();

    return useQuery({
        queryKey: ['get-input-data', user?.uid, week, day],
        queryFn: () =>
            lampService.get<InputDataResponse>(`/input/v2/${user?.uid}/${week}/${day}`).then(({ data }) => data.data),
        enabled: !!user?.uid && !!week && !!day,
    });
};

export const useSaveInput = () => {
    const { user } = useAppContext();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ week, day, inputDTO }: { week: string; day: string; inputDTO: InputDataDTO }) =>
            lampService.patch(`/input/v2/${user?.uid}/${week}/${day}`, { ...inputDTO }),
        onSuccess: async (data, variables) => {
            await queryClient.invalidateQueries({
                queryKey: ['get-input-data', user?.uid, variables.week, variables.day],
            });
            await queryClient.invalidateQueries({
                queryKey: ['get-weekly-performance'],
            });
            await queryClient.invalidateQueries({
                queryKey: ['get-general-weekly-development'],
            });
            await queryClient.invalidateQueries({
                queryKey: ['get-overall-progress'],
            });
        },
    });
};

export const useGetGoalByLevel = (level?: DedaDifficulty) => {
    return useQuery({
        queryKey: ['get-goal-by-level', level],
        queryFn: () =>
            lampService
                .get<GoalTableDataResponse>(`/goals/${level?.toLowerCase()}`)
                .then(({ data }) => data[level?.toLowerCase() as GoalLevels].data),
        enabled: !!level,
    });
};

export const useGoalGraphOptions = (level?: DedaDifficulty) => {
    const [goalGraph, setGoalGraph] = useState<GraphConfig>({
        options: {
            stroke: {
                width: 2,
            },
            colors: [
                '#B79060',
                statisticsColors.DEDA,
                statisticsColors.Active,
                statisticsColors.Passive,
                statisticsColors.Review,
            ],
            grid: {
                borderColor: '#F2F0EE0D',
                xaxis: {
                    lines: {
                        show: true,
                    },
                },
            },
            chart: {
                toolbar: {
                    show: false,
                },
                type: 'line',
                zoom: {
                    enabled: false,
                },
            },
            legend: {
                position: 'top',
                labels: {
                    colors: ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF'],
                },
                fontSize: '14px',
            },
            xaxis: {
                stepSize: 10,
                labels: {
                    style: graphLabelsStyles,
                    formatter: (value) => {
                        return ['W10', 'W20', 'W30', 'W40', 'W50'].includes(value) ? value : '';
                    },
                },
            },
            yaxis: {
                labels: {
                    style: graphLabelsStyles,
                    formatter: (value) => {
                        const hours = Math.floor(value / 60);
                        return `${hours} hour${hours > 1 ? 's' : ''}`;
                    },
                },
                stepSize: 60,
                min: 0,
                max: 360,
            },
        },
        series: [],
    });

    const { data, isLoading: isGraphLoading } = useGetGoalByLevel(level);

    useEffect(() => {
        if (data) {
            const parseMinutes = (time: string) => {
                const [hours, minutes] = time.split(':');
                const totalMinutes = parseInt(hours) * 60 + parseInt(minutes);
                return totalMinutes;
            };

            const totalSeries = data.slice(0, 41).map(({ total }) => parseMinutes(total));
            const dedaSeries = data.slice(0, 41).map(({ deda }) => parseMinutes(deda));
            const activeSeries = data.slice(0, 41).map(({ active }) => parseMinutes(active));
            const passiveSeries = data.slice(0, 41).map(({ passive }) => parseMinutes(passive));
            const reviewSeries = data.slice(0, 41).map(({ review }) => parseMinutes(review));

            const categories = data.slice(0, 41).map(({ week }) => `W${week}`);

            setGoalGraph((previousConfig) => ({
                options: {
                    ...previousConfig.options,
                    xaxis: {
                        ...previousConfig.options.xaxis,
                        categories,
                    },
                },
                series: [
                    {
                        name: 'TOTAL',
                        data: totalSeries,
                    },
                    {
                        name: 'DEDA',
                        data: dedaSeries,
                    },
                    {
                        name: 'ACTIVE',
                        data: activeSeries,
                    },
                    {
                        name: 'PASSIVE',
                        data: passiveSeries,
                    },
                    {
                        name: 'REVIEW',
                        data: reviewSeries,
                    },
                ],
            }));
        }
    }, [data]);

    return {
        isGraphLoading,
        goalGraph,
    };
};

export const useGetOverallStatsReport = (sortBy?: 'ASC' | 'DESC') => {
    const { user } = useAppContext();

    return useQuery({
        enabled: !!user?.uid,
        queryKey: ['get-overall-stats-report', user?.uid, sortBy],
        queryFn: () =>
            lampService
                .get<OverallStatsReportResponse>(
                    `/performance/${user?.uid}/report`,
                    sortBy ? { params: { sort: sortBy } } : undefined,
                )
                .then(({ data }) => data.data),
    });
};
