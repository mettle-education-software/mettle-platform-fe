'use client';

import styled from '@emotion/styled';
import SettingsIcon from '@mui/icons-material/Settings';
import { Button, Card, Col, Flex, Form, Input, Row, Typography } from 'antd';
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

const Settings = () => {
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
                                <Card.Meta
                                    title="Informações pessoais"
                                    description={
                                        <Text className="color-secondary">Atualize suas informações aqui</Text>
                                    }
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
                            </Card>
                        </Col>
                    </Row>
                </MaxWidthContainer>
            </MainContent>
        </AppLayout>
    );
};

export default withAuthentication(Settings);
