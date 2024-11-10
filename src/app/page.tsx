'use client';

import styled from '@emotion/styled';
import { Card, Col, Flex, Row, Typography } from 'antd';
import { AppLayout, CourseCard, MaxWidthContainer, withRoles, FreeHome } from 'components';
import { withAuthentication } from 'libs';
import { useAppContext } from 'providers';
import React from 'react';

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

    return (
        <AppLayout>
            <Content>
                <MaxWidthContainer>
                    <GreetingsCard>
                        <Row gutter={[16, 16]} justify="space-between">
                            <Col xs={24} md={12}>
                                <Flex vertical gap="1rem">
                                    <h1>Testando o preview!!!!</h1>
                                    <Title level={4}>👋 Bem vindo(a), {firstName}!</Title>
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
                                <Title level={4}>Continue estudando</Title>
                                <Text style={{ fontWeight: 400 }}>Navegue entre os cursos disponíveis para você</Text>
                            </Flex>

                            <Row gutter={[16, 16]}>
                                <Col xs={24} md={6}>
                                    <CourseCard
                                        imgUrl={'/img/imerso_thumb.webp'}
                                        title="IMERSO"
                                        type="Programa"
                                        href="/melp"
                                    />
                                </Col>
                            </Row>
                        </Flex>
                    </ContinueCard>
                </MaxWidthContainer>
            </Content>
        </AppLayout>
    );
}

const HomeWithRoles = withRoles(Home, {
    roles: ['METTLE_STUDENT', 'METTLE_ADMIN'],
    fallback: {
        component: <FreeHome />,
        type: 'component',
    },
});

export default withAuthentication(HomeWithRoles);
