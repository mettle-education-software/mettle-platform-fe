'use client';

import { UserOutlined, LockOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Tabs, Input, Flex, Checkbox, Typography, Form, Image, Button } from 'antd';
import type { TabsProps } from 'antd';
import { smallAndSmaller } from 'app/app.layout';
import { handleLogin, withoutAuthentication } from 'libs/authentication';
import React, { useState } from 'react';

const Container = styled.div((props) => ({
    alignItems: 'center',
    display: 'flex',
    [smallAndSmaller]: {
        gap: 0,
    },
    gap: '12rem',
    justifyContent: 'center',
}));

const input_height = '3.125rem';

const input_icon = {
    color: 'var(--secondary)',
};

const ImageLogo = styled(Image)(() => ({
    [smallAndSmaller]: {
        display: 'none',
    },
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
    paddingTop: '0.4rem',
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
                <ImageLogo src="/mettle-login.svg" alt="METTLE" preview={false} />
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
    const [formEmail, setFormEmail] = useState<string>('');
    const [formPassword, setFromPassword] = useState<string>('');
    const [loginErrorMessage, setLoginErrorMessage] = useState<string | null>(null);
    const [isSignInLoading, setIsSignInLoading] = useState<boolean>(false);

    const handleSubmit = async (values: { formEmail: string; formPassword: string }) => {
        await handleLogin({
            email: values.formEmail,
            password: values.formPassword,
            setLoginErrorMessage,
            setIsSignInLoading,
        });
    };

    return (
        <Form onFinish={handleSubmit}>
            <Flex vertical>
                <Typography.Text>Seu e-mail</Typography.Text>
                <Form.Item
                    name="formEmail"
                    rules={[
                        {
                            required: true,
                            message: 'Esse é necessário',
                        },
                        {
                            type: 'email',
                            message: 'E-mail inválido',
                        },
                    ]}
                >
                    <Input
                        size="large"
                        style={{ height: input_height }}
                        placeholder="exemplo@email.com.br"
                        prefix={<UserOutlined style={input_icon} />}
                        onChange={(event) => {
                            console.log(event);
                            setFormEmail(event.target.value);
                            setLoginErrorMessage(null);
                        }}
                    />
                </Form.Item>
            </Flex>
            <Flex vertical>
                <Typography.Text>Sua senha</Typography.Text>
                <Input
                    size="large"
                    style={{ height: input_height }}
                    placeholder="senha"
                    prefix={<LockOutlined style={input_icon} />}
                    type="password"
                    onChange={(event) => {
                        setFromPassword(event.target.value);
                        setLoginErrorMessage(null);
                    }}
                />
                {loginErrorMessage && <LoginErrorContainer>{loginErrorMessage}</LoginErrorContainer>}
                <Flex justify="space-between">
                    <Checkbox>
                        <Typography.Text>Salvar meus dados</Typography.Text>
                    </Checkbox>
                    <Typography.Link href="/forgot-password">Esqueceu a senha?</Typography.Link>
                </Flex>
            </Flex>
            <EnterButton htmlType="submit" type="primary">
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
        </Form>
    );
}

export default withoutAuthentication(Page);
