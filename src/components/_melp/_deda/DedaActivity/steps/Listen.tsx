'use client';

import styled from '@emotion/styled';
import { Card, Skeleton, Typography } from 'antd';
import { useDeda } from 'hooks';
import { DedaListenQueryResponse } from 'interfaces';
import { createSCWidget } from 'libs';
import React, { useEffect, useState } from 'react';
import { ListenSoundCloud } from '../../../ListenSoundCloud/ListenSoundCloud';

const { Text, Title } = Typography;

interface ListenProps {
    dedaId: string;
    isTodaysDedaAndNotCompleted: boolean;
    dedaOngoing: boolean;

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
    left: 200px;
    z-index: 10;
    background: var(--brown-bg);
    opacity: 90%;
    border: none;
    max-width: 400px;
`;

export const Listen: React.FC<ListenProps> = ({ dedaId, onListenPlay, isTodaysDedaAndNotCompleted, dedaOngoing }) => {
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
                        setDisplayStartMessage(false);
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
            {isTodaysDedaAndNotCompleted && displayStartMessage && !dedaOngoing && (
                <StartMessage>
                    <Text className="color-white">
                        Click PLAY to start today&apos;s DEDA. Once you click, the timer will begin.
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
