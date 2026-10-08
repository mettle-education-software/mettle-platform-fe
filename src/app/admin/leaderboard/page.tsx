'use client';

import { AppLayout } from 'components';
import { auth } from 'config/firebase';
import { withAuthentication } from 'libs';
import { isLeituraOwner } from 'libs/leitura';
import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import { useAppContext } from 'providers';
import React from 'react';

// Leaderboard do Imerso: só o dono (mesma chave da análise de leitura), com a plataforma nova. Fora do bundle dos
// alunos; o Worker também só responde ao dono. Alunos não veem, nem com a plataforma nova liberada para todos.
const NewLeaderboard = dynamic(() => import('components/_new/NewLeaderboard'), { ssr: false, loading: () => null });

const Leaderboard = () => {
    useAppContext(); // reavalia quando a sessão carrega; a decisão usa a conta realmente logada
    if (!isLeituraOwner(auth.currentUser?.uid)) notFound();
    return (
        <AppLayout>
            <NewLeaderboard />
        </AppLayout>
    );
};

export default withAuthentication(Leaderboard);
