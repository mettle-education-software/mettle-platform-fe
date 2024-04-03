'use client';

import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Tabs, Input, Flex, Checkbox, Button, Typography, Image } from 'antd';
import type { TabsProps } from 'antd';
import styles from './login.module.css';

const items: TabsProps['items'] = [
    {
        key: '1',
        label: 'Plataforma Mettle',
        children: LoginForm(),
    },
    {
        key: '2',
        label: 'Business Manager',
        children: '',
    },
];

function Page() {
    return (
        <Flex className={styles.container} justify="center" align="center" gap={0}>
            <Flex>
                <Image src="/mettle-login.svg" alt="METTLE" preview={false} />
            </Flex>
            <Flex align="center" justify="center" className={styles.containerTabs}>
                <Tabs defaultActiveKey="1" items={items} />
            </Flex>
        </Flex>
    );
}

function LoginForm() {
    return (
        <Flex vertical gap={12} className={styles.form}>
            <Flex vertical>
                <Typography.Text className={styles.label}>Seu e-mail</Typography.Text>
                <Input
                    size="large"
                    className={styles.input}
                    placeholder="exemplo@email.com.br"
                    prefix={<UserOutlined className={styles.input_icon} />}
                />
            </Flex>
            <Flex vertical>
                <Typography.Text className={styles.label}>Sua senha</Typography.Text>
                <Input
                    size="large"
                    className={styles.input}
                    placeholder="senha"
                    prefix={<LockOutlined className={styles.input_icon} />}
                    type="password"
                />
                <Flex justify="space-between">
                    <Checkbox>
                        <Typography.Text>Salvar meus dados</Typography.Text>
                    </Checkbox>
                    <Typography.Link href="/">Esqueceu a senha?</Typography.Link>
                </Flex>
            </Flex>
            <Button
                type="primary"
                className={styles.button}
                onClick={() => {
                    alert('teste');
                }}
            >
                Entrar
            </Button>
            <Flex vertical gap={0} align="center" className={styles.terms}>
                <Typography.Text type="secondary">
                    Ao fazer login na Plataforma Mettle ou no Mettle Business Manager, você concorda com nossos
                    <a href="https://mettle.com.br/termos-de-uso/">Termos de Uso</a> e{' '}
                    <a href="https://mettle.com.br/politica-de-privacidade/">Política de Privacidade.</a>
                </Typography.Text>
            </Flex>
        </Flex>
    );
}

export default Page;
