'use client';

import { Skeleton } from 'antd';
import { useGeneralWeeklyDevelopment } from 'hooks/melp/lamp';
import dynamic from 'next/dynamic';
import { useAppContext } from 'providers';
import React from 'react';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

export const WeeklyDevelopmentGraph: React.FC = () => {
    const { user } = useAppContext();
    const { weeklyDevelopment, isLoading, weeklyDevelopmentData } = useGeneralWeeklyDevelopment(user?.uid);

    if (isLoading || !weeklyDevelopmentData) return <Skeleton active loading />;

    return (
        <ReactApexChart
            options={weeklyDevelopment.options}
            series={weeklyDevelopment.series}
            type="area"
            height={400}
            width="100%"
        />
    );
};
