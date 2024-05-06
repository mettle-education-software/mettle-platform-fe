'use client';

import styled from '@emotion/styled';
import { Card, Flex, Skeleton } from 'antd';
import { RichTextRenderer } from 'components';
import { useDeda } from 'hooks';
import { DedaListenReadQueryResponse } from 'interfaces';
import React from 'react';
import { ListenSoundCloud } from '../../ListenSoundCloud/ListenSoundCloud';

interface ListenReadProps {
    dedaId: string;
}

const MaxTextWidth = styled.div`
    max-width: 800px;
`;

export const ListenRead: React.FC<ListenReadProps> = ({ dedaId }) => {
    const dedaListenReadResult = useDeda<DedaListenReadQueryResponse>('deda-listen-read', dedaId);

    const dedaReadRecordData = dedaListenReadResult.data?.dedaContentCollection?.items[0].dedaReadContent;
    const dedaListenSoundCloudLink =
        dedaListenReadResult.data?.dedaContentCollection?.items[0].dedaListenSoundCloudLink;

    return (
        <Card>
            <Flex justify="center">
                <MaxTextWidth>
                    <Flex vertical align="stretch" gap="2rem">
                        <ListenSoundCloud src={dedaListenSoundCloudLink} />
                        <Skeleton loading={dedaListenReadResult.loading} active style={{ width: '100%' }}>
                            <RichTextRenderer rawContent={dedaReadRecordData?.json} links={dedaReadRecordData?.links} />
                        </Skeleton>
                    </Flex>
                </MaxTextWidth>
            </Flex>
        </Card>
    );
};
