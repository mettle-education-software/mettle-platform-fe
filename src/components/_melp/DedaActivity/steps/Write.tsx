'use client';

import styled from '@emotion/styled';
import { Card, Flex, Skeleton } from 'antd';
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

const ContentCard = styled(Card)`
    max-height: 660px;
    overflow-y: auto;
`;

export const Write: React.FC<WriteProps> = ({ dedaId }) => {
    const dedaWriteResult = useDeda<DedaWriteQueryResponse>('deda-write', dedaId);

    const dedaWriteDays = dedaWriteResult.data?.dedaContentCollection?.items[0];

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
        <ContentCard>
            <Flex justify="center">
                <MaxTextWidth>
                    <Skeleton loading={dedaWriteResult.loading} active style={{ width: '100%' }}>
                        <RichTextRenderer
                            rawContent={currentDayDedaWrite?.json as any}
                            links={currentDayDedaWrite?.links}
                        />
                    </Skeleton>
                </MaxTextWidth>
            </Flex>
        </ContentCard>
    );
};
