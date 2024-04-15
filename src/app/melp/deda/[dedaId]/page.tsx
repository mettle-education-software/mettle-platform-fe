'use client';

import styled from '@emotion/styled';
import { Col, Flex, Row, Tabs, Typography } from 'antd';
import { DedaActivity, DedaNotes, DedaReview } from 'components';
import { AppLayout } from 'components/layouts';
import { useDeviceSize } from 'hooks';
import { useFeaturedDedaData } from 'hooks/queries/dedaQueries';
import { MAX_CONTENT_WIDTH, padding, withAuthentication } from 'libs';
import React, { useEffect, useRef, useState } from 'react';

const HeaderSummary = styled.section<{ imgUrl?: string; headerHeight: number }>`
    position: sticky;
    top: 0;
    z-index: 2;
    background: linear-gradient(0deg, rgb(43, 43, 43) 0%, rgb(43, 43, 43) 15%, rgb(0, 0, 0, 0) 100%),
        url(${({ imgUrl }) => imgUrl});
    background-size: cover;
    background-position: center;
    padding: ${padding.y.lg} ${padding.y.lg};
    max-height: 500px;
    height: ${({ headerHeight }) => headerHeight}px;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    border: none;
    transition: 0.6s ease-out;

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

const TabNav = styled(Tabs)`
    width: 100%;
    max-width: ${MAX_CONTENT_WIDTH}px;
    position: relative;
    top: 65px;

    .ant-tabs-tab {
        border: none !important;
        background: transparent !important;
    }

    .ant-tabs-tab-active {
        color: var(--secondary) !important;
        background: #3c362f !important;
        border-bottom: 1px solid var(--secondary) !important;
    }
`;

function DedaContent({ params: { dedaId } }: { params: { dedaId: string } }) {
    const device = useDeviceSize();

    const featuredDedaDataResult = useFeaturedDedaData(dedaId);
    const featuredDeda = featuredDedaDataResult.data?.dedaContentCollection.items[0];

    const MAX_HEADER_HEIGHT = 500;
    const MIN_HEADER_HEIGHT = 250;

    const contentRef = useRef<HTMLDivElement>(null);

    const [headerHeight, setHeaderHeight] = useState(500);

    useEffect(() => {
        const contentElement = contentRef.current;

        const handleScroll = () => {
            if (contentElement?.scrollTop && contentElement?.scrollTop > 25) {
                setHeaderHeight(MIN_HEADER_HEIGHT);
            } else {
                setHeaderHeight(MAX_HEADER_HEIGHT);
            }
        };
        contentElement?.addEventListener('scroll', handleScroll, { passive: true });
        contentElement?.addEventListener('click', handleScroll);

        return () => {
            contentElement?.removeEventListener('scroll', handleScroll);
        };
    }, [contentRef]);

    const [activeTab, setActiveTab] = useState('dedaNotes');

    return (
        <AppLayout withMelpSummary ref={contentRef}>
            <HeaderSummary imgUrl={featuredDeda?.dedaFeaturedImage.url} headerHeight={headerHeight}>
                <div style={{ maxWidth: MAX_CONTENT_WIDTH, width: '100%' }}>
                    {device === 'desktop' && (
                        <Row justify="space-between" align="middle">
                            <Col span={12}>
                                <Flex vertical>
                                    <Typography.Title>{featuredDeda?.dedaTitle}</Typography.Title>
                                </Flex>
                            </Col>
                        </Row>
                    )}
                </div>

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
                                    style={{ color: '#FFFFFF' }}
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
                                    style={{ color: '#FFFFFF' }}
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
                                    style={{ color: '#FFFFFF' }}
                                >
                                    Review
                                </Typography.Title>
                            ),
                        },
                    ]}
                />
            </HeaderSummary>
            <Content>
                {activeTab === 'dedaNotes' && <DedaNotes dedaId={dedaId} />}
                {activeTab === 'dedaActivity' && <DedaActivity dedaId={dedaId} />}
                {activeTab === 'dedaReview' && <DedaReview dedaId={dedaId} />}
            </Content>
        </AppLayout>
    );
}

export default withAuthentication(DedaContent);
