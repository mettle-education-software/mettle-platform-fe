'use client';

import { AppLayout } from 'components';
import { auth } from 'config/firebase';
import { withAuthentication } from 'libs';
import { isLeituraOwner } from 'libs/leitura';
import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import { useAppContext } from 'providers';
import React from 'react';

// Ferramentas internas (só o dono, plataforma nova): o mesmo filtro da Análise de leitura. Fora do bundle dos alunos.
const NewAdminHub = dynamic(() => import('components/_new/NewAdminHub'), { ssr: false, loading: () => null });

const Admin = () => {
    useAppContext(); // reavalia quando a sessão carrega; a decisão usa a conta realmente logada
    if (!isLeituraOwner(auth.currentUser?.uid)) notFound();
    return (
        <AppLayout>
            <NewAdminHub />
        </AppLayout>
    );
};

export default withAuthentication(Admin);
