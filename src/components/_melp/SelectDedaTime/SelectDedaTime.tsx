'use client';

import styled from '@emotion/styled';
import { Select, SelectProps } from 'antd';
import { dedaTimeList } from 'libs';
import React from 'react';

const StyledSelect = styled(Select)`
    width: 100%;
    border-radius: 1px !important;
`;

export const SelectDedaTime: React.FC<SelectProps> = (props) => {
    return <StyledSelect options={dedaTimeList.map((time) => ({ value: time.value, label: time.time }))} {...props} />;
};
