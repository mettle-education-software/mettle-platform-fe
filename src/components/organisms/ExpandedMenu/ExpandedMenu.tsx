'use client';

import { DownOutlined, HomeOutlined, InfoCircleOutlined, RightOutlined, SettingOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Image, Space, Tooltip } from 'antd';
import Link from 'next/link';
import React from 'react';

const Bar = styled.div`
    justify-self: center;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    margin: 0.75rem;
    height: 100%;
`;

const MainMenu = styled.div`
    display: flex;
    flex-direction: column;
`;

const HomeMenu = styled(Link)`
    display: flex;
    gap: 0.75rem;
    padding: 1rem 1rem;
    span > svg {
        width: 1.25rem;
        height: 1.25rem;
    }
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
    span:nth-of-type(2) {
        font-size: 0.625rem;
        cursor: pointer;
    }
    span:first-of-type {
        cursor: pointer;
    }
`;

const Settings = styled.div`
    display: flex;
    gap: 0.75rem;
    cursor: pointer;
    span > svg {
        width: 1.25rem;
        height: 1.25rem;
    }
    padding: 1rem 1rem;
`;

export type MenuItem = {
    label: string;
    tooltip: string;
    href: string;
};

function ExpandedSideBar(props: { items: Array<MenuItem> }) {
    const [showMenu, setShowMenu] = React.useState(true);

    const handleShowMenu = () => {
        setShowMenu(!showMenu);
    };

    return (
        <Bar>
            <MainMenu>
                <HomeMenu href="/course">
                    <HomeOutlined />
                    <span>Home</span>
                </HomeMenu>
                <MelpMenu>
                    <MelpMenuHeader onClick={handleShowMenu}>
                        <Space>
                            <Image src="/melp-ico.svg" alt="MELP" preview={false} />
                            <span>MELP</span>
                        </Space>
                        {showMenu && <DownOutlined />}
                        {!showMenu && <RightOutlined />}
                    </MelpMenuHeader>
                    {showMenu && (
                        <>
                            <MelpMenuDivider />
                            <MelpMenuItems>
                                {props.items.map((item, index, { length }) => (
                                    <>
                                        <MelpMenuItem key={`${item.label}-${index}`}>
                                            <Link href={item.href}>{item.label}</Link>
                                            <Tooltip title={item.tooltip} placement="right">
                                                <InfoCircleOutlined />
                                            </Tooltip>
                                        </MelpMenuItem>
                                        {!(length - 1 === index) && <MelpMenuDivider />}
                                    </>
                                ))}
                            </MelpMenuItems>
                        </>
                    )}
                </MelpMenu>
            </MainMenu>
            <Settings>
                <SettingOutlined />
                <span>Settings</span>
            </Settings>
        </Bar>
    );
}

export default ExpandedSideBar;
