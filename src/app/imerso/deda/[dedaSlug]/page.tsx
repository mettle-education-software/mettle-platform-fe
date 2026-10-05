'use client';

import styled from '@emotion/styled';
import { ArrowBackIos, Mic } from '@mui/icons-material';
import { Button, Flex, Typography } from 'antd';
import { DedaActivity, DedaNotes, DedaQuote, DedaReview, MaxWidthContainer, TabNav, withRoles } from 'components';
import { DedaHeaderBackdrop } from 'components/_melp/_deda/DedaHeaderBackdrop/DedaHeaderBackdrop';
import { MyRecordings } from 'components/_melp/_deda/DedaRecorder/MyRecordings';
import { AppLayout } from 'components/layouts';
import { useDeviceSize } from 'hooks';
import { useDedaRecordings } from 'hooks/melp/dedaRecording';
import { useDedaHeaderImage, useFeaturedDedaData } from 'hooks/queries/dedaQueries';
import { SMALL_VIEWPORT, withAuthentication } from 'libs';
import { withDedaSlug } from 'libs/authentication/withDedaSlug';
import { withDedaUnlocked } from 'libs/authentication/withDedaUnlocked';
import { HEADER_GRADIENT } from 'libs/dedaHeader';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

const { Title } = Typography;

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
                {activeTab === 'dedaActivity' && <DedaActivity dedaId={dedaId} />}
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
