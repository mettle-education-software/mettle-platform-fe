'use client';

import { Skeleton } from 'antd';
import { MaxWidthContainer, RichTextRenderer } from 'components';
import { useDeda } from 'hooks/queries/dedaQueries';
import { DedaNotesQueryResponse } from 'interfaces';
import { MAX_CONTENT_WIDTH } from 'libs';
import React, { useMemo } from 'react';

export const Introduction = ({ dedaId }: { dedaId: string }) => {
    const dedaNotesResult = useDeda<DedaNotesQueryResponse>('deda-notes', dedaId);
    const dedaNotesContent = useMemo(() => dedaNotesResult?.data?.dedaContentCollection?.items[0], [dedaNotesResult]);

    if (!dedaNotesContent)
        return (
            <MaxWidthContainer>
                <Skeleton active paragraph />
            </MaxWidthContainer>
        );

    return (
        <div style={{ maxWidth: `${MAX_CONTENT_WIDTH - 120}px`, marginTop: '40px' }}>
            <RichTextRenderer
                rawContent={dedaNotesContent.dedaNotesIntroductionContent?.json}
                links={dedaNotesContent.dedaNotesIntroductionContent?.links}
            />
        </div>
    );
};
