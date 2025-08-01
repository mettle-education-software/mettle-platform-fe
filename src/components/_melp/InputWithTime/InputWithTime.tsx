import { DownOutlined, UpOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Button, Col, Flex, Input, Modal, Row, Typography } from 'antd';
import { SMALL_VIEWPORT } from 'libs';
import React, { useEffect, useState } from 'react';

const { Text, Title } = Typography;

const TimeInputDisplay = styled(Input)`
    position: relative !important;
    z-index: 0 !important;
    border: 1px solid #888;
    background: transparent;
    color: #888;

    &:hover,
    &:focus {
        background: transparent;
        caret-color: transparent;
    }

    & ::before {
        content: 'Time' !important;
        position: absolute !important;
        font-size: 13px;
        background: #3c362f;
        color: #888;
        z-index: 3;
        padding: 0 8px;
        top: -8px;
        left: 17px;
    }
`;

const TimeInput = styled(Input)`
    margin: 0 !important;
    height: 4rem;
    font-size: 2rem;
    max-width: 5rem;
    text-align: center;
`;

const ClockWrapper = styled.div`
    padding: 5rem 0;
`;

const LabelText = styled(Text)`
    color: #fff;
    font-weight: normal;
    font-size: 20px;
    line-height: 130%;

    @media (max-width: ${SMALL_VIEWPORT}px) {
        font-size: small;
    }
`;

export interface InputWithTimeProps {
    label?: string | React.ReactNode;
    value: number;

    onChange(value: number): void;
}

export const InputWithTime: React.FC<InputWithTimeProps> = ({ label, value, onChange }) => {
    const [hourValue, setHourValue] = useState<number>(Math.floor(value / 60));
    const [minuteValue, setMinuteValue] = useState<number>(value % 60);
    const [modalOpen, setModalOpen] = useState(false);
    const [hourDisplayValue, setHourDisplayValue] = useState<string>(hourValue.toString().padStart(2, '0'));
    const [minuteDisplayValue, setMinuteDisplayValue] = useState<string>(minuteValue.toString().padStart(2, '0'));

    useEffect(() => {
        setHourDisplayValue(hourValue.toString().padStart(2, '0'));
        setMinuteDisplayValue(minuteValue.toString().padStart(2, '0'));
    }, [hourValue, minuteValue]);

    const showModal = () => {
        setModalOpen(true);
    };

    const handleOk = () => {
        setModalOpen(false);
        onChange(hourValue * 60 + minuteValue);
    };

    const handleCancel = () => {
        setModalOpen(false);
        const hour = Math.floor(value / 60);
        const minute = value % 60;

        setHourValue(hour);
        setMinuteValue(minute);
    };

    useEffect(() => {
        const hour = Math.floor(value / 60);
        const minute = value % 60;

        setHourValue(hour);
        setMinuteValue(minute);
    }, [value]);

    const handleHourValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const valueAsNumber = Number(event.target.value);
        if (/^\d{1,2}$/.test(valueAsNumber.toString())) {
            setHourValue(valueAsNumber);
        }
        if (event.target.value === '') {
            setHourValue(0);
        }
    };
    const handleMinuteValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const valueAsNumber = Number(event.target.value);
        if (/^\d{1,2}$/.test(valueAsNumber.toString()) && valueAsNumber <= 59) {
            setMinuteValue(valueAsNumber);
        }
        if (event.target.value === '') {
            setMinuteValue(0);
        }
        if (valueAsNumber > 59) {
            setMinuteValue(59);
        }
    };

    return (
        <Row>
            <Col span={16}>
                <LabelText>{label}</LabelText>
            </Col>
            <Col span={8}>
                <TimeInputDisplay
                    id="time-display"
                    value={`${hourValue.toString().padStart(2, '0')}:${minuteValue.toString().padStart(2, '0')}`}
                    onClick={() => {
                        showModal();
                    }}
                />
                <Modal open={modalOpen} onOk={handleOk} onCancel={handleCancel} title={label}>
                    <ClockWrapper>
                        <Row align="middle" justify="center" gutter={16}>
                            <Col>
                                <Flex vertical gap="0.5rem" align="center">
                                    <Button
                                        onClick={() => {
                                            setHourValue((previousHourValue) => previousHourValue + 1);
                                        }}
                                    >
                                        <UpOutlined />
                                    </Button>
                                    <TimeInput value={hourDisplayValue} min={0} onChange={handleHourValueChange} />
                                    <Button
                                        disabled={hourValue === 0}
                                        onClick={() => {
                                            setHourValue((previousHourValue) => previousHourValue - 1);
                                        }}
                                    >
                                        <DownOutlined />
                                    </Button>
                                </Flex>
                            </Col>
                            <Col span={1}>
                                <Title style={{ marginTop: '-12px' }} level={1}>
                                    :
                                </Title>
                            </Col>
                            <Col>
                                <Flex vertical gap="0.5rem" align="center">
                                    <Button
                                        disabled={minuteValue >= 45}
                                        onClick={() => {
                                            const minuteValueMod = minuteValue % 15;

                                            if (minuteValueMod === 0) {
                                                setMinuteValue((previousMinuteValue) => previousMinuteValue + 15);
                                            } else {
                                                setMinuteValue(
                                                    (previousMinuteValue) => previousMinuteValue + 15 - minuteValueMod,
                                                );
                                            }
                                        }}
                                    >
                                        <UpOutlined />
                                    </Button>
                                    <TimeInput
                                        value={minuteDisplayValue}
                                        min={0}
                                        max={59}
                                        onChange={handleMinuteValueChange}
                                    />
                                    <Button
                                        disabled={minuteValue === 0}
                                        onClick={() => {
                                            const minuteValueMod = minuteValue % 15;

                                            if (minuteValueMod === 0) {
                                                setMinuteValue((previousMinuteValue) => previousMinuteValue - 15);
                                            } else {
                                                setMinuteValue(
                                                    (previousMinuteValue) => previousMinuteValue - minuteValueMod,
                                                );
                                            }
                                        }}
                                    >
                                        <DownOutlined />
                                    </Button>
                                </Flex>
                            </Col>
                        </Row>
                    </ClockWrapper>
                </Modal>
            </Col>
        </Row>
    );
};
