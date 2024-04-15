'use client';

import styled from '@emotion/styled';
import { Flex, Skeleton } from 'antd';
import { RichTextRenderer, MaxWidthContainer } from 'components';
import { useDeda } from 'hooks/queries/dedaQueries';
import React, { useMemo } from 'react';

const DedaNotesNav = styled.div`
    width: 100%;
    background: #2b2b2b;
    display: flex;
    justify-content: center;
    padding: 22px 0;
    position: sticky;
    top: 250px;
    z-index: 0;
`;

export const DedaNotes = ({ dedaId }: { dedaId: string }) => {
    const dedaNotesResult = useDeda('deda-notes', dedaId);
    const dedaNotesContent = useMemo(() => dedaNotesResult?.data?.dedaContentCollection?.items[0], [dedaNotesResult]);

    if (!dedaNotesContent) return <Skeleton active paragraph />;

    return (
        <Flex vertical align="center" style={{ width: '100%' }} gap="40px">
            <DedaNotesNav>
                <MaxWidthContainer>
                    <Flex>
                        <h1 style={{ color: 'white' }}>Deda Notes</h1>
                        <h1 style={{ color: 'white' }}>Deda Notes</h1>
                        <h1 style={{ color: 'white' }}>Deda Notes</h1>
                    </Flex>
                </MaxWidthContainer>
            </DedaNotesNav>
            <div style={{ maxWidth: '800px' }}>
                <RichTextRenderer
                    justify
                    rawContent={dedaNotesContent.dedaNotesIntroductionContent?.json}
                    links={dedaNotesContent.dedaNotesIntroductionContent?.links}
                />
            </div>
        </Flex>
    );
};
