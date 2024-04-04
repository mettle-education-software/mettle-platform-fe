'use client';

import { UserOutlined, LockOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Tabs, Input, Flex, Checkbox, Typography, Button, Form } from 'antd';
import type { FormProps, TabsProps } from 'antd';
import { smallAndSmaller } from 'app/app.layout';
import { handleLogin, withoutAuthentication } from 'libs/authentication';
import React, { useState } from 'react';

const Container = styled.div((props) => ({
    alignItems: 'center',
    display: 'flex',
    [smallAndSmaller]: {
        flexDirection: 'column',
        gap: 0,
    },
    gap: '12rem',
    justifyContent: 'center',
}));

const MainForm = styled(Form)((props) => ({
    span: {
        color: 'var(--font-primary)',
    },
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    width: '22.5rem',
}));

const input_height = '3.125rem';

const input_icon = {
    color: 'var(--secondary)',
};

const ImageLogo = styled.div((props) => ({
    [smallAndSmaller]: {
        backgroundImage: "url('/mettle-logo.svg')",
        width: '7.92rem',
        height: '2.1rem',
        marginBottom: '1.25rem',
        marginTop: '1.25rem',
    },
    backgroundImage: "url('/mettle-login.svg')",
    width: '42.6875rem',
    height: '43rem',
}));

const EnterButton = styled(Button)(() => ({
    height: '3.125rem',
    span: {
        color: 'var(--primary)',
    },
}));

const Terms = styled.div((props) => ({
    span: {
        fontSize: '0.6rem',
        width: '20rem',
    },
    'span > a': {
        fontSize: '0.6rem',
    },
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
}));

const LoginErrorContainer = styled.div((props) => ({
    color: 'var(--danger)',
    fontSize: '0.8rem',
    paddingBottom: '0.4rem',
}));

function Page() {
    const items: TabsProps['items'] = [
        {
            key: 'mettlePlatform',
            label: 'Plataforma Mettle',
            children: LoginForm(),
        },
        {
            key: 'businessManager',
            label: 'Business Manager',
            children: '',
        },
    ];

    return (
        <Container>
            <Flex>
                <ImageLogo />
            </Flex>
            <Flex align="center" justify="center">
                <Tabs
                    defaultActiveKey="mettlePlatform"
                    items={items}
                    indicator={{ size: (origin) => origin + 25, align: 'center' }}
                />
            </Flex>
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
                <Flex justify="space-between">
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
