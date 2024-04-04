'use client';

import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Tabs, Input, Flex, Checkbox, Typography } from 'antd';
import type { TabsProps } from 'antd';
import { handleLogin, withoutAuthentication } from 'libs/authentication';
import React, { useState } from 'react';
import {
    Terms,
    EnterButton,
    Container,
    Form,
    input_icon,
    input_height,
    LoginErrorContainer,
    ImageLogo,
} from './login.styled';

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

    const handleSubmit = async () => {
        console.log(formEmail);
        console.log(formPassword);
        await handleLogin({
            email: formEmail as string,
            password: formPassword as string,
            setLoginErrorMessage,
            setIsSignInLoading,
        });
    };

    return (
        <Form>
            <Flex vertical>
                <Typography.Text>Seu e-mail</Typography.Text>
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
            <EnterButton
                type="primary"
                onClick={async () => {
                    await handleSubmit();
                }}
            >
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
