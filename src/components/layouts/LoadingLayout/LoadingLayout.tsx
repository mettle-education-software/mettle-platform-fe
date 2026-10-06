'use client';

import styled from '@emotion/styled';
import Rive from '@rive-app/react-canvas';
import { useNewDesign } from 'hooks/useNewDesign';
import dynamic from 'next/dynamic';
import React, { useContext } from 'react';
import { InPersistentShell } from '../AppLayout/AppLayout';

// Carregando da plataforma nova (libs/newDesign), só para as contas da lista: fora do bundle dos alunos.
const NewLoading = dynamic(() => import('components/_new/NewStatus').then((m) => m.NewLoading), {
    ssr: false,
    loading: () => null,
});

// Dentro da casca persistente: só a área de conteúdo, discreta e só depois de ~300 ms (carregamento rápido não aparece).
const NewContentLoading = dynamic(() => import('components/_new/NewStatus').then((m) => m.NewContentLoading), {
    ssr: false,
    loading: () => null,
});

const Container = styled.div`
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: flex-start;
    gap: 3rem;
`;

const Centralize = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
`;

export const LoadingLayout: React.FC = () => {
    const inShell = useContext(InPersistentShell);
    if (useNewDesign()) return inShell ? <NewContentLoading /> : <NewLoading />;
    return (
        <Container>
            <Centralize>
                <Rive src="/riv/mettle_logo.riv" stateMachines="loading" />
            </Centralize>
        </Container>
    );
};
