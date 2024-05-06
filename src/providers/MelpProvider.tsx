'use client';

import { useMelpSummary } from 'hooks';
import { MelpSummaryResponse } from 'interfaces/melp';
import { useAppContext } from 'providers/AppProvider';
import React, { createContext, useContext } from 'react';

interface ProviderProps {
    children: React.ReactNode;
}

interface ProviderContext {
    melpSummary: MelpSummaryResponse['data'];
}

const MelpContext = createContext<ProviderContext>({} as ProviderContext);

export const MelpProvider: React.FC<ProviderProps> = ({ children }) => {
    const { user } = useAppContext();

    const { data: melpSummary } = useMelpSummary(user?.uid as string);

    return (
        <MelpContext.Provider value={{ melpSummary: melpSummary as MelpSummaryResponse['data'] }}>
            {children}
        </MelpContext.Provider>
    );
};

export const useMelpContext = () => useContext(MelpContext);
