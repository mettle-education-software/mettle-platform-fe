'use client';

import { BellOutlined, CaretDownOutlined, MenuOutlined, UserOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Typography, Image, Avatar, Dropdown, Space, MenuProps } from 'antd';
import ExpandedSideBar, { MenuItem } from 'components/ExpandedSideBar/ExpandedSideBar';
import { useDedaMeta } from 'hooks';
import { handleLogout, withAuthentication } from 'libs';
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
    align-items: center;
    background-color: var(--primary);
    display: flex;
    gap: 0.75rem;
    grid-area: logo;
    margin: 0 1.7rem;
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

const Main = styled.div`
    grid-area: main;
    background-color: var(--B2);
`;

function Home() {
    const { user } = useAppContext();
    const { loading, data } = useDedaMeta('DEDA8');

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
                            <Chip color="var(--primary)" style={{ backgroundColor: 'var(--brown-light)' }}>
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
                            {/* profileImageSrc */}
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
                <ExpandedSideBar items={menuItems} />
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
