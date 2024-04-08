'use client';

import {
    BellOutlined,
    CaretDownOutlined,
    CaretRightOutlined,
    DownOutlined,
    HomeOutlined,
    InfoCircleOutlined,
    MenuOutlined,
    SettingOutlined,
    UserOutlined,
} from '@ant-design/icons';
import styled from '@emotion/styled';
import { Typography, Image, Avatar, MenuProps, Dropdown, Space } from 'antd';
import { useDedaMeta } from 'hooks';
import { handleLogout, withAuthentication } from 'libs';
import Link from 'next/link';
import { useAppContext } from 'providers';
import React from 'react';

const Container = styled.div`
    display: grid;
    grid-template-columns: 13.75rem auto;
    grid-template-rows: 2.875rem calc(100vh - 2.875rem);
    grid-template-areas:
        'logo header'
        'bar main';
`;

const Logo = styled.div`
    grid-area: logo;
    place-self: center;
    display: flex;
    gap: 0.75rem;
    background-color: var(--primary);
    & > span {
        cursor: pointer;
    }
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
    display: flex;
    align-items: center;
    padding-left: 0.5rem;
    gap: 0.5rem;
`;

const Chip = styled('div')`
    align-content: center;
    border-radius: 6.25rem;
    color: ${(props: any) => props.color};
    font-weight: var(--font-weight-bold);
    height: 1.75rem;
    text-align: center;
`;

const NeutralText = styled.span`
    color: (--neutral-text);
    font-weight: var(--font-weight-bold);
`;

const Divider = styled.div`
    border-left-color: var(--quaternary);
    border-left-style: solid;
    height: 1rem;
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

const Bar = styled.div`
    grid-area: bar;
    justify-self: center;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    margin: 0.75rem 0;
    width: 12.75rem;
`;

const Menu = styled.div`
    display: flex;
    flex-direction: column;
`;

const HomeMenu = styled(Link)`
    display: flex;
    gap: 0.75rem;
    padding: 1rem 1rem;
`;

const MelpMenu = styled.div`
    display: flex;
    background-color: var(--C2);
    border-radius: 0.375rem;
    flex-direction: column;
`;

const MelpMenuHeader = styled.div`
    display: flex;
    font-weight: var(--h1-font-weight);
    justify-content: space-between;
    padding: 1rem 1rem;
    span:last-child {
        cursor: pointer;
    }
`;

const MelpMenuDivider = styled.div`
    border-bottom: 1px solid var(--C1);
`;

const MelpMenuItems = styled.div``;

const MelpMenuItem = styled.div`
    display: flex;
    padding: 1rem 1rem;
    gap: 1rem;
    span:nth-child(2) {
        font-size: 0.625rem;
        cursor: pointer;
    }
    span:first-child {
        cursor: pointer;
    }
`;

const MelpMenuItemTooltip = styled.div`
    align-content: center;
    background-color: var(--B1);
    border-radius: 0.375rem;
    color: var(--white);
    display: none;
    text-align: center;
`;

const Settings = styled.div`
    display: flex;
    gap: 0.75rem;
    cursor: pointer;
`;

const Main = styled.div`
    grid-area: main;
    background-color: var(--B2);
`;

function Home() {
    const { user } = useAppContext();
    const { loading, data } = useDedaMeta('DEDA8');
    const [showMenu, setShowMenu] = React.useState(true);

    if (loading) {
        return <Loading />;
    }

    const { dedaContentCollection } = data;
    const { dedaTitle } = dedaContentCollection.items[0];

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

    const handleSubmit = () => {
        handleLogout().catch((error) => {
            throw error;
        });
    };

    const handleShowMenu = () => {
        setShowMenu(!showMenu);
    };

    const handleShowTooltip = (id: string) => {
        var tooltip = document.getElementById(id);
        tooltip?.setAttribute('style', 'display: inherit');
    };

    return (
        <main>
            <Container>
                <Logo>
                    <MenuOutlined
                        onClick={() => {
                            alert('teste');
                        }}
                    />
                    <Image src="./mettle-logo.svg" alt="METTLE" preview={false} />
                </Logo>
                <Header>
                    <LeftHeader>
                        <Summary>
                            <Chip
                                color="var(--primary)"
                                style={{ width: '3.625rem', backgroundColor: 'var(--secondary)' }}
                            >
                                DEDA
                            </Chip>
                            <NeutralText>{dedaTitle}</NeutralText>
                            <Divider />
                            <Chip
                                color="var(--neutral-text)"
                                style={{ width: '3.625rem', backgroundColor: 'var(--gray)' }}
                            >
                                Week
                            </Chip>
                            <NeutralText>108</NeutralText>
                            <Divider />
                            <Chip
                                color="var(--neutral-text)"
                                style={{ width: '3.625rem', backgroundColor: 'var(--gray)' }}
                            >
                                Day
                            </Chip>
                            <NeutralText>1</NeutralText>
                        </Summary>
                    </LeftHeader>
                    <RightHeader>
                        <Notifications>
                            <BellOutlined />
                        </Notifications>
                        <User>
                            <Avatar icon={<UserOutlined />} />
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
                <Bar>
                    <Menu>
                        <HomeMenu href="/">
                            <HomeOutlined />
                            <span>Home</span>
                        </HomeMenu>
                        <MelpMenu>
                            <MelpMenuHeader onClick={() => handleShowMenu()}>
                                <Space>
                                    <Image src="./melp-ico.svg" alt="MELP" preview={false} />
                                    <span>MELP</span>
                                </Space>
                                {showMenu && <CaretDownOutlined />}
                                {!showMenu && <CaretRightOutlined />}
                            </MelpMenuHeader>
                            {showMenu && (
                                <>
                                    <MelpMenuDivider />
                                    <MelpMenuItems>
                                        <MelpMenuItem>
                                            <span>HPEC</span>
                                            <InfoCircleOutlined onClick={() => handleShowTooltip('HPEC')} />
                                            <MelpMenuItemTooltip id="HPEC">Tooltip text.</MelpMenuItemTooltip>
                                        </MelpMenuItem>
                                        <MelpMenuDivider />
                                        <MelpMenuItem>
                                            <span>DEDA</span>
                                            <InfoCircleOutlined onClick={() => handleShowTooltip('DEDA')} />
                                            <MelpMenuItemTooltip id="DEDA">Tooltip text.</MelpMenuItemTooltip>
                                        </MelpMenuItem>
                                        <MelpMenuDivider />
                                        <MelpMenuItem>
                                            <span>LAMP</span>
                                            <InfoCircleOutlined onClick={() => handleShowTooltip('LAMP')} />
                                            <MelpMenuItemTooltip id="LAMP">Tooltip text.</MelpMenuItemTooltip>
                                        </MelpMenuItem>
                                    </MelpMenuItems>
                                </>
                            )}
                        </MelpMenu>
                    </Menu>
                    <Settings>
                        <SettingOutlined />
                        <span>Settings</span>
                    </Settings>
                </Bar>
                <Main>
                    <Typography.Title>Hello Mettle</Typography.Title>
                </Main>
            </Container>
        </main>
    );
}

function Loading() {
    return <div>Loading</div>;
}

export default withAuthentication(Home);
