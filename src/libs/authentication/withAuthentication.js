'use client';

import { auth } from 'config/firebase';
import { signOut } from 'firebase/auth';
import { isHydrated, isNewDesignAccount } from 'libs/newDesign';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

// eslint-disable-next-line react/display-name
export const withAuthentication = (Component) => (props) => {
    // Plataforma nova: a sessão já conhecida vale desde o primeiro quadro (sem o quadro vazio a cada troca de página).
    // Chave desligada: como sempre, espera o aviso do Firebase.
    const [nextOrObserver, setNextOrObserver] = useState(() =>
        isHydrated() && isNewDesignAccount(auth.currentUser?.uid) ? auth.currentUser : null,
    );
    const router = useRouter();

    useEffect(() => {
        auth.onAuthStateChanged(async (authUser) => {
            setNextOrObserver(authUser);

            if (!authUser) {
                await signOut(auth);
                router.push('/login');
            }

            // this is a logic based on roles, I believe it might come handy in case we want to add something role based
            // try {
            //     const token = await authUser.getIdTokenResult();
            //     const { claims } = token;
            //     if (!claims?.roles?.some((role) => ['METTLE_ADMIN'].includes(role))) {
            //         signOut(auth);
            //         router.push('/');
            //     }
            // } catch (error) {
            //     signOut(auth);
            //     router.push('/');
            // }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (nextOrObserver) {
        return <Component {...props} userUid={nextOrObserver.uid} />;
    }
};

// eslint-disable-next-line react/display-name
export const withoutAuthentication = (Component) => (props) => {
    const [nextOrObserver, setNextOrObserver] = useState({});
    const router = useRouter();

    useEffect(() => {
        auth.onAuthStateChanged((authUser) => {
            setNextOrObserver(authUser);
            if (authUser) {
                router.push('/');
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!nextOrObserver) {
        return <Component {...props} />;
    }
};
