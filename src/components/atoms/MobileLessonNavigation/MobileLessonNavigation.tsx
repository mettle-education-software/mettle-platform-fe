'use client';

import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import AppsRoundedIcon from '@mui/icons-material/AppsRounded';
import { Button, Col, Flex, Row } from 'antd';
import React from 'react';

const NavContainer = styled.div`
    width: 100%;
    max-height: 20vh;
    padding: 1rem 1.5rem;
    background: var(--brown-bg);
`;

const NavButton = styled(Button)`
    border-radius: 50rem;
    width: 100%;
    padding-left: 1rem;
    padding-right: 1rem;
    padding-top: 1rem;
    padding-bottom: 1rem;
    display: flex;
    justify-content: center;
    align-items: center;
    font-weight: 600;
`;

const GridIcon = styled(AppsRoundedIcon)`
    color: var(--secondary);
`;

interface MobileLessonNavigationProps {
    onChangeView(): void;

    onPrevious(): void;

    onNext(): void;

    lastItem: boolean;
    firstItem: boolean;
}

export const MobileLessonNavigation: React.FC<MobileLessonNavigationProps> = ({
    onChangeView,
    onPrevious,
    onNext,
    firstItem,
    lastItem,
}) => {
    return (
        <NavContainer>
            <Row align="middle" gutter={16}>
                <Col span={10}>
                    <NavButton type="primary" disabled={firstItem} onClick={onPrevious}>
                        <LeftOutlined /> Previous
                    </NavButton>
                </Col>
                <Col span={4}>
                    <Flex justify="center" align="center">
                        <GridIcon onClick={onChangeView} />
                    </Flex>
                </Col>
                <Col span={10}>
                    <NavButton type="primary" disabled={lastItem} onClick={onNext}>
                        Next <RightOutlined />
                    </NavButton>
                </Col>
            </Row>
        </NavContainer>
    );
};
