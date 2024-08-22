'use client';

import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import { Card, Flex } from 'antd';
import { useDeda } from 'hooks';
import { DedaWatchQueryResponse } from 'interfaces';
import { SMALL_VIEWPORT } from 'libs';
import React from 'react';

interface WatchProps {
    dedaId: string;
}

const CardWrapper = styled(Card)`
    background: rgba(255, 255, 255, 0.03);
    padding: 0.5rem;
    border: none;
    display: flex;
    width: 100%;
    justify-content: center;
`;

const DedaWatchVideo = styled.iframe`
    border: none;
    border-radius: 1rem;
    width: 50vw;
    aspect-ratio: 16/9;

    @media (max-width: ${SMALL_VIEWPORT}px) {
        width: 85vw;
    }
`;

const DedaWatchSkeleton = styled.div`
    width: 40rem;
    aspect-ratio: 16/9;
    border-radius: 1rem;

    animation: ${keyframes`
        0% {
            background: rgba(255, 255, 255, 0.03);
        }
        50% {
            background: rgba(255, 255, 255, 0.05);
        }
        100% {
            background: rgba(255, 255, 255, 0.03);
        }
    `} 1s infinite;

    @media (max-width: ${SMALL_VIEWPORT}px) {
        width: 90vw;
    }
`;

export const Watch: React.FC<WatchProps> = ({ dedaId }) => {
    const dedaWatchResult = useDeda<DedaWatchQueryResponse>('deda-watch', dedaId);

    if (dedaWatchResult.loading)
        return (
            <Flex justify="center">
                <DedaWatchSkeleton />
            </Flex>
        );

    const dedaWatchLink = dedaWatchResult.data?.dedaContentCollection?.items[0].dedaWatchVideoLink;

    return <CardWrapper>{!dedaWatchLink ? <DedaWatchSkeleton /> : <DedaWatchVideo src={dedaWatchLink} />}</CardWrapper>;
};
