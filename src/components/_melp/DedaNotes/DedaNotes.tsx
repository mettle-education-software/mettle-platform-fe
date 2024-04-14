'use client';

import styled from '@emotion/styled';
import { Skeleton } from 'antd';
import { RichTextRenderer } from 'components';
import { useDeda } from 'hooks/queries/dedaQueries';
import React, { useMemo } from 'react';

export const DedaNotes = ({ dedaId }: { dedaId: string }) => {
    const dedaNotesResult = useDeda('deda-notes', dedaId);
    const dedaNotesContent = useMemo(() => dedaNotesResult?.data?.dedaContentCollection?.items[0], [dedaNotesResult]);

    if (!dedaNotesContent) return <Skeleton active paragraph />;

    return (
        <div style={{ maxWidth: '600px' }}>
            <RichTextRenderer
                justify
                rawContent={dedaNotesContent.dedaNotesIntroductionContent?.json}
                links={dedaNotesContent.dedaNotesIntroductionContent?.links}
            />
        </div>
    );
};
