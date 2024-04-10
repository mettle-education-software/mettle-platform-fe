'use client';

import { BellOutlined, CaretDownOutlined, MenuOutlined, UserOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { ThemeConfig, Dropdown, Space, MenuProps, Avatar, Image } from 'antd';
import CollapsedMenu from 'components/CollapsedMenu/CollapsedMenu';
import ExpandedMenu, { MenuItem } from 'components/ExpandedMenu/ExpandedMenu';
import { useDeviceSize, useGetUser } from 'hooks';
import { handleLogout } from 'libs';
import { useAppContext } from 'providers';
import React, { useState } from 'react';
import { darkTheme, lightTheme } from 'themes';
import '../../styles/globals.css';

const Container = styled.div`
    display: grid;
    grid-template-columns: auto 1fr;
    grid-template-rows: 2.875rem calc(100vh - 2.875rem);
    grid-template-areas:
        'sidebar header'
        'sidebar main';
`;

const Sidebar = styled.div`
    display: flex;
    flex-direction: column;
    grid-area: sidebar;
    transition: all 0.5s ease-out;
`;

const Logo = styled.div`
    align-items: center;
    background-color: var(--primary);
    display: flex;
    gap: 0.75rem;
    & > span {
        cursor: pointer;
    }
    height: 2.875rem;
    justify-content: center;
`;

const Header = styled.div`
    align-self: center;
    grid-area: header;
    display: flex;
    align-items: center;
    justify-content: space-between;
`;
const LeftHeader = styled.div``;

const Summary = styled.div`
    align-items: center;
    align-self: stretch;
    display: flex;
    justify-content: center;
    padding-left: 0.5rem;
    gap: 0.5rem;
`;

const Chip = styled('div')`
    align-content: center;
    border-radius: 6.25rem;
    color: ${(props: any) => props.color};
    font-weight: var(--font-weight-bold);
    font-size: var(--chip-font-size);
    height: 1.75rem;
    line-height: 1.25rem;
    padding: 0.625rem;
    text-align: center;
`;

const NeutralText = styled.span`
    color: (--neutral-text);
    font-weight: var(--font-weight-bold);
`;

const Divider = styled.div`
    border-left-color: var(--quaternary);
    border-left-style: solid;
    border-left-width: 1px;
    height: 0.5rem;
`;

const RightHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 0.75rem;
`;

const Notifications = styled.div`
    padding-right: 0.5rem;
`;

const User = styled.div`
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding-right: 1.5rem;
`;

const Content = styled.div`
    grid-area: main;
    background-color: var(--B2);
`;

const App = ({ children }: { children: React.ReactNode }) => {
    const { theme, isAppLoading } = useAppContext();
    const [collapsed, setCollapsed] = useState(false);

    const themeConfig: ThemeConfig | undefined = theme === 'light' ? lightTheme : darkTheme;

    const { user } = useAppContext();
    const { isLoading, data } = useGetUser(user?.uid);
    const deviceSize = useDeviceSize();

    if (!data || isLoading) {
        return null;
    }

    const { currentTime } = data;

    const items: MenuProps['items'] = [
        {
            key: 'user-name',
            label: (
                <a
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                        handleSubmit();
                    }}
                >
                    Sair
                </a>
            ),
        },
    ];

    const menuItems = [
        { label: 'HPEC', tooltip: 'tooltip text.', href: '/' } as MenuItem,
        { label: 'DEDA', tooltip: 'tooltip text.', href: '/' } as MenuItem,
        { label: 'LAMP', tooltip: 'tooltip text.', href: '/' } as MenuItem,
    ];

    const handleSubmit = () => {
        handleLogout().catch((error) => {
            throw error;
        });
    };

    const handleCollapsed = () => {
        setCollapsed(!collapsed);
    };

    window.addEventListener('resize', () => {
        deviceSize === 'desktop' ? setCollapsed(false) : setCollapsed(true);
    });

    return (
        <Container>
            <Header>
                <LeftHeader>
                    <Summary>
                        <Chip color="var(--primary)" style={{ backgroundColor: 'var(--brown-light)' }}>
                            DEDA
                        </Chip>
                        <NeutralText>{currentTime.currentDedaName}</NeutralText>
                        <Divider />
                        <Chip color="var(--neutral-text)" style={{ width: '3.625rem', backgroundColor: 'var(--gray)' }}>
                            Week
                        </Chip>
                        <NeutralText>{currentTime.currentWeek}</NeutralText>
                        <Divider />
                        <Chip color="var(--neutral-text)" style={{ width: '3.625rem', backgroundColor: 'var(--gray)' }}>
                            Day
                        </Chip>
                        <NeutralText>{currentTime.currentDay}</NeutralText>
                    </Summary>
                </LeftHeader>
                <RightHeader>
                    <Notifications>
                        <BellOutlined />
                    </Notifications>
                    <User>
                        {user?.profileImageSrc && <Avatar src={<img src={user.profileImageSrc} alt="avatar" />} />}
                        {!user?.profileImageSrc && <Avatar icon={<UserOutlined />} />}
                        <Dropdown menu={{ items }}>
                            <a onClick={(e) => e.preventDefault()}>
                                <Space>
                                    {user?.name}
                                    <CaretDownOutlined />
                                </Space>
                            </a>
                        </Dropdown>
                    </User>
                </RightHeader>
            </Header>
            <Sidebar id="sidebar" style={{ width: !collapsed ? '13.75rem' : '3.25rem' }}>
                <Logo>
                    <MenuOutlined onClick={handleCollapsed} />
                    {!collapsed && <Image src="./mettle-logo.svg" alt="METTLE" preview={false} />}
                </Logo>
                {collapsed && <CollapsedMenu />}
                {!collapsed && <ExpandedMenu items={menuItems} />}
            </Sidebar>
            <Content>{children}</Content>
        </Container>
    );
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return <App>{children}</App>;
}
