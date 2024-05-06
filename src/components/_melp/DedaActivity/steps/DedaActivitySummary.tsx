'use client';

import styled from '@emotion/styled';
import { Flex, Typography, Row, Col, Rate } from 'antd';
import { SelectDedaTime } from 'components/_melp/SelectDedaTime/SelectDedaTime';
import { SelectReadingTime } from 'components/_melp/SelectReadingTime/SelectReadingTime';
import { SaveDedaInputMutationDedaData } from 'hooks/melp/lamp';
import { getClosestTimeListValue } from 'libs';
import React, { useCallback, useEffect, useState } from 'react';

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

    .highlight {
        color: var(--secondary);
    }

    .input-variable-text {
        font-size: 20px;
        font-style: normal;
        font-weight: 700;
        line-height: 130%;
        color: #ffffff;
    }

    .input-time-text {
        font-size: 20px;
        font-style: normal;
        font-weight: 400;
        line-height: 130%;
        color: #ffffff;
    }

    .ant-rate-star-first {
        color: var(--secondary) !important;
    }

    .ant-rate-star-second {
        color: #ffffff;
    }
`;

const InputsWrapper = styled.div`
    border-radius: 0.5rem;
    background: rgba(242, 240, 238, 0.05);
    padding: 1.5rem 1rem;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 25px;
`;

const MaxContentWidth = styled.div`
    max-width: 573px;
`;

const dedaRatings = ['Terrible', 'Bad', 'Normal', 'Good', 'Wonderful'];

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

    const handleRateChange = (value: number, key: keyof typeof dedaInputData) => {
        setDedaInputData((previousInputData) => ({
            ...previousInputData,
            [key]: value,
        }));
    };

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
                        <InputsWrapper>
                            <Row>
                                <Col span={16}>
                                    <Text className="input-variable-text">Predetermined Place/Time</Text>
                                </Col>
                                <Col span={8}>
                                    <Flex justify="flex-end">
                                        <Rate
                                            className="ant-rate-star-first"
                                            tooltips={dedaRatings}
                                            onChange={(value) => {
                                                handleRateChange(value, 'dedaPredPlace');
                                            }}
                                            value={dedaInputData.dedaPredPlace}
                                        />
                                    </Flex>
                                </Col>
                            </Row>
                            <Row>
                                <Col span={16}>
                                    <Text className="input-variable-text">Five steps (DEEP)</Text>
                                </Col>
                                <Col span={8}>
                                    <Flex justify="flex-end">
                                        <Rate
                                            className="ant-rate-star-first"
                                            tooltips={dedaRatings}
                                            onChange={(value) => {
                                                handleRateChange(value, 'dedaSteps');
                                            }}
                                            value={dedaInputData.dedaSteps}
                                        />
                                    </Flex>
                                </Col>
                            </Row>
                            <Row>
                                <Col span={16}>
                                    <Text className="input-variable-text">State of mind</Text>
                                </Col>
                                <Col span={8}>
                                    <Flex justify="flex-end">
                                        <Rate
                                            className="ant-rate-star-first"
                                            tooltips={dedaRatings}
                                            onChange={(value) => {
                                                handleRateChange(value, 'dedaStateMind');
                                            }}
                                            value={dedaInputData.dedaStateMind}
                                        />
                                    </Flex>
                                </Col>
                            </Row>
                            <Row>
                                <Col span={16}>
                                    <Text className="input-variable-text">State of being</Text>
                                </Col>
                                <Col span={8}>
                                    <Flex justify="flex-end">
                                        <Rate
                                            className="ant-rate-star-first"
                                            tooltips={dedaRatings}
                                            onChange={(value) => {
                                                handleRateChange(value, 'dedaStateBeing');
                                            }}
                                            value={dedaInputData.dedaStateBeing}
                                        />
                                    </Flex>
                                </Col>
                            </Row>
                            <Row>
                                <Col span={16}>
                                    <Text className="input-variable-text">Focus</Text>
                                </Col>
                                <Col span={8}>
                                    <Flex justify="flex-end">
                                        <Rate
                                            className="ant-rate-star-first"
                                            tooltips={dedaRatings}
                                            onChange={(value) => {
                                                handleRateChange(value, 'dedaFocus');
                                            }}
                                            value={dedaInputData.dedaFocus}
                                        />
                                    </Flex>
                                </Col>
                            </Row>
                        </InputsWrapper>
                        <InputsWrapper>
                            <Row>
                                <Col span={16}>
                                    <Text className="input-time-text">
                                        Enter the <span className="highlight">Reading Time</span>
                                    </Text>
                                </Col>
                                <Col span={8}>
                                    <SelectReadingTime
                                        value={readingTime}
                                        onChange={(readingTimeValue) => {
                                            setReadingTime(readingTimeValue);
                                        }}
                                    />
                                </Col>
                            </Row>
                            <Row>
                                <Col span={16}>
                                    <Text className="input-time-text">
                                        Enter the <span className="highlight">DEDA Time</span>
                                    </Text>
                                </Col>
                                <Col span={8}>
                                    <SelectDedaTime
                                        value={dedaTime}
                                        onChange={(dedaTimeValue) => {
                                            setDedaTime(dedaTimeValue);
                                        }}
                                    />
                                </Col>
                            </Row>
                        </InputsWrapper>
                    </Flex>
                </MaxContentWidth>
            </Flex>
        </SummaryWrapper>
    );
};
