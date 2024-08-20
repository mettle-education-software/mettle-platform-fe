'use client';

import styled from '@emotion/styled';
import { ArrowBackIos } from '@mui/icons-material';
import { Button, Flex, Typography } from 'antd';
import { DedaActivity, DedaNotes, DedaQuote, DedaReview, MaxWidthContainer, TabNav } from 'components';
import { AppLayout } from 'components/layouts';
import { useDeviceSize } from 'hooks';
import { useFeaturedDedaData } from 'hooks/queries/dedaQueries';
import { SMALL_VIEWPORT, withAuthentication } from 'libs';
import { withDedaUnlocked } from 'libs/authentication/withDedaUnlocked';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

const { Title } = Typography;

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

    @media (max-width: ${SMALL_VIEWPORT}px) {
        height: 8vh;
    }
`;

const MobileNavigationWrapper = styled.div`
    display: none;

    @media (max-width: ${SMALL_VIEWPORT}px) {
        background: var(--main-bg);
        display: block;
        width: 100%;
        margin: 0;
        padding: 0;
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
    const router = useRouter();

    const isDesktop = device === 'desktop';

    const featuredDedaDataResult = useFeaturedDedaData(dedaId);
    const featuredDeda = featuredDedaDataResult.data?.dedaContentCollection.items[0];

    const [activeTab, setActiveTab] = useState('dedaNotes');

    const tabItems = [
        {
            key: 'dedaNotes',
            label: (
                <Title
                    level={5}
                    className={activeTab === 'dedaNotes' ? 'activeTab' : undefined}
                    style={{ color: '#FFFFFF', fontWeight: 400 }}
                >
                    DEDA Notes
                </Title>
            ),
        },
        {
            key: 'dedaActivity',
            label: (
                <Title
                    level={5}
                    className={activeTab === 'dedaActivity' ? 'activeTab' : undefined}
                    style={{ color: '#FFFFFF', fontWeight: 400 }}
                >
                    DEDA
                </Title>
            ),
        },
        {
            key: 'dedaReview',
            label: (
                <Title
                    level={5}
                    className={activeTab === 'dedaReview' ? 'activeTab' : undefined}
                    style={{ color: '#FFFFFF', fontWeight: 400 }}
                >
                    Review
                </Title>
            ),
        },
    ];

    return (
        <AppLayout withMelpSummary>
            <HeaderSummary imgUrl={featuredDeda?.dedaFeaturedImage.url}>
                <MaxWidthContainer style={{ marginBottom: '2rem' }}>
                    {isDesktop ? (
                        <Flex justify="space-between">
                            <Flex align="center">
                                <Button
                                    style={{ border: 'none' }}
                                    icon={<ArrowBackIos className="color-secondary" />}
                                    ghost
                                    onClick={() => {
                                        router.push('/melp/deda');
                                    }}
                                />
                                <Typography.Title>{featuredDeda?.dedaTitle}</Typography.Title>
                            </Flex>
                            <div style={{ flex: 0.3 }}>
                                <DedaQuote dedaId={dedaId} />
                            </div>
                        </Flex>
                    ) : (
                        <Flex justify="space-between">
                            <Flex align="center">
                                <Button
                                    style={{ border: 'none', marginTop: '2rem' }}
                                    icon={<ArrowBackIos className="color-white" />}
                                    ghost
                                    onClick={() => {
                                        router.push('/melp/deda');
                                    }}
                                />
                            </Flex>
                        </Flex>
                    )}
                </MaxWidthContainer>

                {isDesktop && (
                    <MaxWidthContainer>
                        <TabNav
                            type="card"
                            color="secondary"
                            activeKey={activeTab}
                            onChange={setActiveTab}
                            defaultActiveKey="dedaNotes"
                            items={tabItems}
                        />
                    </MaxWidthContainer>
                )}
            </HeaderSummary>

            {!isDesktop && (
                <MobileNavigationWrapper>
                    <TabNav
                        withoutBottomBorder
                        tabBarStyle={{ marginBottom: 0 }}
                        type="card"
                        color="secondary"
                        activeKey={activeTab}
                        onChange={setActiveTab}
                        defaultActiveKey="dedaNotes"
                        items={tabItems}
                    />
                </MobileNavigationWrapper>
            )}

            <Content>
                {activeTab === 'dedaNotes' && <DedaNotes dedaId={dedaId} />}
                {activeTab === 'dedaActivity' && <DedaActivity dedaId={dedaId} />}
                {activeTab === 'dedaReview' && <DedaReview dedaId={dedaId} />}
            </Content>
        </AppLayout>
    );
}

export default withAuthentication(withDedaUnlocked(DedaContent));
