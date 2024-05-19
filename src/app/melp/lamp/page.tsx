'use client';

import { CloudOutlined, LoadingOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Flex, Typography } from 'antd';
import { AppLayout, MaxWidthContainer, TabNav } from 'components';
import { PerformanceTab, InputTab, GoalsTab } from 'components';
import { padding, withAuthentication } from 'libs';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

const { Title, Text } = Typography;

const Header = styled.div`
    width: 100%;
    padding: 1.8rem 0;
    display: flex;
    justify-content: center;
    background: linear-gradient(180deg, rgba(0, 0, 0, 0.8) 0%, #2b2b2b 100%);
`;

const ContentContainer = styled.div`
    background: var(--main-bg);
    width: 100%;
    min-height: 100vh;
    flex: 1;
    display: flex;
    align-items: center;
    flex-direction: column;
    padding: ${padding.y.sm} ${padding.x.lg};
    position: relative;
`;

const SaveStatus = ({ isSaving, lastTimeSaved }: { isSaving: boolean; lastTimeSaved?: Date }) => {
    const iconStyle = { fontSize: '1.3rem' };
    const textStyle = { color: '#FFF' };

    if (isSaving) {
        return (
            <Text style={textStyle}>
                <LoadingOutlined style={iconStyle} /> Saving...
            </Text>
        );
    }

    return (
        <Text style={textStyle}>
            <CloudOutlined style={iconStyle} /> Saved {lastTimeSaved && `on ${lastTimeSaved.toLocaleString()}`}
        </Text>
    );
};

const LampPage: React.FC = ({ searchParams }: { searchParams?: { lampTab?: string } }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState(searchParams?.lampTab ?? 'performance');
    const [lastTimeInputSaved, setLastTimeInputSaved] = useState<Date>();

    const router = useRouter();

    return (
        <AppLayout withMelpSummary>
            <Header>
                <MaxWidthContainer>
                    <Flex vertical gap="0.2rem">
                        <Title level={1} className="color-secondary">
                            LAMP
                        </Title>
                        <Title level={4} className="color-white" style={{ fontWeight: 400 }}>
                            Language Acquisition Management Platform
                        </Title>
                    </Flex>
                </MaxWidthContainer>
            </Header>
            <ContentContainer>
                <MaxWidthContainer style={{ position: 'relative' }}>
                    <TabNav
                        sticky
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
