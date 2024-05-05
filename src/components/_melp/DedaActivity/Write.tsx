'use client';

import styled from '@emotion/styled';
import { Card, Flex } from 'antd';
import { RichTextRenderer } from 'components';
import { useDeda } from 'hooks';
import { DedaWriteQueryResponse } from 'interfaces';
import React from 'react';

interface WriteProps {
    dedaId: string;
}

const MaxTextWidth = styled.div`
    max-width: 800px;
`;

export const Write: React.FC<WriteProps> = ({ dedaId }) => {
    const dedaReadRecordResult = useDeda<DedaWriteQueryResponse>('deda-write', dedaId);

    const dedaWriteDays = dedaReadRecordResult.data?.dedaContentCollection?.items[0];

    if (!dedaWriteDays) return null;

    const dedaWriteDaysKeys = [
        'dedaWriteContentDaySeven',
        'dedaWriteContentDayOne',
        'dedaWriteContentDayTwo',
        'dedaWriteContentDayThree',
        'dedaWriteContentDayFour',
        'dedaWriteContentDayFive',
        'dedaWriteContentDaySix',
    ];
    const weekDay = new Date().getDay();

    const currentDayDedaWrite = dedaWriteDays[dedaWriteDaysKeys[weekDay] as keyof typeof dedaWriteDays];

    return (
        <Card>
            <Flex justify="center">
                <MaxTextWidth>
                    <RichTextRenderer
                        rawContent={currentDayDedaWrite?.json as any}
                        links={currentDayDedaWrite?.links}
                    />
                </MaxTextWidth>
            </Flex>
        </Card>
    );
};
