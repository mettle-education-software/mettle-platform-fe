'use client';

import { LoadingLayout } from 'components';
import { useRouter } from 'next/navigation';
import { useAppContext, useProductAccess } from 'providers';
import React from 'react';

interface Config {
    roles: string[];
    fallback: {
        type: 'redirect' | 'component';
        to?: string;
        component?: React.ReactNode;
    };
}

export function withRoles<P extends object>(Component: React.FC<P>, config: Config): React.FC<P> {
    const WithRoles: React.FC<P> = (props: P) => {
        const { roles, fallback } = config;

        const { user } = useAppContext();
        const { access } = useProductAccess();
        const router = useRouter();

        // Expirado ainda entra (modo leitura; o AppLayout decide o que abre). Só "none" é barrado.
        const hasPermission = roles.some((role) => user?.roles?.includes(role) || access(role).state !== 'none');

        if (!user) return <LoadingLayout />;

        if (!hasPermission) {
            if (fallback.type === 'redirect') {
                router.push(fallback.to ?? '/403');
                return;
            }
            return fallback.component || null;
        }

        return <Component {...props} />;
    };

    return WithRoles;
}
