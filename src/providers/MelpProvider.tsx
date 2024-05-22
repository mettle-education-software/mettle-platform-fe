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
    isTodaysDedaCompleted?: boolean;
}

const MelpContext = createContext<ProviderContext>({} as ProviderContext);

export const MelpProvider: React.FC<ProviderProps> = ({ children }) => {
    const { user } = useAppContext();

    const { data: melpSummary, isLoading: isMelpSummaryLoading } = useMelpSummary(user?.uid as string);
    const { data: currentDayDedaActivityStatus } = useCurrentDayDedaActivityStatus();

    const value = useMemo(
        () => ({
            melpSummary: melpSummary as MelpSummaryResponse['data'],
            isMelpSummaryLoading,
            isTodaysDedaCompleted: currentDayDedaActivityStatus?.isDedaCompleted,
        }),
        [melpSummary, isMelpSummaryLoading, currentDayDedaActivityStatus?.isDedaCompleted],
    );

    return <MelpContext.Provider value={value}>{children}</MelpContext.Provider>;
};

export const useMelpContext = () => useContext(MelpContext);
