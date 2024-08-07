'use client';

import styled from '@emotion/styled';
import { Card, Col, Flex, Row, Typography } from 'antd';
import { AppLayout, CourseCard, MaxWidthContainer } from 'components';
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

    const [firstName] = user ? user.name.split(' ') : [''];

    return (
        <AppLayout>
            <Content>
                <MaxWidthContainer>
                    <GreetingsCard>
                        <Row gutter={[16, 16]} justify="space-between">
                            <Col xs={24} md={12}>
                                <Flex vertical gap="1rem">
                                    <Title level={4}>👋 Bem vindo, {firstName}!</Title>
                                </Flex>
                            </Col>
                            <Col xs={24} md={12}>
                                <Text>
                                    “O trabalho vai preencher uma grande parte da sua vida. A única maneira de ser
                                    realmente feliz é fazer o que você acredita ser um ótimo trabalho. E o único jeito
                                    de fazer um ótimo trabalho é amar o que você faz”. Steve Jobs
                                </Text>
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
                                        imgUrl={'/img/melp-thumb.webp'}
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

export default withAuthentication(Home);
