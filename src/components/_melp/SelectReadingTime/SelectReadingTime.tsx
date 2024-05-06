'use client';

import styled from '@emotion/styled';
import { Select, SelectProps } from 'antd';
import { readingTimeList } from 'libs';
import React from 'react';

const StyledSelect = styled(Select)`
    width: 100%;
    border-radius: 1px !important;
`;

export const SelectReadingTime: React.FC<SelectProps> = (props) => {
    return (
        <StyledSelect options={readingTimeList.map((time) => ({ value: time.value, label: time.time }))} {...props} />
    );
};
