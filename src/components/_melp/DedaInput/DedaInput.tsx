import styled from '@emotion/styled';
import { Row, Col, Rate, Typography } from 'antd';
import { Flex } from 'antd';
import { InputWithTime } from 'components';
import React, { Dispatch, SetStateAction } from 'react';
import { InputsWrapper } from '../InputsWrapper/InputsWrapper';
import { SelectDedaTime } from '../SelectDedaTime/SelectDedaTime';
import { SelectReadingTime } from '../SelectReadingTime/SelectReadingTime';

const { Text } = Typography;

interface DedaRateInputProps {
    label: string;
    value: number;
    onChange: (value: number) => void;
}

const dedaRatings = ['Terrible', 'Bad', 'Normal', 'Good', 'Wonderful'];

const DedaRateInputWrapper = styled.div`
    width: 100%;

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

export const DedaRateInput: React.FC<DedaRateInputProps> = ({ label, value, onChange }) => (
    <DedaRateInputWrapper>
        <Row>
            <Col span={14}>
                <Text className="input-variable-text">{label}</Text>
            </Col>
            <Col span={10}>
                <Flex justify="flex-end">
                    <Rate
                        className="ant-rate-star-first"
                        tooltips={dedaRatings}
                        onChange={(value) => onChange(value)}
                        value={value}
                    />
                </Flex>
            </Col>
        </Row>
    </DedaRateInputWrapper>
);

interface DedaInputProps {
    dedaInputData: any;
    handleRateChange: (value: number, key: string) => void;
    dedaTime: number;
    readingTime: number;
    setDedaTime: Dispatch<SetStateAction<number>>;
    setReadingTime: Dispatch<SetStateAction<number>>;
}

export const DedaInput: React.FC<DedaInputProps> = ({
    handleRateChange,
    dedaInputData,
    dedaTime,
    readingTime,
    setDedaTime,
    setReadingTime,
}) => {
    return (
        <>
            <InputsWrapper>
                <DedaRateInput
                    label="Predetermined Place/Time"
                    onChange={(value) => {
                        handleRateChange(value, 'dedaPredPlace');
                    }}
                    value={dedaInputData.dedaPredPlace}
                />
                <DedaRateInput
                    label="Five steps (DEEP)"
                    onChange={(value) => {
                        handleRateChange(value, 'dedaSteps');
                    }}
                    value={dedaInputData.dedaSteps}
                />
                <DedaRateInput
                    label="State of mind"
                    onChange={(value) => {
                        handleRateChange(value, 'dedaStateMind');
                    }}
                    value={dedaInputData.dedaStateMind}
                />
                <DedaRateInput
                    label="State of being"
                    onChange={(value) => {
                        handleRateChange(value, 'dedaStateBeing');
                    }}
                    value={dedaInputData.dedaStateBeing}
                />
                <DedaRateInput
                    label="Focus"
                    onChange={(value) => {
                        handleRateChange(value, 'dedaFocus');
                    }}
                    value={dedaInputData.dedaFocus}
                />
            </InputsWrapper>
            <InputsWrapper>
                <InputWithTime
                    label={
                        <Text className="color-white" style={{ fontWeight: 700, fontSize: '1.2rem' }}>
                            Enter the <span className="highlight color-secondary">Reading Time</span>
                        </Text>
                    }
                    value={readingTime}
                    onChange={(readingTimeValue) => {
                        setReadingTime(readingTimeValue);
                    }}
                />
                <InputWithTime
                    label={
                        <Text className="color-white" style={{ fontWeight: 700, fontSize: '1.2rem' }}>
                            Enter the <span className="highlight color-secondary">DEDA Time</span>
                        </Text>
                    }
                    value={dedaTime}
                    onChange={(dedaTimeValue) => {
                        setDedaTime(dedaTimeValue);
                    }}
                />
            </InputsWrapper>
        </>
    );
};
