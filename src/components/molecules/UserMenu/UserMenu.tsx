'use client';

import { Avatar, Flex, Typography, Dropdown } from 'antd';
import { handleLogout } from 'libs';
import { useRouter } from 'next/navigation';
import { useAppContext } from 'providers';
import React, { useState } from 'react';
import { NotificationsList } from '../../atoms';
import { ArrowDown } from '../../icons';

const { Text } = Typography;

export const UserMenu = () => {
    const router = useRouter();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const { user } = useAppContext();

    return (
        <Flex align="center" gap="1rem">
            <NotificationsList />

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
