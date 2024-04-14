'use client';

import styled from '@emotion/styled';
import { Row, Col, Typography, Flex, Spin } from 'antd';
import { DedaCard } from 'components';
import { useDeviceSize, useMelpSummary } from 'hooks';
import { useAllDedasList, useLastDedas, useNextDedas } from 'hooks/queries/dedasLists';
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

    const unlockedDEDAs = melpSummary?.unlockedDEDAs ?? [];

    const currentDeda = unlockedDEDAs[unlockedDEDAs.length - 1];

    const lastDedas = unlockedDEDAs.slice(unlockedDEDAs.length - 4, unlockedDEDAs.length);

    let nextDedas: string[] = [];

    if (currentDeda) {
        const currentDedaNumber = parseInt(currentDeda.replace(/\D/g, ''));
        for (let i = 1; i <= 4; i++) {
            nextDedas.push(`DEDA${currentDedaNumber + i}`);
        }
    }

    const lastDedasResult = useLastDedas(lastDedas);

    const nextDedasResult = useNextDedas(nextDedas);

    const allDedasResult = useAllDedasList(type !== 'allDedas');

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
            {isLoading && <Spin spinning />}
            <div>
                <div style={{ width: '100%', marginBottom: '1rem' }}>{titles[type]}</div>

                <Row gutter={[24, 24]} justify="space-between">
                    {type === 'lastDedas' &&
                        lastDedasResult.data?.dedaContentCollection.items.map((deda) => (
                            <Col xs={12} md={6} key={deda.dedaSlug}>
                                <DedaCard
                                    dedaId={deda.dedaId}
                                    imgUrl={deda.dedaFeaturedImage.url}
                                    title={deda.dedaTitle}
                                    week="Week 013"
                                    onClick={() => {
                                        onSelectedDeda(deda.dedaId);
                                    }}
                                />
                            </Col>
                        ))}
                    {type === 'nextDedas' &&
                        nextDedasResult.data?.dedaContentCollection.items.map((deda) => (
                            <Col xs={12} md={6} key={deda.dedaSlug}>
                                <DedaCard
                                    dedaId={deda.dedaId}
                                    imgUrl={deda.dedaFeaturedImage.url}
                                    title={deda.dedaTitle}
                                    week="Week 013"
                                    onClick={() => {
                                        onSelectedDeda(deda.dedaId);
                                    }}
                                />
                            </Col>
                        ))}
                    {type === 'allDedas' &&
                        allDedasResult.data?.dedaContentCollection.items.map((deda) => (
                            <Col xs={12} md={6} key={deda.dedaSlug}>
                                <DedaCard
                                    dedaId={deda.dedaId}
                                    imgUrl={deda.dedaFeaturedImage.url}
                                    title={deda.dedaTitle}
                                    week="Week 013"
                                    onClick={() => {
                                        onSelectedDeda(deda.dedaId);
                                    }}
                                />
                            </Col>
                        ))}
                </Row>
            </div>
        </Flex>
    );
};
