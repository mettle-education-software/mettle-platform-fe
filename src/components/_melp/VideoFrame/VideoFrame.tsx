'use client';

import { extractYouTubeID } from 'libs';
import { FrameThumbnail } from '../../atoms/FrameThumbnail/FrameThumbnail';

export const VideoFrame = ({ videoSrc, title }: { videoSrc: string; title: string }) => {
    const videoId = extractYouTubeID(videoSrc);

    return (
        <FrameThumbnail title={title} onThumbClick={() => null}>
            <div
                style={{
                    borderRadius: '6px',
                    width: '100%',
                    height: '100%',
                    background: `url('https://img.youtube.com/vi/${videoId}/maxresdefault.jpg')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            />
        </FrameThumbnail>
    );
};
