'use client';

import styled from '@emotion/styled';
import { Typography } from 'antd';
import React from 'react';

const FrameThumbnailContainer = styled.div`
    background: transparent;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
    cursor: pointer;
`;

const ThumbnailWrapper = styled.div<{ fullWidth?: boolean }>`
    min-width: 250px;
    width: 100%;
    ${({ fullWidth }) => (fullWidth ? '' : 'max-width: 250px;')}
    aspect-ratio: 211 / 126;
    border-radius: 6px;
`;

export const FrameThumbnail: React.FC<{
    title: string;
    onThumbClick(): void;
    children: React.ReactNode;
    fullWidth?: boolean;
}> = ({ title, onThumbClick, children, fullWidth = false }) => {
    return (
        <FrameThumbnailContainer onClick={onThumbClick}>
            <ThumbnailWrapper fullWidth={fullWidth}>{children}</ThumbnailWrapper>
            <Typography.Title
                ellipsis={{ rows: 3 }}
                className="color-white"
                style={{
                    whiteSpace: 'break-spaces',
                    fontWeight: 400,
                }}
                level={5}
            >
                {title}
            </Typography.Title>
        </FrameThumbnailContainer>
    );
};
