'use client';

import styled from '@emotion/styled';
import { Card, Flex, Skeleton } from 'antd';
import { AudioPlayer, MaxWidthContainer, RichTextRenderer } from 'components';
import { TwoTrackPlayer } from 'components/_melp/_deda/DedaRecorder/TwoTrackPlayer';
import { useDeda, useDeviceSize } from 'hooks';
import { useDedaRecordings } from 'hooks/melp/dedaRecording';
import { DedaListenReadQueryResponse } from 'interfaces';
import React from 'react';
import { ListenSoundCloud } from '../../../ListenSoundCloud/ListenSoundCloud';

interface ListenReadProps {
    dedaId: string;
    isCurrentDeda?: boolean;
    onGoRecord?: () => void;
}

const MaxTextWidth = styled.div`
    max-width: 800px;
`;

const ListenCard = styled(Card)`
    max-height: 660px;
    overflow-y: auto;
`;

export const ListenRead: React.FC<ListenReadProps> = ({ dedaId, isCurrentDeda = false, onGoRecord }) => {
    const dedaListenReadResult = useDeda<DedaListenReadQueryResponse>('deda-listen-read', dedaId);
    const recordings = useDedaRecordings(dedaId);
    const item = dedaListenReadResult.data?.dedaContentCollection?.items[0];
    // Gravador liberado para o aluno: um player com duas faixas ("My reading" e "Original").
    const twoTracks = (sticky: boolean) =>
        recordings.active && !dedaListenReadResult.loading ? (
            <TwoTrackPlayer
                dedaId={dedaId}
                isCurrentDeda={isCurrentDeda}
                title={item?.dedaTitle ?? 'Listen'}
                coverSrc={item?.dedaFeaturedImage?.url ?? ''}
                originalUrl={item?.dedaListenAudioMedia?.url ?? ''}
                onGoRecord={onGoRecord}
                sticky={sticky}
            />
        ) : null;

    const dedaReadRecordData = dedaListenReadResult.data?.dedaContentCollection?.items[0].dedaReadContent;
    const dedaListenSoundCloudLink =
        dedaListenReadResult.data?.dedaContentCollection?.items[0].dedaListenSoundCloudLink;

    const device = useDeviceSize();

    if (device === 'mobile')
        return (
            <Flex justify="center">
                <MaxWidthContainer style={{ paddingBottom: '5rem', paddingTop: '1rem' }}>
                    <Flex vertical align="stretch" gap="2rem">
                        {twoTracks(true) ?? (
                            <AudioPlayer
                                title={
                                    dedaListenReadResult.data?.dedaContentCollection?.items[0]?.dedaTitle ?? 'Listen'
                                }
                                coverSrc={
                                    dedaListenReadResult.data?.dedaContentCollection?.items[0]?.dedaFeaturedImage
                                        ?.url ?? ''
                                }
                                audioURL={
                                    dedaListenReadResult.data?.dedaContentCollection?.items[0]?.dedaListenAudioMedia
                                        ?.url ?? ''
                                }
                            />
                        )}
                        <Skeleton loading={dedaListenReadResult.loading} active style={{ width: '100%' }}>
                            <RichTextRenderer rawContent={dedaReadRecordData?.json} links={dedaReadRecordData?.links} />
                        </Skeleton>
                    </Flex>
                </MaxWidthContainer>
            </Flex>
        );

    return (
        <ListenCard>
            <Flex justify="center">
                <MaxTextWidth>
                    <Flex vertical align="stretch" gap="2rem">
                        {twoTracks(true) ??
                            (!dedaListenReadResult.loading && (
                                <AudioPlayer
                                    title={
                                        dedaListenReadResult.data?.dedaContentCollection?.items[0]?.dedaTitle ??
                                        'Listen'
                                    }
                                    coverSrc={
                                        dedaListenReadResult.data?.dedaContentCollection?.items[0]?.dedaFeaturedImage
                                            ?.url ?? ''
                                    }
                                    audioURL={
                                        dedaListenReadResult.data?.dedaContentCollection?.items[0]?.dedaListenAudioMedia
                                            ?.url ?? ''
                                    }
                                />
                            ))}
                        <Skeleton loading={dedaListenReadResult.loading} active style={{ width: '100%' }}>
                            <RichTextRenderer rawContent={dedaReadRecordData?.json} links={dedaReadRecordData?.links} />
                        </Skeleton>
                    </Flex>
                </MaxTextWidth>
            </Flex>
        </ListenCard>
    );
};
