'use client';

import styled from '@emotion/styled';
import { Skeleton } from 'antd';
import { useGoalGraphOptions } from 'hooks/melp/lamp';
import dynamic from 'next/dynamic';
import React from 'react';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

const GraphWrapper = styled.div`
    width: 100%;
    height: 100%;
`;

export const GoalsGraph: React.FC = () => {
    const { goalGraph, isGraphLoading } = useGoalGraphOptions('hard');

    if (isGraphLoading || !goalGraph) return <Skeleton active loading />;

    return (
        <GraphWrapper>
            <ReactApexChart
                options={goalGraph.options}
                series={goalGraph.series}
                type="line"
                width="100%"
                height="200%"
            />
        </GraphWrapper>
    );
};
