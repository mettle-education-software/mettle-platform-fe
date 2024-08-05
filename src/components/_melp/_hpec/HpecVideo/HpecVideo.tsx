'use client';

import styled from '@emotion/styled';
import { Skeleton, Typography } from 'antd';
import { useDeviceSize } from 'hooks';
import useGetLessonContent from 'hooks/queries/useGetLessonContent';
import { padNumber, SMALL_VIEWPORT } from 'libs';
import React from 'react';
import ReactMarkdown from 'react-markdown';

const { Title } = Typography;

interface HpecVideoProps {
    lessonId: string;
}

const VideoWrapper = styled.div`
    width: 100%;
`;

const VideoIFrame = styled.iframe`
    width: 100%;
    aspect-ratio: 16/9;
    border: none;
    border-radius: 1rem;

    @media (max-width: ${SMALL_VIEWPORT}px) {
        border-radius: 0.5rem;
    }
`;

const Markdown = styled(ReactMarkdown)`
    margin-top: 1rem;
    color: white;
    font-size: 1.5rem;
    font-weight: 400;

    @media (max-width: ${SMALL_VIEWPORT}px) {
        margin-top: 0.5rem;
        font-size: 0.8rem;
    }
`;

export const HpecVideo: React.FC<HpecVideoProps> = ({ lessonId }) => {
    const { data, loading } = useGetLessonContent(lessonId);
    const device = useDeviceSize();

    if (loading || !data) return <Skeleton active loading />;

    const lesson = data.singleLessonCollection.items[0];

    return (
        <VideoWrapper>
            <VideoIFrame allowFullScreen src={lesson.lessonVideoEmbedUrl} />

            {device === 'mobile' && (
                <Title level={5} className="color-white">
                    {lesson.lessonTitle}
                </Title>
            )}

            <Markdown>{lesson.lessonFeaturedText}</Markdown>
        </VideoWrapper>
    );
};
