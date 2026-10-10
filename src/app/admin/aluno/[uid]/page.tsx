'use client';

import { AppLayout } from 'components';
import { useNewDesign } from 'hooks/useNewDesign';
import { withAuthentication } from 'libs';
import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import { useAppContext } from 'providers';
import React from 'react';

// Página do aluno no Admin (acesso por produto, registro e histórico): dono e administradores, plataforma nova; fora
// do bundle dos alunos. O servidor confere o administrador em cada rota (/accounts/:uid/access…).
const NewAdminStudent = dynamic(() => import('components/_new/NewAdminStudent'), { ssr: false, loading: () => null });

const AdminStudent = ({ params: { uid } }: { params: { uid: string } }) => {
    const { user } = useAppContext();
    const newDesign = useNewDesign();
    if (!user) return null; // as claims (roles) ainda carregando
    if (!newDesign || !user.roles?.includes('METTLE_ADMIN')) notFound();
    return (
        <AppLayout>
            <NewAdminStudent uid={uid} />
        </AppLayout>
    );
};

export default withAuthentication(AdminStudent);
