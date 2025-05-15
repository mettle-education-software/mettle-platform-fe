'use client';

import styled from '@emotion/styled';
import Player from '@vimeo/player';
import { Skeleton, Typography } from 'antd';
import { useDeviceSize } from 'hooks';
import useGetLessonContent from 'hooks/queries/useGetLessonContent';
import { useProductEventsSender } from 'hooks/useEvents';
import { SMALL_VIEWPORT } from 'libs';
import { useAppContext } from 'providers';
import React, { useRef, useCallback, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

const { Title } = Typography;

interface LessonVideoProps {
    lessonId: string;
    onEmptyVideo?: () => void;
    productId?: string;
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

export const LessonVideo: React.FC<LessonVideoProps> = ({ lessonId, onEmptyVideo }) => {
    const { data, loading } = useGetLessonContent(lessonId);
    const { user } = useAppContext();
    const device = useDeviceSize();

    const iframeRef = useRef<HTMLIFrameElement | null>(null);

    const { mutate: sendMilestoneEvent } = useProductEventsSender();

    useEffect(() => {
        const sendMilestone = async (milestone: number) => {
            sendMilestoneEvent({
                productId: lessonId as string,
                dto: {
                    userEmail: user?.email as string,
                    userFirstName: user?.name as string,
                    userUid: user?.uid as string,
                    eventKey: milestone,
                },
            });
        };

        if (!iframeRef.current) return;

        const player = new Player(iframeRef.current);

        const milestones = [25, 50, 75, 90, 98];
        const triggeredMilestones = new Set<number>();

        const onTimeUpdate = async (data: { percent: number }) => {
            const watchedPercent = Math.floor(data.percent * 100);

            for (const milestone of milestones) {
                if (watchedPercent >= milestone && !triggeredMilestones.has(milestone)) {
                    triggeredMilestones.add(milestone);
                    await sendMilestone(milestone);
                }
            }
        };

        player.on('timeupdate', onTimeUpdate);

        return () => {
            player.off('timeupdate', onTimeUpdate);
        };
    }, [iframeRef.current, user]);

    if (loading || !data) return <Skeleton active loading />;

    const lesson = data.singleLessonCollection.items[0];

    if (!lesson.lessonVideoEmbedUrl && onEmptyVideo) {
        onEmptyVideo();
    }

    return (
        <VideoWrapper>
            <VideoIFrame ref={iframeRef} allowFullScreen src={lesson.lessonVideoEmbedUrl} />

            {device === 'mobile' && (
                <Title level={5} className="color-white">
                    {lesson.lessonTitle}
                </Title>
            )}
        </VideoWrapper>
    );
};
