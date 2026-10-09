'use client';

import styled from '@emotion/styled';
import { Button, Flex, Typography } from 'antd';
import { AppLayout, Chip, DedasGrid, MaxWidthContainer, withRoles } from 'components';
import { DedaHeaderBackdrop } from 'components/_melp/_deda/DedaHeaderBackdrop/DedaHeaderBackdrop';
import { useDeviceSize } from 'hooks';
import { useDedaHeaderImage, useDedaHomeHeaderImage, useFeaturedDedaData } from 'hooks/queries/dedaQueries';
import { useNewDesign } from 'hooks/useNewDesign';
import { padding, SMALL_VIEWPORT, withAuthentication } from 'libs';
import { dedaPath } from 'libs/cleanUrls';
import { recentDedaIds, todaysDedaId } from 'libs/dedaClock';
import { HEADER_GRADIENT, HOME_ART_OBJECT_POSITION, HOME_MOBILE_CROPS } from 'libs/dedaHeader';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useMelpContext } from 'providers';
import React, { useEffect, useMemo, useState } from 'react';

const { Title } = Typography;

// Lista de DEDAs da plataforma nova (libs/newDesign), só para as contas da lista: fora do bundle dos alunos.
const NewDedaList = dynamic(() => import('components/_new/NewDedaList'), { ssr: false, loading: () => null });

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

    const blockedDEDAs =
        useMemo(() => ['MELP_SUSPENDED'].includes(melpSummary?.melp_status), [melpSummary]) ||
        melpSummary?.days_since_melp_start < 2;

    const [selectedDeda, setSelectedDeda] = useState<string>();

    useEffect(() => {
        if (!selectedDeda) {
            // relógio novo: o de hoje (deda_today) ou, sem ele publicado, o último publicado; legado: o último liberado
            setSelectedDeda(todaysDedaId(melpSummary) ?? recentDedaIds(melpSummary, 1)[0]);
        }
    }, [melpSummary, setSelectedDeda, selectedDeda]);

    const featuredDedaDataResult = useFeaturedDedaData(selectedDeda);
    // Cabeçalho: imagem própria (dedaHeaderImage) ou, sem ela, a do card como antes.
    const headerImage = useDedaHeaderImage(selectedDeda);
    // Home: arte própria (ultra-panorâmica) antes da imagem de cabeçalho do DEDA e da do card.
    const homeHeaderImage = useDedaHomeHeaderImage(selectedDeda);

    const featuredDeda = featuredDedaDataResult.data?.dedaContentCollection.items[0];

    const router = useRouter();

    const handleSelectedDeda = (dedaSlug: string) => router.push(dedaPath(dedaSlug));

    const newDesign = useNewDesign();
    if (newDesign)
        return (
            <AppLayout withMelpSummary>
                <NewDedaList />
            </AppLayout>
        );

    return (
        <AppLayout withMelpSummary>
            <HeaderSummary>
                <DedaHeaderBackdrop
                    images={[
                        homeHeaderImage && { ...homeHeaderImage, objectPosition: HOME_ART_OBJECT_POSITION },
                        headerImage,
                        featuredDeda?.dedaFeaturedImage,
                    ]}
                    // Bloqueada no celular o cabeçalho é mais alto (~2,8:1): vale o recorte padrão, mais alto.
                    mobileCrops={blockedDEDAs ? undefined : HOME_MOBILE_CROPS}
                    gradient={HEADER_GRADIENT}
                />
                {!blockedDEDAs ? (
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
                ) : (
                    <div style={{ height: '5rem' }} />
                )}
            </HeaderSummary>
            <GridContent>
                <MaxWidthContainer>
                    <DedasGrid blockedDEDAs={blockedDEDAs} type="lastDedas" onSelectedDeda={handleSelectedDeda} />
                </MaxWidthContainer>
                <MaxWidthContainer>
                    <DedasGrid blockedDEDAs={blockedDEDAs} type="nextDedas" onSelectedDeda={handleSelectedDeda} />
                </MaxWidthContainer>
                <MaxWidthContainer>
                    <DedasGrid blockedDEDAs={blockedDEDAs} type="allDedas" onSelectedDeda={handleSelectedDeda} />
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
