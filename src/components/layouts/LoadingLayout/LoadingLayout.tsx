'use client';

import styled from '@emotion/styled';
import Rive from '@rive-app/react-canvas';
import { Skeleton } from 'antd';
import { useDeviceSize } from 'hooks';
import React from 'react';

const Container = styled.div`
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: flex-start;
    gap: 3rem;
`;

const SidebarSkeleton = styled(Skeleton.Button)`
    min-height: 100vh;
    width: 15rem !important;
    background: #3c362f;
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
    const device = useDeviceSize();

    return (
        <Container>
            {device === 'desktop' && <SidebarSkeleton active />}
            <Centralize>
                <Rive src="/riv/mettle_logo.riv" stateMachines="loading" />
            </Centralize>
        </Container>
    );
};
