'use client';

import styled from '@emotion/styled';
import { Skeleton } from 'antd';
import { useGoalGraphOptions } from 'hooks';
import { DedaDifficulty } from 'interfaces/melp';
import dynamic from 'next/dynamic';
import React from 'react';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

const GraphWrapper = styled.div`
    width: 100%;
    height: 100%;
    max-height: 50%;
`;

interface GoalsGraphProps {
    goalLevel: DedaDifficulty;
}

export const GoalsGraph: React.FC<GoalsGraphProps> = ({ goalLevel }) => {
    const { goalGraph, isGraphLoading } = useGoalGraphOptions(goalLevel);

    if (isGraphLoading || !goalGraph || !goalLevel) return <Skeleton active loading />;

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
