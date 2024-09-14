'use client';

import { CheckCircleFilled, CheckCircleOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { ChevronLeft, ChevronRight, Timer, TimerOff } from '@mui/icons-material';
import { Breadcrumb, Button, Col, Flex, Row, Tooltip, Typography } from 'antd';
import { DedaNavButton } from 'components';
import { SaveDedaInputMutationDedaData, useConfetti, useDeviceSize, useSaveDedaInput } from 'hooks';
import { getDayToday, padNumber } from 'libs';
import { useRouter } from 'next/navigation';
import { useAppContext, useMelpContext } from 'providers';
import React, { useCallback, useEffect, useState } from 'react';
import { DedaActivitySummary, DedaStepsCompleted, Listen, ListenRead, ReadRecord, Watch, Write } from './steps';

const { Text } = Typography;

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

    &.highlighted {
        background: var(--secondary);
    }

    .active-icon {
        color: var(--secondary);
    }

    .text {
        color: #fff;
        white-space: nowrap;
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
    border: 1px solid rgba(255, 255, 255, 0.05);

    &[disabled] {
        border: 1px solid rgba(255, 255, 255, 0.05);
        color: grey;
    }
`;

const MobileNavigationHeaderRow = styled.div`
    width: 100%;
    display: flex;
    justify-content: center;
    position: sticky;
    top: 0;
    z-index: 1;
    background: #eae8e2;
    gap: 0;
    align-items: center;
    max-width: 100vw;
    height: 4rem;
    padding: 0;

    .button-item {
        flex-grow: 1;
    }
`;

const MobileBottomNavigationRow = styled.div`
    width: 100%;
    position: fixed;
    bottom: 0;
    z-index: 1;
    background: var(--brown-bg);
    padding: 0.5rem;
`;

const StepChip = ({
    status,
    stepName,
    type,
}: {
    status?: 'completed' | 'active' | 'highlighted';
    stepName: string;
    type: 'step' | 'chip';
}) => (
    <ChipWrapper className={status}>
        {type === 'step' ? (
            status === 'completed' ? (
                <CheckCircleFilled className="active-icon" />
            ) : (
                <CheckCircleOutlined className="icon" />
            )
        ) : null}
        <Text className="text">{stepName}</Text>
    </ChipWrapper>
);

const StopWatch = ({ onStop }: { onStop(duration: number): void }) => {
    const [stopwatch, setStopwatch] = useState(0);
    const [isOpen, setIsOpen] = useState(true);
    const [tooltipOpen, setTooltipOpen] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => setStopwatch((prev) => prev + 1), 1000);
        return () => {
            clearInterval(interval);
            onStop(stopwatch);
        };
    }, [stopwatch, onStop]);

    useEffect(() => {
        const tooltipTimeout = setTimeout(() => setTooltipOpen(false), 5000);
        return () => {
            clearTimeout(tooltipTimeout);
        };
    }, []);

    return (
        <Tooltip title="Your time has started and it will be tracked" open={tooltipOpen}>
            <ChipWrapper>
                <Flex justify="flex-end" align="center" gap="0.6rem">
                    {isOpen && (
                        <Text className="text">
                            {padNumber(Math.floor(stopwatch / 3600))}:
                            {padNumber(Math.floor(stopwatch / 60) - Math.floor(stopwatch / 3600) * 60)}:
                            {padNumber(stopwatch % 60)}
                        </Text>
                    )}
                    {isOpen ? (
                        <Timer style={{ cursor: 'pointer' }} className="icon" onClick={() => setIsOpen(false)} />
                    ) : (
                        <TimerOff style={{ cursor: 'pointer' }} className="icon" onClick={() => setIsOpen(true)} />
                    )}
                </Flex>
            </ChipWrapper>
        </Tooltip>
    );
};

const steps = ['listen', 'readRecord', 'watch', 'listenRead', 'write', 'finish', 'completed'];

enum Steps {
    listen = '1. Listen',
    readRecord = '2. Read + Record',
    watch = '3. Watch',
    listenRead = '4. Listen + Read',
    write = '5. Write',
    finish = 'Finish',
    completed = 'Completed',
}

export const DedaSteps: React.FC<{ dedaId: string }> = ({ dedaId }) => {
    const router = useRouter();
    const device = useDeviceSize();
    const isDesktop = device === 'desktop';
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

    const saveInput = useSaveDedaInput();

    const { shootStars } = useConfetti();

    const handleFinishSave = () => {
        const week = `week${melpSummary.unlocked_dedas.indexOf(dedaId)}`;
        const day = getDayToday();
        const userUid = user?.uid as string;

        saveInput.mutate(
            { userUid, week, day, inputData },
            {
                onSuccess: () => {
                    setCurrentStep('completed');
                    shootStars();
                },
            },
        );
    };

    const isTodaysDeda = melpSummary?.unlocked_dedas[melpSummary?.unlocked_dedas.length - 1] === dedaId;
    const isTodaysDedaAndNotCompleted = isTodaysDeda && !isTodaysDedaCompleted;

    const [hasPlayStarted, setHasPlayStarted] = useState(false);
    const handleDedaListenStart = useCallback(() => {
        setHasPlayStarted(true);
    }, []);

    const handleStepChange = (direction: 'next' | 'previous') => {
        const currentIndex = steps.indexOf(currentStep);
        const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
        const newStep = steps[newIndex];

        if (newStep === 'finish' && !isTodaysDedaAndNotCompleted) {
            handleFinishSave();
        } else if (newStep === 'completed') {
            router.push('/melp/deda');
        } else {
            setCurrentStep(newStep);
        }
    };

    const indexOfCurrentStep = steps.indexOf(currentStep);
    const isNotWeekZero = !['CAN_START_DEDA', 'WEEK_ZERO'].includes(melpSummary.melp_status);
    const showStopwatch =
        isTodaysDedaAndNotCompleted &&
        !['finish', 'completed'].includes(currentStep) &&
        hasPlayStarted &&
        isNotWeekZero;

    const dedaSteps = {
        listen: (
            <Listen
                key="listen"
                dedaId={dedaId}
                onListenPlay={handleDedaListenStart}
                isTodaysDedaAndNotCompleted={isTodaysDedaAndNotCompleted}
                dedaOngoing={showStopwatch}
            />
        ),
        readRecord: <ReadRecord key="readRecord" dedaId={dedaId} />,
        watch: <Watch key="watch" dedaId={dedaId} />,
        listenRead: <ListenRead key="listenRead" dedaId={dedaId} />,
        write: <Write key="write" dedaId={dedaId} />,
        finish: (
            <DedaActivitySummary
                defaultDedaTime={dedaTime}
                onInputs={setInputData}
                key="finish"
                isDedaCompleted={!isTodaysDedaAndNotCompleted}
                loading={saveInput.isPending}
            />
        ),
        completed: <DedaStepsCompleted key="completed" dedaId={dedaId} />,
    };

    if (!isDesktop) {
        return (
            <>
                <MobileNavigationHeaderRow>
                    {/* TODO - Maybe have this logic in a .map*/}
                    <DedaNavButton className={indexOfCurrentStep === 0 ? 'active' : undefined}>Listen</DedaNavButton>
                    <DedaNavButton
                        disabled={indexOfCurrentStep < 1}
                        className={indexOfCurrentStep === 1 ? 'active' : undefined}
                    >
                        Read + Record
                    </DedaNavButton>
                    <DedaNavButton
                        disabled={indexOfCurrentStep < 2}
                        className={indexOfCurrentStep === 2 ? 'active' : undefined}
                    >
                        Watch
                    </DedaNavButton>
                    <DedaNavButton
                        disabled={indexOfCurrentStep < 3}
                        className={indexOfCurrentStep === 3 ? 'active' : undefined}
                    >
                        Listen + Read
                    </DedaNavButton>
                    <DedaNavButton
                        disabled={indexOfCurrentStep < 4}
                        className={indexOfCurrentStep === 4 ? 'active' : undefined}
                    >
                        Write
                    </DedaNavButton>
                    {isTodaysDedaAndNotCompleted && (
                        <DedaNavButton
                            disabled={indexOfCurrentStep < 5}
                            className={indexOfCurrentStep === 5 ? 'active' : undefined}
                        >
                            Summary
                        </DedaNavButton>
                    )}
                </MobileNavigationHeaderRow>
                {dedaSteps[currentStep as keyof typeof dedaSteps]}
                <MobileBottomNavigationRow>
                    <Row align="middle" gutter={8}>
                        {isTodaysDedaAndNotCompleted && (
                            <Col span={8}>
                                {showStopwatch && (
                                    <StopWatch
                                        onStop={(stopwatchValue) => {
                                            setDedaTime(stopwatchValue);
                                        }}
                                    />
                                )}
                            </Col>
                        )}
                        {!['finish', 'completed'].includes(currentStep) && (
                            <Col span={isTodaysDedaAndNotCompleted ? 4 : 24}>
                                <Flex justify="flex-end" align="center" gap="0.5rem">
                                    <NavButton
                                        disabled={currentStep === 'listen'}
                                        onClick={() => handleStepChange('previous')}
                                    >
                                        <ChevronLeft />
                                    </NavButton>
                                    <NavButton
                                        onClick={() => handleStepChange('next')}
                                        disabled={
                                            !isTodaysDeda || !isTodaysDedaAndNotCompleted
                                                ? currentStep === 'write'
                                                : !stepsProgress[currentStep as keyof typeof stepsProgress]
                                        }
                                    >
                                        <ChevronRight />
                                    </NavButton>
                                </Flex>
                            </Col>
                        )}
                        {!['finish', 'completed'].includes(currentStep) && isTodaysDedaAndNotCompleted && (
                            <Col span={12}>
                                <CompleteButton
                                    block
                                    type="primary"
                                    disabled={
                                        !!stepsProgress[currentStep as keyof typeof stepsProgress] || !hasPlayStarted
                                    }
                                    onClick={() => {
                                        setStepsProgress((prev) => ({
                                            ...prev,
                                            [currentStep]: true,
                                        }));
                                        handleStepChange('next');
                                    }}
                                >
                                    {stepsProgress[currentStep as keyof typeof stepsProgress]
                                        ? 'Step completed 🎉'
                                        : currentStep === 'write'
                                          ? 'Finish'
                                          : 'Complete step'}
                                </CompleteButton>
                            </Col>
                        )}
                        {currentStep === 'finish' && (
                            <Col span={24}>
                                <Flex justify="center">
                                    <CompleteButton
                                        loading={saveInput.isPending}
                                        type="primary"
                                        onClick={handleFinishSave}
                                    >
                                        Complete DEDA
                                    </CompleteButton>
                                </Flex>
                            </Col>
                        )}
                    </Row>
                </MobileBottomNavigationRow>
            </>
        );
    }

    return (
        <ActivityCard>
            {isDesktop && (
                <Flex justify="center" align="center" gap="1rem">
                    {showStopwatch && (
                        <StopWatch
                            onStop={(stopwatchValue) => {
                                setDedaTime(stopwatchValue);
                            }}
                        />
                    )}
                    <BreadCrumbs separator={<ChevronRight style={{ color: 'white', marginTop: '0.25rem' }} />}>
                        {steps.slice(0, 5).map((step, index) => (
                            <Breadcrumb.Item key={step}>
                                <StepChip
                                    type="step"
                                    stepName={Steps[step as keyof typeof Steps]}
                                    status={
                                        isTodaysDedaCompleted
                                            ? undefined
                                            : stepsProgress[step as keyof typeof stepsProgress]
                                              ? 'completed'
                                              : indexOfCurrentStep === index
                                                ? 'active'
                                                : undefined
                                    }
                                />
                            </Breadcrumb.Item>
                        ))}
                    </BreadCrumbs>
                </Flex>
            )}
            {/* Refactor this mobile logic out */}
            {!isDesktop && (
                <Flex justify="space-between">
                    <StepChip
                        type="chip"
                        stepName={Steps[currentStep as keyof typeof Steps]}
                        status={
                            isTodaysDedaCompleted
                                ? undefined
                                : stepsProgress[currentStep as keyof typeof stepsProgress]
                                  ? 'completed'
                                  : 'active'
                        }
                    />
                    {isTodaysDedaAndNotCompleted && !['finish', 'completed'].includes(currentStep) && (
                        <StopWatch
                            onStop={(stopwatchValue) => {
                                setDedaTime(stopwatchValue);
                            }}
                        />
                    )}
                </Flex>
            )}
            {dedaSteps[currentStep as keyof typeof dedaSteps]}
            <Flex justify="flex-end" align="center" gap="1rem">
                {currentStep === 'completed' ? (
                    <CompleteButton type="primary" href="/melp/deda">
                        Go back
                    </CompleteButton>
                ) : (
                    !saveInput.isPending && (
                        <Flex gap="0.5rem">
                            <NavButton disabled={currentStep === 'listen'} onClick={() => handleStepChange('previous')}>
                                <ChevronLeft />
                            </NavButton>
                            <NavButton
                                onClick={() => handleStepChange('next')}
                                disabled={
                                    !isTodaysDeda || !isTodaysDedaAndNotCompleted || !isNotWeekZero
                                        ? currentStep === 'write'
                                        : !stepsProgress[currentStep as keyof typeof stepsProgress]
                                }
                            >
                                <ChevronRight />
                            </NavButton>
                        </Flex>
                    )
                )}
                {!['finish', 'completed'].includes(currentStep) && isTodaysDedaAndNotCompleted && isNotWeekZero && (
                    <CompleteButton
                        type="primary"
                        disabled={!!stepsProgress[currentStep as keyof typeof stepsProgress] || !hasPlayStarted}
                        onClick={() => {
                            setStepsProgress((prev) => ({
                                ...prev,
                                [currentStep]: true,
                            }));
                            handleStepChange('next');
                        }}
                    >
                        {stepsProgress[currentStep as keyof typeof stepsProgress]
                            ? 'Step completed 🎉'
                            : currentStep === 'write'
                              ? 'Finish'
                              : 'Complete step'}
                    </CompleteButton>
                )}
                {currentStep === 'finish' && (
                    <CompleteButton loading={saveInput.isPending} type="primary" onClick={handleFinishSave}>
                        Complete DEDA
                    </CompleteButton>
                )}
            </Flex>
        </ActivityCard>
    );
};
