'use client';

import styled from '@emotion/styled';
import { Button, Flex, Typography } from 'antd';
import { AppLayout, Chip, DedasGrid, MaxWidthContainer, withRoles } from 'components';
import { useDeviceSize } from 'hooks';
import { useFeaturedDedaData } from 'hooks/queries/dedaQueries';
import { padding, SMALL_VIEWPORT, withAuthentication } from 'libs';
import { useRouter } from 'next/navigation';
import { useMelpContext } from 'providers';
import React, { useEffect, useMemo, useState } from 'react';

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

function DedaPage() {
    const device = useDeviceSize();

    const { melpSummary } = useMelpContext();

    const [selectedDeda, setSelectedDeda] = useState<string>();

    const unlockedDEDAs = useMemo(() => melpSummary?.unlocked_dedas ?? [], [melpSummary]);

    useEffect(() => {
        if (!selectedDeda) {
            setSelectedDeda(unlockedDEDAs[unlockedDEDAs.length - 1]);
        }
    }, [melpSummary, unlockedDEDAs, setSelectedDeda, selectedDeda]);

    const featuredDedaDataResult = useFeaturedDedaData(selectedDeda);

    const featuredDeda = featuredDedaDataResult.data?.dedaContentCollection.items[0];

    const router = useRouter();

    const handleSelectedDeda = (dedaId: string) => router.push(`/imerso/deda/${dedaId}`);

    return (
        <AppLayout withMelpSummary>
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
                                href={`/imerso/deda/${featuredDeda?.dedaId}`}
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
                    <DedasGrid type="lastDedas" onSelectedDeda={handleSelectedDeda} />
                </MaxWidthContainer>
                <MaxWidthContainer>
                    <DedasGrid type="nextDedas" onSelectedDeda={handleSelectedDeda} />
                </MaxWidthContainer>
                <MaxWidthContainer>
                    <DedasGrid type="allDedas" onSelectedDeda={handleSelectedDeda} />
                </MaxWidthContainer>
            </GridContent>
        </AppLayout>
    );
}

const DedaPageWithRoles = withRoles(DedaPage, {
    roles: ['METTLE_STUDENT', 'METTLE_ADMIN'],
    fallback: {
        type: 'redirect',
        to: '/',
    },
});

export default withAuthentication(DedaPageWithRoles);
