'use client';

import styled from '@emotion/styled';
import { Skeleton, Modal, Drawer } from 'antd';
import { useDeviceSize, useGetMetadata } from 'hooks';
import { useEffect, useState } from 'react';
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

export const ArticleFrame = ({ href, title, fullWidth }: { href: string; title: string; fullWidth?: boolean }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const device = useDeviceSize();

    const handleOk = () => {
        setIsModalOpen(false);
    };

    const { data: metadata, isError, isLoading } = useGetMetadata(href);

    const [thumbStyle, setThumbStyle] = useState({
        borderRadius: 6,
        width: '100%',
        aspectRatio: '16 / 9',
        backgroundImage: `url("/mettle.png")`,
        backgroundSize: 'contain',
        backgroundPosition: 'center',
    });
    const [shouldOpenExternal, setShouldOpenExternal] = useState(true);

    useEffect(() => {
        fetch(href)
            .then((response) => {
                if (response.status === 200) {
                    setShouldOpenExternal(false);
                }
            })
            .catch((error) => {
                console.error('Error fetching href', error);
            });
    }, [href]);

    useEffect(() => {
        if (metadata?.image) {
            fetch(metadata.image)
                .then((response) => {
                    if (response.status === 200) {
                        setThumbStyle((previous) => ({
                            ...previous,
                            backgroundImage: `url(${metadata.image})`,
                            backgroundSize: 'contain',
                        }));
                    }
                })
                .catch((error) => {
                    console.log('Fetch image error', error);
                });
        }
    }, [metadata?.image]);

    if (isLoading)
        return (
            <Skeleton.Image
                active
                style={{
                    width: '100%',
                    minWidth: '250px',
                    minHeight: 'calc(9/16 * 250px)',
                    aspectRatio: '16/9',
                }}
            />
        );

    return (
        <FrameThumbnail
            fullWidth={fullWidth}
            title={title}
            onThumbClick={() => {
                if (isError || shouldOpenExternal) {
                    window.open(href, '_blank');
                    return;
                }

                if (!isModalOpen) setIsModalOpen(true);
            }}
        >
            {device === 'desktop' ? (
                <Dialog
                    open={isModalOpen}
                    onCancel={handleOk}
                    onOk={handleOk}
                    destroyOnClose
                    footer={null}
                    width="70vw"
                >
                    <ArticleFrameContainer allowFullScreen height="100%" src={href} />
                </Dialog>
            ) : (
                <Drawer
                    open={isModalOpen}
                    onClose={handleOk}
                    destroyOnClose
                    width="100%"
                    height="100%"
                    placement="bottom"
                >
                    <ArticleFrameContainer allowFullScreen height="100%" src={href} />
                </Drawer>
            )}
            <div style={thumbStyle} />
        </FrameThumbnail>
    );
};
