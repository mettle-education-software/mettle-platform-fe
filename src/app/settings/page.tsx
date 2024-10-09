'use client';

import { InfoCircleOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import SettingsIcon from '@mui/icons-material/Settings';
import { Button, Card, Col, Flex, Form, Input, Modal, Row, Tabs as AntTabs, Tooltip, Typography } from 'antd';
import { AppLayout, MaxWidthContainer } from 'components';
import { usePauseDeda, useResetMelp, useUpdatePassword } from 'hooks';
import { passwordRules, withAuthentication } from 'libs';
import Head from 'next/head';
import Script from 'next/script';
import { useAppContext, useMelpContext } from 'providers';
import React, { useEffect } from 'react';

const { Title, Text } = Typography;

const MainContent = styled.div`
    background-color: var(--main-bg);
    width: 100%;
    min-height: 100%;
    display: flex;
    justify-content: center;
    padding-top: 1rem;
    padding-bottom: 2rem;

    .row-border {
        border-top: 1px solid var(--border-gray);
        padding-top: 1.2rem;
        padding-bottom: 1.2rem;
    }
`;

const Tabs = styled(AntTabs)`
    .ant-tabs-tab-btn:not(.ant-tabs-tab-active) {
        color: var(--primary);
    }
`;

const SecuritySettings = () => {
    const [form] = Form.useForm();

    const newPassword = Form.useWatch('newPassword', form);

    useEffect(() => {
        if (!newPassword) {
            form.resetFields(['newPasswordRepeat']);
        }
    }, [newPassword, form]);

    const updatePassword = useUpdatePassword();

    const handlePasswordChange = ({ newPasswordRepeat }: { newPasswordRepeat: string }) => {
        updatePassword.mutate(newPasswordRepeat);
    };

    return (
        <>
            <Card.Meta
                title="Segurança"
                description={<Text className="color-secondary">Atualize suas informações de segurança</Text>}
            />
            <div style={{ marginTop: '2rem' }}>
                <Form form={form} colon={false} onFinish={handlePasswordChange}>
                    <Row>
                        <Col span={24}>
                            <Row className="row-border">
                                <Col xs={24} md={6}>
                                    Alterar a senha
                                </Col>
                                <Col xs={24} md={18}>
                                    <Form.Item name="newPassword" rules={passwordRules}>
                                        <Input.Password placeholder="Nova senha" />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Col>

                        <Col span={24}>
                            <Row className="row-border">
                                <Col xs={24} md={6}>
                                    Insira a nova senha novamente
                                </Col>
                                <Col xs={24} md={18}>
                                    <Form.Item
                                        name="newPasswordRepeat"
                                        rules={[
                                            {
                                                required: true,
                                                message: 'Por favor insira uma nova senha',
                                            },
                                            {
                                                min: 8,
                                                message: 'A senha deve ter pelo menos 8 caracteres',
                                            },
                                            {
                                                validator: async (_, value) => {
                                                    if (value !== newPassword) {
                                                        return Promise.reject(new Error('As senhas não coincidem'));
                                                    }
                                                    const validationRegex = new RegExp(
                                                        /^(?!.*\s)(?=.*[a-zA-Z])(?=.*\d)(?=.*\W).{8,}$/,
                                                        'g',
                                                    );
                                                    if (!validationRegex.test(value)) {
                                                        return Promise.reject(
                                                            new Error(
                                                                'A senha deve ter pelo menos 8 caracteres, 1 letra maiúscula, 1 letra minúscula, 1 número e 1 caractere especial',
                                                            ),
                                                        );
                                                    }
                                                },
                                            },
                                        ]}
                                    >
                                        <Input.Password
                                            disabled={!newPassword}
                                            placeholder="Insira a senha novamente"
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Col>

                        <Col span={24}>
                            <Row>
                                <Col>
                                    <Button
                                        loading={updatePassword.isPending}
                                        htmlType="submit"
                                        size="large"
                                        type="primary"
                                    >
                                        Salvar
                                    </Button>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </Form>
            </div>
        </>
    );
};

const PersonalInformation = () => {
    const [form] = Form.useForm();

    const newPassword = Form.useWatch('newPassword', form);

    useEffect(() => {
        if (!newPassword) {
            form.resetFields(['newPasswordRepeat']);
        }
    }, [newPassword, form]);

    const { user } = useAppContext();

    const handleSubmit = ({ email }: { email: string }) => {};

    return (
        <>
            <Card.Meta
                title="Informações pessoais"
                description={<Text className="color-secondary">Atualize suas informações aqui</Text>}
            />

            <div style={{ marginTop: '2rem' }}>
                <Form form={form} colon={false} onFinish={handleSubmit}>
                    <Row>
                        <Col span={24}>
                            <Row className="row-border">
                                <Col xs={24} md={6}>
                                    Nome completo
                                </Col>
                                <Col xs={24} md={18}>
                                    <Form.Item>
                                        <Tooltip
                                            placement="topLeft"
                                            title="Para alterar o nome completo, por favor entre em contato com o suporte"
                                        >
                                            <Input placeholder={user?.name} disabled />
                                        </Tooltip>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Col>

                        <Col span={24}>
                            <Row className="row-border">
                                <Col xs={24} md={6}>
                                    E-mail
                                </Col>
                                <Col xs={24} md={18}>
                                    <Form.Item
                                        name="email"
                                        hasFeedback
                                        rules={[
                                            {
                                                type: 'email',
                                                message: 'Por favor insira um e-mail válido',
                                            },
                                            {
                                                required: true,
                                                message: 'Por favor insira um e-mail',
                                            },
                                        ]}
                                    >
                                        <Tooltip
                                            placement="topLeft"
                                            title="Para alterar o email, por favor entre em contato com o suporte"
                                        >
                                            <Input type="email" placeholder={user?.email} disabled />
                                        </Tooltip>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Col>

                        {/*<Col span={24}>*/}
                        {/*    <Row>*/}
                        {/*        <Col>*/}
                        {/*            <Button htmlType="submit" size="large" type="primary">*/}
                        {/*                Salvar*/}
                        {/*            </Button>*/}
                        {/*        </Col>*/}
                        {/*    </Row>*/}
                        {/*</Col>*/}
                    </Row>
                </Form>
            </div>
        </>
    );
};

const ImersoSettings = () => {
    const programReset = useResetMelp();
    const pauseDeda = usePauseDeda();

    const handleProgramReset = () => {
        programReset.mutate();
    };

    const handleDedaPause = () => {
        pauseDeda.mutate();
    };

    const { melpSummary } = useMelpContext();

    return (
        <>
            <Card.Meta
                title="Programa IMERSO"
                description={<Text className="color-secondary">Configurações do programa IMERSO</Text>}
            />
            <div style={{ marginTop: '2rem' }}>
                <Row>
                    <Col span={24}>
                        <Row className="row-border" align="middle">
                            <Col xs={24} md={6}>
                                <Flex vertical>
                                    <Flex gap="0.5rem" align="center">
                                        <Text>Reiniciar o programa</Text>
                                        <Tooltip title="Você pode reinicar a sua conta e recomeçar o programa IMERSO do início. Seu progresso até agora será inteiramente removido.">
                                            <InfoCircleOutlined />
                                        </Tooltip>
                                    </Flex>
                                    <Text type="secondary">
                                        Você tem <strong>{melpSummary.remaining_resets}</strong> chances de reiniciar o
                                        programa
                                    </Text>
                                </Flex>
                            </Col>
                            <Col xs={24} md={18}>
                                <Button
                                    loading={programReset.isPending}
                                    onClick={() => {
                                        Modal.confirm({
                                            title: 'Atenção!',
                                            content:
                                                'Tem certeza que deseja reiniciar? Você perderá todo o seu progresso atual e essa ação não poderá ser revertida.',
                                            onOk: () => {
                                                handleProgramReset();
                                            },
                                        });
                                    }}
                                    type="primary"
                                >
                                    Reiniciar
                                </Button>
                            </Col>
                        </Row>
                    </Col>
                    {melpSummary.melp_status === 'DEDA_STARTED' && (
                        <Col span={24}>
                            <Row className="row-border" align="middle">
                                <Col xs={24} md={6}>
                                    <Flex vertical>
                                        <Flex gap="0.5rem" align="center">
                                            <Text>Pausar DEDA</Text>
                                            <Tooltip title="Você pode pausar o DEDA 3 vezes. Ao pausar, seu progresso não será contabilizado até que você ative novamente.">
                                                <InfoCircleOutlined />
                                            </Tooltip>
                                        </Flex>
                                        <Text type="secondary">
                                            Você tem <strong>{melpSummary.remaining_pauses}</strong> chances de pausar o
                                            programa
                                        </Text>
                                    </Flex>
                                </Col>
                                <Col xs={24} md={18}>
                                    <Button
                                        onClick={() => {
                                            Modal.confirm({
                                                title: 'Atenção!',
                                                content:
                                                    'Tem certeza que deseja pausar? Você não poderá despausar até a próxima semana o progresso desta semana será perdido.',
                                                onOk: () => {
                                                    handleDedaPause();
                                                },
                                            });
                                        }}
                                        type="primary"
                                    >
                                        Pausar
                                    </Button>
                                </Col>
                            </Row>
                        </Col>
                    )}
                    {/*<Col span={24}>*/}
                    {/*    <Row className="row-border" align="middle">*/}
                    {/*        <Col xs={24} md={6}>*/}
                    {/*            <Flex vertical>*/}
                    {/*                <Flex gap="0.5rem" align="center">*/}
                    {/*                    <Text>Alterar a dificuldade</Text>*/}
                    {/*                    <Tooltip title="Ao alterar a dificuldade, o programa será reiniciado e você perderá o seu progresso atual e suas chances de reiniciar.">*/}
                    {/*                        <InfoCircleOutlined />*/}
                    {/*                    </Tooltip>*/}
                    {/*                </Flex>*/}
                    {/*                <Text type="secondary">*/}
                    {/*                    A dificuldade atual é: <strong>XXX</strong>. Você tem <strong>X</strong> chances*/}
                    {/*                    de alterar a dificuldade.*/}
                    {/*                </Text>*/}
                    {/*            </Flex>*/}
                    {/*        </Col>*/}
                    {/*        <Col xs={24} md={18}>*/}
                    {/*            <Button onClick={handleChangeDifficulty} type="primary">*/}
                    {/*                Selecionar nova dificuldade*/}
                    {/*            </Button>*/}
                    {/*        </Col>*/}
                    {/*    </Row>*/}
                    {/*</Col>*/}
                </Row>
            </div>
        </>
    );
};

const Help = () => {
    return (
        <div>
            <Card.Meta
                title="Ajuda"
                description={<Text className="color-secondary">Precisa de ajuda? Entre em contato</Text>}
            />
            <div style={{ marginTop: '2rem' }}>
                <Row>
                    <Col span={24}>
                        <Row className="row-border">
                            <Col xs={12} md={6}>
                                <Text>Contato</Text>
                            </Col>
                            <Col xs={24} md={18}>
                                <Button href="mailto:hello@mettle.com.br">hello@mettle.com.br</Button>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </div>
        </div>
    );
};

const Settings = () => {
    return (
        <AppLayout>
            <MainContent>
                <MaxWidthContainer>
                    <Row gutter={[16, 16]}>
                        <Col span={24}>
                            <Flex gap="1rem" align="center">
                                <SettingsIcon className="color-white" />
                                <Title level={4} className="color-white">
                                    Configurações
                                </Title>
                            </Flex>
                        </Col>

                        <Col span={24}>
                            <Card>
                                <Tabs
                                    items={[
                                        {
                                            key: 'personal-information',
                                            label: 'Dados pessoais',
                                            children: <PersonalInformation />,
                                        },
                                        {
                                            key: 'security-settings',
                                            label: 'Segurança',
                                            children: <SecuritySettings />,
                                        },
                                        {
                                            key: 'imerso-settings',
                                            label: 'IMERSO',
                                            children: <ImersoSettings />,
                                        },
                                        {
                                            key: 'help',
                                            label: 'Ajuda',
                                            children: <Help />,
                                        },
                                    ]}
                                />
                            </Card>
                        </Col>
                    </Row>
                </MaxWidthContainer>
            </MainContent>
        </AppLayout>
    );
};

export default withAuthentication(Settings);
