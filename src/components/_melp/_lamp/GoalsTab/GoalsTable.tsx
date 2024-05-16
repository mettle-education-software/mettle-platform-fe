'use client';

import { InfoCircleOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import AdsClickIcon from '@mui/icons-material/AdsClick';
import { Flex, Table as AntTable, Typography, TableColumnsType, Tooltip } from 'antd';
import React from 'react';

const { Title } = Typography;

interface GoalsTableProps {
    data: any[];
    currentWeek: number;
}

const TitleCell = styled.div`
    font-weight: 400 !important;
    padding: 1rem 2rem;
    color: #fff;
    background: #37312a;
    width: 100%;
    height: 100%;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const CellContent = styled.div<{ isLast?: boolean; isCurrent: boolean }>`
    width: 100%;
    height: 100%;
    background: ${({ isCurrent }) => (isCurrent ? 'rgba(242, 213, 177, 0.25)' : '#37312a')};
    font-size: 14px;
    min-height: 3rem;
    padding: 1rem 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${({ isCurrent }) => (isCurrent ? '#FFFFFF' : 'var(--secondary)')};

    &::before ${({ isLast }) =>
        isLast
            ? ''
            : `{
        background-attachment: scroll;
        background-clip: border-box;
        background-color: rgb(183, 144, 96);
        background-image: none;
        background-origin: padding-box;
        background-position-x: 0%;
        background-position-y: 0%;
        background-repeat: repeat;
        background-size: auto;
        box-sizing: border-box;
        content: '';
        display: block;
        height: 53px;
        inset-inline-end: 0px;
        position: absolute;
        top: 26.5px;
        transform: matrix(1, 0, 0, 1, 0, -26.5);
        transition-delay: 0s;
        transition-duration: 0.2s;
        transition-property: background-color;
        transition-timing-function: ease;
        width: 1px;
    }`}
`;

const TableCard = styled.div`
    background: #3c362f;
    padding: 0;
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    width: 100%;
`;

const Table = styled(AntTable)`
    .ant-table-cell {
        padding: 0 !important;
    }

    .ant-table-cell::before {
        background: #b79060 !important;
        height: 100% !important;
    }

    .ant-table-tbody {
        background: #37312a !important;
    }

    tr,
    .ant-table-cell {
        border: none !important;
        border-top: none !important;
        border-bottom: none !important;
    }
`;

const goalTableColumns: (currentWeek: number) => TableColumnsType = (currentWeek) => [
    {
        title: <TitleCell>WEEK</TitleCell>,
        dataIndex: 'week',
        key: 'week',
        render: (value, { week }) => <CellContent isCurrent={currentWeek === week}>{value}</CellContent>,
    },
    {
        title: <TitleCell>DEDA</TitleCell>,
        dataIndex: 'deda',
        key: 'deda',
        render: (value, { week }) => <CellContent isCurrent={currentWeek === week}>{value}</CellContent>,
    },
    {
        title: <TitleCell>ACTIVE</TitleCell>,
        dataIndex: 'active',
        key: 'active',
        render: (value, { week }) => <CellContent isCurrent={currentWeek === week}>{value}</CellContent>,
    },
    {
        title: <TitleCell>PASSIVE</TitleCell>,
        dataIndex: 'passive',
        key: 'passive',
        render: (value, { week }) => <CellContent isCurrent={currentWeek === week}>{value}</CellContent>,
    },
    {
        title: <TitleCell>REVIEW</TitleCell>,
        dataIndex: 'review',
        key: 'review',
        render: (value, { week }) => <CellContent isCurrent={currentWeek === week}>{value}</CellContent>,
    },
    {
        title: <TitleCell>TOTAL</TitleCell>,
        dataIndex: 'total',
        key: 'total',
        render: (value, { week }) => <CellContent isCurrent={currentWeek === week}>{value}</CellContent>,
    },
    {
        title: <TitleCell>TOTAL ACTIVE</TitleCell>,
        dataIndex: 'totalActive',
        key: 'totalActive',
        render: (value, { week }) => <CellContent isCurrent={currentWeek === week}>{value}</CellContent>,
    },
    {
        title: <TitleCell>TOTAL PASSIVE</TitleCell>,
        dataIndex: 'totalPassive',
        key: 'totalPassive',
        render: (value, { week }) => (
            <CellContent isLast isCurrent={currentWeek === week}>
                {value}
            </CellContent>
        ),
    },
];

export const GoalsTable: React.FC<GoalsTableProps> = ({ data, currentWeek }) => {
    return (
        <TableCard>
            <Flex style={{ padding: '1rem' }} align="center" gap="0.8rem">
                <AdsClickIcon className="color-white" />
                <Title className="color-white" level={5}>
                    Check your weekly goal, until 41 weeks
                </Title>
                <Tooltip title="After week 41, the goals remain the same until the end of the program.">
                    <InfoCircleOutlined style={{ cursor: 'pointer' }} className="color-white" />
                </Tooltip>
            </Flex>
            <Table dataSource={data} columns={goalTableColumns(currentWeek)} pagination={false} />
        </TableCard>
    );
};
