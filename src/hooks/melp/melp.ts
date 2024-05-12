import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MelpSummaryResponse } from 'interfaces/melp';
import { useMelpContext } from 'providers/MelpProvider';
import { useEffect, useState } from 'react';
import { melpService } from 'services';

export const useMelpSummary = (userUid?: string) => {
    return useQuery({
        queryKey: ['melp-summary', userUid],
        queryFn: () =>
            melpService.get<MelpSummaryResponse>(`/v2/${userUid as string}/summary`).then(({ data }) => data.data),
        enabled: !!userUid,
    });
};

export const useStartDeda = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userUid: string) => melpService.put(`/deda/${userUid}/start`),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ['melp-summary'],
            });
        },
    });
};

export const usePauseDeda = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userUid: string) => melpService.put(`/deda/${userUid}/pause`),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ['melp-summary'],
            });
        },
    });
};

export const useResumeDeda = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userUid: string) => melpService.put(`/deda/${userUid}/resume`),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ['melp-summary'],
            });
        },
    });
};

export const useResetMelp = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userUid: string) => melpService.put(`/${userUid}/reset`),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ['melp-summary'],
            });
        },
    });
};

export const useGetDedasList = () => {
    const [dedasList, setDedasList] = useState<{ id: string; title: string }[]>([]);

    const { melpSummary } = useMelpContext();

    const { data: dedasListData, isLoading } = useQuery({
        queryKey: ['get-dedas-list'],
        queryFn: () => melpService.get<Record<string, string>>('/deda/list').then(({ data }) => data),
        enabled: !!melpSummary,
    });

    useEffect(() => {
        if (dedasListData && melpSummary) {
            const dedasListContent = melpSummary.unlocked_dedas.map((dedaId) => {
                return {
                    id: dedaId,
                    title: dedasListData[dedaId],
                };
            });

            setDedasList(dedasListContent);
        }
    }, [dedasListData, melpSummary]);

    return {
        dedasList,
        isLoading,
    };
};
