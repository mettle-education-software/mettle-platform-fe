'use client';

import { ApolloClient, InMemoryCache } from '@apollo/client';
import { ApolloProvider } from '@apollo/react-hooks';
import { User } from '@firebase/auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { AdminImpersonator } from 'components';
import { auth } from 'config/firebase';
import { FireUser } from 'interfaces';
import React, { useContext, createContext, useState, useEffect, useMemo } from 'react';

interface ProviderProps {
    children: React.ReactNode;
}

interface IProviderContext {
    theme: 'light' | 'dark';
    user?: FireUser;
    isAppLoading: boolean;
}

const client = new ApolloClient({
    uri: process.env.GRAPHQL_URI as string,
    cache: new InMemoryCache(),
});

const queryClient = new QueryClient();

const AppProviderContext = createContext<IProviderContext>({} as IProviderContext);

export const AppProvider: React.FC<ProviderProps> = ({ children }) => {
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');
    const [user, setUser] = useState<any>(null);
    const [isAppLoading, setIsAppLoading] = useState<boolean>(false);

    const handleUserTokenChange = async (user: User | null) => {
        if (user) {
            const token = await user.getIdTokenResult(true);
            const { claims } = token;

            const splitName = (claims?.name as string).split(' ');

            setUser({
                email: claims.email,
                name: `${splitName[0]} ${splitName[1]}`,
                roles: claims.roles,
                uid: claims.user_id,
                businessUuid: claims.businessUuid,
                profileImageSrc: user.photoURL || null,
            });
        }
        setIsAppLoading(false);
    };

    useEffect(() => {
        auth.beforeAuthStateChanged(() => {
            setIsAppLoading(true);
        });
        auth.onAuthStateChanged(handleUserTokenChange);
    }, []);

    const value = useMemo(() => ({ theme, user, isAppLoading }), [theme, user, isAppLoading]);

    return (
        <QueryClientProvider client={queryClient}>
            <ApolloProvider client={client}>
                <AppProviderContext.Provider value={value}>
                    {children}
                    {/*{user?.roles.includes('METTLE_ADMIN') && (*/}
                    {/*    <AdminImpersonator*/}
                    {/*        onOk={(selectedUser) => {*/}
                    {/*            setUser((previous: User) => ({*/}
                    {/*                ...previous,*/}
                    {/*                email: selectedUser.email,*/}
                    {/*                name: selectedUser.first_name + ' ',*/}
                    {/*                uid: selectedUser.user_uid,*/}
                    {/*            }));*/}
                    {/*        }}*/}
                    {/*    />*/}
                    {/*)}*/}
                </AppProviderContext.Provider>
            </ApolloProvider>
        </QueryClientProvider>
    );
};

export const useAppContext = () => useContext(AppProviderContext);
