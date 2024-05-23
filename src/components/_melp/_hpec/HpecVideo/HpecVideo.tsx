'use client';

import styled from '@emotion/styled';
import { Skeleton } from 'antd';
import useGetLessonContent from 'hooks/queries/useGetLessonContent';
import React from 'react';
import ReactMarkdown from 'react-markdown';

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
`;

const Markdown = styled(ReactMarkdown)`
    margin-top: 1rem;
    color: white;
    font-size: 1.5rem;
    font-weight: 400;
`;

export const HpecVideo: React.FC<HpecVideoProps> = ({ lessonId }) => {
    const { data, loading } = useGetLessonContent(lessonId);

    if (loading || !data) return <Skeleton active loading />;

    return (
        <VideoWrapper>
            <VideoIFrame allowFullScreen src={data?.singleLessonCollection?.items[0].lessonVideoEmbedUrl} />

            <Markdown>{data?.singleLessonCollection?.items[0].lessonFeaturedText}</Markdown>
        </VideoWrapper>
    );
};
