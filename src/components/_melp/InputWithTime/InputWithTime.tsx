import styled from '@emotion/styled';
import { Col, Row, TimePicker, Typography, Space, InputNumber } from 'antd';
// import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';

const { Text } = Typography;

const MelpTimePicker = styled(InputNumber)`
    border-radius: 2px !important;
`;

export const InputWithTime = ({
    label,
    value,
    onChange,
}: {
    label: string | React.ReactNode;
    value: number;
    onChange(value: number): void;
}) => {
    const [hourValue, setHourValue] = useState<number>(Math.floor(value / 60));
    const [minuteValue, setMinuteValue] = useState<number>(value % 60);

    useEffect(() => {
        const hour = Math.floor(value / 60);
        const minute = value % 60;

        setHourValue(hour);
        setMinuteValue(minute);
    }, [value]);

    return (
        <Row>
            <Col span={16}>
                <Text style={{ color: '#FFF', fontWeight: 700, fontSize: '20px', lineHeight: '130%' }}>{label}</Text>
            </Col>
            <Col span={8}>
                <Space.Compact block>
                    <MelpTimePicker
                        value={hourValue}
                        onChange={(pickerValue) => {
                            const timeInMinutes = !!pickerValue
                                ? (pickerValue as number) * 60 + minuteValue
                                : minuteValue;
                            onChange(timeInMinutes);
                        }}
                        min={0}
                        max={5}
                        formatter={(value) => (value ? `${(value as number) < 10 ? '0' + value : value}h` : '0h')}
                    />

                    <MelpTimePicker
                        value={minuteValue}
                        onChange={(pickerValue) => {
                            const timeInMinutes = !!pickerValue
                                ? hourValue * 60 + (pickerValue as number)
                                : hourValue * 60;
                            onChange(timeInMinutes);
                        }}
                        min={0}
                        max={59}
                        formatter={(value) => (value ? `${(value as number) < 10 ? '0' + value : value}min` : '0min')}
                    />
                </Space.Compact>
                {/*<Select*/}
                {/*    value={value}*/}
                {/*    onChange={onChange}*/}
                {/*    options={timeList.map((time) => ({ label: time.time, value: time.value }))}*/}
                {/*/>*/}
                {/*<MelpTimePicker*/}
                {/*    value={dayjs().startOf('day').add(value, 'minutes')}*/}
                {/*    onOk={(value) => {*/}
                {/*        const timeInMinutes = value?.hour() * 60 + value?.minute();*/}
                {/*        onChange(timeInMinutes);*/}
                {/*    }}*/}
                {/*    format="HH:mm"*/}
                {/*    showNow={false}*/}
                {/*/>*/}
            </Col>
        </Row>
    );
};
