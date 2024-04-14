'use client';

import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import { Typography } from 'antd';
import { padding } from 'libs';
import React from 'react';
import { Chip } from '../../atoms/Chip/Chip';

interface CardComponentProps {
    imgUrl: string;
    title: string;
    week: string;
    dedaId: string;
    onClick: (dedaId: string) => void;
}

const Card = styled.div<{ imgUrl: string }>`
    background: linear-gradient(0deg, rgb(43, 43, 43) 0%, rgb(0, 0, 0, 0) 100%), url(${(props) => props.imgUrl});
    background-size: cover;
    background-position: center;
    border-radius: 6px;
    //min-width: 135px;
    width: 100%;
    aspect-ratio: 1/1.4;
    border: 2px solid #8f8f8f;

    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: ${padding.y.sm} ${padding.x.sm};
    transition: all 0.15s ease-in-out;
    cursor: pointer;

    & h2 {
        color: var(--secondary);
        margin-bottom: 2rem;
        font-weight: 700;
    }

    &:hover {
        box-shadow: -12px 12px 15px 0 rgba(0, 0, 0, 0.2);
    }
`;

export const DedaCard: React.FC<CardComponentProps> = ({ imgUrl, title, week, dedaId, onClick }) => {
    return (
        <Card
            imgUrl={imgUrl}
            onClick={() => {
                onClick(dedaId);
            }}
        >
            <div>
                <Chip>{week}</Chip>
            </div>
            <Typography.Title ellipsis={true} level={2}>
                {title}
            </Typography.Title>
        </Card>
    );
};
