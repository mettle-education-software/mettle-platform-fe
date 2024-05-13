'use client';

import styled from '@emotion/styled';
import { Row, Col } from 'antd';
import { WidgetCard } from 'components';
import { useMelpContext } from 'providers/MelpProvider';
import React, { useEffect } from 'react';
import { DedasListSelect } from '../../DedasListSelect/DedasListSelect';
import { DedaStatisticsGraphs } from './DedaStatisticsGraphs';
import { OverallGraph } from './OverallGraph';
import { WeeklyDevelopmentGraph } from './WeeklyDevelopmentGraph';

const PerformanceContainer = styled.section`
    margin-top: 5px;
    padding-bottom: 10rem;
`;

export const PerformanceTab: React.FC = () => {
    const { melpSummary } = useMelpContext();
    const [selectedWeek, setSelectedWeek] = React.useState<string>();

    useEffect(() => {
        if (melpSummary?.current_deda_week) {
            setSelectedWeek(`week${melpSummary.current_deda_week}`);
        }
    }, [melpSummary?.current_deda_week]);

    const handleWeekChange = (week: string) => {
        setSelectedWeek(week);
    };

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
                    <WidgetCard
                        title="DEDA Statistics"
                        extra={<DedasListSelect onChange={handleWeekChange} value={selectedWeek} />}
                    >
                        <DedaStatisticsGraphs selectedWeek={selectedWeek} />
                    </WidgetCard>
                </Col>
            </Row>
        </PerformanceContainer>
    );
};
