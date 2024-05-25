'use client';

import styled from '@emotion/styled';
import { Flex, Typography } from 'antd';
import { DedaActivity, DedaNotes, DedaQuote, DedaReview, MaxWidthContainer, TabNav } from 'components';
import { AppLayout } from 'components/layouts';
import { useDeviceSize } from 'hooks';
import { useFeaturedDedaData } from 'hooks/queries/dedaQueries';
import { withAuthentication } from 'libs';
import { withDedaUnlocked } from 'libs/authentication/withDedaUnlocked';
import React, { useState } from 'react';

const HeaderSummary = styled.section<{ imgUrl?: string }>`
    background: linear-gradient(0deg, rgb(43, 43, 43) 0%, rgb(43, 43, 43) 15%, rgb(0, 0, 0, 0) 100%),
        url(${({ imgUrl }) => imgUrl});
    background-size: cover;
    background-position: center;
    max-height: 250px;
    height: 250px;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    border: none;

    & h1 {
        color: var(--secondary);
    }

    .activeTab {
        color: var(--secondary) !important;
    }
`;

const Content = styled.section`
    margin-top: -1px;
    width: 100%;
    padding: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3rem;
    border: none;
    height: 100%;
`;

function DedaContent({ params: { dedaId } }: { params: { dedaId: string } }) {
    const device = useDeviceSize();

    const featuredDedaDataResult = useFeaturedDedaData(dedaId);
    const featuredDeda = featuredDedaDataResult.data?.dedaContentCollection.items[0];

    const [activeTab, setActiveTab] = useState('dedaNotes');

    return (
        <AppLayout withMelpSummary>
            <HeaderSummary imgUrl={featuredDeda?.dedaFeaturedImage.url}>
                <MaxWidthContainer style={{ marginBottom: '2rem' }}>
                    {device === 'desktop' && (
                        <Flex justify="space-between">
                            <Typography.Title>{featuredDeda?.dedaTitle}</Typography.Title>
                            <div style={{ flex: 0.55 }}>
                                <DedaQuote dedaId={dedaId} />
                            </div>
                        </Flex>
                    )}
                </MaxWidthContainer>

                <MaxWidthContainer>
                    <TabNav
                        type="card"
                        color="secondary"
                        activeKey={activeTab}
                        onChange={setActiveTab}
                        defaultActiveKey="dedaNotes"
                        items={[
                            {
                                key: 'dedaNotes',
                                label: (
                                    <Typography.Title
                                        level={5}
                                        className={activeTab === 'dedaNotes' ? 'activeTab' : undefined}
                                        style={{ color: '#FFFFFF', fontWeight: 400 }}
                                    >
                                        DEDA Notes
                                    </Typography.Title>
                                ),
                            },
                            {
                                key: 'dedaActivity',
                                label: (
                                    <Typography.Title
                                        level={5}
                                        className={activeTab === 'dedaActivity' ? 'activeTab' : undefined}
                                        style={{ color: '#FFFFFF', fontWeight: 400 }}
                                    >
                                        DEDA
                                    </Typography.Title>
                                ),
                            },
                            {
                                key: 'dedaReview',
                                label: (
                                    <Typography.Title
                                        level={5}
                                        className={activeTab === 'dedaReview' ? 'activeTab' : undefined}
                                        style={{ color: '#FFFFFF', fontWeight: 400 }}
                                    >
                                        Review
                                    </Typography.Title>
                                ),
                            },
                        ]}
                    />
                </MaxWidthContainer>
            </HeaderSummary>
            <Content>
                {activeTab === 'dedaNotes' && <DedaNotes dedaId={dedaId} />}
                {activeTab === 'dedaActivity' && <DedaActivity dedaId={dedaId} />}
                {activeTab === 'dedaReview' && <DedaReview dedaId={dedaId} />}
            </Content>
        </AppLayout>
    );
}

export default withAuthentication(withDedaUnlocked(DedaContent));
