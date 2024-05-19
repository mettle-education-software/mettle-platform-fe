'use client';

import styled from '@emotion/styled';
import { Col, Flex, Row, Typography } from 'antd';
import { HpecModulesList, HpecResources, HpecSummary, HpecVideo, MaxWidthContainer, TabNav } from 'components';
import { AppLayout } from 'components/layouts';
import { useGetHpecResources } from 'hooks/queries/hpecQueries';
import { withAuthentication } from 'libs';
import React from 'react';

const { Title } = Typography;

const Header = styled.div`
    width: 100%;
    padding: 1.8rem 0;
    display: flex;
    justify-content: center;
    background:
        linear-gradient(180deg, rgba(0, 0, 0, 0.6) 0%, #2b2b2b 100%),
        url('/img/hpec-bg.webp') lightgray 50% / cover no-repeat;
    background-blend-mode: normal, luminosity;
`;

const HpecSection = styled.section`
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: #2b2b2b;
`;

function HpecContent({ params: { hpecId, lessonId } }: { params: { hpecId: string; lessonId: string } }) {
    const { data, loading } = useGetHpecResources(lessonId);

    return (
        <AppLayout withMelpSummary>
            <Header>
                <MaxWidthContainer>
                    <Flex vertical gap="0.2rem">
                        <Title level={1} className="color-secondary">
                            HPEC
                        </Title>
                        <Title level={4} className="color-white" style={{ fontWeight: 400 }}>
                            This is your personal coach. Go ahead!
                        </Title>
                    </Flex>
                </MaxWidthContainer>
            </Header>

            <HpecSection>
                <MaxWidthContainer>
                    <Row gutter={[16, 16]}>
                        <Col span={6}>
                            <HpecModulesList activeLessonId={lessonId} activeHpecId={hpecId} />
                        </Col>
                        <Col span={18}>
                            <TabNav
                                items={[
                                    {
                                        key: 'video',
                                        label: 'Video',
                                        children: <HpecVideo lessonId={lessonId} />,
                                    },
                                    {
                                        key: 'summary',
                                        label: 'Summary',
                                        children: <HpecSummary lessonId={lessonId} />,
                                    },
                                    {
                                        key: 'resources',
                                        label: 'Resources',
                                        children: <HpecResources lessonId={lessonId} />,
                                        disabled:
                                            data?.singleLessonCollection?.items[0].lessonResourcesCollection.items
                                                .length === 0,
                                    },
                                ]}
                            />
                        </Col>
                    </Row>
                </MaxWidthContainer>
            </HpecSection>
        </AppLayout>
    );
}

export default withAuthentication(HpecContent);
