'use client';

import styled from '@emotion/styled';
import { Skeleton } from 'antd';
import { useDeda } from 'hooks';
import { DedaListenQueryResponse } from 'interfaces';
import React, { useEffect } from 'react';
import { ListenSoundCloud } from '../../../ListenSoundCloud/ListenSoundCloud';

interface ListenProps {
    dedaId: string;
}

const ListenFrame = styled.div`
    width: 100%;
    padding: 1rem;
    border-radius: 0.5rem;
    background: rgba(255, 255, 255, 0.05);

    & #widget > div.mobilePrestitial.g-flex-row-centered.g-box-full.m-enabled {
        display: none;
    }
`;

export const Listen: React.FC<ListenProps> = ({ dedaId }) => {
    const dedaListenResult = useDeda<DedaListenQueryResponse>('deda-listen', dedaId);

    const { loading, data } = dedaListenResult;

    useEffect(() => {
        if (window) {
            window.onload = () => {
                document?.querySelector('.playButton.medium')?.addEventListener('click', () => {
                    alert('play clicked');
                    console.log('play clicked');
                });
            };
        }
    }, [loading, data]);

    if (loading || data?.dedaContentCollection?.items?.length === 0) {
        return <Skeleton loading active style={{ height: '10rem', width: '100%' }} />;
    }

    return (
        <ListenFrame>
            <ListenSoundCloud src={dedaListenResult.data?.dedaContentCollection.items[0].dedaListenSoundCloudLink} />
        </ListenFrame>
    );
};
