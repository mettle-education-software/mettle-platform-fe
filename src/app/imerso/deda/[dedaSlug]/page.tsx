'use client';

import styled from '@emotion/styled';
import { ArrowBackIos, Mic } from '@mui/icons-material';
import { Button, Flex, Typography } from 'antd';
import { DedaActivity, DedaNotes, DedaQuote, DedaReview, MaxWidthContainer, TabNav, withRoles } from 'components';
import { DedaHeaderBackdrop } from 'components/_melp/_deda/DedaHeaderBackdrop/DedaHeaderBackdrop';
import { MyRecordings } from 'components/_melp/_deda/DedaRecorder/MyRecordings';
import { AppLayout } from 'components/layouts';
import { LoadingLayout } from 'components/layouts/LoadingLayout/LoadingLayout';
import { useDeviceSize } from 'hooks';
import { useDedaReader } from 'hooks/melp/dedaReader';
import { useDedaRecordings } from 'hooks/melp/dedaRecording';
import { useDedaHeaderImage, useFeaturedDedaData } from 'hooks/queries/dedaQueries';
import { SMALL_VIEWPORT, withAuthentication } from 'libs';
import { withDedaSlug } from 'libs/authentication/withDedaSlug';
import { withDedaUnlocked } from 'libs/authentication/withDedaUnlocked';
import { HEADER_GRADIENT } from 'libs/dedaHeader';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

const { Title } = Typography;

// Página nova do DEDA (modo de estudo), só para as contas de libs/dedaReader: carregada à parte, fora do bundle dos alunos.
const DedaReaderStudy = dynamic(() => import('components/_melp/_deda/DedaReader/DedaReaderStudy'), {
    ssr: false,
    loading: () => <LoadingLayout />,
});

// Link discreto "Classic view" / "New view": só aparece para as contas da página nova.
const ViewSwitch = styled.button`
    /* && vence o "position: relative" que HeaderSummary dá aos filhos */
    && {
        position: absolute;
    }
    top: 0.5rem;
    right: 1rem;
    z-index: 1;
    min-height: 44px;
    padding: 0 0.5rem;
    border: 0;
    background: none;
    color: #e8dccb;
    font: inherit;
    font-size: 0.8125rem;
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;

    &:focus-visible {
        outline: 2px solid #ffffff;
    }
`;

const HeaderSummary = styled.section`
    position: relative;
    background-color: #2b2b2b;
    /* conteúdo acima do fundo (<DedaHeaderBackdrop>) */
    & > :not([data-deda-backdrop]) {
        position: relative;
    }

    /* título legível sobre imagem clara */
    h1 {
        text-shadow: 0 2px 8px rgba(0, 0, 0, 0.55);
    }

    .deda-header-quote {
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
    }
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

        /* Quatro abas (com a de gravações) cabem em 360 px sem rolar nem cair na reticência ("…"). */
        .ant-tabs-tab {
            padding-left: 0.625rem !important;
            padding-right: 0.625rem !important;
        }

        .ant-tabs-tab-active .ant-tabs-tab-btn {
            padding: 0 0.25rem !important;
        }
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
    // Cabeçalho: imagem própria (dedaHeaderImage) ou, sem ela, a do card como antes.
    const headerImage = useDedaHeaderImage(dedaId);
    const featuredDeda = featuredDedaDataResult.data?.dedaContentCollection.items[0];

    const [activeTab, setActiveTab] = useState('dedaNotes');
    // Aba "My recordings": só com o gravador liberado para o aluno (hooks/melp/dedaRecording).
    const recordingsTab = useDedaRecordings(dedaId).active;
    const reader = useDedaReader();

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
        ...(recordingsTab
            ? [
                  {
                      key: 'dedaRecordings',
                      label: (
                          <Title
                              level={5}
                              className={activeTab === 'dedaRecordings' ? 'activeTab' : undefined}
                              style={{ color: '#FFFFFF', fontWeight: 400 }}
                          >
                              {isDesktop ? (
                                  'My recordings'
                              ) : (
                                  // Celular: ícone, para as quatro abas caberem sem a reticência ("…") de 360 px em diante.
                                  <Mic titleAccess="My recordings" style={{ verticalAlign: 'middle' }} />
                              )}
                          </Title>
                      ),
                  },
              ]
            : []),
    ];

    return (
        <AppLayout withMelpSummary>
            <HeaderSummary>
                <DedaHeaderBackdrop
                    images={[headerImage, featuredDeda?.dedaFeaturedImage]}
                    gradient={HEADER_GRADIENT}
                />
                {reader.allowed && (
                    <ViewSwitch type="button" onClick={() => reader.setView(reader.on ? 'classic' : 'new')}>
                        {reader.on ? 'Classic view' : 'New view'}
                    </ViewSwitch>
                )}
                <MaxWidthContainer style={{ marginBottom: '2rem' }}>
                    {isDesktop ? (
                        <Flex justify="space-between">
                            <Flex align="center">
                                <Button
                                    style={{ border: 'none' }}
                                    icon={<ArrowBackIos className="color-secondary" />}
                                    ghost
                                    onClick={() => {
                                        router.push('/imerso/deda');
                                    }}
                                />
                                <Typography.Title>{featuredDeda?.dedaTitle}</Typography.Title>
                            </Flex>
                            <div style={{ flex: 0.3, minWidth: 260 }} className="deda-header-quote">
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
                                        router.push('/imerso/deda');
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
                {activeTab === 'dedaActivity' &&
                    (reader.on ? (
                        <DedaReaderStudy
                            dedaId={dedaId}
                            title={featuredDeda?.dedaTitle}
                            coverUrl={featuredDeda?.dedaFeaturedImage?.url}
                            stripImageUrl={headerImage?.url ?? featuredDeda?.dedaFeaturedImage?.url}
                            tabs={[
                                { key: 'dedaNotes', label: 'DEDA Notes' },
                                { key: 'dedaActivity', label: 'DEDA' },
                                { key: 'dedaReview', label: 'Review' },
                                ...(recordingsTab ? [{ key: 'dedaRecordings', label: 'My recordings' }] : []),
                            ]}
                            activeTab={activeTab}
                            onTab={setActiveTab}
                            onClassic={() => reader.setView('classic')}
                        />
                    ) : (
                        <DedaActivity dedaId={dedaId} />
                    ))}
                {activeTab === 'dedaReview' && <DedaReview dedaId={dedaId} />}
                {activeTab === 'dedaRecordings' && recordingsTab && (
                    <MyRecordings
                        dedaId={dedaId}
                        dedaTitle={featuredDeda?.dedaTitle}
                        coverSrc={featuredDeda?.dedaFeaturedImage?.url}
                    />
                )}
            </Content>
        </AppLayout>
    );
}

const DedaContentWithRoles = withRoles(DedaContent, {
    roles: ['METTLE_STUDENT', 'METTLE_ADMIN'],
    fallback: {
        type: 'redirect',
        to: '/',
    },
});

export default withAuthentication(withDedaSlug(withDedaUnlocked(DedaContentWithRoles)));
