'use client';

import { Avatar, Flex, Typography } from 'antd';
import { useAppContext } from 'providers';
import React from 'react';
import { Chat, NotificationsList } from '../../atoms';

const { Text } = Typography;

export const UserMenu = () => {
    const { user } = useAppContext();

    return (
        <Flex align="center" gap="1rem" style={{ paddingRight: '0.8rem' }}>
            <NotificationsList />

            <Flex align="center" gap="1rem">
                <Avatar src={user?.profileImageSrc}>{user?.name[0]}</Avatar>
                <Text>{user?.name}</Text>
            </Flex>
        </Flex>
    );
};
