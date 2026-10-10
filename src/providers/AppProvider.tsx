'use client';

import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';
import { ApolloProvider } from '@apollo/react-hooks';
import { NextFn } from '@firebase/util';
import * as Sentry from '@sentry/nextjs';
import { auth } from 'config/firebase';
import { useFirstLoginEvent } from 'hooks/useEvents';
import { FireUser } from 'interfaces';
import { contentFetch } from 'libs/contentSource';
import { isNewDesignAccount } from 'libs/newDesign';
import { readLevels, rolesFromLevels } from 'libs/productAccess';
import { setViewOnly } from 'libs/viewOnly';
import React, { useContext, createContext, useState, useEffect, useMemo } from 'react';
import { accountService } from 'services';

/**
 * Roles do aluno visto (o /accounts/me segue a impersonação do administrador): a plataforma nova mostra exatamente o que
 * ele vê. null se a resposta não for dele (servidor antigo) ou falhar: valem as roles de antes.
 */
const studentRoles = async (uid?: string): Promise<string[] | null> => {
    try {
        const { data } = await accountService.get<{
            data?: { fbData?: { uid?: string; customClaims?: { roles?: unknown } } };
        }>('/me');
        const fb = data?.data?.fbData;
        if (!uid || fb?.uid !== uid) return null;
        const roles = fb.customClaims?.roles;
        return Array.isArray(roles) ? roles.filter((role): role is string => typeof role === 'string') : [];
    } catch {
        return null;
    }
};

/** Nome, e-mail e foto do aluno visto, do cadastro (GET /accounts/:uid/access): o token grande perde esses campos. */
const studentProfile = async (uid?: string) => {
    if (!uid) return null;
    try {
        const { data } = await accountService.get<{
            user?: { name?: string | null; email?: string | null; photoURL?: string | null };
        }>(`/${encodeURIComponent(uid)}/access`);
        return data?.user ?? null;
    } catch {
        return null;
    }
};

interface ProviderProps {
    children: React.ReactNode;
}

interface IProviderContext {
    theme: 'light' | 'dark';
    /** viewAs: o token tem a impersonação (vencida ou não; o servidor recusa gravações até a saída) */
    user?: FireUser & { impersonating?: boolean; viewAs?: { uid: string; expires: number } };
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
            const seen = (claims.impersonatedUser ?? {}) as {
                uid?: string;
                email?: string;
                displayName?: string;
                photoURL?: string | null;
                profileImageSrc?: string | null;
                businessUuid?: string;
                roles?: unknown;
                access?: unknown;
            };

            // Impersonação = modo visualização, já (antes de qualquer espera): nada grava como o aluno, nem os eventos
            // (login, vídeo), que o servidor não tem como barrar. A claim fica no token depois de vencer (1 h): o
            // servidor recusa gravações até a saída, então o modo segue ligado e a barra oferece Sair.
            const viewing = !!claims.impersonating;
            const impersonating = viewing && (claims.expires as number) > Date.now();
            setViewOnly(viewing);
            if (!viewing) sendFirstLoginEvent({ email: claims.email });

            const contextUser = {
                impersonating,
                viewAs: viewing && seen.uid ? { uid: seen.uid, expires: Number(claims.expires) || 0 } : undefined,
                email: claims.email,
                // nome inteiro; cada tela escolhe o que mostrar (libs/newDesign: firstName, displayName)
                name: String(claims?.name ?? '')
                    .trim()
                    .replace(/\s+/g, ' '),
                roles: claims.roles,
                uid: claims.user_id,
                businessUuid: claims.businessUuid,
                profileImageSrc: user.photoURL ?? null,
                // acesso por produto do modelo novo (libs/productAccess.readLevels); na impersonação, o do aluno, que vem no
                // próprio token (impersonatedUser.access)
                access: impersonating ? seen.access : claims.access,
            };

            Sentry.setUser({
                id: contextUser.uid,
            });

            if (impersonating) {
                // uid e acesso sempre vêm no token; nome, e-mail e foto podem faltar (token grande): o cadastro completa
                const profile =
                    !seen.displayName || !seen.email || !('photoURL' in seen) ? await studentProfile(seen.uid) : null;
                contextUser.email = (seen.email || profile?.email || '') as string;
                contextUser.name = String(seen.displayName || profile?.name || '')
                    .trim()
                    .replace(/\s+/g, ' ');
                contextUser.uid = seen.uid as string;
                contextUser.roles = claims.roles;
                contextUser.businessUuid = seen.businessUuid as string;
                contextUser.profileImageSrc = seen.photoURL ?? seen.profileImageSrc ?? profile?.photoURL ?? null;
                // plataforma nova: tudo como o aluno (roles e acesso dele; o menu e as chaves de equipe somem). As roles vêm
                // no token (impersonatedUser.roles); token grande demais as perde, e então saem do acesso dele; sem nada
                // disso (impersonação anterior ao deploy), do /accounts/me. A tela clássica segue com as do administrador,
                // para não perder a saída da impersonação no painel antigo.
                if (isNewDesignAccount(user.uid)) {
                    const own = seen.roles;
                    contextUser.roles = Array.isArray(own)
                        ? own
                        : (rolesFromLevels(readLevels(contextUser.access)) ??
                          (await studentRoles(contextUser.uid)) ??
                          claims.roles);
                }
            }

            setUser(contextUser);
        } else {
            setViewOnly(false);
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
