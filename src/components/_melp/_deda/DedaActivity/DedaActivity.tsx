'use client';

import { CheckCircleFilled, HourglassOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import { Steps, Typography } from 'antd';
import { SMALL_VIEWPORT } from 'libs';
import React from 'react';
import { MaxWidthContainer } from '../../../atoms';
import { DedaSteps } from '../DedaActivity/DedaSteps';

const { Text } = Typography;

const ActivityWrapper = styled.div`
    width: 100%;
    background: #2b2b2b;
    padding-bottom: 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-grow: 1;

    @media (max-width: ${SMALL_VIEWPORT}px) {
        padding-top: 1rem;
    }
`;

const StyledSteps = styled(Steps)`
    margin-bottom: 42px;
    padding: 16px 0;
    font-size: 16px;

    &.ant-steps .ant-steps-item-process > .ant-steps-item-container > .ant-steps-item-content > div::after,
    &.ant-steps
        .ant-steps-item-wait
        > .ant-steps-item-container
        > .ant-steps-item-content
        > .ant-steps-item-title::after {
        background: #564533 !important;
    }

    span {
        color: #564533;
    }

    .today {
        color: #b89261;
    }

    .past-day {
        text-decoration: line-through;
    }
`;

const DayStepper = () => {
    const today = 3;

    const items = [1, 2, 3, 4, 5, 6, 7].map((weekDay) => {
        const isTodayBigger = today > weekDay;
        const isToday = today === weekDay;

        const className = isToday ? 'today' : isTodayBigger ? 'past-day' : '';

        return {
            title: <Text className={className}>Day {weekDay}</Text>,
            icon: isTodayBigger ? (
                <CheckCircleFilled />
            ) : isToday ? (
                <RotateRightIcon style={{ color: 'var(--secondary)', fontSize: '2rem' }} />
            ) : (
                <HourglassOutlined className={className} />
            ),
        };
    });

    return <StyledSteps current={today - 1} size="small" items={items} />;
};

export const DedaActivity = ({ dedaId }: { dedaId: string }) => {
    return (
        <ActivityWrapper>
            <MaxWidthContainer>
                {/*<DayStepper />*/}
                <DedaSteps dedaId={dedaId} />
            </MaxWidthContainer>
        </ActivityWrapper>
    );
};
