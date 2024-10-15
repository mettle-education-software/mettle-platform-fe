'use client';

import styled from '@emotion/styled';
import { Flex } from 'antd';
import { Logo } from 'components';
import { useDeviceSize } from 'hooks';
import { padding, SMALL_VIEWPORT } from 'libs';
import React from 'react';

const PageContainer = styled.div`
    max-height: 100vh;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
    display: flex;
`;

const LogoContainer = styled.div`
    width: 50%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    background:
        linear-gradient(0deg, rgba(60, 54, 47, 0.69) 0%, rgba(60, 54, 47, 0.69) 100%),
        url('/img/woman_bg.jpeg') lightgray 50% / cover no-repeat;
`;

const LogoWrapper = styled.div`
    width: 100%;
    max-width: 50%;
    padding: 1rem 0;

    @media (max-width: ${SMALL_VIEWPORT}px) {
        padding-top: 3.3rem;
    }
`;

interface AuthenticationLayoutProps {
    children: React.ReactNode;
}

export const AuthenticationLayout: React.FC<AuthenticationLayoutProps> = ({ children }) => {
    const deviceSize = useDeviceSize();

    if (deviceSize === 'mobile') {
        return (
            <Flex vertical align="center" gap={24} style={{ paddingBottom: padding.y.md }}>
                <LogoWrapper>
                    <Logo theme="dark" />
                </LogoWrapper>
                {children}
            </Flex>
        );
    }

    return (
        <PageContainer>
            <LogoContainer>
                <LogoWrapper>
                    <Logo />
                </LogoWrapper>
            </LogoContainer>
            {children}
        </PageContainer>
    );
};
