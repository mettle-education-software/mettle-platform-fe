'use client';

import { AppLayout } from 'components';
import { useNewDesign } from 'hooks/useNewDesign';
import { withAuthentication } from 'libs';
import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import { useAppContext } from 'providers';
import React from 'react';

// Painel de Contas (Admin): administradores, plataforma nova; fora do bundle dos alunos. O servidor confere o
// administrador (e o dono, nas ações dele) em cada rota.
const NewAdminContas = dynamic(() => import('components/_new/NewAdminContas'), { ssr: false, loading: () => null });

const Contas = () => {
    const { user } = useAppContext();
    const newDesign = useNewDesign();
    if (!user) return null; // as claims (roles) ainda carregando
    if (!newDesign || !user.roles?.includes('METTLE_ADMIN')) notFound();
    return (
        <AppLayout>
            <NewAdminContas />
        </AppLayout>
    );
};

export default withAuthentication(Contas);
