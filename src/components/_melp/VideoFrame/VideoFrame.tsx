'use client';

import { YoutubeFilled } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Typography } from 'antd';
import { extractYouTubeID } from 'libs';
import { youTubeThumbnail, youTubeThumbnailFallback } from 'libs/youtube';
import React, { useId, useState } from 'react';
import { FrameThumbnail } from '../../atoms/FrameThumbnail/FrameThumbnail';
import { ArticleReaderModal } from '../ArticleFrame/ArticleFrame';

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

export const VideoFrame = ({
    videoSrc,
    title,
    fullWidth,
}: {
    videoSrc: string;
    title: string;
    fullWidth?: boolean;
}) => {
    const videoId = extractYouTubeID(videoSrc);
    const titleId = useId();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [thumbSrc, setThumbSrc] = useState(() => youTubeThumbnail(videoId));

    const tryFallback = (naturalWidth: number | null) => {
        const next = youTubeThumbnailFallback(videoId, thumbSrc, naturalWidth);
        if (next) setThumbSrc(next);
    };

    return (
        <FrameThumbnail
            title={title}
            onThumbClick={() => {
                if (!isModalOpen) setIsModalOpen(true);
            }}
            fullWidth={fullWidth}
        >
            <ArticleReaderModal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={title}
                labelledBy={titleId}
            >
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
            <VideoThumbDisplay>
                {/* eslint-disable-next-line @next/next/no-img-element -- precisa de naturalWidth para o fallback */}
                <img
                    src={thumbSrc}
                    alt=""
                    onLoad={(event) => tryFallback(event.currentTarget.naturalWidth)}
                    onError={() => tryFallback(null)}
                />
                <YouTubeIcon />
            </VideoThumbDisplay>
        </FrameThumbnail>
    );
};
