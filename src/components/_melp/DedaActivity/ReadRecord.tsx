'use client';

import styled from '@emotion/styled';
import { Card, Flex } from 'antd';
import { RichTextRenderer } from 'components';
import { useDeda } from 'hooks';
import { DedaReadRecordQueryResponse } from 'interfaces';
import React from 'react';

interface ReadRecordProps {
    dedaId: string;
}

const MaxTextWidth = styled.div`
    max-width: 800px;
`;

export const ReadRecord: React.FC<ReadRecordProps> = ({ dedaId }) => {
    const dedaReadRecordResult = useDeda<DedaReadRecordQueryResponse>('deda-read-record', dedaId);

    const dedaReadRecordData = dedaReadRecordResult.data?.dedaContentCollection?.items[0].dedaReadContent;

    return (
        <Card>
            <Flex justify="center">
                <MaxTextWidth>
                    <RichTextRenderer rawContent={dedaReadRecordData?.json} links={dedaReadRecordData?.links} />
                </MaxTextWidth>
            </Flex>
        </Card>
    );
};
