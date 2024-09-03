'use client';

import { LockOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Button, Col, Flex, Form, Input, Row, Typography } from 'antd';
import { Logo } from 'components';
import { useDeviceSize, useResetUnauthenticatedPassword } from 'hooks';
import { padding, passwordRules, SMALL_VIEWPORT, withoutAuthentication } from 'libs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
        color: var(--primary);
    }
`;

const ErrorMessage = styled.span`
    color: red;
`;

interface ResetPasswordProps {
    userUid: string;
    token: string;
}

const ResetPassword: React.FC<ResetPasswordProps> = ({ userUid, token }) => {
    const router = useRouter();
    const [validationError, setValidationError] = React.useState<null | string>(null);

    const deviceSize = useDeviceSize();

    const { mutate: resetPassword, isPending } = useResetUnauthenticatedPassword();

    const handleResetPassword = ({ newPassword }: { newPassword: string }) => {
        resetPassword(
            { userUid, token, newPassword },
            {
                onSuccess: () => {
                    router.push('/');
                },
                onError: () => {
                    setValidationError('Ocorreu um erro ao tentar recuperar a senha. Tente novamente mais tarde');
                },
            },
        );
    };

    const renderForm = () => (
        <LoginContainer>
            <FormContainer>
                <FormHeader>
                    <Text>Recuperação de senha</Text>
                </FormHeader>
                <Form layout="vertical" onFinish={handleResetPassword}>
                    <Form.Item validateDebounce={800} name="newPassword" rules={passwordRules}>
                        <Input.Password
                            className="input"
                            size="large"
                            placeholder="Senha"
                            prefix={<LockOutlined className="prefix-icon" />}
                        />
                    </Form.Item>
                    <LoginButton type="primary" htmlType="submit" loading={isPending}>
                        Resetar senha
                    </LoginButton>
                    {validationError && <ErrorMessage>{validationError}</ErrorMessage>}
                </Form>
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
};

export default withoutAuthentication(ResetPassword);
