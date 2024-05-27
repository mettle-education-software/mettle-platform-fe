'use client';

import styled from '@emotion/styled';
import { BookmarkOutlined, HomeOutlined, PsychologyOutlined } from '@mui/icons-material';
import { Button, Flex } from 'antd';
import { MaxWidthContainer } from 'components';
import React, { useState } from 'react';
import { Glossary } from './Glossary/Glossary';
import { Introduction } from './Introduction/Introduction';
import { LinKnowledge } from './LinKnowledge/LinKnowledge';

const DedaNotesNav = styled.div`
    width: 100%;
    background: #2b2b2b;
    display: flex;
    justify-content: center;
    position: sticky;
    top: 0;
    z-index: 1;
`;

const DedaNavButton = styled(Button)`
    border: none;
    height: 4rem;
    display: flex;
    align-items: center;
    padding: 0;
    font-size: 18px;

    &.active {
        color: var(--secondary);
    }
`;

export const DedaNotes = ({ dedaId }: { dedaId: string }) => {
    const [selectedDedaNotesSection, setSelectedDedaNotesSection] = useState('introduction');

    const contentRenderer: Map<string, React.ReactNode> = new Map([
        ['introduction', <Introduction key="introduction" dedaId={dedaId} />],
        ['glossary', <Glossary key="glossary" dedaId={dedaId} />],
        ['linknowledge', <LinKnowledge key="linknowledge" dedaId={dedaId} />],
    ]);

    return (
        <Flex vertical align="center" style={{ width: '100%', flexGrow: 1 }}>
            <DedaNotesNav>
                <MaxWidthContainer>
                    <Flex gap="1.5rem">
                        <DedaNavButton
                            className={selectedDedaNotesSection === 'introduction' ? 'active' : undefined}
                            onClick={() => setSelectedDedaNotesSection('introduction')}
                            icon={<HomeOutlined />}
                            ghost
                        >
                            Introduction
                        </DedaNavButton>
                        <DedaNavButton
                            className={selectedDedaNotesSection === 'glossary' ? 'active' : undefined}
                            onClick={() => setSelectedDedaNotesSection('glossary')}
                            icon={<BookmarkOutlined />}
                            ghost
                        >
                            Glossary
                        </DedaNavButton>
                        <DedaNavButton
                            className={selectedDedaNotesSection === 'linknowledge' ? 'active' : undefined}
                            onClick={() => setSelectedDedaNotesSection('linknowledge')}
                            icon={<PsychologyOutlined />}
                            ghost
                        >
                            LinKnowledge
                        </DedaNavButton>
                    </Flex>
                </MaxWidthContainer>
            </DedaNotesNav>
            {contentRenderer.get(selectedDedaNotesSection)}
        </Flex>
    );
};
