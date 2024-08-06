'use client';

import styled from '@emotion/styled';
import { Row, Col, Typography, Skeleton } from 'antd';
import { useGetWeeklyPerformance } from 'hooks';
import dynamic from 'next/dynamic';
import React, { useState } from 'react';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

const { Title } = Typography;

const WhiteTitle = styled(Title)`
    color: #ffffff !important;
`;

const DailySelectorButton = styled.button`
    background-color: rgba(255, 255, 255, 0.2);
    color: #bbb;
    border: none;
    padding: 1px 20px;
    font-size: 16px;
    border-radius: 20px;
    transition: all 0.3s ease;
    cursor: pointer;
    margin-right: 10px;
    display: flex;
    align-items: center;
    gap: 5px;

    & .icon {
        font-size: 1.6rem;
        color: rgba(255, 255, 255, 0.2);
    }

    &.active .icon {
        color: var(--secondary);
    }

    &.active {
        background-color: #fff;
        color: #333;
    }

    &:focus {
        outline: none;
    }
`;

interface DedaStatisticsGraphsProps {
    selectedWeek?: string;
}

export const DedaStatisticsGraphs: React.FC<DedaStatisticsGraphsProps> = ({ selectedWeek }) => {
    const [dailySelectedType, setDailySelectedType] = useState<'dedaTime' | 'readingTime'>('dedaTime');

    const {
        weeklyPerformanceGraph,
        dailyPerformanceGraph,
        isLoading: isWeeklyLoading,
        graphsData,
    } = useGetWeeklyPerformance(dailySelectedType, selectedWeek);

    if (isWeeklyLoading || !graphsData) return <Skeleton active loading paragraph={{ rows: 4 }} />;

    return (
        <Row gutter={[22, 22]} align="stretch">
            <Col xs={24} md={9}>
                <WhiteTitle level={4}>Weekly</WhiteTitle>
                <ReactApexChart
                    options={weeklyPerformanceGraph.options}
                    series={weeklyPerformanceGraph.series}
                    type="bar"
                    width="100%"
                    height="400"
                />
            </Col>
            <Col xs={24} md={15}>
                <Row justify="space-between">
                    <Col span={12}>
                        <WhiteTitle level={4}>Daily</WhiteTitle>
                    </Col>
                    <Col>
                        <Row>
                            <Col>
                                <DailySelectorButton
                                    onClick={() => {
                                        setDailySelectedType('dedaTime');
                                    }}
                                    className={dailySelectedType === 'dedaTime' ? 'active' : undefined}
                                >
                                    <span className="icon">&#8226;</span> DEDA Time
                                </DailySelectorButton>
                            </Col>
                            <Col>
                                <DailySelectorButton
                                    onClick={() => {
                                        setDailySelectedType('readingTime');
                                    }}
                                    className={dailySelectedType === 'readingTime' ? 'active' : undefined}
                                >
                                    <span className="icon">&#8226;</span> Reading Time
                                </DailySelectorButton>
                            </Col>
                        </Row>
                    </Col>
                </Row>
                <ReactApexChart
                    options={dailyPerformanceGraph.options}
                    series={dailyPerformanceGraph.series}
                    type="bar"
                    width="100%"
                    height="400"
                />
            </Col>
        </Row>
    );
};
