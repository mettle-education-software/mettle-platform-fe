import { useMutation, useQuery } from '@tanstack/react-query';
import { CurrentDedaResponse, DedaActivityStatusResponse, FireUser } from 'interfaces';
import { MelpSummaryResponse } from 'interfaces/melp';
import { lampToday } from 'libs/dedaClock';
import { useAppContext } from 'providers';
import { melpService } from 'services';

/**
 * DEDA de hoje já concluído? Só existe com a LAMP contando (libs/dedaClock.lampToday): em pausa, fim ou espera não há
 * dia de hoje na LAMP (antes lia o dia de uma semana congelada). Semana e dia vêm dos contadores do resumo.
 */
export const useCurrentDayDedaActivityStatus = (melpSummary?: MelpSummaryResponse['data'], user?: FireUser) => {
    const lampDay = lampToday(melpSummary);
    const currentWeek = `week${lampDay?.week}`;
    const currentDay = `day${lampDay?.day}`;

    return useQuery({
        queryKey: ['get-deda-status', user?.uid, currentWeek, currentDay],
        queryFn: () =>
            melpService
                .get<DedaActivityStatusResponse>(`/deda/status/${user?.uid}/${currentWeek}/${currentDay}`)
                .then(({ data }) => data),
        enabled: !!user && !!lampDay,
    });
};

export const useGetDedaRecording = (week: string, weekDay: string) => {
    const { user } = useAppContext();

    return useQuery({
        queryKey: ['get-deda-recording', week, weekDay, user?.uid],
        queryFn: () =>
            melpService
                .get<string>(`/deda/recording/${user?.uid}/${week}/${weekDay}`, {
                    responseType: 'arraybuffer',
                })
                .then(({ data }) => {
                    const blob = new Blob([data], { type: 'audio/wave' });
                    const url = URL.createObjectURL(blob);
                    return url;
                }),
    });
};

export const useSubmitDedaRecordingAudio = () => {
    return useMutation({
        mutationFn: ({
            userUid,
            week,
            weekDay,
            formData,
        }: {
            userUid: string;
            week: string;
            weekDay: string;
            formData: FormData;
        }) =>
            melpService.post(`/deda/recording/${userUid}/${week}/${weekDay}`, {
                data: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }),
    });
};

export const useGetCurrentDeda = () => {
    return useQuery({
        queryKey: ['get-current-deda'],
        queryFn: () => melpService.get<CurrentDedaResponse>('/deda/current').then(({ data }) => data),
    });
};
