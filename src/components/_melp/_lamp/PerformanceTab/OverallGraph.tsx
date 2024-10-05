'use client';

import styled from '@emotion/styled';
import { Col, Flex, Row, Skeleton, Typography } from 'antd';
import { useDeviceSize, useOverallProgress } from 'hooks';
import { SMALL_VIEWPORT, statisticsColors } from 'libs';
import dynamic from 'next/dynamic';
import { useAppContext } from 'providers';
import React from 'react';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

const { Title } = Typography;

const WhiteTitle = styled(Title)`
    color: #ffffff !important;
    font-weight: 400 !important;
    font-size: 1rem !important;

    @media (max-width: ${SMALL_VIEWPORT}px) {
        font-size: 0.85rem !important;
    }
`;

const Legend = ({ value, name, color }: { name: string; color: string; value?: number }) => {
    return (
        <Flex vertical align="center" gap="0.7rem">
            <Flex vertical align="center">
                <WhiteTitle className="word-no-break" level={5}>
                    {value?.toFixed(0)}%
                </WhiteTitle>
                <hr style={{ border: `4px solid ${color}`, borderRadius: '30px', width: '55px' }} />
            </Flex>
            <WhiteTitle className="word-no-break" level={5}>
                {name}
            </WhiteTitle>
        </Flex>
    );
};

export const OverallGraph: React.FC = () => {
    const { user } = useAppContext();
    const { overallGraph, isLoading, overallData } = useOverallProgress(user?.uid);
    const device = useDeviceSize();

    if (isLoading || !overallData || !user) return <Skeleton active loading />;

    return (
        <div
            style={{
                height: '100%',
                position: 'relative',
            }}
        >
            <div
                style={{
                    position: 'absolute',
                    top: device === 'mobile' ? '35%' : '37.5%',
                    left: device === 'mobile' ? '37.5%' : '42%',
                }}
            >
                <Flex vertical align="center" gap="0">
                    {overallData && (
                        <Title
                            level={5}
                            style={{
                                color: '#FFF',
                                margin: 0,
                            }}
                        >
                            {overallData.overallPerformance.toFixed(2)}%
                        </Title>
                    )}
                    <Title level={5} style={{ color: 'var(--secondary)', margin: 0 }}>
                        OVERALL
                    </Title>
                </Flex>
            </div>
            <ReactApexChart
                options={overallGraph.options}
                series={overallGraph.series}
                type="radialBar"
                width="100%"
                height={device === 'desktop' ? 400 : 350}
            />
            <Row align="middle" gutter={[40, 40]} justify="center">
                <Col span={6}>
                    <Legend name="DEDA" color={statisticsColors.DEDA} value={overallData?.byActivity.deda} />
                </Col>
                <Col span={6}>
                    <Legend name="ACTIVE" color={statisticsColors.Active} value={overallData?.byActivity.active} />
                </Col>
                <Col span={6}>
                    <Legend name="PASSIVE" color={statisticsColors.Passive} value={overallData?.byActivity.passive} />
                </Col>
                {overallData?.byActivity.review ? (
                    <Col span={6}>
                        <Legend name="REVIEW" color={statisticsColors.Review} value={overallData?.byActivity.review} />
                    </Col>
                ) : null}
            </Row>
        </div>
    );
};
