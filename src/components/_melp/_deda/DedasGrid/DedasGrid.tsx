'use client';

import styled from '@emotion/styled';
import { Col, Flex, Row, Typography } from 'antd';
import { DedaCard } from 'components';
import { useDeviceSize, useMelpSummary } from 'hooks';
import { useAllDedasList, useLastDedas, useNextDedas } from 'hooks/queries/dedasLists';
import { DedaItem } from 'interfaces';
import { MAX_CONTENT_WIDTH } from 'libs';
import { useAppContext } from 'providers';
import React from 'react';

interface DedasGridProps {
    type: 'lastDedas' | 'nextDedas' | 'allDedas';
    onSelectedDeda: (dedaId: string) => void;
}

const Title = styled(Typography.Title)`
    color: white !important;
    font-weight: 500 !important;
`;

export const DedasGrid: React.FC<DedasGridProps> = ({ type, onSelectedDeda }) => {
    const device = useDeviceSize();

    const { user } = useAppContext();

    const { data: melpSummary, isLoading } = useMelpSummary(user?.uid as string);

    const currentWeek = melpSummary?.current_deda_week;

    const unlockedDEDAs = melpSummary?.unlocked_dedas ?? [];

    const currentDeda = unlockedDEDAs[unlockedDEDAs.length - 1];

    const lastDedas = unlockedDEDAs.slice(unlockedDEDAs.length - 4, unlockedDEDAs.length).reverse();

    let nextDedas: string[] = [];

    if (currentDeda) {
        const currentDedaNumber = parseInt(currentDeda.replace(/\D/g, ''));
        for (let i = 1; i <= 4; i++) {
            nextDedas.push(`DEDA${currentDedaNumber + i}`);
        }
    }

    const lastDedasResult = useLastDedas(lastDedas);
    const sortedLastDedasResult: DedaItem[] = [];

    lastDedasResult.data?.dedaContentCollection.items.forEach((deda) => {
        const indexOfLastDedas = lastDedas.indexOf(deda.dedaId);
        sortedLastDedasResult[indexOfLastDedas] = deda;
    });

    const nextDedasResult = useNextDedas(nextDedas);

    const allDedasResult = useAllDedasList(type !== 'allDedas');
    const sortedAllDedasResult: DedaItem[] = allDedasResult
        ? (allDedasResult.data?.dedaContentCollection?.items?.toSorted((a, b) => {
              return Number(a.dedaId.replace(/\D/g, '')) - Number(b.dedaId.replace(/\D/g, ''));
          }) as DedaItem[])
        : [];

    const showSkeleton = isLoading || lastDedasResult.loading || nextDedasResult.loading || allDedasResult.loading;

    const titles: { [key in DedasGridProps['type']]: React.ReactNode } = {
        lastDedas: (
            <Title level={4}>
                <strong>Most recent</strong> DEDAs
            </Title>
        ),
        nextDedas: (
            <Title level={4}>
                <strong>Next</strong> DEDAs
            </Title>
        ),
        allDedas: (
            <Title level={4}>
                <strong>All</strong> DEDAs
            </Title>
        ),
    };

    return (
        <Flex style={{ maxWidth: MAX_CONTENT_WIDTH, width: '100%' }} vertical gap="2.25rem">
            <div>
                <div style={{ width: '100%', marginBottom: '1rem' }}>{titles[type]}</div>

                <Row
                    gutter={[
                        {
                            xs: 16,
                            sm: 24,
                            md: 32,
                            lg: 54,
                            xl: 24,
                        },
                        {
                            xs: 16,
                            sm: 24,
                            md: 32,
                            lg: 54,
                            xl: 24,
                        },
                    ]}
                    justify="space-between"
                >
                    {showSkeleton && (
                        <>
                            <Col xs={12} md={6}>
                                <DedaCard isLoading />
                            </Col>
                            <Col xs={12} md={6}>
                                <DedaCard isLoading />
                            </Col>
                            <Col xs={12} md={6}>
                                <DedaCard isLoading />
                            </Col>
                            <Col xs={12} md={6}>
                                <DedaCard isLoading />
                            </Col>
                        </>
                    )}
                    {type === 'lastDedas' &&
                        sortedLastDedasResult.map((deda, index) => (
                            <Col xs={12} md={6} key={deda.dedaSlug}>
                                <DedaCard
                                    dedaId={deda.dedaId}
                                    imgUrl={deda.dedaFeaturedImage.url}
                                    title={deda.dedaTitle}
                                    week={`Week ${(currentWeek as number) - index}`}
                                    onClick={() => {
                                        onSelectedDeda(deda.dedaId);
                                    }}
                                    categories={deda.dedaCategories}
                                    blocked={!unlockedDEDAs?.includes(deda.dedaId)}
                                />
                            </Col>
                        ))}
                    {type === 'nextDedas' &&
                        nextDedasResult.data?.dedaContentCollection.items.map((deda, index) => (
                            <Col xs={12} md={6} key={deda.dedaSlug}>
                                <DedaCard
                                    dedaId={deda.dedaId}
                                    imgUrl={deda.dedaFeaturedImage.url}
                                    title={deda.dedaTitle}
                                    week={`Week ${(currentWeek as number) + index + 1}`}
                                    onClick={() => {
                                        onSelectedDeda(deda.dedaId);
                                    }}
                                    categories={deda.dedaCategories}
                                    blocked={!unlockedDEDAs?.includes(deda.dedaId)}
                                />
                            </Col>
                        ))}
                    {type === 'allDedas' &&
                        sortedAllDedasResult?.map((deda) => (
                            <Col xs={12} md={6} key={deda.dedaSlug}>
                                <DedaCard
                                    dedaId={deda.dedaId}
                                    imgUrl={deda.dedaFeaturedImage.url}
                                    title={deda.dedaTitle}
                                    onClick={() => {
                                        onSelectedDeda(deda.dedaId);
                                    }}
                                    categories={deda.dedaCategories}
                                    blocked={!unlockedDEDAs?.includes(deda.dedaId)}
                                />
                            </Col>
                        ))}
                </Row>
            </div>
        </Flex>
    );
};
