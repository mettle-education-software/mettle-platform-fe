'use client';

import { UserOutlined, LockOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Input, Form, Button, Row, Col, Spin, Flex, Typography } from 'antd';
import { Logo, Google, Microsoft } from 'components';
import { useDeviceSize } from 'hooks';
import {
    withoutAuthentication,
    handleLogin,
    handleGoogleLogin,
    SMALL_VIEWPORT,
    handleMicrosoftLogin,
    padding,
} from 'libs';
import Link from 'next/link';
import React from 'react';

const { Text } = Typography;

const PageContainer = styled.div`
    max-height: 100vh;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
    display: flex;
`;

const LogoContainer = styled.div`
    width: 50%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    background:
        linear-gradient(0deg, rgba(60, 54, 47, 0.69) 0%, rgba(60, 54, 47, 0.69) 100%),
        url('/img/woman_bg.jpeg') lightgray 50% / cover no-repeat;
`;

const LogoWrapper = styled.div`
    width: 100%;
    max-width: 50%;
    padding: 1rem 0;

    @media (max-width: ${SMALL_VIEWPORT}px) {
        padding-top: 3.3rem;
    }
`;

const LoginContainer = styled.div`
    width: 50%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background: #fefdfb;

    @media (max-width: ${SMALL_VIEWPORT}px) {
        width: 100%;
    }
`;

const FormContainer = styled.div`
    width: 50%;
    max-width: 500px;
    display: flex;
    flex-direction: column;
    gap: 1rem;

    .input {
        border: 1px solid var(--neutral);
        padding: 1rem;
        margin: 0;
    }

    .prefix-icon {
        color: var(--secondary);
    }

    .forgot-col {
        align-items: flex-end !important;
        display: flex;
        flex-direction: column;
        margin-bottom: 1.25rem;
    }

    @media (max-width: ${SMALL_VIEWPORT}px) {
        width: 90vw;
    }
`;

const FormHeader = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    border-bottom: 1px solid var(--secondary);
    padding: 1rem;
    margin-bottom: 1rem;
    color: var(--primary);
`;

const LoginButton = styled(Button)`
    width: 100%;
    min-height: 40px;
    background: var(--secondary);
    padding: 0.5rem 0;
    height: 3rem;
`;

const ForgotPasswordLink = styled(Link)`
    color: var(--secondary);
    text-align: right;
    font-size: 1.2rem;

    &:hover {
        color: var(--tertiary);
    }
`;

const ErrorMessage = styled.span`
    color: red;
`;

const LineDivider = styled.div`
    width: 100%;
    height: 1px;
    background: var(--primary-bg, #b79060);
`;

function Login() {
    const [loginError, setLoginError] = React.useState<null | string>(null);
    const [isSignInLoading, setIsSignInLoading] = React.useState<boolean>(false);

    const deviceSize = useDeviceSize();

    const renderForm = () => (
        <LoginContainer>
            <FormContainer>
                <Spin spinning={isSignInLoading}>
                    <FormHeader>
                        <Text>Plataforma Mettle</Text>
                    </FormHeader>
                    <Form
                        layout="vertical"
                        onFinish={(values) => {
                            setIsSignInLoading(true);
                            handleLogin({
                                email: values.email,
                                password: values.password,
                                setLoginErrorMessage: setLoginError,
                                setIsSignInLoading,
                            });
                        }}
                    >
                        <Form.Item
                            validateDebounce={800}
                            name="email"
                            rules={[
                                {
                                    required: true,
                                    message: 'Por favor insira o seu e-mail de login',
                                },
                                { type: 'email', message: 'Por favor insira um e-mail válido' },
                            ]}
                        >
                            <Input
                                className="input"
                                size="large"
                                type="email"
                                placeholder="exemplo@empresa.com.br"
                                prefix={<UserOutlined className="prefix-icon" />}
                            />
                        </Form.Item>
                        <Form.Item name="password" rules={[{ required: true, message: 'Por favor insira a senha' }]}>
                            <Input.Password
                                className="input"
                                size="large"
                                placeholder="Senha"
                                prefix={<LockOutlined className="prefix-icon" />}
                            />
                        </Form.Item>
                        <Row justify="end" align="middle">
                            <Col className="forgot-col" span={12}>
                                <ForgotPasswordLink href={'/forgotten-password'}>Esqueceu a senha?</ForgotPasswordLink>
                            </Col>
                        </Row>
                        <LoginButton loading={isSignInLoading} size="large" type="primary" htmlType="submit">
                            Entrar
                        </LoginButton>
                        {loginError && <ErrorMessage>{loginError}</ErrorMessage>}
                    </Form>
                </Spin>

                <Flex align="center" gap="1rem">
                    <LineDivider />
                    <div>
                        <Typography.Text style={{ wordBreak: 'keep-all' }}>ou</Typography.Text>
                    </div>
                    <LineDivider />
                </Flex>

                <Button onClick={handleGoogleLogin} style={{ padding: '0.5rem 1rem', height: '3.5rem' }}>
                    <Flex style={{ width: '100%' }} align="center" gap="1rem">
                        <Google />
                        Continuar com o Google
                    </Flex>
                </Button>
                <Button onClick={handleMicrosoftLogin} style={{ padding: '0.5rem 1rem', height: '3.5rem' }}>
                    <Flex style={{ width: '100%' }} align="center" gap="1rem">
                        <Microsoft />
                        Continuar com a Microsoft
                    </Flex>
                </Button>
            </FormContainer>
        </LoginContainer>
    );

    if (deviceSize === 'mobile') {
        return (
            <Flex vertical align="center" gap={24} style={{ paddingBottom: padding.y.md }}>
                <LogoWrapper>
                    <Logo theme="dark" />
                </LogoWrapper>
                {renderForm()}
            </Flex>
        );
    }

    return (
        <PageContainer>
            <LogoContainer>
                <LogoWrapper>
                    <Logo />
                </LogoWrapper>
            </LogoContainer>
            {renderForm()}
        </PageContainer>
    );
}

export default withoutAuthentication(Login);
