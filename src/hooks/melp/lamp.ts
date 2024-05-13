import { useQuery, useMutation } from '@tanstack/react-query';
import { ApexOptions } from 'apexcharts';
import {
    GraphConfig,
    InputDataDTO,
    InputDataResponse,
    OverallPerformanceResponse,
    WeeklyPerformanceResponse,
    WeeklyStatisticsResponse,
} from 'interfaces';
import { statisticsColors } from 'libs';
import { useAppContext } from 'providers';
import { useEffect, useState } from 'react';
import { lampService } from 'services';

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
}

export const useSaveDedaInput = () => {
    return useMutation({
        mutationFn: async ({ userUid, week, day, inputData }: SaveDedaInputMutation) => {
            try {
                const { data: currentInputData } = await lampService
                    .get<InputDataResponse>(`/input/v2/${userUid}/${week}/${day}`)
                    .then(({ data }) => data);

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
                        dedaInputData: {
                            dedaFocus: inputData.dedaFocus,
                            dedaSteps: inputData.dedaFocus,
                            dedaPredPlace: inputData.dedaFocus,
                            dedaStateBeing: inputData.dedaFocus,
                            dedaStateMind: inputData.dedaFocus,
                            readingTime: inputData.readingTime,
                            dedaTime: inputData.dedaTime,
                        },
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

                await lampService.patch(`/input/v2/${userUid}/${week}/${day}`, { ...inputDTO });
            } catch (error) {
                throw error;
            }
        },
        onError: (error) => {
            alert(error.message);
        },
    });
};

const graphLabelsStyles = {
    colors: '#FFF',
    fontFamily: 'Europa, sans-serif',
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
                series: [data.byActivity.deda, data.byActivity.active, data.byActivity.passive, data.byActivity.review],
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
                        name: 'General Weekly Development',
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

    const [weeklyPerformanceGraph, setWeeklyPerformance] = useState<GraphConfig>({
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

    const [dailyPerformanceGraph, setDailyPerformance] = useState<GraphConfig>({
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

            setWeeklyPerformance((previousConfig) => ({
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
                const dedaTimeSeries = data.dedaDaily.map((daily) => ({
                    x: daily.weekDay,
                    y: daily.dedaTime,
                }));

                setDailyPerformance((previousConfig) => ({
                    series: [
                        {
                            name: 'DEDA Time',
                            data: dedaTimeSeries,
                        },
                    ],
                    options: {
                        ...previousConfig.options,
                        yaxis: {
                            ...previousConfig.options.yaxis,
                            max: 100,
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
                const readingTimeSeries = data.dedaDaily.map((daily) => ({
                    x: daily.weekDay,
                    y: daily.readingTime,
                }));

                setDailyPerformance((previousConfig) => ({
                    series: [
                        {
                            name: 'Reading Time',
                            data: readingTimeSeries,
                        },
                    ],
                    options: {
                        ...previousConfig.options,
                        yaxis: {
                            ...previousConfig.options.yaxis,
                            max: 6000,
                            labels: {
                                style: graphLabelsStyles,
                                formatter: (value) => {
                                    return `${(value / 600).toFixed(0)} min`;
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
        queryKey: ['input', user?.uid, week, day],
        queryFn: () =>
            lampService.get<InputDataResponse>(`/input/v2/${user?.uid}/${week}/${day}`).then(({ data }) => data.data),
        enabled: !!user?.uid && !!week && !!day,
    });
};

export const useSaveInput = () => {
    const { user } = useAppContext();

    return useMutation({
        mutationFn: ({ week, day, inputDTO }: { week: string; day: string; inputDTO: InputDataDTO }) =>
            lampService.patch(`/input/v2/${user?.uid}/${week}/${day}`, { ...inputDTO }),
    });
};
