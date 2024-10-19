'use client';

import styled from '@emotion/styled';
import { Button, Card, Col, Flex, Row, Typography } from 'antd';
import { Google, Logo, Microsoft } from 'components';
import { handleGoogleLogin, handleMicrosoftLogin } from 'libs';
import React from 'react';

const { Title } = Typography;

const PageWrapper = styled.main`
    height: 100vh;
    width: 100vw;
    max-height: 100vh;
    max-width: 100vw;
    background-image: url('/img/deda-grid-bg.webp');
    background-size: cover;
    background-repeat: no-repeat;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding-top: 2rem;
    position: relative;

    &::before {
        position: absolute;

        content: '';
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 0;
    }
`;

const Footer = styled.footer`
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    padding: 1rem;
    text-align: center;
    color: var(--white);
    display: flex;
    justify-content: center;
    align-items: center;
`;

const ContentBox = styled.div`
    height: 70%;
    width: 60%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 2rem;
`;

const SignUpBox = styled(Card)`
    background-color: var(--main-bg) !important;
    border: none !important;
    -webkit-box-shadow: 0 38px 54px -23px rgba(0, 0, 0, 1);
    -moz-box-shadow: 0 38px 54px -23px rgba(0, 0, 0, 1);
    box-shadow: 0 38px 54px -23px rgba(0, 0, 0, 1);
`;

const FooterLink = styled(Button)`
    color: #f9f9f9;
`;

export default function SignUp() {
    return (
        <PageWrapper>
            <div style={{ width: '25rem', position: 'relative', zIndex: 2 }}>
                <Logo theme="light" />
            </div>
            <ContentBox>
                <Row gutter={[42, 16]} align="middle">
                    <Col xs={24} md={16}>
                        <Flex gap="1rem" vertical>
                            <Title
                                level={1}
                                className="color-white"
                                style={{
                                    fontSize: '4rem',
                                }}
                            >
                                Inglês do mundo real.
                            </Title>{' '}
                            <Title
                                level={1}
                                className="color-white"
                                style={{
                                    fontSize: '4rem',
                                }}
                            >
                                {' '}
                                Sem enrolação.
                            </Title>
                            <Title level={2} className="color-white">
                                Mais de 10.000 horas de conteúdo para você aprender de verdade!
                            </Title>
                        </Flex>
                    </Col>
                    <Col xs={24} md={8}>
                        <SignUpBox>
                            <Flex vertical gap="2rem">
                                <Button
                                    onClick={handleGoogleLogin}
                                    block
                                    style={{ padding: '0.5rem 1rem', height: '3.5rem' }}
                                >
                                    <Flex style={{ width: '100%' }} align="center" gap="1rem">
                                        <Google />
                                        Acessar com o Google
                                    </Flex>
                                </Button>
                                <Button
                                    onClick={handleMicrosoftLogin}
                                    block
                                    style={{ padding: '0.5rem 1rem', height: '3.5rem' }}
                                >
                                    <Flex style={{ width: '100%' }} align="center" gap="1rem">
                                        <Microsoft />
                                        Acessar com a Microsoft
                                    </Flex>
                                </Button>
                            </Flex>
                        </SignUpBox>
                    </Col>
                </Row>
            </ContentBox>
            <Footer>
                <FooterLink href="https://mettle.com.br/politica-de-privacidade" type="link" size="small">
                    Política de privacidade
                </FooterLink>
            </Footer>
        </PageWrapper>
    );
}
