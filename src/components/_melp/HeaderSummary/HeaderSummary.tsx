'use client';

import styled from '@emotion/styled';
import { Col, Flex, Row, Typography } from 'antd';
import { MaxWidthContainer } from 'components';
import { padding } from 'libs';
import React from 'react';

const { Title, Text } = Typography;

const HeaderSummaryContainer = styled.header<{ imgUrl?: string }>`
    position: sticky;
    top: 0;
    z-index: 1;
    background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, #2b2b2b 100%), #1f1f1f;
    background-position: center;
    background-size: cover;
    padding: ${padding.x.sm} ${padding.x.lg};
    height: 200px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border: none;

    & h1 {
        color: var(--secondary);
    }

    & .text {
        color: white !important;
    }
`;

interface HeaderSummaryProps {
    imgUrl?: string;
    title: string;
    description?: string;
    extra?: React.ReactNode;
}

export const HeaderSummary: React.FC<HeaderSummaryProps> = ({ imgUrl, title, description, extra }) => {
    return (
        <HeaderSummaryContainer imgUrl={imgUrl}>
            <MaxWidthContainer>
                <Row>
                    <Col>
                        <Flex vertical>
                            <Title level={1}>{title}</Title>
                            {description && <Text className="text">{description}</Text>}
                        </Flex>
                    </Col>
                    <Col>{extra}</Col>
                </Row>
            </MaxWidthContainer>
        </HeaderSummaryContainer>
    );
};
