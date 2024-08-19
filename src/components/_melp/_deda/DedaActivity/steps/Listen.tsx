'use client';

import styled from '@emotion/styled';
import { Card, Skeleton, Typography } from 'antd';
import { useDeda } from 'hooks';
import { DedaListenQueryResponse } from 'interfaces';
import { createSCWidget } from 'libs';
import React, { useEffect, useState } from 'react';
import { ListenSoundCloud } from '../../../ListenSoundCloud/ListenSoundCloud';

const { Text } = Typography;

interface ListenProps {
    dedaId: string;
    isTodaysDedaAndNotCompleted: boolean;

    onListenPlay?(): void;
}

const ListenFrame = styled.div`
    width: 100%;
    padding: 1rem;
    border-radius: 0.5rem;
    background: rgba(255, 255, 255, 0.05);
    position: relative;
`;

const StartMessage = styled(Card)`
    position: absolute;
    top: 20px;
    left: 100px;
    z-index: 10;
    background: var(--brown-bg);
    opacity: 90%;
    border: none;
`;

export const Listen: React.FC<ListenProps> = ({ dedaId, onListenPlay, isTodaysDedaAndNotCompleted }) => {
    const dedaListenResult = useDeda<DedaListenQueryResponse>('deda-listen', dedaId);
    const [displayStartMessage, setDisplayStartMessage] = useState(true);

    const { loading, data } = dedaListenResult;

    const soundCloudFrameId = 'deda-listen-sc';

    useEffect(() => {
        if (!!window && !!data) {
            // @ts-ignore
            createSCWidget(soundCloudFrameId, (widget) => {
                widget.bind('play', () => {
                    if (onListenPlay) {
                        onListenPlay();
                    }
                    widget.unbind('play');
                });
            });
        }
    }, [data, onListenPlay]);

    if (loading || data?.dedaContentCollection?.items?.length === 0) {
        return <Skeleton loading active style={{ height: '10rem', width: '100%' }} />;
    }

    return (
        <ListenFrame>
            {isTodaysDedaAndNotCompleted && (
                <StartMessage>
                    <Text className="color-white">
                        Clique no PLAY para iniciar o DEDA de hoje. Assim que clicar, o tempo começará a contar. Bons
                        estudos!
                    </Text>
                </StartMessage>
            )}
            <ListenSoundCloud
                id={soundCloudFrameId}
                src={
                    dedaListenResult.data?.dedaContentCollection.items[0].dedaListenSoundCloudLink +
                    '&amp;show_teaser=false'
                }
            />
        </ListenFrame>
    );
};
