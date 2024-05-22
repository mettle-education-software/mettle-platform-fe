'use client';

import styled from '@emotion/styled';
import { Flex, Typography } from 'antd';
import { SaveDedaInputMutationDedaData } from 'hooks';
import { getClosestTimeListValue } from 'libs';
import React, { useCallback, useEffect, useState } from 'react';
import { DedaInput } from '../../DedaInput/DedaInput';

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
`;

const MaxContentWidth = styled.div`
    max-width: 573px;
`;

export const DedaActivitySummary = ({
    defaultDedaTime,
    onInputs,
}: {
    defaultDedaTime: number;
    onInputs(inputValue: SaveDedaInputMutationDedaData): void;
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
    const [dedaTime, setDedaTime] = useState<number>(getClosestTimeListValue(dedaTimeMin));
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

    return (
        <SummaryWrapper>
            <Flex justify="center">
                <MaxContentWidth>
                    <Flex vertical gap="1rem">
                        <Flex vertical align="center" gap="0.5rem">
                            <Title className="text" level={4}>
                                How is the QUALITY of your relationship to DEDA?
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
