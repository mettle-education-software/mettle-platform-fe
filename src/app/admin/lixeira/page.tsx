'use client';

import { AppLayout } from 'components';
import { auth } from 'config/firebase';
import { withAuthentication } from 'libs';
import { isTrashOwner } from 'libs/adminAccess';
import { isNewDesignAccount } from 'libs/newDesign';
import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import { useAppContext } from 'providers';
import React from 'react';

// Lixeira (contas excluídas, 30 dias para restaurar): só o dono, plataforma nova, fora do bundle dos alunos. O servidor
// confere o dono em GET /admin/trash e POST /accounts/:uid/restore.
const NewAdminTrash = dynamic(() => import('components/_new/NewAdminTrash'), { ssr: false, loading: () => null });

const AdminTrash = () => {
    useAppContext(); // reavalia quando a sessão carrega; a decisão usa a conta realmente logada
    const uid = auth.currentUser?.uid;
    if (!isTrashOwner(uid) || !isNewDesignAccount(uid)) notFound();
    return (
        <AppLayout>
            <NewAdminTrash />
        </AppLayout>
    );
};

export default withAuthentication(AdminTrash);
