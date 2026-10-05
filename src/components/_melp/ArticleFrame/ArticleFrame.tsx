'use client';

import styled from '@emotion/styled';
import { Drawer, Modal, Skeleton, Typography } from 'antd';
import { useDeviceSize, useGetMetadata, useGetReadableArticle } from 'hooks';
import React, { useEffect, useState } from 'react';
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

    /* título só para leitores de tela (nome acessível do dialog) */
    .ant-modal-header {
        margin: 0;
        padding: 0;
    }
`;

const ArticleFrameContainer = styled.div`
    height: 100%;
    max-height: 100%;
    padding: 0 1.5rem 1.5rem;

    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
        color: #141414;
        line-height: 1.25;
        margin: 1.5rem 0 0.75rem;
    }

    p,
    li,
    blockquote,
    figcaption {
        color: #434343;
        font-size: 1rem;
        line-height: 1.75;
    }

    img,
    video {
        border-radius: 6px;
        display: block;
        height: auto;
        margin: 1rem auto;
        max-width: 100%;
    }

    a {
        color: #1677ff;
    }

    blockquote {
        border-left: 3px solid #d9d9d9;
        margin: 1.25rem 0;
        padding-left: 1rem;
    }

    pre,
    code {
        white-space: pre-wrap;
    }
`;

const ArticleHeader = styled.div`
    padding: 0 1.5rem 1rem;
`;

const VisuallyHidden = styled.span`
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
`;

/**
 * Popup de leitura do LinKnowledge: modal no desktop, tela cheia no mobile.
 * `title` dá o nome acessível; `labelledBy` aponta para o título visível do conteúdo, quando houver.
 */
export const ArticleReaderModal = ({
    open,
    onClose,
    title,
    labelledBy,
    tools,
    children,
}: {
    open: boolean;
    onClose(): void;
    title: string;
    labelledBy?: string;
    /** Controles no cabeçalho do popup (o "Aa" da página nova do DEDA); nada por padrão. */
    tools?: React.ReactNode;
    children: React.ReactNode;
}) => {
    const device = useDeviceSize();

    return device === 'desktop' ? (
        // O rc-dialog só liga aria-labelledby ao próprio título: título oculto visualmente.
        <Dialog
            open={open}
            onCancel={onClose}
            onOk={onClose}
            destroyOnClose
            footer={null}
            width="70vw"
            title={
                <>
                    <VisuallyHidden>{title}</VisuallyHidden>
                    {tools}
                </>
            }
        >
            {children}
        </Dialog>
    ) : (
        <Drawer
            open={open}
            onClose={onClose}
            destroyOnClose
            width="100%"
            height="100%"
            placement="bottom"
            aria-labelledby={labelledBy}
            aria-label={labelledBy ? undefined : title}
            extra={tools}
        >
            {children}
        </Drawer>
    );
};

export const ArticleFrame = ({ href, title, fullWidth }: { href: string; title: string; fullWidth?: boolean }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleOk = () => {
        setIsModalOpen(false);
    };

    const { data: metadata, isError, isLoading } = useGetMetadata(href);
    const {
        data: article,
        isLoading: isArticleLoading,
        isFetching: isArticleFetching,
        isError: isArticleError,
    } = useGetReadableArticle(href, isModalOpen);

    const [thumbStyle, setThumbStyle] = useState({
        borderRadius: 6,
        width: '100%',
        aspectRatio: '16 / 9',
        backgroundImage: `url("/img/thumb_articles_deda_linknowledge.webp")`,
        backgroundSize: 'contain',
        backgroundPosition: 'center',
    });

    useEffect(() => {
        if (metadata?.image) {
            fetch(metadata.image)
                .then((response) => {
                    if (response.status === 200) {
                        setThumbStyle((previous) => ({
                            ...previous,
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

    const articleBody = (
        <>
            <Skeleton
                style={{ paddingLeft: '1rem', paddingRight: '1rem' }}
                active
                loading={isArticleLoading || isArticleFetching}
            />
            {!isArticleLoading && !isArticleFetching && (
                <div style={{ maxHeight: '100%', overflowY: 'auto', padding: '0.8rem' }}>
                    <ArticleHeader>
                        <Typography.Title level={3} style={{ marginBottom: article?.excerpt ? '0.5rem' : 0 }}>
                            {article?.title || title}
                        </Typography.Title>
                        {article?.excerpt ? (
                            <Typography.Paragraph
                                type="secondary"
                                style={{ marginBottom: article?.byline ? '0.5rem' : 0 }}
                            >
                                {article.excerpt}
                            </Typography.Paragraph>
                        ) : null}
                        {article?.byline ? <Typography.Text type="secondary">{article.byline}</Typography.Text> : null}
                        {isArticleError ? (
                            <Typography.Paragraph type="secondary" style={{ marginTop: '1rem', marginBottom: 0 }}>
                                Unable to load a readable version of this article.{' '}
                                <a href={href} rel="noreferrer" target="_blank">
                                    Open original article
                                </a>
                                .
                            </Typography.Paragraph>
                        ) : null}
                    </ArticleHeader>
                    {article?.content ? (
                        <ArticleFrameContainer dangerouslySetInnerHTML={{ __html: article.content }} />
                    ) : null}
                </div>
            )}
        </>
    );

    return (
        <FrameThumbnail
            fullWidth={fullWidth}
            title={title}
            onThumbClick={() => {
                if (isError) {
                    window.open(href, '_blank');
                    return;
                }

                if (!isModalOpen) setIsModalOpen(true);
            }}
        >
            <ArticleReaderModal open={isModalOpen} onClose={handleOk} title={article?.title || title}>
                {articleBody}
            </ArticleReaderModal>
            <div style={thumbStyle} />
        </FrameThumbnail>
    );
};
