'use client';

import styled from '@emotion/styled';
import { Typography } from 'antd';
import { LinKnowledgeArticle, useLinKnowledgeEdition } from 'hooks/queries/dedaQueries';
import { GENRE_LABELS } from 'libs/linknowledge';
import Image from 'next/image';
import React, { useState } from 'react';
import { ArticleReaderModal } from '../../../ArticleFrame/ArticleFrame';
import { MettleArticleReader } from './MettleArticleReader';

const ArticleCard = styled.button`
    all: unset;
    display: flex;
    flex-direction: column;
    width: 16rem;
    flex-shrink: 0;
    border-radius: 6px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.05);
    color: #ffffff;
    cursor: pointer;

    &:hover,
    &:focus-visible {
        background: rgba(255, 255, 255, 0.1);
    }

    &:focus-visible {
        outline: 2px solid var(--secondary);
    }

    img {
        width: 100%;
        height: auto;
        aspect-ratio: 16 / 9;
        object-fit: cover;
    }
`;

const CardText = styled.div`
    padding: 0.75rem 1rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
`;

/** Os 7 artigos do Mettle Editor, lidos no mesmo popup dos links do LinKnowledge; sem a seção no Contentful, não renderiza nada. */
export const MettleArticles = ({
    dedaId,
    children,
}: {
    dedaId: string;
    children: (row: React.ReactNode) => React.ReactNode;
}) => {
    const { data } = useLinKnowledgeEdition(dedaId);
    const [openDay, setOpenDay] = useState<number | null>(null);
    const articles = (data?.dedaContentCollection.items[0]?.dedaLinKnowledgeArticlesCollection?.items ?? [])
        .filter((article): article is LinKnowledgeArticle => !!article)
        .sort((a, b) => a.day - b.day);

    if (articles.length === 0) return null;

    const index = articles.findIndex((article) => article.day === openDay);

    return (
        <>
            {children(
                <div style={{ display: 'flex', gap: '1rem', paddingBottom: '1rem' }}>
                    {articles.map((article) => {
                        const image = article.imagesCollection.items[0];
                        return (
                            <ArticleCard
                                key={article.day}
                                type="button"
                                aria-label={`Day ${article.day}: ${article.title}`}
                                onClick={() => setOpenDay(article.day)}
                            >
                                {image && (
                                    <Image
                                        src={image.url}
                                        alt={image.description || article.title}
                                        width={image.width}
                                        height={image.height}
                                    />
                                )}
                                <CardText>
                                    <Typography.Text style={{ color: 'var(--secondary)', fontSize: 12 }}>
                                        Day {article.day} · {GENRE_LABELS[article.genre] ?? article.genre}
                                    </Typography.Text>
                                    <Typography.Text strong style={{ color: '#FFFFFF', fontSize: 16 }}>
                                        {article.title}
                                    </Typography.Text>
                                </CardText>
                            </ArticleCard>
                        );
                    })}
                </div>,
            )}
            <ArticleReaderModal open={index >= 0} onClose={() => setOpenDay(null)}>
                {index >= 0 && (
                    <MettleArticleReader
                        article={articles[index]}
                        previous={articles[index - 1]}
                        next={articles[index + 1]}
                        onNavigate={setOpenDay}
                    />
                )}
            </ArticleReaderModal>
        </>
    );
};
