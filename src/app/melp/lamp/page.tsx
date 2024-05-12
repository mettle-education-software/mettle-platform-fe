'use client';

import styled from '@emotion/styled';
import { AppLayout, MaxWidthContainer, TabNav } from 'components';
import { HeaderSummary, PerformanceTab, InputTab, GoalsTab } from 'components';
import { padding, withAuthentication } from 'libs';
import React from 'react';

const ContentContainer = styled.div`
    background: var(--main-bg);
    height: 100%;
    width: 100%;
    display: flex;
    align-items: center;
    flex-direction: column;
    padding: ${padding.x.sm} ${padding.x.lg};
`;

const LampPage: React.FC = () => {
    return (
        <AppLayout>
            <HeaderSummary title="LAMP" description="Language Acquisition Management Platform" />
            <ContentContainer>
                <MaxWidthContainer>
                    <TabNav
                        defaultActiveKey="performance"
                        items={[
                            {
                                key: 'performance',
                                label: 'Performance',
                                children: <PerformanceTab />,
                            },
                            {
                                key: 'input',
                                label: 'Input',
                                children: <InputTab />,
                            },
                            {
                                key: 'goal',
                                label: 'Goals',
                                children: <GoalsTab />,
                            },
                        ]}
                    />
                </MaxWidthContainer>
            </ContentContainer>
        </AppLayout>
    );
};

export default withAuthentication(LampPage);
