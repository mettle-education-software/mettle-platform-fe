'use client';

import styled from '@emotion/styled';
import Rive from '@rive-app/react-canvas';
import React from 'react';

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
    return (
        <Container>
            <Centralize>
                <Rive src="/riv/mettle_logo.riv" stateMachines="loading" />
            </Centralize>
        </Container>
    );
};
