'use client';

import styled from '@emotion/styled';
import { ConfigProvider, Select as AntSelect, SelectProps } from 'antd';
import { useMelpContext } from 'providers/MelpProvider';
import React, { useEffect, useMemo, useState } from 'react';

const Select = styled(AntSelect)`
    position: relative;
    z-index: 0;

    &.ant-select {
        .ant-select-arrow {
            color: #888 !important;
        }

        .ant-select-clear {
            color: var(--secondary) !important;
        }

        .ant-select-item-option-selected {
            background-color: #ffffff !important;
        }
    }

    &::before {
        content: 'Day';
        position: absolute;
        font-size: 13px;
        background: #3c362f;
        color: #888;
        z-index: 1;
        padding: 0 8px;
        top: -8px;
        left: 17px;
    }
`;

export const DedaWeekDaySelect: React.FC<SelectProps & { selectedWeek?: string }> = ({ selectedWeek, ...props }) => {
    const { melpSummary } = useMelpContext();

    const weekDays = useMemo(
        () => [
            { label: 'Monday', value: 'day1' },
            { label: 'Tuesday', value: 'day2' },
            { label: 'Wednesday', value: 'day3' },
            { label: 'Thursday', value: 'day4' },
            { label: 'Friday', value: 'day5' },
            { label: 'Saturday', value: 'day6' },
            { label: 'Sunday', value: 'day7' },
        ],
        [],
    );

    const [options, setOptions] = useState(weekDays);
    const [value, setValue] = useState(props.value);

    useEffect(() => {
        if (selectedWeek && melpSummary) {
            const weekNumber = Number(selectedWeek.split('week')[1]);
            if (melpSummary.current_deda_week === weekNumber) {
                const today = new Date().getDay() === 0 ? 7 : new Date().getDay();
                const filteredDays = weekDays.filter((_, index) => index + 1 <= today);

                setOptions(filteredDays);

                const valueDay = Number(value.split('day')[1]);
                if (valueDay > today) {
                    setValue(`day${today}`);
                }
            } else {
                setOptions(weekDays);
            }
        }
    }, [selectedWeek, melpSummary, weekDays]);

    useEffect(() => {
        if (props.onChange) {
            props.onChange(value, options);
        }
    }, [value]);

    return (
        <ConfigProvider
            theme={{
                components: {
                    Select: {
                        clearBg: 'transparent',
                        selectorBg: 'transparent',
                        colorTextPlaceholder: 'var(--secondary)',
                        colorBorder: '#888',
                        colorText: '#888',
                    },
                },
            }}
        >
            <div style={{ padding: '1rem 0' }}>
                <Select
                    {...props}
                    onChange={(value) => {
                        setValue(value);
                    }}
                    value={value}
                    size="large"
                    style={{ width: 300 }}
                    placeholder="Select DEDA day"
                    options={options}
                />
            </div>
        </ConfigProvider>
    );
};
