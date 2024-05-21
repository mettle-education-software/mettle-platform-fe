'use client';

import { BellOutlined } from '@ant-design/icons';
import { Avatar, Flex, Typography, Dropdown, Empty } from 'antd';
import { handleLogout } from 'libs';
import { useRouter } from 'next/navigation';
import { useAppContext } from 'providers';
import React, { useState } from 'react';
import { ArrowDown } from '../../icons';

const { Text } = Typography;

export const UserMenu = () => {
    const router = useRouter();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const { user } = useAppContext();

    return (
        <Flex align="center" gap="1rem">
            <Dropdown
                menu={{
                    items: [
                        {
                            key: 'none',
                            label: <Empty style={{ cursor: 'default' }} description="Não há notificações" />,
                            disabled: true,
                        },
                    ],
                }}
            >
                <BellOutlined />
            </Dropdown>

            <Dropdown
                open={userMenuOpen}
                trigger={['click']}
                onOpenChange={(open) => setUserMenuOpen(open)}
                menu={{
                    items: [
                        {
                            key: 'profile',
                            label: 'Perfil',
                            onClick: ({ domEvent }) => {
                                domEvent.preventDefault();
                                router.push('/profile');
                            },
                        },
                        {
                            key: 'logout',
                            label: 'Logout',
                            onClick: ({ domEvent }) => {
                                domEvent.preventDefault();
                                handleLogout();
                            },
                        },
                    ],
                }}
            >
                <Flex align="center" gap="1rem" style={{ cursor: 'pointer' }}>
                    <Avatar src={user?.profileImageSrc}>{user?.name[0]}</Avatar>
                    <Text>Pedro Filipe</Text>
                    <ArrowDown className={userMenuOpen ? 'open' : ''} />
                </Flex>
            </Dropdown>
        </Flex>
    );
};
