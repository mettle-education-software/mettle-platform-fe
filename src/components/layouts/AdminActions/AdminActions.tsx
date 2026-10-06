'use client';

import { Button, Card, Col, Flex, Modal, Row, Select, Typography } from 'antd';
import { useGetMettleUsers, useImpersonate, useStopImpersonating } from 'hooks';
import { useAppContext } from 'providers';
import React, { useCallback, useState } from 'react';
import { debounce } from 'ts-debounce';

const { Title } = Typography;

/** Estado e ações do painel de administração (impersonar alunos): os mesmos para o painel atual e o da plataforma nova. */
export const useAdminImpersonation = () => {
    const { user } = useAppContext();

    const impersonating = user?.impersonating;

    const [visible, setVisible] = useState(false);
    const [selectedUserToImpersonate, setSelectedUserToImpersonate] = useState<string>();
    const [searchQuery, setSearchQuery] = useState<string>();

    const debounceFn = useCallback(
        debounce((value: string) => {
            setSearchQuery(value);
        }, 500),
        [],
    );

    const handleSearch = (value: string) => {
        debounceFn(value);
    };

    const handleClose = () => {
        setVisible(false);
    };

    const { data: mettleUsersList, isLoading: isMettleUsersLoading } = useGetMettleUsers({
        accountStatusIn: 'ACTIVE',
        searchQuery,
    });

    const impersonate = useImpersonate();
    const stopImpersonate = useStopImpersonating();

    const handleImpersonate = () => {
        if (!selectedUserToImpersonate) return;
        impersonate.mutate(selectedUserToImpersonate);
    };

    const handleStopImpersonating = () => {
        stopImpersonate.mutate();
    };

    const handleClear = () => {
        setSearchQuery(undefined);
        setSelectedUserToImpersonate(undefined);
    };

    return {
        isAdmin: !!user?.roles?.includes('METTLE_ADMIN'),
        impersonating,
        visible,
        setVisible,
        handleClose,
        handleSearch,
        handleClear,
        selectedUserToImpersonate,
        setSelectedUserToImpersonate,
        isMettleUsersLoading,
        options: mettleUsersList?.data.map((user) => ({
            label: `${user.first_name} ${user.last_name} - ${user.email}`,
            value: user.user_uid,
        })),
        impersonate,
        stopImpersonate,
        handleImpersonate,
        handleStopImpersonating,
    };
};

export const AdminActions: React.FC = () => {
    const {
        isAdmin,
        impersonating,
        visible,
        setVisible,
        handleClose,
        handleSearch,
        handleClear,
        selectedUserToImpersonate,
        setSelectedUserToImpersonate,
        isMettleUsersLoading,
        options,
        impersonate,
        stopImpersonate,
        handleImpersonate,
        handleStopImpersonating,
    } = useAdminImpersonation();

    if (!isAdmin) return null;

    return (
        <React.Fragment>
            <Button onClick={() => setVisible(true)}>Admin panel</Button>
            <Modal
                okButtonProps={{ style: { display: 'none' } }}
                open={visible}
                onClose={handleClose}
                onCancel={handleClose}
                title="Painel de administraçäo"
                cancelText="Cancelar"
            >
                <Row gutter={[12, 12]}>
                    <Col span={24}>
                        <Card title="Impersonar alunos" size="small">
                            {impersonating ? (
                                <Flex gap="1rem" align="center">
                                    <Title level={5}>Você está impersonando</Title>
                                    <Button
                                        type="primary"
                                        onClick={handleStopImpersonating}
                                        loading={stopImpersonate.isPending}
                                    >
                                        Retornar à conta normal
                                    </Button>
                                </Flex>
                            ) : (
                                <Flex gap="0.2rem" justify="space-between">
                                    <Select
                                        loading={isMettleUsersLoading}
                                        showSearch
                                        allowClear
                                        onClear={handleClear}
                                        onSearch={handleSearch}
                                        filterOption={false}
                                        onSelect={(value) => setSelectedUserToImpersonate(value)}
                                        value={selectedUserToImpersonate}
                                        style={{ width: '70%' }}
                                        placeholder="Selecione um aluno para impersonar"
                                        options={options}
                                    />

                                    <Button
                                        loading={impersonate.isPending}
                                        type="primary"
                                        onClick={handleImpersonate}
                                        disabled={!selectedUserToImpersonate}
                                    >
                                        Acessar
                                    </Button>
                                </Flex>
                            )}
                        </Card>
                    </Col>
                </Row>
            </Modal>
        </React.Fragment>
    );
};
