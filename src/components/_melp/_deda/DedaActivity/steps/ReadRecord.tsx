'use client';

import styled from '@emotion/styled';
import { Card, Flex, Skeleton } from 'antd';
import { MaxWidthContainer, RichTextRenderer } from 'components';
import { useDeda, useDeviceSize } from 'hooks';
import { DedaReadRecordQueryResponse } from 'interfaces';
import React from 'react';

interface ReadRecordProps {
    dedaId: string;
}

const MaxTextWidth = styled.div`
    max-width: 800px;
`;

const ReadingCard = styled(Card)`
    max-height: 660px;
    overflow-y: auto;
`;

export const ReadRecord: React.FC<ReadRecordProps> = ({ dedaId }) => {
    const device = useDeviceSize();
    const dedaReadRecordResult = useDeda<DedaReadRecordQueryResponse>('deda-read-record', dedaId);

    const dedaReadRecordData = dedaReadRecordResult.data?.dedaContentCollection?.items[0].dedaReadContent;

    if (device === 'mobile')
        return (
            <Flex justify="center">
                <MaxWidthContainer style={{ paddingBottom: '5rem', paddingTop: '1rem' }}>
                    <Skeleton loading={dedaReadRecordResult.loading} active style={{ width: '100%' }}>
                        <RichTextRenderer rawContent={dedaReadRecordData?.json} links={dedaReadRecordData?.links} />
                    </Skeleton>
                </MaxWidthContainer>
            </Flex>
        );

    return (
        <ReadingCard>
            <Flex justify="center">
                <MaxTextWidth>
                    <Skeleton loading={dedaReadRecordResult.loading} active style={{ width: '100%' }}>
                        <RichTextRenderer rawContent={dedaReadRecordData?.json} links={dedaReadRecordData?.links} />
                    </Skeleton>
                </MaxTextWidth>
            </Flex>
        </ReadingCard>
    );
};
