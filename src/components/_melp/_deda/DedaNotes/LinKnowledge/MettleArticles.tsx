'use client';

import { useLinKnowledgeEdition } from 'hooks/queries/dedaQueries';
import { editionArticles, GENRE_LABELS } from 'libs/linknowledge';
import Image from 'next/image';
import React, { useState } from 'react';
import { ArticleReaderModal } from '../../../ArticleFrame/ArticleFrame';
import { LinKnowledgeCard, LinKnowledgeCardsRow } from './LinKnowledgeCard';
import { METTLE_ARTICLE_TITLE_ID, MettleArticleReader } from './MettleArticleReader';

/** Os 7 artigos do Mettle Editor, lidos no mesmo popup dos links do LinKnowledge; substituem os links externos quando existem. */
export const MettleArticles = ({ dedaId, fallback }: { dedaId: string; fallback: React.ReactNode }) => {
    const { data, loading } = useLinKnowledgeEdition(dedaId);
    const [openDay, setOpenDay] = useState<number | null>(null);
    const articles = editionArticles(data?.dedaContentCollection.items[0]?.dedaLinKnowledgeArticlesCollection?.items);

    // Sem artigos do Mettle Editor (ou campo inexistente no ambiente): links externos exatamente como antes.
    if (articles.length === 0) return loading ? null : <>{fallback}</>;

    const index = articles.findIndex((article) => article.day === openDay);

    return (
        <>
            <LinKnowledgeCardsRow>
                {articles.map((article) => {
                    const image = article.imagesCollection.items[0];
                    return (
                        <LinKnowledgeCard
                            key={article.day}
                            meta={`Day ${article.day} · ${GENRE_LABELS[article.genre] ?? article.genre}`}
                            title={article.title}
                            onClick={() => setOpenDay(article.day)}
                            image={
                                image && (
                                    <Image
                                        src={image.url}
                                        alt={image.description || article.title}
                                        width={image.width}
                                        height={image.height}
                                    />
                                )
                            }
                        />
                    );
                })}
            </LinKnowledgeCardsRow>
            <ArticleReaderModal
                open={index >= 0}
                onClose={() => setOpenDay(null)}
                title={articles[index]?.title ?? ''}
                labelledBy={METTLE_ARTICLE_TITLE_ID}
            >
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
