'use client';

import { LockOutlined, UserOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Button, Col, Flex, Form, Input, Row, Spin, Typography } from 'antd';
import { useLoginDesign } from 'components/layouts/AuthenticationLayout/AuthenticationDesign';
import type { MultiFactorResolver } from 'firebase/auth';
// import { Google, Microsoft } from 'components';
import { handleGoogleLogin, handleLogin, handleMicrosoftLogin, SMALL_VIEWPORT } from 'libs';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import React from 'react';
import { MfaStep } from './MfaStep';

const NewLoginForm = dynamic(() => import('components/_new/NewAuthentication').then((m) => m.NewLoginForm));

const { Text } = Typography;

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
        color: var(--primary);
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

export default function Login() {
    const [loginError, setLoginError] = React.useState<null | string>(null);
    const [isSignInLoading, setIsSignInLoading] = React.useState<boolean>(false);
    // conta com verificação em duas etapas: depois da senha, o código do app autenticador
    const [mfa, setMfa] = React.useState<MultiFactorResolver | null>(null);

    const { enabled, preview } = useLoginDesign();

    if (mfa)
        return (
            <LoginContainer>
                <FormContainer>
                    <MfaStep
                        resolver={mfa}
                        onBack={(message) => {
                            setMfa(null);
                            setLoginError(message ?? null);
                        }}
                    />
                </FormContainer>
            </LoginContainer>
        );

    if (enabled) {
        return (
            <NewLoginForm
                loading={isSignInLoading}
                error={loginError}
                preview={preview}
                onFinish={(values) => {
                    setIsSignInLoading(true);
                    handleLogin({
                        email: values.email,
                        password: values.password,
                        setLoginErrorMessage: setLoginError,
                        setIsSignInLoading,
                        onMfaRequired: setMfa,
                    });
                }}
            />
        );
    }

    return (
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
                                onMfaRequired: setMfa,
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
                                <ForgotPasswordLink href={'/senha-esquecida'}>Esqueceu a senha?</ForgotPasswordLink>
                            </Col>
                        </Row>
                        <LoginButton loading={isSignInLoading} size="large" type="primary" htmlType="submit">
                            Entrar
                        </LoginButton>
                        {loginError && <ErrorMessage>{loginError}</ErrorMessage>}
                    </Form>
                </Spin>

                {/*<Flex align="center" gap="1rem">*/}
                {/*    <LineDivider />*/}
                {/*    <div>*/}
                {/*        <Typography.Text style={{ wordBreak: 'keep-all' }}>ou</Typography.Text>*/}
                {/*    </div>*/}
                {/*    <LineDivider />*/}
                {/*</Flex>*/}

                {/*<Button onClick={handleGoogleLogin} style={{ padding: '0.5rem 1rem', height: '3.5rem' }}>*/}
                {/*    <Flex style={{ width: '100%' }} align="center" gap="1rem">*/}
                {/*        <Google />*/}
                {/*        Continuar com o Google*/}
                {/*    </Flex>*/}
                {/*</Button>*/}
                {/*<Button onClick={handleMicrosoftLogin} style={{ padding: '0.5rem 1rem', height: '3.5rem' }}>*/}
                {/*    <Flex style={{ width: '100%' }} align="center" gap="1rem">*/}
                {/*        <Microsoft />*/}
                {/*        Continuar com a Microsoft*/}
                {/*    </Flex>*/}
                {/*</Button>*/}
            </FormContainer>
        </LoginContainer>
    );
}
