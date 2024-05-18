'use client';

import { CloudOutlined, LoadingOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Typography } from 'antd';
import { AppLayout, MaxWidthContainer, TabNav } from 'components';
import { HeaderSummary, PerformanceTab, InputTab, GoalsTab } from 'components';
import { padding, withAuthentication } from 'libs';
import { useRouter } from 'next/navigation';
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

const SaveStatus = ({ isSaving, lastTimeSaved }: { isSaving: boolean; lastTimeSaved?: Date }) => {
    const iconStyle = { fontSize: '1.3rem' };
    const textStyle = { color: '#FFF' };

    if (isSaving) {
        return (
            <Typography.Text style={textStyle}>
                <LoadingOutlined style={iconStyle} /> Saving...
            </Typography.Text>
        );
    }

    return (
        <Typography.Text style={textStyle}>
            <CloudOutlined style={iconStyle} /> Saved {lastTimeSaved && `on ${lastTimeSaved.toLocaleString()}`}
        </Typography.Text>
    );
};

const LampPage: React.FC = ({ searchParams }: { searchParams?: { lampTab?: string } }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState(searchParams?.lampTab ?? 'performance');
    const [lastTimeInputSaved, setLastTimeInputSaved] = useState<Date>();

    const router = useRouter();

    return (
        <AppLayout withMelpSummary>
            <HeaderSummary title="LAMP" description="Language Acquisition Management Platform" />
            <ContentContainer>
                <MaxWidthContainer style={{ position: 'relative' }}>
                    <TabNav
                        activeKey={activeTab}
                        onTabClick={(key) => {
                            router.replace(`/melp/lamp?lampTab=${key}`);
                            setActiveTab(key);
                        }}
                        tabBarExtraContent={
                            activeTab !== 'input' ? undefined : (
                                <SaveStatus isSaving={isSaving} lastTimeSaved={lastTimeInputSaved} />
                            )
                        }
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
                                children: (
                                    <InputTab setIsSaving={setIsSaving} setLastTimeSaved={setLastTimeInputSaved} />
                                ),
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
