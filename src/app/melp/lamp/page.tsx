'use client';

import styled from '@emotion/styled';
import { AppLayout, MaxWidthContainer, TabNav } from 'components';
import { HeaderSummary, PerformanceTab, InputTab, GoalsTab } from 'components';
import { padding, withAuthentication } from 'libs';
import React, { useState } from 'react';

const ContentContainer = styled.div`
    background: var(--main-bg);
    width: 100%;
    min-height: 100vh;
    flex: 1;
    display: flex;
    align-items: center;
    flex-direction: column;
    padding: ${padding.y.sm} ${padding.x.lg};
`;

const LampPage: React.FC = () => {
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('performance');

    return (
        <AppLayout withMelpSummary>
            <HeaderSummary title="LAMP" description="Language Acquisition Management Platform" />
            <ContentContainer>
                <MaxWidthContainer>
                    <TabNav
                        activeKey={activeTab}
                        onTabClick={setActiveTab}
                        tabBarExtraContent={activeTab !== 'input' ? undefined : isSaving ? 'Saving...' : 'Saved'}
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
                                children: <InputTab setIsSaving={setIsSaving} />,
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
