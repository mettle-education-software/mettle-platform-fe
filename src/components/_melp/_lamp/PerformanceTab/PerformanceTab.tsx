'use client';

import styled from '@emotion/styled';
import { Row, Col } from 'antd';
import { WidgetCard } from 'components';
import React from 'react';
import { DedaStatisticsGraphs } from './DedaStatisticsGraphs';
import { OverallGraph } from './OverallGraph';
import { WeeklyDevelopmentGraph } from './WeeklyDevelopmentGraph';

const PerformanceContainer = styled.section`
    margin-top: 5px;
    width: 100%;
`;

export const PerformanceTab: React.FC = () => {
    return (
        <PerformanceContainer>
            <Row gutter={[22, 22]} align="stretch">
                <Col span={8}>
                    <WidgetCard title="Overall Progress">
                        <OverallGraph />
                    </WidgetCard>
                </Col>
                <Col span={16}>
                    <WidgetCard title="General Weekly Development">
                        <WeeklyDevelopmentGraph />
                    </WidgetCard>
                </Col>
                <Col span={24}>
                    <WidgetCard title="DEDA Statistics">
                        <DedaStatisticsGraphs />
                    </WidgetCard>
                </Col>
            </Row>
        </PerformanceContainer>
    );
};
