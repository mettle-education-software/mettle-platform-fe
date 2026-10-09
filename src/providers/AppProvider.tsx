'use client';

import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';
import { ApolloProvider } from '@apollo/react-hooks';
import { NextFn } from '@firebase/util';
import * as Sentry from '@sentry/nextjs';
import { auth } from 'config/firebase';
import { useFirstLoginEvent } from 'hooks/useEvents';
import { FireUser } from 'interfaces';
import { contentFetch } from 'libs/contentSource';
import React, { useContext, createContext, useState, useEffect, useMemo } from 'react';

interface ProviderProps {
    children: React.ReactNode;
}

interface IProviderContext {
    theme: 'light' | 'dark';
    user?: FireUser & { impersonating?: boolean };
    isAppLoading: boolean;
}

const client = new ApolloClient({
    // Espelho de conteúdo com volta automática ao Contentful (libs/contentSource).
    link: new HttpLink({ uri: process.env.GRAPHQL_URI as string, fetch: contentFetch }),
    cache: new InMemoryCache(),
});

const AppProviderContext = createContext<IProviderContext>({} as IProviderContext);

export const AppProvider: React.FC<ProviderProps> = ({ children }) => {
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');
    const [user, setUser] = useState<any>(null);
    const [isAppLoading, setIsAppLoading] = useState<boolean>(false);

    const { mutate: sendFirstLoginEvent } = useFirstLoginEvent();

    const handleUserTokenChange: NextFn<any> = async (user) => {
        if (user) {
            const token = await user.getIdTokenResult(true);
            const { claims } = token;

            sendFirstLoginEvent({ email: claims.email });

            // A claim fica no token depois que a impersonação vence; só vale enquanto não expirou.
            const impersonating = !!claims.impersonating && (claims.expires as number) > Date.now();

            const contextUser = {
                impersonating,
                email: claims.email,
                // nome inteiro; cada tela escolhe o que mostrar (libs/newDesign: firstName, displayName)
                name: String(claims?.name ?? '')
                    .trim()
                    .replace(/\s+/g, ' '),
                roles: claims.roles,
                uid: claims.user_id,
                businessUuid: claims.businessUuid,
                profileImageSrc: user.photoURL ?? null,
            };

            Sentry.setUser({
                id: contextUser.uid,
            });

            if (impersonating) {
                // @ts-ignore
                contextUser.email = claims.impersonatedUser?.email as string;
                // @ts-ignore
                contextUser.name = String(claims.impersonatedUser?.displayName ?? '')
                    .trim()
                    .replace(/\s+/g, ' ');
                // @ts-ignore
                contextUser.uid = claims.impersonatedUser?.uid as string;
                contextUser.roles = claims.roles;
                // @ts-ignore
                contextUser.businessUuid = claims.impersonatedUser?.businessUuid as string;
                // @ts-ignore
                contextUser.profileImageSrc = claims.impersonatedUser?.profileImageSrc as string;
            }

            setUser(contextUser);
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
        <ApolloProvider client={client}>
            <AppProviderContext.Provider value={value}>{children}</AppProviderContext.Provider>
        </ApolloProvider>
    );
};

export const useAppContext = () => useContext(AppProviderContext);
