'use client';

import { isNewLogin } from 'libs/newDesign';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import React, { createContext, Suspense, useContext } from 'react';
import { AuthenticationLayout } from './AuthenticationLayout';

const NewAuthentication = dynamic(() => import('components/_new/NewAuthentication'));
const LoginDesign = createContext({ enabled: false, preview: false });

export const useLoginDesign = () => useContext(LoginDesign);

function Design({ children }: { children: React.ReactNode }) {
    const searchParams = useSearchParams();
    const preview = searchParams.get('preview');
    const enabled = isNewLogin(preview);

    return (
        <LoginDesign.Provider value={{ enabled, preview: preview === 'novo' }}>
            {enabled ? (
                <NewAuthentication>{children}</NewAuthentication>
            ) : (
                <AuthenticationLayout>{children}</AuthenticationLayout>
            )}
        </LoginDesign.Provider>
    );
}

/** Sem estilos globais ou novo markup no caminho clássico. A guarda de sessão continua nos layouts das rotas. */
export function AuthenticationDesign({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={<AuthenticationLayout>{children}</AuthenticationLayout>}>
            <Design>{children}</Design>
        </Suspense>
    );
}
