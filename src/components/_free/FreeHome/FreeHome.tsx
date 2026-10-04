'use client';

import styled from '@emotion/styled';
import { Button, Flex, Typography } from 'antd';
import { AppLayout, Chip, DedasGrid, MaxWidthContainer } from 'components';
import { DedaHeaderBackdrop } from 'components/_melp/_deda/DedaHeaderBackdrop/DedaHeaderBackdrop';
import { useDeviceSize, useGetCurrentDeda } from 'hooks';
import { useDedaHeaderImage, useDedaHomeHeaderImage, useFeaturedDedaData } from 'hooks/queries/dedaQueries';
import { padding, SMALL_VIEWPORT } from 'libs';
import { dedaPath } from 'libs/cleanUrls';
import { FULL_HEADER_CSS, HEADER_GRADIENT, HOME_ART_OBJECT_POSITION, HOME_MOBILE_CROPS } from 'libs/dedaHeader';
import { useRouter } from 'next/navigation';
import React from 'react';

const { Title } = Typography;

const HeaderSummary = styled.section`
    background-color: #2b2b2b;
    /* conteúdo acima do fundo (<DedaHeaderBackdrop>) */
    & > :not([data-deda-backdrop]) {
        position: relative;
    }

    /* título e chip legíveis sobre imagem clara */
    h1,
    h5 {
        text-shadow: 0 2px 8px rgba(0, 0, 0, 0.55);
    }
    width: 100%;
    padding: 1.8rem 0;
    display: flex;
    justify-content: center;
    position: sticky;
    top: 0;
    z-index: 3;

    /* imagem própria: altura segue a largura (3:1), conteúdo na base e cabeçalho rola com a página
       (fixo, ocuparia metade da tela) */
    ${FULL_HEADER_CSS}
    &:has([data-deda-full]) {
        position: relative;
        align-items: flex-end;
    }
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
    // Cabeçalho: imagem própria (dedaHeaderImage) ou, sem ela, a do card como antes.
    const headerImage = useDedaHeaderImage(currentDeda?.id);
    // Home: arte própria (ultra-panorâmica) antes da imagem de cabeçalho do DEDA e da do card.
    const homeHeaderImage = useDedaHomeHeaderImage(currentDeda?.id);

    const featuredDeda = featuredDedaDataResult.data?.dedaContentCollection.items[0];

    const router = useRouter();

    const handleSelectedDeda = (dedaSlug: string) => router.push(dedaPath(dedaSlug));

    return (
        <AppLayout>
            <HeaderSummary>
                <DedaHeaderBackdrop
                    images={[
                        homeHeaderImage && { ...homeHeaderImage, objectPosition: HOME_ART_OBJECT_POSITION, full: true },
                        headerImage && { ...headerImage, full: true },
                        featuredDeda?.dedaFeaturedImage,
                    ]}
                    mobileCrops={HOME_MOBILE_CROPS}
                    gradient={HEADER_GRADIENT}
                />
                <MaxWidthContainer>
                    {device === 'desktop' && (
                        <Flex align="flex-end" justify="space-between">
                            <Flex vertical gap="0.8rem">
                                <Chip
                                    bgColor="rgba(183, 144, 96, 0.3)"
                                    style={{
                                        border: 'none',
                                        paddingLeft: 18,
                                        paddingRight: 18,
                                        alignSelf: 'flex-start',
                                    }}
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
                                href={featuredDeda && dedaPath(featuredDeda.dedaSlug)}
                                type="primary"
                            >
                                Open DEDA
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
