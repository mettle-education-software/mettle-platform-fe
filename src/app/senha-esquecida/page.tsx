'use client';

import { UserOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Button, Col, Form, Input, Result, Row, Typography } from 'antd';
import { useRecoverUnauthenticatedPassword } from 'hooks';
import { SMALL_VIEWPORT, withoutAuthentication } from 'libs';
import Link from 'next/link';
import React, { useState } from 'react';

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

export default function ForgottenPassword() {
    const [loginError, setLoginError] = useState<null | string>(null);
    const [emailSent, setEmailSent] = useState(false);

    const { mutate: recoverPassword, isPending } = useRecoverUnauthenticatedPassword();

    const handleRecoverPassword = async ({ email }: { email: string }) => {
        recoverPassword(email, {
            onSuccess: () => {
                setEmailSent(true);
            },
            onError: () => {
                setLoginError('Ocorreu um erro ao tentar recuperar a senha. Tente novamente mais tarde');
            },
        });
    };

    return (
        <LoginContainer>
            <FormContainer>
                {emailSent ? (
                    <Result
                        status="success"
                        title="Sucesso"
                        subTitle="Verifique sua caixa de e-mail para recuperar sua senha."
                        extra={[
                            <ForgotPasswordLink key="/" href="/">
                                Retornar à página de login
                            </ForgotPasswordLink>,
                        ]}
                    />
                ) : (
                    <>
                        <FormHeader>
                            <Text>Recuperação de senha</Text>
                        </FormHeader>
                        <Form layout="vertical" onFinish={handleRecoverPassword}>
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
                            <Row justify="end" align="middle">
                                <Col className="forgot-col" span={24}>
                                    <ForgotPasswordLink href="/">Retornar à página de login</ForgotPasswordLink>
                                </Col>
                            </Row>
                            <LoginButton loading={isPending} size="large" type="primary" htmlType="submit">
                                Recuperar senha
                            </LoginButton>
                            {loginError && <ErrorMessage>{loginError}</ErrorMessage>}
                        </Form>
                    </>
                )}
            </FormContainer>
        </LoginContainer>
    );
}
