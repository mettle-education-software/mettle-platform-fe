'use client';

import { useCurrentDayDedaActivityStatus, useMelpSummary } from 'hooks';
import { MelpSummaryResponse } from 'interfaces/melp';
import { useAppContext } from 'providers/AppProvider';
import React, { createContext, useContext, useMemo } from 'react';

interface ProviderProps {
    children: React.ReactNode;
}

interface ProviderContext {
    melpSummary: MelpSummaryResponse['data'];
    isMelpSummaryLoading: boolean;
    /** o resumo falhou e não há dado anterior: a tela mostra "Try again" em vez de esqueleto eterno */
    isMelpSummaryError?: boolean;
    retryMelpSummary?: () => void;
    isTodaysDedaCompleted?: boolean;
}

const MelpContext = createContext<ProviderContext>({} as ProviderContext);

export const MelpProvider: React.FC<ProviderProps> = ({ children }) => {
    const { user } = useAppContext();

    const {
        data: melpSummary,
        isLoading: isMelpSummaryLoading,
        isError,
        refetch,
    } = useMelpSummary(user?.uid as string);
    const { data: currentDayDedaActivityStatus } = useCurrentDayDedaActivityStatus(melpSummary, user);

    const value = useMemo(
        () => ({
            melpSummary: melpSummary as MelpSummaryResponse['data'],
            isMelpSummaryLoading,
            isMelpSummaryError: isError && !melpSummary,
            retryMelpSummary: () => void refetch(),
            isTodaysDedaCompleted: currentDayDedaActivityStatus?.isDedaCompleted,
        }),
        [melpSummary, isMelpSummaryLoading, isError, refetch, currentDayDedaActivityStatus?.isDedaCompleted],
    );

    return <MelpContext.Provider value={value}>{children}</MelpContext.Provider>;
};

export const useMelpContext = () => useContext(MelpContext);
