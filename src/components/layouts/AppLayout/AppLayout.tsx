'use client';

import { HomeOutlined, LogoutOutlined, MenuOutlined, SettingOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Button, Drawer, Flex, Layout, Menu, Typography } from 'antd';
import { Logo, NotificationsList } from 'components';
import { MelpSummary } from 'components/_melp/MelpSummary/MelpSummary';
import { useDeviceSize } from 'hooks';
import { handleLogout, SMALL_VIEWPORT } from 'libs';
import { usePathname, useRouter } from 'next/navigation';
import { useAppContext, useMelpContext } from 'providers';
import React, { forwardRef, useEffect, useState } from 'react';
import { DedaIcon } from '../../icons';
import { UserMenu } from '../../molecules/UserMenu/UserMenu';
import { AdminActions } from '../AdminActions/AdminActions';

const { Header, Content, Sider } = Layout;
const { Text } = Typography;

const AppHeader = styled(Header)`
    background: var(--tertiary);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-left: 1rem;
    padding-right: 1rem;

    @media (max-width: ${SMALL_VIEWPORT}px) {
        max-height: 3rem;
    }
`;

const LogoWrapper = styled.div`
    max-width: 6.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
`;

const Sidebar = styled(Sider)`
    width: 12rem;
    max-width: 20vw;
    max-height: 100%;
    height: 100%;
    min-height: 100%;
    background: var(--tertiary) !important;
    box-shadow: 0 2px 8px 0 #00000026;
    padding: 1rem 1rem;
`;

const PageLayout = styled(Layout)<{ mobileMaxHeight?: number }>`
    height: 100vh;
    max-height: 100vh;
    width: 100vw;
    max-width: 100vw;

    @media (max-width: ${SMALL_VIEWPORT}px) {
        overflow-y: hidden;
        max-height: ${({ mobileMaxHeight }) => (mobileMaxHeight ? mobileMaxHeight : 800)}px;
    }
`;

const ContentLayout = styled(Layout)`
    max-height: 100vh;
    overflow-x: hidden;
    overflow-y: hidden; // check this later if scroll does not work
`;

const AppContent = styled(Content)`
    padding: 0;
    overflow-y: auto;
`;

const CustomMenu = styled(Menu)`
    background: transparent;
    border: none !important;
    box-shadow: none !important;
`;

export const AppLayout = forwardRef<
    HTMLDivElement,
    {
        children: React.ReactNode;
        withMelpSummary?: boolean;
    }
>(
    (
        {
            children,
            withMelpSummary = false,
        }: {
            children: React.ReactNode;
            withMelpSummary?: boolean;
        },
        ref,
    ) => {
        const device = useDeviceSize();

        const defaultCollapsed = window?.localStorage?.getItem('menuCollapsed') === 'true';

        const [collapsed, setCollapsed] = useState(defaultCollapsed);

        useEffect(() => {
            if (device === 'mobile') {
                setCollapsed(true);
            }
        }, [device]);

        const collapseOnMobile = () => {
            if (device === 'mobile') setCollapsed(true);
        };

        const pathname = usePathname();
        const router = useRouter();

        const { melpSummary } = useMelpContext();
        const { user } = useAppContext();

        const trigger = (
            <Button
                ghost
                className="trigger"
                onClick={() =>
                    setCollapsed((previous) => {
                        window?.localStorage.setItem('menuCollapsed', String(!previous));
                        return !previous;
                    })
                }
                icon={
                    <MenuOutlined
                        style={{ color: device === 'mobile' ? 'var(--secondary)' : 'var(--primary)', fontSize: '1rem' }}
                    />
                }
            />
        );

        const customMenu = (
            <CustomMenu
                mode="inline"
                selectedKeys={pathname.split('/')}
                items={[
                    {
                        key: 'home',
                        icon: <HomeOutlined />,
                        label: 'Início',
                        onClick: ({ domEvent }) => {
                            domEvent.preventDefault();
                            collapseOnMobile();
                            router.push('/');
                        },
                    },
                    ...(user?.roles.includes('METTLE_STUDENT')
                        ? [
                              {
                                  key: 'imerso',
                                  icon: <DedaIcon style={{ marginLeft: '-3px' }} />,
                                  label: (
                                      <Text
                                          style={{ cursor: 'pointer' }}
                                          onClick={(event) => {
                                              event.stopPropagation();
                                              router.push('/imerso');
                                          }}
                                      >
                                          IMERSO
                                      </Text>
                                  ),
                                  children: [
                                      {
                                          key: 'meplHpec',
                                          label: 'HPEC',
                                          // @ts-ignore
                                          onClick: ({ domEvent }) => {
                                              domEvent.preventDefault();
                                              collapseOnMobile();
                                              router.push('/imerso/hpec/HPEC1/welcome');
                                          },
                                      },
                                      {
                                          key: 'melpDeda',
                                          label: 'DEDA',
                                          // @ts-ignore
                                          onClick: ({ domEvent }) => {
                                              domEvent.preventDefault();
                                              collapseOnMobile();
                                              router.push('/imerso/deda');
                                          },
                                          disabled: ['MELP_SUSPENDED'].includes(melpSummary?.melp_status),
                                      },
                                      {
                                          key: 'melpLamp',
                                          label: 'LAMP',
                                          disabled: !['DEDA_STARTED', 'DEDA_FINISHED', 'DEDA_PAUSED'].includes(
                                              melpSummary?.melp_status,
                                          ),
                                          // @ts-ignore
                                          onClick: ({ domEvent }) => {
                                              domEvent.preventDefault();
                                              collapseOnMobile();
                                              router.push('/imerso/lamp');
                                          },
                                      },
                                  ],
                              },
                          ]
                        : []),
                    {
                        key: 'settings',
                        label: 'Ajustes',
                        icon: <SettingOutlined />,
                        onClick: ({ domEvent }) => {
                            domEvent.preventDefault();
                            collapseOnMobile();
                            router.push('/settings');
                        },
                    },
                    {
                        key: 'logout',
                        label: 'Sair',
                        icon: <LogoutOutlined />,
                        onClick: ({ domEvent }) => {
                            domEvent.preventDefault();
                            collapseOnMobile();
                            handleLogout();
                        },
                    },
                ]}
            />
        );

        if (device === 'mobile') {
            return (
                <PageLayout mobileMaxHeight={window?.innerHeight}>
                    <Layout>
                        <AppHeader>
                            <Flex gap="0.5rem" align="center" justify="space-between" style={{ width: '100%' }}>
                                {trigger}
                                {withMelpSummary && <MelpSummary />}
                                <Flex align="center" justify="flex-end" gap="1rem">
                                    <NotificationsList />
                                </Flex>
                            </Flex>
                            <Drawer open={!collapsed} onClose={() => setCollapsed(true)}>
                                {customMenu}
                            </Drawer>
                        </AppHeader>
                        <ContentLayout>
                            <AppContent>{children}</AppContent>
                        </ContentLayout>
                    </Layout>
                </PageLayout>
            );
        }

        return (
            <PageLayout>
                <Sidebar collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)} trigger={null}>
                    <Flex
                        align="center"
                        gap="12px"
                        justify={collapsed ? 'center' : 'flex-start'}
                        style={{ marginBottom: '1rem' }}
                    >
                        {trigger}
                        {!collapsed && (
                            <LogoWrapper
                                onClick={() => {
                                    router.push('/');
                                }}
                            >
                                <Logo theme="dark" />
                            </LogoWrapper>
                        )}
                    </Flex>
                    {customMenu}
                </Sidebar>
                <Layout>
                    <AppHeader>
                        <div>{withMelpSummary && melpSummary?.melp_status === 'DEDA_STARTED' && <MelpSummary />}</div>
                        <div>
                            <AdminActions />
                        </div>
                        <div>
                            <UserMenu />
                        </div>
                    </AppHeader>
                    <ContentLayout>
                        <AppContent ref={ref}>{children}</AppContent>
                    </ContentLayout>
                </Layout>
            </PageLayout>
        );
    },
);

AppLayout.displayName = 'AppLayout';
