'use client';

import { AppLayout } from 'components';
import { useNewDesign } from 'hooks/useNewDesign';
import { withAuthentication } from 'libs';
import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import { useAppContext } from 'providers';
import React from 'react';

// Início do Admin (painel com os números do dia): administradores, plataforma nova; fora do bundle dos alunos.
const NewAdminDashboard = dynamic(() => import('components/_new/NewAdminDashboard'), {
    ssr: false,
    loading: () => null,
});

const Admin = () => {
    const { user } = useAppContext();
    const newDesign = useNewDesign();
    if (!user) return null; // as claims (roles) ainda carregando
    if (!newDesign || !user.roles?.includes('METTLE_ADMIN')) notFound();
    return (
        <AppLayout>
            <NewAdminDashboard />
        </AppLayout>
    );
};

export default withAuthentication(Admin);
