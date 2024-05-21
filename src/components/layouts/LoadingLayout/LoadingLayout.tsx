'use client';

import styled from '@emotion/styled';
import { Skeleton } from 'antd';
import * as animationData from 'libs/lotties/loading-student.json';
import React from 'react';
import Lottie from 'react-lottie';
import { Logo } from '../../atoms/Logo/Logo';

const Container = styled.div`
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: flex-start;
    gap: 3rem;
`;

const SidebarSkeleton = styled(Skeleton.Button)`
    height: 100%;
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
    return (
        <Container>
            <SidebarSkeleton
                active
                style={{
                    height: '100%',
                    width: '100%',
                }}
            />
            <Centralize>
                <div>
                    <Lottie
                        options={{
                            loop: true,
                            autoplay: true,
                            animationData: animationData,
                        }}
                        height={500}
                        width={500}
                    />
                </div>
                <div style={{ width: 500 }}>
                    <Logo theme="dark" />
                </div>
            </Centralize>
        </Container>
    );
};
