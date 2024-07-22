'use client';

import styled from '@emotion/styled';
import { Flex, Typography, Tag, Skeleton, Row, Col } from 'antd';
import { useDeviceSize, useMelpSummary } from 'hooks';
import { padNumber, getWeekDay } from 'libs';
import { useAppContext } from 'providers';
import React from 'react';

const { Text, Title } = Typography;

const DedaChip = styled(Tag)<{ bg: string }>`
    background: ${({ bg }) => bg};
    border-radius: 40px;
    padding: 0.01rem 1rem;
    border: none;
`;

const Divider = styled.div`
    width: 1px;
    height: 10px;
    background: #d8d8d8;
`;

export const MelpSummary: React.FC = () => {
    const device = useDeviceSize();

    const { user } = useAppContext();

    const { data: melpSummary, isLoading, isFetching } = useMelpSummary(user?.uid as string);

    const currentWeek = melpSummary?.current_deda_week as number;
    const currentDedaName = melpSummary?.currentDedaName as string;
    const currentDay = getWeekDay();

    if (device === 'mobile')
        return (
            <Skeleton loading={isLoading || isFetching} round style={{ width: '100%' }} active paragraph={false}>
                <Row align="middle" justify="space-between" style={{ width: '100%' }}>
                    <Col span={16}>
                        <Flex>
                            <DedaChip bg="var(--secondary)">
                                <Text strong style={{ color: '#FFFFFF' }}>
                                    DEDA
                                </Text>
                            </DedaChip>
                            <Text strong ellipsis>
                                {melpSummary?.currentDedaName}
                            </Text>
                        </Flex>
                    </Col>
                    <Col span={8}>
                        <Flex gap="0.5rem" align="center">
                            <Divider />
                            <Text className="color-secondary" strong>
                                W
                            </Text>
                            <Text className="word-no-break">{padNumber(currentWeek)}</Text>
                            <Text className="color-secondary" strong>
                                D
                            </Text>
                            <Text className="word-no-break">{currentDay}</Text>
                        </Flex>
                    </Col>
                </Row>
            </Skeleton>
        );

    return (
        <Skeleton loading={isLoading || isFetching} round style={{ width: '15rem' }} active paragraph={false}>
            <Flex gap={16} justify="flex-start" align="center">
                <DedaChip bg="var(--secondary)">
                    <Title level={5} style={{ color: '#FFFFFF' }}>
                        DEDA
                    </Title>
                </DedaChip>
                <Title level={5}>{currentDedaName}</Title>
                <Divider />
                <DedaChip bg="#F2F0EE">
                    <Title level={5}>Week</Title>
                </DedaChip>
                <Text>{currentWeek}</Text>
                <Divider />
                <DedaChip bg="#F2F0EE">
                    <Title level={5}>Day</Title>
                </DedaChip>
                <Text>{currentDay}</Text>
            </Flex>
        </Skeleton>
    );
};
