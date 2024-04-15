'use client';

import styled from '@emotion/styled';
import { Skeleton, Modal } from 'antd';
import { useGetMetadata } from 'hooks';
import { useState } from 'react';
import { FrameThumbnail } from '../../atoms/FrameThumbnail/FrameThumbnail';

const Dialog = styled(Modal)`
    .ant-modal-content {
        border-radius: 6px;
        height: 80vh;
        padding: 3rem 0 0 0;
    }

    .ant-modal-body {
        padding: 0;
        height: 100%;
    }
`;

const ArticleFrameContainer = styled.iframe`
    width: 100%;
    min-height: 100% !important;
    border: none;
`;

export const ArticleFrame = ({ href, title }: { href: string; title: string }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleOk = () => {
        setIsModalOpen(false);
    };

    const { data: metadata, isError } = useGetMetadata(href);

    if (!metadata) return <Skeleton.Image active />;

    return (
        <FrameThumbnail
            title={title}
            onThumbClick={() => {
                if (isError) {
                    window.open(href, '_blank');
                    return;
                }

                if (!isModalOpen) setIsModalOpen(true);
            }}
        >
            <Dialog open={isModalOpen} onCancel={handleOk} onOk={handleOk} destroyOnClose footer={null} width="70vw">
                <ArticleFrameContainer allowFullScreen height="100%" src={href} />
            </Dialog>
            <div
                style={{
                    borderRadius: 6,
                    height: '100%',
                    width: '100%',
                    background: `url(${metadata.image ?? '/mettle.png'})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            />
        </FrameThumbnail>
    );
};
