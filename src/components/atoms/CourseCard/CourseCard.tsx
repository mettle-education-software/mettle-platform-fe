'use client';

import styled from '@emotion/styled';
import { Card, Button, Flex, Typography } from 'antd';
import React from 'react';

const { Title, Text } = Typography;

interface CourseCardProps {
    title: string;
    type: string;
    href: string;
    imgUrl: string;
}

const StyledCard = styled(Card)`
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.07);

    .ant-card-head {
        padding: 0;
        border-bottom: none;
    }
`;

const CardThumb = styled.div<{ imgUrl: string }>`
    background-image: url(${(props) => props.imgUrl});
    background-size: cover;
    background-position: center;
    height: 250px;
    border-top-left-radius: 6px;
    border-top-right-radius: 6px;
    padding: 1rem;

    .card-type-row {
        display: flex;
        width: 100%;
        justify-content: flex-end;
    }

    .card-type {
        background: #ede4d7;
        color: #212121;
        font-weight: 400;
        padding: 2px 16px;
        border-radius: 12px;
    }
`;

export const CourseCard: React.FC<CourseCardProps> = ({ title, type, href, imgUrl }) => (
    <StyledCard
        title={
            <CardThumb imgUrl={imgUrl}>
                <div className="card-type-row">
                    <div className="card-type">
                        <Text>{type}</Text>
                    </div>
                </div>
            </CardThumb>
        }
    >
        <Flex vertical gap="1rem">
            <Title level={5}>{title}</Title>

            <Button type="primary" block href={href}>
                Acessar
            </Button>
        </Flex>
    </StyledCard>
);
