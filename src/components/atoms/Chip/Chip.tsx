'use client';

import styled from '@emotion/styled';
import { Tag } from 'antd';
import React from 'react';

const ChipTag = styled(Tag)<{ size?: string }>`
    border-radius: 100rem;
    ${({ size }) => (size === 'small' ? 'padding: 0 0.5rem;' : 'padding: 0.5rem 1rem;')}
`;

export const Chip: React.FC<React.HTMLAttributes<HTMLDivElement> & { size?: 'small' | 'large' }> = ({
    size = 'small',
    ...props
}) => {
    return (
        <ChipTag size={size} className={props.className}>
            {props.children}
        </ChipTag>
    );
};
