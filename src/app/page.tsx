'use client';

import styled from '@emotion/styled';
import { Card, Col, Flex, Row, Typography } from 'antd';
import { AppLayout, FreeHome, MaxWidthContainer, MettleCoursesList, withRoles } from 'components';
import { useNewDesign } from 'hooks/useNewDesign';
import { withAuthentication } from 'libs';
import dynamic from 'next/dynamic';
import { useAppContext } from 'providers';
import React from 'react';

// Home da plataforma nova (libs/newDesign), só para as contas da lista: carregada à parte, fora do bundle dos alunos.
const NewHome = dynamic(() => import('components/_new/NewHome'), { ssr: false, loading: () => null });

const { Title, Text } = Typography;

const Content = styled.section`
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem 0;
    gap: 2rem;
    min-height: 100%;
`;

const GreetingsCard = styled(Card)`
    position: relative;
    z-index: 2;
    border: none;

    ::before {
        content: '';
        position: absolute;
        z-index: 1;
        bottom: 0;
        right: 0;
        width: 9rem;
        height: 85%;
        background-image: url('/img/target-motive.webp');
        background-size: contain;
        background-repeat: no-repeat;
        background-position: bottom right;
    }
`;

const ContinueCard = styled(Card)`
    height: 100%;

    .ant-card-head {
        border-bottom: none;
    }
`;

function Home() {
    const { user } = useAppContext();

    const [firstName] = user?.name ? user.name.split(' ') : [''];

    const newDesign = useNewDesign();
    if (newDesign)
        return (
            <AppLayout>
                <NewHome />
            </AppLayout>
        );

    return (
        <AppLayout>
            <Content>
                <MaxWidthContainer>
                    <GreetingsCard>
                        <Row gutter={[16, 16]} justify="space-between">
                            <Col xs={24} md={12}>
                                <Flex vertical gap="1rem">
                                    <Title level={4}>👋 Olá, {firstName}!</Title>
                                </Flex>
                            </Col>
                            <Col xs={24} md={12}>
                                <Text>
                                    &quot;Não ambiciones senão um único direito: o de cumprires o teu dever.&quot;{' '}
                                </Text>
                                <Text>(São Josemaria Escrivá — Sulco, 413)</Text>
                            </Col>
                        </Row>
                    </GreetingsCard>
                </MaxWidthContainer>

                <MaxWidthContainer>
                    <ContinueCard>
                        <Flex vertical gap="1.5rem">
                            <Flex vertical gap="0.2rem">
                                <Title level={4}>Continue aprendendo...</Title>
                                <Text style={{ fontWeight: 400 }}>Acesse os cursos disponíveis para você.</Text>
                            </Flex>

                            <MettleCoursesList />
                        </Flex>
                    </ContinueCard>
                </MaxWidthContainer>
            </Content>
        </AppLayout>
    );
}

export default withAuthentication(Home);
