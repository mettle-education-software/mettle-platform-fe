'use client';

import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import LockIcon from '@mui/icons-material/Lock';
import { Flex, Typography } from 'antd';
import { padding, SMALL_VIEWPORT } from 'libs';
import React from 'react';
import { Chip } from '../../atoms/Chip/Chip';

const { Title, Text } = Typography;

const Card = styled.div<{ imgUrl?: string; blocked?: boolean }>`
    background: linear-gradient(0deg, rgb(43, 43, 43) 0%, rgb(0, 0, 0, 0) 100%), url(${(props) => props.imgUrl});
    background-size: cover;
    background-position: center;
    border-radius: 6px;
    //min-width: 135px;
    width: 100%;
    aspect-ratio: 1/1.4;
    border: 2px solid #8f8f8f;

    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: ${padding.y.sm} ${padding.x.sm};
    transition: all 0.15s ease-in-out;
    cursor: ${({ blocked }) => (blocked ? 'not-allowed' : 'pointer')};
    position: relative;
    z-index: 1;

    &.is-loading {
        animation: ${keyframes`
            0% {
                background-color: #2b2b2b;
            }
            50% {
                background-color: #3b3b3b;
            }
            100% {
                background-color: #2b2b2b;
            }
        `} 1.1s infinite;
        border: none;
    }

    .categories {
        color: #cfcbbd;
        font-size: 1rem;
        font-weight: 400;
    }

    &:hover {
        box-shadow: -12px 12px 15px 0 rgba(0, 0, 0, 0.2);
    }

    .dot-separator {
        font-size: 1rem !important;
        margin: 0 0.8rem;
    }

    @media (max-width: ${SMALL_VIEWPORT}px) {
        .card-title {
            font-size: 1rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-clamp: 1;
        }

        .categories {
            display: none;
        }

        .dot-separator {
            display: none;
        }
    }
`;

const Blocked = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 2;
    background-color: rgba(0, 0, 0, 0.35);
    display: flex;
    justify-content: center;
    align-items: center;

    .lock {
        color: rgba(254, 253, 251, 0.32);
        font-size: 5rem;
    }
`;

interface CardComponentProps {
    imgUrl?: string;
    title?: string;
    week?: string;
    dedaId?: string;
    onClick?: (dedaId: string) => void;
    isLoading?: boolean;
    blocked?: boolean;
    categories?: string[];
}

export const DedaCard: React.FC<CardComponentProps> = ({
    imgUrl,
    title,
    week,
    dedaId,
    onClick,
    isLoading,
    blocked = false,
    categories = [],
}) => {
    if (isLoading) return <Card className="is-loading" />;

    return (
        <Card
            blocked={blocked}
            className={isLoading ? 'is-loading' : ''}
            imgUrl={imgUrl}
            onClick={() => {
                if (dedaId && onClick && !blocked) {
                    onClick(dedaId);
                }
            }}
        >
            {blocked && (
                <Blocked>
                    <LockIcon className="lock" />
                </Blocked>
            )}
            <div>{week && <Chip>{week}</Chip>}</div>
            <Flex vertical gap="12px">
                <Title level={2} className="card-title color-secondary">
                    {title}
                </Title>
                <Text className="categories">
                    {categories?.map((category, index) => (
                        <React.Fragment key={`${category}-${index}`}>
                            {category}
                            {index < categories.length - 1 && (
                                <span className="color-secondary dot-separator"> • </span>
                            )}
                        </React.Fragment>
                    ))}
                </Text>
            </Flex>
        </Card>
    );
};
