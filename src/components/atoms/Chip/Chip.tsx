'use client';

import styled from '@emotion/styled';
import { Tag } from 'antd';
import React from 'react';

const ChipTag = styled(Tag)<{ size?: string; bgcolor?: string }>`
    border-radius: 100rem;
    ${({ size }) => (size === 'small' ? 'padding: 0 0.5rem;' : 'padding: 0.5rem 1rem;')}
    ${({ bgcolor }) => (bgcolor ? `background-color: ${bgcolor};` : '')}
`;

export const Chip: React.FC<
    React.HTMLAttributes<HTMLDivElement> & {
        size?: 'small' | 'large';
        bgColor?: string;
    }
> = ({ size = 'small', bgColor, ...props }) => {
    return (
        <ChipTag bgcolor={bgColor} size={size} className={props.className} {...props}>
            {props.children}
        </ChipTag>
    );
};
