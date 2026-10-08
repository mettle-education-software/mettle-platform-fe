'use client';

import { AppLayout } from 'components';
import { auth } from 'config/firebase';
import { withAuthentication } from 'libs';
import { isLeituraOwner } from 'libs/leitura';
import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import { useAppContext } from 'providers';
import React from 'react';

// Histórico do programa de cada aluno: só o dono (mesma chave do Leaderboard e da análise de leitura), plataforma nova,
// fora do bundle dos alunos. O resumo de outro aluno só responde a METTLE_ADMIN (requireAccess no backend).
const NewAdminHistory = dynamic(() => import('components/_new/NewAdminHistory'), { ssr: false, loading: () => null });

const AdminHistory = () => {
    useAppContext(); // reavalia quando a sessão carrega; a decisão usa a conta realmente logada
    if (!isLeituraOwner(auth.currentUser?.uid)) notFound();
    return (
        <AppLayout>
            <NewAdminHistory />
        </AppLayout>
    );
};

export default withAuthentication(AdminHistory);
