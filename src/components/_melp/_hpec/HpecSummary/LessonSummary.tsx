'use client';

import styled from '@emotion/styled';
import { Skeleton } from 'antd';
import { RichTextRenderer } from 'components';
import useGetLessonContent from 'hooks/queries/useGetLessonContent';
import { SMALL_VIEWPORT } from 'libs';
import React from 'react';

interface HpecSummaryProps {
    lessonId: string;
}

const SummaryReader = styled.article`
    width: 100%;
    aspect-ratio: 16/9;
    background: #ffffff;
    border-radius: 1rem;
    padding: 1rem 8rem;
    overflow-y: auto;

    @media (max-width: ${SMALL_VIEWPORT}px) {
        height: 58vh;
        aspect-ratio: unset;
        padding: 0.5rem 1rem;
    }
`;

export const LessonSummary: React.FC<HpecSummaryProps> = ({ lessonId }) => {
    const { data, loading } = useGetLessonContent(lessonId);

    if (loading) return <Skeleton active loading />;

    return (
        <SummaryReader>
            <RichTextRenderer
                rawContent={data?.singleLessonCollection?.items[0].lessonContent.json}
                links={data?.singleLessonCollection?.items[0].lessonContent.links}
                justify
            />
        </SummaryReader>
    );
};
