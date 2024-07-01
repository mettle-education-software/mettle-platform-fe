'use client';

import { Skeleton } from 'antd';
import { MaxWidthContainer, RichTextRenderer } from 'components';
import { useDeviceSize } from 'hooks';
import { useDeda } from 'hooks/queries/dedaQueries';
import { DedaNotesQueryResponse } from 'interfaces';
import { MAX_CONTENT_WIDTH } from 'libs';
import React, { useMemo } from 'react';

export const Glossary = ({ dedaId }: { dedaId: string }) => {
    const dedaNotesResult = useDeda<DedaNotesQueryResponse>('deda-notes', dedaId);
    const dedaNotesContent = useMemo(() => dedaNotesResult?.data?.dedaContentCollection?.items[0], [dedaNotesResult]);

    const device = useDeviceSize();

    if (!dedaNotesContent)
        return (
            <MaxWidthContainer>
                <Skeleton active paragraph />
            </MaxWidthContainer>
        );

    if (device === 'mobile') {
        return (
            <MaxWidthContainer style={{ margin: '20px 0' }}>
                <RichTextRenderer
                    rawContent={dedaNotesContent.dedaNotesGlossaryContent?.json}
                    links={dedaNotesContent.dedaNotesGlossaryContent?.links}
                />
            </MaxWidthContainer>
        );
    }

    return (
        <div style={{ maxWidth: `${MAX_CONTENT_WIDTH - 120}px`, marginTop: '40px' }}>
            <RichTextRenderer
                rawContent={dedaNotesContent.dedaNotesGlossaryContent?.json}
                links={dedaNotesContent.dedaNotesGlossaryContent?.links}
            />
        </div>
    );
};
