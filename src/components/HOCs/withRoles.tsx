'use client';

import { LoadingLayout } from 'components';
import { MettleRoles } from 'interfaces';
import { useRouter } from 'next/navigation';
import { useAppContext } from 'providers';
import React from 'react';

interface Config {
    roles: (keyof typeof MettleRoles)[];
    fallback: {
        type: 'redirect' | 'component';
        to?: string;
        component?: React.ReactNode;
    };
}

export function withRoles<P extends object>(Component: React.ComponentType<P>, config: Config): React.FC<P> {
    const WithRoles: React.FC<P> = (props: P) => {
        const { roles, fallback } = config;

        const { user } = useAppContext();
        const router = useRouter();

        const hasPermission = roles.some((role) => user?.roles?.includes(role));

        if (!user) return <LoadingLayout />;

        if (!hasPermission) {
            if (fallback.type === 'redirect') {
                router.push(fallback.to || '/403');
                return;
            }
            return fallback.component || null;
        }

        return <Component {...props} />;
    };

    return WithRoles;
}
