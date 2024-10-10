'use client';

import { BellOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Badge, Button, Col, Dropdown, Empty, Flex, Row, Skeleton, Typography } from 'antd';
import { useGetNotifications, useMarkAsRead, useListenForNotifications } from 'hooks';
import { Notification } from 'interfaces';
import { SMALL_VIEWPORT } from 'libs';
import Link from 'next/link';
import { useAppContext } from 'providers';
import React, { useEffect, useState } from 'react';

const { Title, Text } = Typography;

const NotificationDropdown = styled.div`
    width: 500px;
    background: #fff;
    max-height: 500px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    border-radius: 0.8rem;

    @media (max-width: ${SMALL_VIEWPORT}px) {
        width: 80vw;
    }
`;

const NotificationElement = styled.div`
    transition: background 300ms ease;
    padding: 1rem;

    &:not(:last-child) {
        border-bottom: 1px solid var(--secondary-light);
    }

    &:hover,
    &.not-read:hover {
        background: #e8e8e8;
    }

    &.not-read {
        cursor: pointer;
        background: #f0f0f0;
    }

    &.read {
        background: #fff;
    }
`;

const NotificationAvatar = styled.div`
    width: 100%;
    aspect-ratio: 1;
    padding: 0;
    border-radius: 10%;
    background: url('/img/target-motive.webp') center center / cover no-repeat;
    filter: blendTrans(var(--main-bg));
`;

const BellIcon = styled(BellOutlined)`
    font-size: 1.5rem;
    cursor: pointer;

    @media (max-width: ${SMALL_VIEWPORT}px) {
        font-size: 1.2rem;
        color: var(--secondary);
    }
`;

export const NotificationsList: React.FC = () => {
    const { user } = useAppContext();

    const [open, setOpen] = useState(false);

    useListenForNotifications();

    const [notifications, setNotifications] = useState<Notification[]>([]);

    const { data: notificationsData, isLoading } = useGetNotifications(user?.uid as string);
    const markRead = useMarkAsRead(user?.uid as string);

    useEffect(() => {
        if (notificationsData) {
            setNotifications(notificationsData);
        }
    }, [notificationsData]);

    const [unreads, setUnreads] = useState(0);

    useEffect(() => {
        setUnreads(notifications.filter((notification) => !notification.isRead).length);
    }, [notifications]);

    return (
        <Dropdown
            open={open}
            trigger={['click']}
            onOpenChange={(open) => setOpen(open)}
            dropdownRender={() => {
                return (
                    <NotificationDropdown>
                        <Skeleton active loading={isLoading}>
                            {notifications.length === 0 && (
                                <NotificationElement>
                                    <Empty style={{ cursor: 'default' }} description="Não há notificações" />
                                </NotificationElement>
                            )}
                            {notifications.map((notification) => (
                                <NotificationElement
                                    onClick={() => {
                                        if (!notification.isRead) {
                                            markRead.mutate(notification.notificationId);
                                        }
                                    }}
                                    key={notification.notificationId}
                                    className={notification.isRead ? 'read' : 'not-read'}
                                >
                                    <Row gutter={16}>
                                        <Col span={4}>
                                            <NotificationAvatar />
                                        </Col>
                                        <Col span={20}>
                                            <Flex vertical align="flex-start" gap="0.8rem">
                                                <div>
                                                    <Title level={5}>{notification.title}</Title>
                                                    <Text>{notification.body}</Text>
                                                </div>
                                                {notification.actionLink && (
                                                    <Link
                                                        prefetch
                                                        shallow
                                                        href={notification.actionLink}
                                                        onClick={() => {
                                                            if (!notification.isRead) {
                                                                markRead.mutate(notification.notificationId);
                                                            }
                                                        }}
                                                    >
                                                        <Button size="small">Access</Button>
                                                    </Link>
                                                )}
                                            </Flex>
                                        </Col>
                                    </Row>
                                </NotificationElement>
                            ))}
                        </Skeleton>
                    </NotificationDropdown>
                );
            }}
        >
            <Badge count={unreads} style={{ display: unreads === 0 ? 'none' : undefined }}>
                <BellIcon />
            </Badge>
        </Dropdown>
    );
};
