import { HistoryOutlined, CheckOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Flex, Skeleton, Typography } from 'antd';
import { useDeda } from 'hooks';
import { DedaWatchQueryResponse } from 'interfaces';
import React from 'react';

const { Title, Text } = Typography;

const ThumbnailWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    padding: 0.5rem;
    width: 100%;

    color: #ffffff;

    h4,
    h1,
    h2,
    h3 {
        color: #fff;
        font-weight: 400;
    }
`;

const VideoFrame = styled.iframe`
    border: none;
    border-radius: 1rem;
    width: 100%;
    aspect-ratio: 16/9;
`;

const WeekChip = styled.div`
    background: #fff;
    color: #000;
    padding: 0.1rem 0.9rem;
    border-radius: 10rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
`;

const ReviewStatusChip = styled.button`
    padding: 0.5rem 1rem;
    border-radius: 10rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    border: none;
    box-shadow: none;
    cursor: pointer;
    transition: background 0.3s;

    & > * {
        color: #fff !important;
    }

    &.completed {
        background: rgba(183, 144, 96, 0.2);
    }

    &.incomplete {
        background: rgba(176, 176, 176, 0.2);
    }

    &:hover {
        background: rgba(255, 255, 255, 0.4);
    }
`;

interface ReviewThumbnailProps {
    dedaId: string;
    title: string;
    number: number;
    week: string;
    status: boolean;
    onMarkCompleted: (status: boolean) => void;
}

export const ReviewThumbnail: React.FC<ReviewThumbnailProps> = ({
    dedaId,
    title,
    number,
    week,
    status,
    onMarkCompleted,
}) => {
    const { data, loading } = useDeda<DedaWatchQueryResponse>('deda-watch', dedaId);

    if (!data || loading) return <Skeleton.Image active />;

    const dedaUrl = data?.dedaContentCollection.items[0].dedaWatchVideoLink;

    const reviewProperties: {
        [key: typeof number]: {
            order: string;
            complement: string;
        };
    } = {
        1: {
            order: 'st',
            complement: '1 day after',
        },
        2: {
            order: 'nd',
            complement: '1 week after',
        },
        3: {
            order: 'rd',
            complement: '1 month after',
        },
    };

    return (
        <ThumbnailWrapper>
            <Flex gap="0.6rem" align="center">
                <HistoryOutlined style={{ marginTop: '0.5rem' }} />{' '}
                <Title style={{ margin: 0, lineHeight: 0 }} level={4}>
                    {number}
                    <sup>{reviewProperties[number].order}</sup> Review (
                    <span style={{ fontWeight: 400 }}>{reviewProperties[number].complement})</span>
                </Title>
            </Flex>
            <VideoFrame src={dedaUrl} />
            <Flex style={{ width: '100%' }} justify="space-between" align="center">
                <Flex align="center" gap="1rem">
                    <Text style={{ color: '#FFF' }}>{title}</Text>
                    <WeekChip>
                        <Text strong>Week</Text>
                        <Text>{week.split('week')[1]}</Text>
                    </WeekChip>
                </Flex>
                <ReviewStatusChip
                    onClick={() => {
                        onMarkCompleted(!status);
                    }}
                    className={status ? 'completed' : 'incomplete'}
                >
                    <Text>{status ? 'Completed' : 'Mark as complete'}</Text>
                    {status && <CheckOutlined />}
                </ReviewStatusChip>
            </Flex>
        </ThumbnailWrapper>
    );
};
