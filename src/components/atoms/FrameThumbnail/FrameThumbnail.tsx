'use client';

import styled from '@emotion/styled';
import { Typography } from 'antd';
import React from 'react';

const FrameThumbnailContainer = styled.div`
    background: transparent;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
    cursor: pointer;
`;

const ThumbnailWrapper = styled.div`
    width: 250px;
    max-width: 250px;
    aspect-ratio: 211/126;
    border-radius: 6px;
    //background: url('https://source.unsplash.com/random');
`;

export const FrameThumbnail: React.FC<{ title: string; onThumbClick(): void; children: React.ReactNode }> = ({
    title,
    onThumbClick,
    children,
}) => {
    return (
        <FrameThumbnailContainer onClick={onThumbClick}>
            <ThumbnailWrapper>{children}</ThumbnailWrapper>
            <Typography.Title style={{ whiteSpace: 'break-spaces' }} level={4}>
                {title}
            </Typography.Title>
        </FrameThumbnailContainer>
    );
};
