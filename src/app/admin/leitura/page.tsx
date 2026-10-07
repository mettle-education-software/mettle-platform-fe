'use client';

import { AppLayout } from 'components';
import { auth } from 'config/firebase';
import { withAuthentication } from 'libs';
import { isLeituraOwner } from 'libs/leitura';
import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import { useAppContext } from 'providers';
import React from 'react';

// Análise de leitura do DEDA (piloto interno): só o dono, com a plataforma nova. Fora do bundle dos alunos.
const NewLeitura = dynamic(() => import('components/_new/NewLeitura'), { ssr: false, loading: () => null });

const Leitura = () => {
    useAppContext(); // reavalia quando a sessão carrega; a decisão usa a conta realmente logada
    if (!isLeituraOwner(auth.currentUser?.uid)) notFound();
    return (
        <AppLayout>
            <NewLeitura />
        </AppLayout>
    );
};

export default withAuthentication(Leitura);
