import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MettleRoles } from 'interfaces';
import { DedaDifficulty, MelpSummaryResponse } from 'interfaces/melp';
import { lampWeekOptions } from 'libs/dedaClock';
import { IMERSO_PRODUCT } from 'libs/productAccess';
import { useAppContext, useMelpContext, useNotificationsContext, useProductAccess } from 'providers';
import { useMemo } from 'react';
import { melpService } from 'services';

export const useMelpSummary = (userUid?: string) => {
    const { user } = useAppContext();
    const { access } = useProductAccess();

    return useQuery({
        queryKey: ['imerso-summary', userUid],
        // conta sem programa (Leitura que nunca começou, login restaurado): o 404 é resposta, não falha. null = "sem
        // programa" (nada de carregando eterno nem nova tentativa — PF2-01)
        queryFn: () =>
            melpService
                .get<MelpSummaryResponse>(`/v2/${userUid as string}/summary`)
                .then(({ data }): MelpSummaryResponse['data'] | null => data.data)
                .catch((error) => {
                    const response = (error as { response?: { status?: number; data?: unknown } })?.response;
                    // o 404 do serviço (sem programa), não o de rota inexistente ("Not Found" do gateway/express)
                    if (response?.status === 404 && response.data !== 'Not Found') return null;
                    throw error;
                }),
        enabled:
            !!userUid &&
            ([MettleRoles.METTLE_STUDENT, MettleRoles.METTLE_ADMIN].some((role) => user?.roles?.includes(role)) ||
                access(IMERSO_PRODUCT).state !== 'none'),
    });
};

export const useStartDeda = () => {
    const queryClient = useQueryClient();

    const { user } = useAppContext();
    const { showNotification } = useNotificationsContext();

    return useMutation({
        mutationFn: ({ userGoalLevel }: { userGoalLevel?: DedaDifficulty }) =>
            melpService.put(`/deda/${user?.uid}/start`, { userGoalLevel }),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ['imerso-summary'],
            });
        },
        onError: (error) => {
            showNotification('error', 'Error', error.message);
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
                queryKey: ['imerso-summary'],
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
                queryKey: ['imerso-summary'],
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
                queryKey: ['imerso-summary'],
            });
            showNotification('success', 'Recomeço', 'Você reiniciou o programa IMERSO.');
        },
    });
};

/** Semanas da LAMP para os seletores ("W4 · título"): relógio novo por `deda_weeks`, legado pela posição (libs/dedaClock). */
export const useGetDedasList = () => {
    const { melpSummary } = useMelpContext();

    const { data: dedasListData, isLoading } = useQuery({
        queryKey: ['get-dedas-list'],
        queryFn: () => melpService.get<Record<string, string>>('/deda/list').then(({ data }) => data),
        enabled: !!melpSummary,
    });

    const dedasList = useMemo(
        () => (dedasListData && melpSummary ? lampWeekOptions(melpSummary, dedasListData) : []),
        [dedasListData, melpSummary],
    );

    return {
        dedasList,
        isLoading,
    };
};
