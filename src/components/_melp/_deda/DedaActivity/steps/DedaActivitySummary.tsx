'use client';

import styled from '@emotion/styled';
import { Flex, Skeleton, Typography } from 'antd';
import { withDedaActivity } from 'components/HOCs';
import { SaveDedaInputMutationDedaData } from 'hooks';
import { SMALL_VIEWPORT } from 'libs';
import React, { useCallback, useEffect, useState } from 'react';
import { DedaInput } from '../../../DedaInput/DedaInput';

const { Text, Title } = Typography;

const SummaryWrapper = styled.div`
    width: 100%;
    background: rgba(255, 255, 255, 0.05);
    padding: 2rem;
    border-radius: 0.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;

    .text {
        color: #ffffff;
    }

    @media (max-width: ${SMALL_VIEWPORT}px) {
        background: var(--main-bg);
        border-radius: unset;
        padding-bottom: 5rem;
    }
`;

const MaxContentWidth = styled.div`
    max-width: 573px;
`;

const DedaActivitySummaryRaw = ({
    defaultDedaTime,
    onInputs,
    loading,
}: {
    defaultDedaTime: number;
    onInputs(inputValue: SaveDedaInputMutationDedaData): void;
    loading: boolean;
}) => {
    const dedaTimeMin = Math.floor(defaultDedaTime / 60);

    const [dedaInputData, setDedaInputData] = useState<Omit<SaveDedaInputMutationDedaData, 'readingTime' | 'dedaTime'>>(
        {
            dedaPredPlace: 0,
            dedaSteps: 0,
            dedaStateMind: 0,
            dedaStateBeing: 0,
            dedaFocus: 0,
        },
    );
    const [dedaTime, setDedaTime] = useState<number>(dedaTimeMin);
    const [readingTime, setReadingTime] = useState<number>(0);

    const handleRateChange = (value: number, key: string) => {
        setDedaInputData((previousInputData) => ({
            ...previousInputData,
            [key]: value,
        }));
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const onInputsCallback = useCallback(onInputs, []);

    useEffect(() => {
        onInputsCallback({
            ...dedaInputData,
            dedaTime,
            readingTime,
        });
    }, [dedaInputData, dedaTime, readingTime, onInputsCallback]);

    if (loading) return <Skeleton active loading />;

    return (
        <SummaryWrapper>
            <Flex justify="center">
                <MaxContentWidth>
                    <Flex vertical gap="1rem">
                        <Flex vertical align="center" gap="0.5rem">
                            <Title className="text" level={4}>
                                Rate the quality of your DEDA study session today.
                            </Title>
                            <Text className="text">
                                (From 1 to 5, score the quality of each of the five variables for the day.)
                            </Text>
                        </Flex>
                        <DedaInput
                            dedaInputData={dedaInputData}
                            dedaTime={dedaTime}
                            readingTime={readingTime}
                            setDedaTime={setDedaTime}
                            setReadingTime={setReadingTime}
                            handleRateChange={handleRateChange}
                        />
                    </Flex>
                </MaxContentWidth>
            </Flex>
        </SummaryWrapper>
    );
};

export const DedaActivitySummary = withDedaActivity(DedaActivitySummaryRaw);
