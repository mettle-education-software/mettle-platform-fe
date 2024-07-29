'use client';

import { InfoCircleOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import SettingsIcon from '@mui/icons-material/Settings';
import { Button, Card, Col, Flex, Form, Input, Row, Tabs as AntTabs, Tooltip, Typography } from 'antd';
import { AppLayout, MaxWidthContainer } from 'components';
import { withAuthentication } from 'libs';
import { useAppContext } from 'providers';
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

const PersonalInformation = () => {
    const [form] = Form.useForm();

    const newPassword = Form.useWatch('newPassword', form);

    useEffect(() => {
        if (!newPassword) {
            form.resetFields(['newPasswordRepeat']);
        }
    }, [newPassword, form]);

    const { user } = useAppContext();

    const handleSubmit = (values: { fullName: string; newPassword: string; email: string }) => {};

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
                                        <Input placeholder={user?.name} />
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
                                    <Form.Item>
                                        <Input type="email" placeholder={user?.email} />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Col>

                        <Col span={24}>
                            <Row className="row-border">
                                <Col xs={24} md={6}>
                                    Alterar a senha
                                </Col>
                                <Col xs={24} md={18}>
                                    <Form.Item name="newPassword">
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
                                    <Form.Item name="newPasswordRepeat">
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
                                    <Button htmlType="submit" size="large" type="primary">
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

const ImersoSettings = () => {
    const handleProgramReset = () => {};

    const handleDedaPause = () => {};

    const handleChangeDifficulty = () => {};

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
                                        Você tem <strong>X</strong> chances de reiniciar o programa
                                    </Text>
                                </Flex>
                            </Col>
                            <Col xs={24} md={18}>
                                <Button onClick={handleProgramReset} type="primary">
                                    Reiniciar
                                </Button>
                            </Col>
                        </Row>
                    </Col>
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
                                        Você tem <strong>X</strong> chances de pausar o programa
                                    </Text>
                                </Flex>
                            </Col>
                            <Col xs={24} md={18}>
                                <Button onClick={handleDedaPause} type="primary">
                                    Pausar
                                </Button>
                            </Col>
                        </Row>
                    </Col>
                    <Col span={24}>
                        <Row className="row-border" align="middle">
                            <Col xs={24} md={6}>
                                <Flex vertical>
                                    <Flex gap="0.5rem" align="center">
                                        <Text>Alterar a dificuldade</Text>
                                        <Tooltip title="Ao alterar a dificuldade, o programa será reiniciado e você perderá o seu progresso atual e suas chances de reiniciar.">
                                            <InfoCircleOutlined />
                                        </Tooltip>
                                    </Flex>
                                    <Text type="secondary">
                                        A dificuldade atual é: <strong>XXX</strong>. Você tem <strong>X</strong> chances
                                        de alterar a dificuldade.
                                    </Text>
                                </Flex>
                            </Col>
                            <Col xs={24} md={18}>
                                <Button onClick={handleChangeDifficulty} type="primary">
                                    Selecionar nova dificuldade
                                </Button>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </div>
        </>
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
                                            label: 'Meu perfil',
                                            children: <PersonalInformation />,
                                        },
                                        {
                                            key: 'imerso-settings',
                                            label: 'IMERSO',
                                            children: <ImersoSettings />,
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
