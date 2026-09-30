'use client';

import styled from '@emotion/styled';
import { Flex, Typography } from 'antd';
import { useDedaLinKnowledgeArticles } from 'hooks/queries/dedaQueries';
import { GENRE_LABELS, linKnowledgeArticlePath, readingMinutes } from 'libs/linknowledge';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

const ArticleCard = styled(Link)`
    display: flex;
    flex-direction: column;
    width: 16rem;
    flex-shrink: 0;
    border-radius: 6px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.05);
    color: #ffffff;

    &:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
    }

    img {
        width: 100%;
        height: 9rem;
        object-fit: cover;
    }
`;

const CardText = styled.div`
    padding: 0.75rem 1rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
`;

/** Os 7 artigos do Mettle Editor; sem a seção no Contentful, não renderiza nada. */
export const MettleArticles = ({
    dedaId,
    children,
}: {
    dedaId: string;
    children: (row: React.ReactNode) => React.ReactNode;
}) => {
    const { data } = useDedaLinKnowledgeArticles(dedaId);
    const deda = data?.dedaContentCollection.items[0];
    const articles = (deda?.dedaLinKnowledgeArticlesCollection?.items ?? [])
        .filter((article): article is NonNullable<typeof article> => !!article)
        .sort((a, b) => a.day - b.day);

    if (!deda || articles.length === 0) return null;

    return children(
        <Flex gap="1rem" style={{ paddingBottom: '1rem' }}>
            {articles.map((article) => {
                const image = article.imagesCollection.items[0];
                return (
                    <ArticleCard
                        key={article.day}
                        href={linKnowledgeArticlePath(deda.dedaSlug, article.day)}
                        aria-label={`Day ${article.day}: ${article.title}`}
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
                            <Typography.Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>
                                {readingMinutes(article.wordCount)} min read
                            </Typography.Text>
                        </CardText>
                    </ArticleCard>
                );
            })}
        </Flex>,
    );
};
