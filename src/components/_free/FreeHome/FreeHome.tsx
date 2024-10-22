'use client';

import styled from '@emotion/styled';
import { Button, Flex, Typography } from 'antd';
import { AppLayout, Chip, DedasGrid, MaxWidthContainer } from 'components';
import { useDeviceSize, useGetCurrentDeda } from 'hooks';
import { useFeaturedDedaData } from 'hooks/queries/dedaQueries';
import { padding, SMALL_VIEWPORT, withAuthentication } from 'libs';
import { useRouter } from 'next/navigation';
import React from 'react';

const { Title } = Typography;

const HeaderSummary = styled.section<{ imgUrl?: string }>`
    background: linear-gradient(0deg, rgb(43, 43, 43) 0%, rgb(43, 43, 43, 0.7) 100%), url(${({ imgUrl }) => imgUrl}),
        #2b2b2b;
    background-size: cover;
    background-position: center;
    width: 100%;
    padding: 1.8rem 0;
    display: flex;
    justify-content: center;
    position: sticky;
    top: 0;
    z-index: 3;
`;

const GridContent = styled.section`
    margin-top: -1px;
    background: #2b2b2b;
    width: 100%;
    min-height: 100%;
    //padding: 23px ${padding.x.lg} ${padding.x.lg} ${padding.x.lg};
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3rem;
    border: none;
    padding-bottom: 2rem;

    @media (max-width: ${SMALL_VIEWPORT}px) {
        padding: 0 22px;
    }
`;

export const FreeHome = () => {
    const device = useDeviceSize();

    const { data: currentDeda } = useGetCurrentDeda();

    const featuredDedaDataResult = useFeaturedDedaData(currentDeda?.id);

    const featuredDeda = featuredDedaDataResult.data?.dedaContentCollection.items[0];

    const router = useRouter();

    const handleSelectedDeda = (dedaId: string) => router.push(`/melp/deda/${dedaId}`);

    return (
        <AppLayout>
            <HeaderSummary imgUrl={featuredDeda?.dedaFeaturedImage.url}>
                <MaxWidthContainer>
                    {device === 'desktop' && (
                        <Flex align="flex-end" justify="space-between">
                            <Flex vertical gap="0.8rem">
                                <Chip
                                    bgColor="rgba(183, 144, 96, 0.3)"
                                    style={{ border: 'none', paddingLeft: 18, paddingRight: 18 }}
                                >
                                    <Title level={5} style={{ color: '#FFFFFF' }}>
                                        Current DEDA
                                    </Title>
                                </Chip>
                                <Title level={1} className="color-secondary">
                                    {featuredDeda?.dedaTitle}
                                </Title>
                            </Flex>
                            <Button
                                style={{ borderRadius: 36, fontSize: 20, height: 40 }}
                                href={`/melp/deda/${featuredDeda?.dedaId}`}
                                type="primary"
                            >
                                Go to DEDA
                            </Button>
                        </Flex>
                    )}
                </MaxWidthContainer>
            </HeaderSummary>
            <GridContent>
                <MaxWidthContainer>
                    <DedasGrid type="allDedas" onSelectedDeda={handleSelectedDeda} />
                </MaxWidthContainer>
            </GridContent>
        </AppLayout>
    );
};
