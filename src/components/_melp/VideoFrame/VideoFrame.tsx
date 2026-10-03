'use client';

import { CaretRightFilled, YoutubeFilled } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Typography } from 'antd';
import { extractYouTubeID } from 'libs';
import { youTubeThumbnail, youTubeThumbnailFallback } from 'libs/youtube';
import React, { useId, useState } from 'react';
import { FrameThumbnail } from '../../atoms/FrameThumbnail/FrameThumbnail';
import { ArticleReaderModal } from '../ArticleFrame/ArticleFrame';
import { LinKnowledgeCard } from '../_deda/DedaNotes/LinKnowledge/LinKnowledgeCard';

const YouTubeIcon = styled(YoutubeFilled)`
    color: red;
    font-size: 4rem;
    position: relative;
`;

const VideoThumbDisplay = styled.div`
    border-radius: 6px;
    overflow: hidden;
    cursor: pointer;
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;

    img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
`;

const Player = styled.div`
    height: 100%;
    overflow-y: auto;
    padding: 0 1.5rem 1.5rem;

    iframe {
        display: block;
        border: none;
        border-radius: 6px;
        margin: 0 auto;
        /* 16:9 que cabe no popup (80vh no desktop) sem rolagem */
        width: min(100%, calc((80vh - 9rem) * 16 / 9));
        aspect-ratio: 16 / 9;
        height: auto;
    }
`;

const PlayBadge = styled.span`
    position: relative;
    width: 2.75rem;
    height: 2.75rem;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.55);
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
`;

/** `meta` (ex.: "Day 2") liga o card do carrossel do LinKnowledge, igual ao dos artigos. */
export const VideoFrame = ({
    videoSrc,
    title,
    fullWidth,
    meta,
}: {
    videoSrc: string;
    title: string;
    fullWidth?: boolean;
    meta?: string;
}) => {
    const videoId = extractYouTubeID(videoSrc);
    const titleId = useId();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [thumbSrc, setThumbSrc] = useState(() => youTubeThumbnail(videoId));

    const tryFallback = (naturalWidth: number | null) => {
        const next = youTubeThumbnailFallback(videoId, thumbSrc, naturalWidth);
        if (next) setThumbSrc(next);
    };

    const popup = (
        <ArticleReaderModal open={isModalOpen} onClose={() => setIsModalOpen(false)} title={title} labelledBy={titleId}>
            <Player>
                <Typography.Title id={titleId} level={3} style={{ marginBottom: '1rem' }}>
                    {title}
                </Typography.Title>
                <iframe
                    title={title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                    allowFullScreen
                    src={`https://www.youtube.com/embed/${videoId}`}
                />
            </Player>
        </ArticleReaderModal>
    );

    const thumb = (
        // eslint-disable-next-line @next/next/no-img-element -- precisa de naturalWidth para o fallback
        <img
            src={thumbSrc}
            alt=""
            onLoad={(event) => tryFallback(event.currentTarget.naturalWidth)}
            onError={() => tryFallback(null)}
        />
    );

    if (meta) {
        return (
            <>
                <LinKnowledgeCard
                    meta={meta}
                    title={title}
                    image={thumb}
                    overlay={
                        <PlayBadge aria-hidden>
                            <CaretRightFilled />
                        </PlayBadge>
                    }
                    onClick={() => setIsModalOpen(true)}
                />
                {popup}
            </>
        );
    }

    return (
        <FrameThumbnail
            title={title}
            onThumbClick={() => {
                if (!isModalOpen) setIsModalOpen(true);
            }}
            fullWidth={fullWidth}
        >
            {popup}
            <VideoThumbDisplay>
                {thumb}
                <YouTubeIcon />
            </VideoThumbDisplay>
        </FrameThumbnail>
    );
};
