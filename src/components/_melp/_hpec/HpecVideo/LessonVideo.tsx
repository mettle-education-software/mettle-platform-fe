'use client';

import styled from '@emotion/styled';
import Player from '@vimeo/player';
import { Skeleton, Typography } from 'antd';
import { useDeviceSize } from 'hooks';
import useGetLessonContent from 'hooks/queries/useGetLessonContent';
import { useProductEventsSender } from 'hooks/useEvents';
import { SMALL_VIEWPORT } from 'libs';
import { useAppContext } from 'providers';
import React, { useRef, useEffect } from 'react';

const { Title } = Typography;

interface LessonVideoProps {
    lessonId: string;
    onEmptyVideo?: () => void;
    productId?: string;
    /** Plataforma nova: chamado uma vez ao passar de `watchedAt`% do vídeo (aula vista). */
    onWatched?: () => void;
    watchedAt?: number;
    /** Plataforma nova: toca ao abrir (o clique que trouxe o aluno até aqui já foi o "play"). */
    autoplay?: boolean;
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

export const LessonVideo: React.FC<LessonVideoProps> = ({
    lessonId,
    onEmptyVideo,
    onWatched,
    watchedAt = 90,
    autoplay,
}) => {
    const { data, loading } = useGetLessonContent(lessonId);
    const { user } = useAppContext();
    const device = useDeviceSize();

    const iframeRef = useRef<HTMLIFrameElement | null>(null);

    const { mutate: sendMilestoneEvent } = useProductEventsSender();

    useEffect(() => {
        const sendMilestone = async (milestone: number) => {
            sendMilestoneEvent({
                productId: lessonId,
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

        const milestones = [25, 50, 75, 90, 95, 100];
        const triggeredMilestones = new Set<number>();
        let watchedSent = false;
        // o navegador pode recusar tocar com som: fica o play do próprio player
        if (autoplay) player.play().catch(() => {});

        const onTimeUpdate = async (data: { percent: number }) => {
            const watchedPercent = Math.floor(data.percent * 100);

            if (onWatched && !watchedSent && watchedPercent >= watchedAt) {
                watchedSent = true;
                onWatched();
            }

            for (const milestone of milestones) {
                if (watchedPercent >= milestone && !triggeredMilestones.has(milestone)) {
                    triggeredMilestones.add(milestone);
                    await sendMilestone(milestone);
                }
            }
        };

        player.on('timeupdate', onTimeUpdate);
        // fim do vídeo também conta como vista (pulou para o fim, vídeo curto)
        const onEnded = () => {
            if (onWatched && !watchedSent) {
                watchedSent = true;
                onWatched();
            }
        };
        if (onWatched) player.on('ended', onEnded);

        return () => {
            player.off('timeupdate', onTimeUpdate);
            if (onWatched) player.off('ended', onEnded);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [iframeRef.current, user]);

    if (loading || !data) return <Skeleton active loading />;

    const lesson = data.singleLessonCollection.items[0];

    if (!lesson.lessonVideoEmbedUrl && onEmptyVideo) {
        onEmptyVideo();
    }

    return (
        <VideoWrapper>
            <VideoIFrame
                ref={iframeRef}
                allowFullScreen
                src={lesson.lessonVideoEmbedUrl}
                allow={autoplay ? 'autoplay; fullscreen; picture-in-picture' : undefined}
            />

            {device === 'mobile' && (
                <Title level={5} className="color-white">
                    {lesson.lessonTitle}
                </Title>
            )}
        </VideoWrapper>
    );
};
