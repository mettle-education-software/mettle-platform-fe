'use client';

import styled from '@emotion/styled';
import { useDeda } from 'hooks';
import { DedaListenQueryResponse } from 'interfaces';
import React from 'react';
import { ListenSoundCloud } from '../ListenSoundCloud/ListenSoundCloud';

interface ListenProps {
    dedaId: string;
}

const ListenFrame = styled.div`
    width: 100%;
    padding: 1rem;
    border-radius: 0.5rem;
    background: rgba(255, 255, 255, 0.05);
`;

export const Listen: React.FC<ListenProps> = ({ dedaId }) => {
    const dedaListenResult = useDeda<DedaListenQueryResponse>('deda-listen', dedaId);

    const { loading, data } = dedaListenResult;

    if (loading || data?.dedaContentCollection?.items?.length === 0) {
        return <div>Loading...</div>;
    }

    return (
        <ListenFrame>
            <ListenSoundCloud src={dedaListenResult.data?.dedaContentCollection.items[0].dedaListenSoundCloudLink} />
        </ListenFrame>
    );
};
