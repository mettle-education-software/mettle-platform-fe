'use client';

import { auth } from 'config/firebase';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

// eslint-disable-next-line react/display-name
export const withAuthentication = (Component) => (props) => {
    const [nextOrObserver, setNextOrObserver] = useState(null);
    const router = useRouter();

    useEffect(() => {
        auth.onAuthStateChanged(async (authUser) => {
            setNextOrObserver(authUser);

            if (!authUser) {
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
                router.push('/course');
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!nextOrObserver) {
        return <Component {...props} />;
    }
};
