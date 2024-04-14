'use client';

import styled from '@emotion/styled';
import { Chip } from '@mui/material';
import { Flex, Typography, Tag, Skeleton, Row, Col } from 'antd';
import { useDeviceSize, useMelpSummary } from 'hooks';
import { useAppContext } from 'providers';
import React from 'react';

const DedaChip = styled(Tag)<{ bg: string }>`
    background: ${({ bg }) => bg};
    border-radius: 40px;
    padding: 0.01rem 1rem;
    border: none;
`;

const Divider = styled.div`
    width: 1px;
    height: 8px;
    background: #d8d8d8;
`;

export const MelpSummary: React.FC = () => {
    const device = useDeviceSize();

    const { user } = useAppContext();

    const { data: melpSummary, isLoading } = useMelpSummary(user?.uid as string);

    if (!melpSummary?.accountStatus?.dedaStart?.isDedaStartConfirmed) return null;

    const { currentTime } = melpSummary;

    if (device === 'mobile')
        return (
            <Skeleton loading={isLoading} round style={{ width: '15rem' }} active paragraph={false}>
                <Row align="middle" justify="space-between">
                    <Col span={18}>
                        <Flex>
                            <DedaChip bg="var(--secondary)">
                                <Typography.Text strong style={{ color: '#FFFFFF' }}>
                                    DEDA
                                </Typography.Text>
                            </DedaChip>
                            <Typography.Text strong ellipsis>
                                {currentTime.currentDedaName}
                            </Typography.Text>
                        </Flex>
                    </Col>
                    <Col span={6}>
                        <Flex gap="0.5rem">
                            <Divider />
                            <Typography.Text>W</Typography.Text>
                            <Typography.Text>{currentTime.currentWeek}</Typography.Text>
                            <Typography.Text>D</Typography.Text>
                            <Typography.Text>{currentTime.currentDay}</Typography.Text>
                        </Flex>
                    </Col>
                </Row>
            </Skeleton>
        );

    return (
        <Skeleton loading={isLoading} round style={{ width: '15rem' }} active paragraph={false}>
            <Flex gap={16} justify="flex-start" align="center">
                <DedaChip bg="var(--secondary)">
                    <Typography.Title level={5} style={{ color: '#FFFFFF' }}>
                        DEDA
                    </Typography.Title>
                </DedaChip>
                <Typography.Title level={5}>{currentTime.currentDedaName}</Typography.Title>
                <Divider />
                <DedaChip bg="#F2F0EE">
                    <Typography.Title level={5}>Week</Typography.Title>
                </DedaChip>
                <Typography.Text>{currentTime.currentWeek}</Typography.Text>
                <Divider />
                <DedaChip bg="#F2F0EE">
                    <Typography.Title level={5}>Day</Typography.Title>
                </DedaChip>
                <Typography.Text>{currentTime.currentDay}</Typography.Text>
            </Flex>
        </Skeleton>
    );
};
