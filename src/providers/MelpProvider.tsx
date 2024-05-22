'use client';

import { useMelpSummary } from 'hooks';
import { MelpSummaryResponse } from 'interfaces/melp';
import { useAppContext } from 'providers/AppProvider';
import React, { createContext, useContext, useMemo } from 'react';

interface ProviderProps {
    children: React.ReactNode;
}

interface ProviderContext {
    melpSummary: MelpSummaryResponse['data'];
    isMelpSummaryLoading: boolean;
}

const MelpContext = createContext<ProviderContext>({} as ProviderContext);

export const MelpProvider: React.FC<ProviderProps> = ({ children }) => {
    const { user } = useAppContext();

    const { data: melpSummary, isLoading: isMelpSummaryLoading } = useMelpSummary(user?.uid as string);

    const value = useMemo(
        () => ({
            melpSummary: melpSummary as MelpSummaryResponse['data'],
            isMelpSummaryLoading,
        }),
        [melpSummary, isMelpSummaryLoading],
    );

    return <MelpContext.Provider value={value}>{children}</MelpContext.Provider>;
};

export const useMelpContext = () => useContext(MelpContext);
