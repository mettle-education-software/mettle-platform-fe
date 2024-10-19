import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MettleRoles } from 'interfaces';
import { MelpSummaryResponse } from 'interfaces/melp';
import { useAppContext, useMelpContext, useNotificationsContext } from 'providers';
import { useEffect, useState } from 'react';
import { melpService } from 'services';

export const useMelpSummary = (userUid?: string) => {
    const { user } = useAppContext();

    return useQuery({
        queryKey: ['melp-summary', userUid],
        queryFn: () =>
            melpService.get<MelpSummaryResponse>(`/v2/${userUid as string}/summary`).then(({ data }) => data.data),
        enabled:
            !!userUid &&
            [MettleRoles.METTLE_STUDENT, MettleRoles.METTLE_ADMIN].some((role) => user?.roles?.includes(role)),
    });
};

export const useStartDeda = () => {
    const queryClient = useQueryClient();

    const { user } = useAppContext();

    return useMutation({
        mutationFn: () => melpService.put(`/deda/${user?.uid}/start`),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ['melp-summary'],
            });
        },
    });
};

export const usePauseDeda = () => {
    const queryClient = useQueryClient();
    const { user } = useAppContext();

    return useMutation({
        mutationFn: () => melpService.put(`/deda/${user?.uid as string}/pause`),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ['melp-summary'],
            });
        },
    });
};

export const useResumeDeda = () => {
    const queryClient = useQueryClient();
    const { user } = useAppContext();

    return useMutation({
        mutationFn: () => melpService.put(`/deda/${user?.uid as string}/resume`),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ['melp-summary'],
            });
        },
    });
};

export const useResetMelp = () => {
    const queryClient = useQueryClient();
    const { user } = useAppContext();
    const { showNotification } = useNotificationsContext();

    return useMutation({
        mutationFn: () => melpService.put(`/${user?.uid as string}/reset`),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ['melp-summary'],
            });
            showNotification('success', 'A fresh start', 'Você reiniciou o programa IMERSO');
        },
    });
};

export const useGetDedasList = () => {
    const [dedasList, setDedasList] = useState<{ value: string; label: string }[]>([]);

    const { melpSummary } = useMelpContext();

    const { data: dedasListData, isLoading } = useQuery({
        queryKey: ['get-dedas-list'],
        queryFn: () => melpService.get<Record<string, string>>('/deda/list').then(({ data }) => data),
        enabled: !!melpSummary,
    });

    useEffect(() => {
        if (dedasListData && melpSummary) {
            const dedasListContent = melpSummary.unlocked_dedas.slice(1).map((dedaId, index) => {
                return {
                    value: `week${index + 1}`,
                    label: `W${index + 1} | ${dedasListData[dedaId]}`,
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
