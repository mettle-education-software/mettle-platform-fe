'use client';

import { UserOutlined } from '@ant-design/icons';
import { Flex, FloatButton, Modal, Select, Skeleton, Typography } from 'antd';
import { useGetMettleUsers } from 'hooks';
import React, { useState } from 'react';

const { Title, Text } = Typography;

interface AdminImpersonatorProps {
    onOk: (selectedUser: Record<string, string>) => void;
}

export const AdminImpersonator: React.FC<AdminImpersonatorProps> = ({ onOk }) => {
    const [open, setOpen] = useState(false);
    const { data: mettleUsers, isLoading } = useGetMettleUsers();

    const [selectedUser, setSelectedUser] = useState<Record<string, string>>();

    if (isLoading) return <Skeleton active loading />;

    return (
        <>
            <Modal
                open={open}
                onOk={() => {
                    onOk(selectedUser as Record<string, string>);
                    setOpen(false);
                }}
                okButtonProps={{
                    disabled: !selectedUser,
                }}
                onCancel={() => {
                    setOpen(false);
                }}
                title="Mettle Admin Dialog"
            >
                <Flex vertical style={{ width: '100%' }}>
                    <Title level={5}>Lista de usuários na Mettle</Title>
                    <Select
                        showSearch
                        placeholder="Selecione um usuário"
                        allowClear
                        onChange={(value) => {
                            setSelectedUser(value);
                        }}
                        onClear={() => {
                            setSelectedUser(undefined);
                        }}
                        options={
                            mettleUsers?.data.map((user) => ({
                                label: `${user.first_name} - ${user.email}`,
                                value: JSON.stringify(user),
                            })) ?? []
                        }
                    />
                </Flex>
            </Modal>
            <FloatButton
                icon={<UserOutlined />}
                onClick={() => {
                    setOpen(true);
                }}
                type="primary"
            />
        </>
    );
};
