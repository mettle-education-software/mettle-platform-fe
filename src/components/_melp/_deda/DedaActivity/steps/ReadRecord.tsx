'use client';

import styled from '@emotion/styled';
import { Card, Flex, Skeleton } from 'antd';
import { MaxWidthContainer, RichTextRenderer } from 'components';
import { DedaRecorder } from 'components/_melp/_deda/DedaRecorder/DedaRecorder';
import { useDeda, useDeviceSize } from 'hooks';
import { useDedaRecordings } from 'hooks/melp/dedaRecording';
import { DedaReadRecordQueryResponse } from 'interfaces';
import React from 'react';

interface ReadRecordProps {
    dedaId: string;
    /** Presente só no DEDA da semana (premissa P7): mostra o gravador, se estiver liberado para o aluno. */
    onRecordDone?: () => void;
}

const MaxTextWidth = styled.div`
    max-width: 800px;
`;

const ReadingCard = styled(Card)`
    max-height: 660px;
    overflow-y: auto;
`;

export const ReadRecord: React.FC<ReadRecordProps> = ({ dedaId, onRecordDone }) => {
    const device = useDeviceSize();
    const dedaReadRecordResult = useDeda<DedaReadRecordQueryResponse>('deda-read-record', dedaId);
    const recordings = useDedaRecordings(dedaId);
    const recorder =
        onRecordDone && recordings.active && recordings.data && recordings.uid ? (
            <DedaRecorder dedaId={dedaId} uid={recordings.uid} data={recordings.data} onDone={onRecordDone} />
        ) : null;

    const dedaReadRecordData = dedaReadRecordResult.data?.dedaContentCollection?.items[0].dedaReadContent;

    if (device === 'mobile')
        return (
            <Flex justify="center">
                <MaxWidthContainer style={{ paddingBottom: recorder ? '16rem' : '5rem', paddingTop: '1rem' }}>
                    <Skeleton loading={dedaReadRecordResult.loading} active style={{ width: '100%' }}>
                        <RichTextRenderer rawContent={dedaReadRecordData?.json} links={dedaReadRecordData?.links} />
                    </Skeleton>
                </MaxWidthContainer>
                {recorder}
            </Flex>
        );

    return (
        <Flex vertical gap="1rem">
            {recorder}
            <ReadingCard>
                <Flex justify="center">
                    <MaxTextWidth>
                        <Skeleton loading={dedaReadRecordResult.loading} active style={{ width: '100%' }}>
                            <RichTextRenderer rawContent={dedaReadRecordData?.json} links={dedaReadRecordData?.links} />
                        </Skeleton>
                    </MaxTextWidth>
                </Flex>
            </ReadingCard>
        </Flex>
    );
};
