'use client';

import { HomeOutlined, SettingOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import Image from 'next/image';
import Link from 'next/link';

const Bar = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1 0 0;
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

const BottomArea = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    flex: 1 0 0;
    padding: 1rem 1rem;

    span > svg {
        width: 1.25rem;
        height: 1.25rem;
    }

    div.ant-image > img {
        width: 1.25rem;
        height: 1.25rem;
    }
`;

const MelpLogo = styled(Link)`
    width: 1.25rem;
    height: 1.25rem;
`;

function CollapsedMenu() {
    return (
        <Bar>
            <HomeMenu href="/course">
                <HomeOutlined />
            </HomeMenu>
            <BottomArea>
                <MelpLogo href="/">
                    <Image priority src="./melp-ico.svg" alt="IMERSO" />
                </MelpLogo>
                <SettingOutlined />
            </BottomArea>
        </Bar>
    );
}

export default CollapsedMenu;
