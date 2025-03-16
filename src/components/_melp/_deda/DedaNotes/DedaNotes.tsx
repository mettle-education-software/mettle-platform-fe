'use client';

import styled from '@emotion/styled';
import { BookmarkOutlined, HomeOutlined, PsychologyOutlined } from '@mui/icons-material';
import { Flex } from 'antd';
import { DedaNavButton, MaxWidthContainer } from 'components';
import { useDeviceSize } from 'hooks';
import { SMALL_VIEWPORT } from 'libs';
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

    @media (max-width: ${SMALL_VIEWPORT}px) {
        background: #eae8e2;
        gap: 0;
        align-items: center;
        max-width: 100vw;
        height: 4rem;
        padding: 0;

        .button-item {
            flex-grow: 1;
        }
    }
`;

export const DedaNotes = ({ dedaId }: { dedaId: string }) => {
    const [selectedDedaNotesSection, setSelectedDedaNotesSection] = useState('introduction');
    const device = useDeviceSize();
    const isMobile = device === 'mobile';

    const contentRenderer: Map<string, React.ReactNode> = new Map([
        ['introduction', <Introduction key="introduction" dedaId={dedaId} />],
        ['glossary', <Glossary key="glossary" dedaId={dedaId} />],
        ['linknowledge', <LinKnowledge key="linknowledge" dedaId={dedaId} />],
    ]);

    return (
        <Flex vertical align="center" style={{ width: '100%', flexGrow: 1 }}>
            <DedaNotesNav>
                {!isMobile ? (
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
                ) : (
                    <>
                        <div className="button-item">
                            <DedaNavButton
                                className={selectedDedaNotesSection === 'introduction' ? 'active' : undefined}
                                onClick={() => setSelectedDedaNotesSection('introduction')}
                                icon={<HomeOutlined />}
                                block
                            >
                                Introduction
                            </DedaNavButton>
                        </div>
                        <div className="button-item">
                            <DedaNavButton
                                className={selectedDedaNotesSection === 'glossary' ? 'active' : undefined}
                                onClick={() => setSelectedDedaNotesSection('glossary')}
                                icon={<BookmarkOutlined />}
                                block
                            >
                                Glossary
                            </DedaNavButton>
                        </div>
                        <div className="button-item">
                            <DedaNavButton
                                className={selectedDedaNotesSection === 'linknowledge' ? 'active' : undefined}
                                onClick={() => setSelectedDedaNotesSection('linknowledge')}
                                icon={<PsychologyOutlined />}
                                block
                            >
                                LinKnowledge
                            </DedaNavButton>
                        </div>
                    </>
                )}
            </DedaNotesNav>
            <MaxWidthContainer
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                {contentRenderer.get(selectedDedaNotesSection)}
            </MaxWidthContainer>
        </Flex>
    );
};
