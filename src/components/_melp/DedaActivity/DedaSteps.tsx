'use client';

import { CheckCircleFilled, CheckCircleOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { ChevronLeft, ChevronRight, Timer, TimerOff } from '@mui/icons-material';
import { Breadcrumb, Button, Flex, Typography } from 'antd';
import { SaveDedaInputMutationDedaData, useSaveDedaInput } from 'hooks';
import { getDayToday, padNumber } from 'libs';
import { useRouter } from 'next/navigation';
import { useAppContext, useMelpContext } from 'providers';
import React, { useEffect, useState } from 'react';
import { DedaActivitySummary, DedaStepsCompleted, Listen, ListenRead, ReadRecord, Watch, Write } from './steps';

const { Text } = Typography;

interface DedaStepsProps {
    dedaId: string;
}

const ActivityCard = styled.div`
    width: 100%;
    min-height: 314px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 0.5rem;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
`;

const BreadCrumbs = styled(Breadcrumb)`
    color: white;
`;

const CompleteButton = styled(Button)`
    border-radius: 50rem;

    &.previous {
        background: #777777;
        color: white;
        border-color: transparent;
    }

    &[disabled] {
        background: rgba(243, 236, 228, 0.07);
        color: #ffffff;
        border: none;
    }
`;

const ChipWrapper = styled.div`
    border-radius: 30rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    justify-content: flex-start;
    height: 2rem;
    background: rgba(242, 240, 238, 0.05);
    padding: 0.25rem 0.75rem;
    position: relative;

    font-size: 0.75rem;

    &.active {
        border: 2px solid white;
    }

    .active-icon {
        color: var(--secondary);
    }

    .text {
        color: #fff;
    }

    .icon {
        color: white;
    }
`;

const NavButton = styled(Button)`
    width: 2rem !important;
    height: 2rem !important;
    padding: 0 !important;
    border-radius: 25%;
    display: flex;
    justify-content: center;
    align-items: center;
    background: rgba(243, 236, 228, 0.07);
    color: var(--secondary);
    border: none;
`;

const StopWatch = ({ onStop }: { onStop(duration: number): void }) => {
    const [stopwatch, setStopwatch] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setStopwatch((previousTime) => previousTime + 1);
        }, 1000);

        return () => {
            clearInterval(interval);
            onStop(stopwatch);
        };
    });

    const toggleStopwatch = () => {
        setIsOpen(!isOpen);
    };

    return (
        <ChipWrapper>
            <Flex justify="flex-end" align="center" gap="0.6rem">
                {isOpen && (
                    <Text className="text">
                        {padNumber(Math.floor(stopwatch / 3600))}:{padNumber(Math.floor(stopwatch / 60))}:
                        {padNumber(stopwatch % 60)}
                    </Text>
                )}
                {isOpen ? (
                    <Timer style={{ cursor: 'pointer' }} className="icon" onClick={toggleStopwatch} />
                ) : (
                    <TimerOff style={{ cursor: 'pointer' }} className="icon" onClick={toggleStopwatch} />
                )}
            </Flex>
        </ChipWrapper>
    );
};

const StepChip = ({ status, stepName }: { status?: 'completed' | 'active'; stepName: string }) => {
    return (
        <ChipWrapper className={status}>
            {status === 'completed' ? (
                <CheckCircleFilled className="active-icon" />
            ) : (
                <CheckCircleOutlined className="icon" />
            )}
            <Text className="text">{stepName}</Text>
        </ChipWrapper>
    );
};

const steps = ['listen', 'readRecord', 'watch', 'listenRead', 'write', 'finish', 'completed'];

export const DedaSteps: React.FC<DedaStepsProps> = ({ dedaId }) => {
    const router = useRouter();

    const { melpSummary, isTodaysDedaCompleted } = useMelpContext();
    const { user } = useAppContext();

    const [stepsProgress, setStepsProgress] = useState({
        listen: false,
        readRecord: false,
        watch: false,
        listenRead: false,
        write: false,
        finish: null,
        completed: null,
    });
    const [currentStep, setCurrentStep] = useState('listen');
    const [dedaTime, setDedaTime] = useState(0);
    const [inputData, setInputData] = useState<SaveDedaInputMutationDedaData>({} as SaveDedaInputMutationDedaData);

    const isTodaysDeda = melpSummary?.unlocked_dedas[melpSummary?.unlocked_dedas.length - 1] === dedaId;
    // TODO - implement this logic here

    const dedaSteps = new Map([
        ['listen', <Listen key="listen" dedaId={dedaId} />],
        ['readRecord', <ReadRecord key="readRecord" dedaId={dedaId} />],
        ['watch', <Watch key="watch" dedaId={dedaId} />],
        ['listenRead', <ListenRead key="listenRead" dedaId={dedaId} />],
        ['write', <Write key="write" dedaId={dedaId} />],
        [
            'finish',
            <DedaActivitySummary
                defaultDedaTime={dedaTime}
                onInputs={(value) => {
                    setInputData(value);
                }}
                key="finish"
            />,
        ],
        ['completed', <DedaStepsCompleted key="completed" />],
    ]);

    const handlePreviousStep = () => {
        const previousStep = steps[steps.indexOf(currentStep) - 1];
        setCurrentStep(previousStep);
    };

    const handleNextStep = () => {
        if (currentStep === 'finish') {
            return handleFinishSave();
        }

        if (currentStep === 'completed') {
            router.push('/melp/deda');
            return;
        }

        const nextStep = steps[steps.indexOf(currentStep) + 1];
        setCurrentStep(nextStep);
    };

    const saveInput = useSaveDedaInput();

    function handleFinishSave() {
        const week = `week${melpSummary.unlocked_dedas.indexOf(dedaId)}`;
        const day = getDayToday();
        const userUid = user?.uid as string;

        saveInput.mutate(
            {
                userUid,
                week,
                day,
                inputData,
            },
            {
                onSuccess: () => {
                    setCurrentStep('completed');
                },
            },
        );
    }

    const indexOfCurrentStep = steps.indexOf(currentStep);

    return (
        <ActivityCard>
            <Flex justify="center" align="center" gap="1rem">
                {currentStep !== 'finish' && (
                    <StopWatch
                        onStop={(duration) => {
                            setDedaTime(duration);
                        }}
                    />
                )}

                <BreadCrumbs separator={<ChevronRight style={{ color: 'white', marginTop: '0.25rem' }} />}>
                    <Breadcrumb.Item>
                        <StepChip
                            stepName="Listen"
                            status={
                                stepsProgress.listen ? 'completed' : indexOfCurrentStep === 0 ? 'active' : undefined
                            }
                        />
                    </Breadcrumb.Item>
                    <Breadcrumb.Item>
                        <StepChip
                            stepName="Read + Record"
                            status={
                                stepsProgress.readRecord ? 'completed' : indexOfCurrentStep === 1 ? 'active' : undefined
                            }
                        />
                    </Breadcrumb.Item>
                    <Breadcrumb.Item>
                        <StepChip
                            stepName="Watch"
                            status={stepsProgress.watch ? 'completed' : indexOfCurrentStep === 2 ? 'active' : undefined}
                        />
                    </Breadcrumb.Item>
                    <Breadcrumb.Item>
                        <StepChip
                            stepName="Listen + Read"
                            status={
                                stepsProgress.listenRead ? 'completed' : indexOfCurrentStep === 3 ? 'active' : undefined
                            }
                        />
                    </Breadcrumb.Item>
                    <Breadcrumb.Item>
                        <StepChip
                            stepName="Write"
                            status={stepsProgress.write ? 'completed' : indexOfCurrentStep === 4 ? 'active' : undefined}
                        />
                    </Breadcrumb.Item>
                </BreadCrumbs>
            </Flex>

            {dedaSteps.get(currentStep)}

            <Flex justify="flex-end" align="center" gap="1rem">
                <Flex gap="0.5rem">
                    <NavButton disabled={currentStep === 'listen'} onClick={handlePreviousStep}>
                        <ChevronLeft />
                    </NavButton>
                    <NavButton onClick={handleNextStep}>
                        <ChevronRight />
                    </NavButton>
                </Flex>
                {!['finish', 'completed'].includes(currentStep) && (
                    <CompleteButton
                        type="primary"
                        disabled={stepsProgress[currentStep as keyof typeof stepsProgress] as boolean}
                        onClick={() => {
                            setStepsProgress((prev) => ({ ...prev, [currentStep]: true }));
                        }}
                    >
                        {(stepsProgress[currentStep as keyof typeof stepsProgress] as boolean)
                            ? 'Step completed 🎉'
                            : 'Complete step'}
                    </CompleteButton>
                )}
            </Flex>
        </ActivityCard>
    );
};
