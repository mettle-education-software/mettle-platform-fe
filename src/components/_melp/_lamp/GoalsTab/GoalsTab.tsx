'use client';

import { InfoCircleOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import AdsClickIcon from '@mui/icons-material/AdsClick';
import { Avatar, Col, Flex, Row, Skeleton, Tooltip, Typography } from 'antd';
import { GoalsGraph } from 'components/_melp/_lamp/GoalsTab/GoalsGraph';
import { GoalsTable } from 'components/_melp/_lamp/GoalsTab/GoalsTable';
import { useGetGoalByLevel } from 'hooks';
import { DedaDifficulty } from 'interfaces/melp';
import { useMelpContext } from 'providers';
import React from 'react';

const { Title, Text, Paragraph } = Typography;

const GoalsWrapper = styled.div`
    margin-top: 5px;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding-bottom: 2rem;
`;

const GoalSummaryCard = styled.div`
    background: #363636;
    width: 100%;
    padding: 1rem;
    border-radius: 6px;
`;

const StatisticCardRaw = ({
    className,
    title,
    value,
    color,
    isHighlight,
    textColor,
}: {
    className?: string;
    title: string;
    value: string;
    color?: string;
    textColor?: string;
    isHighlight?: boolean;
}) => {
    return (
        <div className={className}>
            <Flex justify="flex-start" align="center" gap="1rem">
                <Avatar
                    shape="square"
                    size={64}
                    style={{ backgroundColor: isHighlight ? '#37312A' : color, borderRadius: '1rem' }}
                >
                    <Title style={{ color: isHighlight ? '#FFF' : textColor }} level={1}>
                        {title.charAt(0)}
                    </Title>
                </Avatar>
                <Flex vertical>
                    <Title className="title-text" level={5}>
                        {title}
                    </Title>
                    <Text className="time-text">{value}</Text>
                </Flex>
            </Flex>
        </div>
    );
};

const StatisticCard = styled(StatisticCardRaw)`
    background-color: ${({ isHighlight }) => (isHighlight ? 'var(--secondary)' : 'rgba(242, 240, 238, 0.05)')};
    padding: 17px 13px;
    border-radius: 6px;

    .title-text {
        text-transform: uppercase;
        font-size: 14px;
        color: ${({ isHighlight }) => (isHighlight ? '#37312A' : 'var(--secondary)')};
    }

    .time-text {
        font-size: 24px;
        color: ${({ isHighlight }) => (isHighlight ? '#37312A' : '#FFFFFF')};
    }

    .title-text,
    .time-text {
        font-weight: 700;
    }
`;

interface GoalsTabProps {
    goalLevel: DedaDifficulty;
}

export const GoalsTab: React.FC<GoalsTabProps> = ({ goalLevel }) => {
    const { melpSummary } = useMelpContext();
    const { data: goalsData, isLoading: isGoalsLoading } = useGetGoalByLevel(goalLevel);

    const currentWeek = melpSummary?.current_deda_week;

    return (
        <GoalsWrapper>
            <Row gutter={[22, 22]}>
                <Col xs={24} md={12}>
                    <Flex vertical gap="0.2rem">
                        <Paragraph className="color-white">
                            See how your daily and weekly study goals evolve over time. The intensity level you select
                            determines how quickly you’ll reach your daily targets and, ultimately, achieve your goal of
                            English fluency:
                        </Paragraph>
                        <Paragraph className="color-white">
                            <ul>
                                <li>
                                    <strong>FLOW:</strong> A gradual pace, reaching 3 hours/day (1 hour 15 minutes
                                    active, 1 hour 45 minutes passive) within 10 months (41 weeks).
                                </li>
                                <li>
                                    <strong>BOOST:</strong> A moderate pace, reaching 4 hours/day (1 hour 30 minutes
                                    active, 2 hours 30 minutes passive) within 8 months (33 weeks).
                                </li>
                                <li>
                                    <strong>TURBO:</strong> An accelerated pace, reaching 5 hours/day (2 hours active, 3
                                    hours passive) within 6 months (25 weeks).
                                </li>
                            </ul>
                        </Paragraph>
                        <Paragraph className="color-white">
                            These targets help you structure your routine effectively, ensuring steady progress based on
                            your commitment level.
                        </Paragraph>
                        <Paragraph className="color-white">
                            <strong>Note:</strong> You can only select your intensity level at the start of the program
                            or when restarting it using one of your reset options.
                        </Paragraph>
                    </Flex>
                </Col>
                <Col xs={24} md={12}>
                    <GoalsGraph goalLevel={goalLevel} />
                </Col>
            </Row>

            <Skeleton active loading={isGoalsLoading || !goalsData}>
                <Row>
                    <Col span={24}>
                        <GoalSummaryCard>
                            <Flex vertical gap="1rem">
                                <Flex align="center" gap="0.8rem">
                                    <AdsClickIcon className="color-white" />
                                    <Title className="color-white" level={5}>
                                        This is your daily goal for this week (Week{' '}
                                        {currentWeek < 10
                                            ? `0${currentWeek}`
                                            : currentWeek >= 10 && currentWeek < 100
                                              ? `${currentWeek}`
                                              : currentWeek}
                                        )
                                    </Title>
                                    {/*<Tooltip title="This is your daily goal for this week">*/}
                                    {/*    <InfoCircleOutlined style={{ cursor: 'pointer' }} className="color-white" />*/}
                                    {/*</Tooltip>*/}
                                </Flex>

                                <Row gutter={[22, 22]}>
                                    <Col xs={24} md={19}>
                                        <Row gutter={[12, 12]}>
                                            <Col xs={24} md={6}>
                                                <StatisticCard
                                                    title="DEDA"
                                                    value={(goalsData ? goalsData[currentWeek - 1].deda : '') + ' min'}
                                                    color="#582133"
                                                    textColor="#F61F64"
                                                />
                                            </Col>
                                            <Col xs={24} md={6}>
                                                <StatisticCard
                                                    title="Active"
                                                    value={
                                                        (goalsData ? goalsData[currentWeek - 1].active : '') + ' min'
                                                    }
                                                    color="#365421"
                                                    textColor="#6FE71C"
                                                />
                                            </Col>
                                            <Col xs={24} md={6}>
                                                <StatisticCard
                                                    title="Passive"
                                                    value={
                                                        (goalsData ? goalsData[currentWeek - 1].passive : '') + ' min'
                                                    }
                                                    color="#205550"
                                                    textColor="#19ECD5"
                                                />
                                            </Col>
                                            <Col xs={24} md={6}>
                                                <StatisticCard
                                                    title="Review"
                                                    value={
                                                        (goalsData ? goalsData[currentWeek - 1].review : '') + ' min'
                                                    }
                                                    color="#423C2E"
                                                    textColor="#F7C034"
                                                />
                                            </Col>
                                        </Row>
                                    </Col>
                                    <Col xs={24} md={5}>
                                        <StatisticCard
                                            title="Total study time"
                                            value={(goalsData ? goalsData[currentWeek - 1].total : '') + ' min'}
                                            isHighlight
                                        />
                                    </Col>
                                </Row>
                            </Flex>
                        </GoalSummaryCard>
                    </Col>
                </Row>
            </Skeleton>

            <Skeleton active loading={isGoalsLoading || !goalsData}>
                <GoalsTable data={goalsData ?? []} currentWeek={currentWeek} />
            </Skeleton>
        </GoalsWrapper>
    );
};
