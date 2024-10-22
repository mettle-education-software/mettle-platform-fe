import { useMutation, useQuery } from '@tanstack/react-query';
import { CurrentDedaResponse, DedaActivityStatusResponse, FireUser } from 'interfaces';
import { MelpSummaryResponse } from 'interfaces/melp';
import { getDayToday } from 'libs';
import { useAppContext } from 'providers';
import { melpService } from 'services';

export const useCurrentDayDedaActivityStatus = (melpSummary?: MelpSummaryResponse['data'], user?: FireUser) => {
    const currentWeek = `week${melpSummary?.current_deda_week}`;
    const currentDay = getDayToday();

    return useQuery({
        queryKey: ['get-deda-status', currentWeek, currentDay],
        queryFn: () =>
            melpService
                .get<DedaActivityStatusResponse>(`/deda/status/${user?.uid}/${currentWeek}/${currentDay}`)
                .then(({ data }) => data),
        enabled: !!melpSummary && !!user && melpSummary?.current_deda_week > 0,
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
