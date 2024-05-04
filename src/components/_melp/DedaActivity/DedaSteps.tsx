'use client';

import styled from '@emotion/styled';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { Breadcrumb, Button, Flex } from 'antd';
import React, { useState } from 'react';
import { Listen } from './Listen';
import { ListenRead } from './ListenRead';
import { ReadRecord } from './ReadRecord';
import { Watch } from './Watch';
import { Write } from './Write';

interface DedaStepsProps {
    dedaId: string;
}

const ActivityCard = styled.div`
    width: 100%;
    min-height: 314px;
    height: 100%;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 0.5rem;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
`;

const steps = ['listen', 'readRecord', 'watch', 'listenRead', 'write'];

const BreadCrumbs = styled(Breadcrumb)`
    color: white;
`;

const NavigationButton = styled(Button)`
    border-radius: 50rem;
`;

export const DedaSteps: React.FC<DedaStepsProps> = ({ dedaId }) => {
    const [currentStep, setCurrentStep] = useState('listen');

    const dedaSteps = new Map([
        ['listen', <Listen key="listen" dedaId={dedaId} />],
        ['readRecord', <ListenRead key="readRecord" dedaId={dedaId} />],
        ['watch', <Watch key="watch" dedaId={dedaId} />],
        ['listenRead', <ReadRecord key="listenRead" dedaId={dedaId} />],
        ['write', <Write key="write" dedaId={dedaId} />],
    ]);

    return (
        <ActivityCard>
            <Flex justify="center" align="center">
                <BreadCrumbs separator={<ChevronRight />}>
                    <Breadcrumb.Item>Listen</Breadcrumb.Item>
                    <Breadcrumb.Item>Read + Record</Breadcrumb.Item>
                    <Breadcrumb.Item>Watch</Breadcrumb.Item>
                    <Breadcrumb.Item>Listen + Read</Breadcrumb.Item>
                    <Breadcrumb.Item>Write</Breadcrumb.Item>
                </BreadCrumbs>
            </Flex>

            {dedaSteps.get(currentStep)}

            <Flex justify="flex-end" align="center" gap="1rem">
                <NavigationButton
                    onClick={() => {
                        const previousStep = steps[steps.indexOf(currentStep) - 1];
                        setCurrentStep(previousStep);
                    }}
                    size="large"
                    disabled={currentStep === 'listen'}
                >
                    <Flex align="center">
                        <ChevronLeft /> Previous
                    </Flex>
                </NavigationButton>
                <NavigationButton
                    disabled={currentStep === 'write'}
                    size="large"
                    onClick={() => {
                        const nextStep = steps[steps.indexOf(currentStep) + 1];
                        setCurrentStep(nextStep);
                    }}
                    type="primary"
                >
                    <Flex align="center">
                        Next <ChevronRight />
                    </Flex>
                </NavigationButton>
            </Flex>
        </ActivityCard>
    );
};
