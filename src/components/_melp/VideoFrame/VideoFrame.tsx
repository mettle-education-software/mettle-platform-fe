'use client';

import { YoutubeFilled } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Modal } from 'antd';
import { extractYouTubeID } from 'libs';
import { useState } from 'react';
import { FrameThumbnail } from '../../atoms/FrameThumbnail/FrameThumbnail';

const YouTubeIcon = styled(YoutubeFilled)`
    color: red;
    font-size: 4rem;
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
`;

const IFrame = styled.iframe`
    border: none;
    width: 100%;
    height: 100%;
    min-height: 30rem;
    align-self: center;
    margin-bottom: 3rem;
`;

const Dialog = styled(Modal)`
    .ant-modal-content {
        border-radius: 6px;
        padding: 3rem 0 0 0;
        height: 70vh;
    }

    .ant-modal-body {
        padding: 0;
        height: 100%;
    }
`;

export const VideoFrame = ({ videoSrc, title }: { videoSrc: string; title: string }) => {
    const videoId = extractYouTubeID(videoSrc);

    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleOk = () => {
        setIsModalOpen(false);
    };

    return (
        <FrameThumbnail
            title={title}
            onThumbClick={() => {
                if (!isModalOpen) setIsModalOpen(true);
            }}
        >
            <Dialog open={isModalOpen} onCancel={handleOk} onOk={handleOk} destroyOnClose footer={null} width="70vw">
                <IFrame
                    title="LinKnowledge video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    src={`https://www.youtube.com/embed/${videoId}`}
                />
            </Dialog>
            <VideoThumbDisplay
                style={{
                    background: `url('https://img.youtube.com/vi/${videoId}/maxresdefault.jpg')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                <YouTubeIcon />
            </VideoThumbDisplay>
        </FrameThumbnail>
    );
};
