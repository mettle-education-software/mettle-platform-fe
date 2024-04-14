'use client';

import styled from '@emotion/styled';
import { Typography, Row, Col, Flex, Button } from 'antd';
import { AppLayout, DedasGrid } from 'components';
import { useDeviceSize, useMelpSummary } from 'hooks';
import { useFeaturedDedaData } from 'hooks/queries/dedaQueries';
import { withAuthentication, padding, MAX_CONTENT_WIDTH, SMALL_VIEWPORT } from 'libs';
import { useAppContext } from 'providers';
import React, { useEffect, useState } from 'react';

const HeaderSummary = styled.section<{ imgUrl?: string }>`
    position: sticky;
    top: 0;
    z-index: 1;
    background: linear-gradient(0deg, rgb(43, 43, 43) 0%, rgb(0, 0, 0, 0) 100%), url(${({ imgUrl }) => imgUrl});
    background-size: cover;
    background-position: bottom;
    padding: ${padding.x.sm} ${padding.x.lg};
    height: 190px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    boder: none;

    & h1 {
        color: var(--secondary);
    }
`;

const GridContent = styled.section`
    margin-top: -1px;
    background: #2b2b2b;
    width: 100%;
    min-height: 100%;
    padding: 23px ${padding.x.lg} ${padding.x.lg} ${padding.x.lg};
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3rem;
    border: none;

    @media (max-width: ${SMALL_VIEWPORT}px) {
        padding: 0 22px;
    }
`;

function DedaPage() {
    const device = useDeviceSize();

    const { user } = useAppContext();

    const { data: melpSummary } = useMelpSummary(user?.uid as string);

    const [selectedDeda, setSelectedDeda] = useState<string>();

    useEffect(() => {
        if (!selectedDeda) {
            setSelectedDeda(melpSummary?.unlockedDEDAs[melpSummary?.unlockedDEDAs.length - 1]);
        }
    }, [melpSummary]);

    const featuredDedaDataResult = useFeaturedDedaData(selectedDeda);

    const featuredDeda = featuredDedaDataResult.data?.dedaContentCollection.items[0];

    const handleSelectedDeda = (dedaId: string) => setSelectedDeda(dedaId);

    return (
        <AppLayout withMelpSummary>
            <HeaderSummary imgUrl={featuredDeda?.dedaFeaturedImage.url}>
                <div style={{ maxWidth: MAX_CONTENT_WIDTH, width: '100%' }}>
                    {device === 'desktop' && (
                        <Row justify="space-between" align="middle">
                            <Col span={12}>
                                <Flex vertical>
                                    <Typography.Title>{featuredDeda?.dedaTitle}</Typography.Title>
                                </Flex>
                            </Col>
                            <Col>
                                <Button href={`/melp/deda/${featuredDeda?.dedaId}`} type="primary">
                                    Go to DEDA
                                </Button>
                            </Col>
                        </Row>
                    )}
                </div>
            </HeaderSummary>
            <GridContent>
                <DedasGrid type="lastDedas" onSelectedDeda={handleSelectedDeda} />
                <DedasGrid type="nextDedas" onSelectedDeda={handleSelectedDeda} />
                <DedasGrid type="allDedas" onSelectedDeda={handleSelectedDeda} />
            </GridContent>
        </AppLayout>
    );
}

export default withAuthentication(DedaPage);
