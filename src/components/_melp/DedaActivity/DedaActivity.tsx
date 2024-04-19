'use client';

import styled from '@emotion/styled';
import { Steps } from 'antd';
import { getTodaysWeekDay } from 'libs';
import React from 'react';
import { MaxWidthContainer } from '../../atoms';

const ActivityWrapper = styled.div`
    width: 100%;
    height: 100%;
    background: #2b2b2b;
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const StyledSteps = styled(Steps)`
    padding: 16px 0;

    .past-day {
        text-decoration: line-through;
    }
`;

const DayStepper = () => {
    const today = getTodaysWeekDay();

    return (
        <StyledSteps
            size="small"
            items={[
                {
                    title: 'day 1' + today,
                    icon: <div>1</div>,
                },
                {
                    title: 'day 1',
                    icon: <div>1</div>,
                },
                {
                    title: 'day 1',
                    icon: <div>1</div>,
                },
                {
                    title: 'day 1',
                    icon: <div>1</div>,
                },
                {
                    title: 'day 1',
                    icon: <div>1</div>,
                },
                {
                    title: 'day 1',
                    icon: <div>1</div>,
                },
                {
                    title: 'day 1',
                    icon: <div>1</div>,
                },
            ]}
        />
    );
};

export const DedaActivity = ({ dedaId }: { dedaId: string }) => {
    return (
        <ActivityWrapper>
            <MaxWidthContainer>
                <DayStepper />
            </MaxWidthContainer>
        </ActivityWrapper>
    );
};
