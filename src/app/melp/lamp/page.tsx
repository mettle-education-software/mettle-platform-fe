'use client';

import { CloudOutlined, LoadingOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Flex, Popover, Tooltip, Typography } from 'antd';
import {
    AppLayout,
    ArrowDown,
    Chip,
    GoalsTab,
    InputTab,
    MaxWidthContainer,
    PerformanceTab,
    TabNav,
    withRoles,
} from 'components';
import { LoadingLayout } from 'components/layouts/LoadingLayout/LoadingLayout';
import { useDeviceSize } from 'hooks';
import { DedaDifficulties, DedaDifficulty } from 'interfaces/melp';
import { withAuthentication } from 'libs';
import { useRouter } from 'next/navigation';
import { useMelpContext } from 'providers';
import React, { useEffect, useState } from 'react';

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
    position: relative;
`;

const SaveStatus = ({ isSaving, lastTimeSaved }: { isSaving: boolean; lastTimeSaved?: Date }) => {
    const iconStyle = { fontSize: '1.3rem' };
    const textStyle = { color: '#FFF' };

    const device = useDeviceSize();

    if (isSaving) {
        return (
            <Text style={textStyle}>
                <LoadingOutlined style={iconStyle} /> {device === 'desktop' && 'Saving...'}
            </Text>
        );
    }

    return (
        <Text style={textStyle}>
            {device === 'desktop' ? (
                <>
                    <CloudOutlined style={iconStyle} /> Saved {lastTimeSaved && `on ${lastTimeSaved.toLocaleString()}`}
                </>
            ) : (
                <Tooltip
                    title={
                        <>
                            <CloudOutlined style={iconStyle} /> Saved{' '}
                            {lastTimeSaved && `on ${lastTimeSaved.toLocaleString()}`}
                        </>
                    }
                >
                    <CloudOutlined style={iconStyle} />
                </Tooltip>
            )}
        </Text>
    );
};

const GoalOption = styled.div`
    padding: 0.2rem 0.5rem;
    display: flex;
    gap: 1.5rem;
    transition: background 300ms ease;
    cursor: pointer;

    &:hover {
        background: #f5f5f5;
    }
`;

const GoalsPopover = ({
    userGoalLevel,
    selectedGoal,
    onSelect,
}: {
    userGoalLevel: DedaDifficulty;
    selectedGoal: DedaDifficulty;
    onSelect: (value: DedaDifficulty) => void;
}) => {
    const [open, setOpen] = useState(false);

    const isActive = (goal: DedaDifficulty) => goal === userGoalLevel;

    const content = (
        <Flex vertical>
            <GoalOption
                onClick={() => {
                    onSelect('EASY');
                    setOpen(false);
                }}
            >
                <Text strong={isActive('EASY')}>{DedaDifficulties.EASY}</Text>
                {isActive('EASY') && (
                    <Chip bgColor="#B79060" className="color-white">
                        active
                    </Chip>
                )}
            </GoalOption>
            <GoalOption
                onClick={() => {
                    onSelect('MEDIUM');
                    setOpen(false);
                }}
            >
                <Text strong={isActive('MEDIUM')}>{DedaDifficulties.MEDIUM}</Text>
                {isActive('MEDIUM') && (
                    <Chip bgColor="#B79060" className="color-white">
                        active
                    </Chip>
                )}
            </GoalOption>
            <GoalOption
                onClick={() => {
                    onSelect('HARD');
                    setOpen(false);
                }}
            >
                <Text strong={isActive('HARD')}>{DedaDifficulties.HARD}</Text>
                {isActive('HARD') && (
                    <Chip bgColor="#B79060" className="color-white">
                        active
                    </Chip>
                )}
            </GoalOption>
        </Flex>
    );

    const device = useDeviceSize();

    return (
        <Flex align="center" gap="1rem">
            {device === 'desktop' && <Text className="color-white">COMPARE LEVELS</Text>}
            <Popover
                placement="bottomRight"
                content={content}
                trigger="click"
                open={open}
                onOpenChange={(open) => setOpen(open)}
            >
                <Chip bgColor="rgba(255, 255, 255, 0.20)" style={{ border: 'none', cursor: 'pointer' }}>
                    <Text className="color-white">
                        {DedaDifficulties[selectedGoal]?.toUpperCase()} <ArrowDown className={open ? 'open' : ''} />
                    </Text>
                </Chip>
            </Popover>
        </Flex>
    );
};

const LampPage: React.FC = ({ searchParams }: { searchParams?: { lampTab?: string } }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState(searchParams?.lampTab ?? 'performance');
    const [lastTimeInputSaved, setLastTimeInputSaved] = useState<Date>();

    const { melpSummary, isMelpSummaryLoading } = useMelpContext();

    const [goalLevel, setGoalLevel] = useState(melpSummary?.deda_difficulty);

    useEffect(() => {
        if (melpSummary) {
            setGoalLevel(melpSummary.deda_difficulty);
        }
    }, [melpSummary]);

    const router = useRouter();

    if (isMelpSummaryLoading) return <LoadingLayout />;

    // TODO - move this logic to server side rendering
    if (!!melpSummary && !['DEDA_STARTED', 'DEDA_FINISHED', 'DEDA_PAUSED'].includes(melpSummary?.melp_status))
        router.push('/404');

    const tabBarExtra = new Map([
        ['performance', undefined],
        ['input', <SaveStatus key="input" isSaving={isSaving} lastTimeSaved={lastTimeInputSaved} />],
        [
            'goal',
            <GoalsPopover
                key="goal"
                userGoalLevel={melpSummary?.deda_difficulty}
                selectedGoal={goalLevel}
                onSelect={(selectedGoal) => {
                    setGoalLevel(selectedGoal);
                }}
            />,
        ],
    ]);

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
                        tabBarExtraContent={tabBarExtra.get(activeTab)}
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
                                children: <GoalsTab goalLevel={goalLevel} />,
                            },
                        ]}
                    />
                </MaxWidthContainer>
            </ContentContainer>
        </AppLayout>
    );
};

const LampWithRoles = withRoles(LampPage, {
    roles: ['METTLE_STUDENT', 'METTLE_ADMIN'],
    fallback: {
        type: 'redirect',
        to: '/',
    },
});

export default withAuthentication(LampWithRoles);
