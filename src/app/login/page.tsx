'use client';

import { UserOutlined, LockOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Tabs, Input, Flex, Checkbox, Typography, Button, Form, Image } from 'antd';
import type { FormProps, TabsProps } from 'antd';
import { useDeviceSize } from 'hooks';
import { handleLogin, withoutAuthentication } from 'libs/authentication';
import React, { useState } from 'react';
import { smallAndSmaller } from 'styles/media.constants';

const Container = styled.div`
    align-items: flex-start;
    display: flex;
    height: 100vh;
    ${smallAndSmaller} {
        flex-direction: column;
        gap: 0;
    }
`;
//#F2F0EE
const ContainerLeft = styled.div`
    align-self: stretch;
    align-items: center;
    background:
        linear-gradient(0deg, rgba(60, 54, 47, 0.69) 0%, rgba(60, 54, 47, 0.69) 100%),
        url('./mettle-login-background.jpg') lightgray 50% / cover no-repeat;
    display: flex;
    justify-content: center;
    flex: 1 0 0;
    gap: 1.375rem;
    padding: 0 12.75rem;
    ${smallAndSmaller} {
        background-color: #ffffff;
        background-image: none;
        flex: 0 0 0;
        gap: 0.625rem;
        padding: 1rem 0;
    }
`;

const ImageMettleSymbolBlack = styled(Image)`
    width: 2.125rem;
    height: 2.125rem;
`;

const ImageMettleNameBlack = styled(Image)`
    width: 5.25rem;
    height: 0.875rem;
`;

const ContainerRight = styled.div`
    align-self: stretch;
    align-items: center;
    display: flex;
    justify-content: center;
    flex: 1 0 0;
    gap: 1.375rem;
    padding: 0 12.75rem;
    ${smallAndSmaller} {
        padding: 0;
        flex: 0 0 0;
    }
`;

const MainForm = styled(Form)`
    span {
        color: var(--font-primary);
    }
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
`;

const input_height = '3.125rem';

const input_icon = {
    color: 'var(--secondary)',
};

const EnterButton = styled(Button)`
    height: 3.125rem;
    span {
        color: var(--primary);
    }
`;

const Terms = styled.div`
    span {
        font-size: 0.6rem;
        width: 20rem;
    }
    span > a {
        font-size: 0.6rem;
    }
    align-items: center;
    display: flex;
    flex-direction: column;
    gap: 0;
`;

const LoginErrorContainer = styled.div`
    color: var(--danger);
    font-size: 0.8rem;
    padding-bottom: 0.4rem;
`;

const LogoWrapper = styled.div`
    align-items: center;
    display: flex;
    min-width: 10vw;
    gap: 0.725rem;
`;

function Page() {
    const items: TabsProps['items'] = [
        {
            key: 'mettlePlatform',
            label: 'Plataforma Mettle',
            children: LoginForm(),
        },
    ];

    const deviceSize = useDeviceSize();

    return (
        <Container>
            <ContainerLeft>
                {deviceSize === 'mobile' && (
                    <LogoWrapper>
                        <ImageMettleSymbolBlack src="./mettle-symbol-black.svg" preview={false} />
                        <ImageMettleNameBlack src="./mettle-name-black.svg" preview={false} />
                    </LogoWrapper>
                )}
                {deviceSize === 'desktop' && (
                    <LogoWrapper>
                        <Image src="./mettle-symbol-white.svg" preview={false} />
                        <Image src="./mettle-name-white.svg" preview={false} />
                    </LogoWrapper>
                )}
            </ContainerLeft>
            <ContainerRight>
                <Tabs
                    defaultActiveKey="mettlePlatform"
                    items={items}
                    indicator={{ size: (origin) => origin + 25, align: 'center' }}
                />
            </ContainerRight>
        </Container>
    );
}

function LoginForm() {
    const [loginErrorMessage, setLoginErrorMessage] = useState<string | null>(null);
    const [isSignInLoading, setIsSignInLoading] = useState<boolean>(false);

    type FieldType = {
        email?: string;
        password?: string;
        remember?: string;
    };

    const onFinish: FormProps['onFinish'] = async (values: FieldType) => {
        await handleLogin({
            email: values.email!,
            password: values.password!,
            setLoginErrorMessage,
            setIsSignInLoading,
        });
    };

    const requiredRule = { required: true, message: 'Campo obrigatório' };

    return (
        <MainForm name="login" onFinish={onFinish} autoComplete="off">
            <Flex vertical>
                <Typography.Text>Seu e-mail</Typography.Text>
                <Form.Item name="email" rules={[{ type: 'email', message: 'E-mail inválido' }, ...[requiredRule]]}>
                    <Input
                        size="large"
                        style={{ height: input_height }}
                        placeholder="exemplo@email.com.br"
                        prefix={<UserOutlined style={input_icon} />}
                        onChange={(event) => {
                            setLoginErrorMessage(null);
                        }}
                    />
                </Form.Item>
            </Flex>
            <Flex vertical>
                <Typography.Text>Sua senha</Typography.Text>
                <Form.Item name="password" rules={[requiredRule]}>
                    <Input
                        size="large"
                        style={{ height: input_height }}
                        placeholder="senha"
                        prefix={<LockOutlined style={input_icon} />}
                        type="password"
                        onChange={(event) => {
                            setLoginErrorMessage(null);
                        }}
                    />
                </Form.Item>
                {loginErrorMessage && <LoginErrorContainer>{loginErrorMessage}</LoginErrorContainer>}
                <Flex justify="space-between" align="center">
                    <Form.Item name="remember">
                        <Checkbox>
                            <Typography.Text>Salvar meus dados</Typography.Text>
                        </Checkbox>
                    </Form.Item>
                    <Typography.Link href="/forgot-password">Esqueceu a senha?</Typography.Link>
                </Flex>
            </Flex>
            <EnterButton type="primary" htmlType="submit">
                Entrar
            </EnterButton>
            <Terms>
                <Typography.Text type="secondary">
                    Ao fazer login na Plataforma Mettle ou no Mettle Business Manager, você concorda com nossos{' '}
                    <Typography.Link href="https://mettle.com.br/termos-de-uso/">Termos de Uso</Typography.Link> e{' '}
                    <Typography.Link href="https://mettle.com.br/politica-de-privacidade/">
                        Política de Privacidade.
                    </Typography.Link>
                </Typography.Text>
            </Terms>
        </MainForm>
    );
}

export default withoutAuthentication(Page);
