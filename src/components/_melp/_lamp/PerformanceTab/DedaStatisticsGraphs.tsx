'use client';

import { Row, Col, Typography } from 'antd';
import { ApexOptions } from 'apexcharts';
import dynamic from 'next/dynamic';
import React, { useState } from 'react';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

const { Title } = Typography;

export const DedaStatisticsGraphs: React.FC = () => {
    const [weekly, setWeekly] = useState<{ series: ApexOptions['series']; options: ApexOptions }>({
        series: [
            {
                data: [21, 22, 10, 28, 16, 21, 13, 30],
            },
        ],
        options: {
            chart: {
                height: 350,
                type: 'bar',
                events: {
                    click: function (chart, w, e) {
                        // console.log(chart, w, e)
                    },
                },
            },
            colors: ['red', 'blue', 'yellow', 'green', 'purple', 'black', 'orange', 'pink'],
            plotOptions: {
                bar: {
                    columnWidth: '45%',
                    distributed: true,
                },
            },
            dataLabels: {
                enabled: false,
            },
            legend: {
                show: false,
            },
            xaxis: {
                categories: [
                    ['John', 'Doe'],
                    ['Joe', 'Smith'],
                    ['Jake', 'Williams'],
                    'Amber',
                    ['Peter', 'Brown'],
                    ['Mary', 'Evans'],
                    ['David', 'Wilson'],
                    ['Lily', 'Roberts'],
                ],
                labels: {
                    style: {
                        colors: ['red', 'blue', 'yellow', 'green', 'purple', 'black', 'orange', 'pink'],
                        fontSize: '12px',
                    },
                },
            },
        },
    });

    const [daily, setDaily] = useState<{ series: ApexOptions['series']; options: ApexOptions }>({
        series: [
            {
                name: 'sales',
                data: [
                    {
                        x: '2019/01/01',
                        y: 400,
                    },
                    {
                        x: '2019/04/01',
                        y: 430,
                    },
                    {
                        x: '2019/07/01',
                        y: 448,
                    },
                    {
                        x: '2019/10/01',
                        y: 470,
                    },
                    {
                        x: '2020/01/01',
                        y: 540,
                    },
                    {
                        x: '2020/04/01',
                        y: 580,
                    },
                    {
                        x: '2020/07/01',
                        y: 690,
                    },
                    {
                        x: '2020/10/01',
                        y: 690,
                    },
                ],
            },
        ],
        options: {
            chart: {
                type: 'bar',
                height: 380,
            },
            xaxis: {
                type: 'category',
                labels: {
                    formatter: function (val) {
                        return 'Q';
                    },
                },
                group: {
                    style: {
                        fontSize: '10px',
                        fontWeight: 700,
                    },
                    groups: [
                        { title: '2019', cols: 4 },
                        { title: '2020', cols: 4 },
                    ],
                },
            },
            title: {
                text: 'Grouped Labels on the X-axis',
            },
            tooltip: {
                x: {
                    formatter: function (val) {
                        return 'hello';
                    },
                },
            },
        },
    });

    return (
        <Row gutter={[22, 22]} align="stretch">
            <Col span={8}>
                <Title level={4}>Weekly</Title>
                <div>
                    <div id="chart">
                        <ReactApexChart options={weekly.options} series={weekly.series} type="bar" height={350} />
                    </div>
                    <div id="html-dist"></div>
                </div>
            </Col>
            <Col span={16}>
                <Title level={4}>Daily</Title>
                <div>
                    <div id="chart">
                        <ReactApexChart options={daily.options} series={daily.series} type="bar" height={380} />
                    </div>
                    <div id="html-dist"></div>
                </div>
            </Col>
        </Row>
    );
};
