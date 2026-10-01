'use client';

import { documentToReactComponents, Options } from '@contentful/rich-text-react-renderer';
import { BLOCKS, Document, INLINES, TopLevelBlock } from '@contentful/rich-text-types';
import styled from '@emotion/styled';
import { ArrowBackIos, ArrowForwardIos } from '@mui/icons-material';
import { Button, Flex, Typography } from 'antd';
import { LinKnowledgeArticle } from 'hooks/queries/dedaQueries';
import { formatEditionDate, GENRE_LABELS, readingMinutes, splitAtMiddle } from 'libs/linknowledge';
import Image from 'next/image';
import React from 'react';

const Scroll = styled.div`
    height: 100%;
    overflow-y: auto;
    padding: 0 1.25rem 2.5rem;
`;

const Paper = styled.article`
    max-width: 42rem;
    margin: 0 auto;
    color: #262626;

    p,
    li {
        font-family: Georgia, 'Times New Roman', serif;
        font-size: 1.15rem;
        line-height: 1.8;
        margin: 0 0 1.25rem;
    }

    h2 {
        font-size: 1.5rem;
        margin: 2.25rem 0 1rem;
    }

    h3 {
        font-size: 1.25rem;
        margin: 1.75rem 0 0.75rem;
    }

    ul,
    ol {
        padding-left: 1.5rem;
        margin: 0 0 1.25rem;
    }

    blockquote {
        margin: 2rem 0;
        padding: 0.25rem 0 0.25rem 1.25rem;
        border-left: 4px solid var(--secondary);
        font-style: italic;

        p {
            font-size: 1.3rem;
        }
    }

    hr {
        border: none;
        border-top: 1px solid #e5e5e5;
        margin: 2rem 0;
    }

    figure {
        margin: 1.75rem 0;
    }

    figure img {
        width: 100%;
        height: auto;
        aspect-ratio: 16 / 9;
        object-fit: cover;
        border-radius: 6px;
    }
`;

const textOnly = (_node: unknown, children: React.ReactNode) => <>{children}</>;

// Sem links: o aluno lê tudo dentro da Plataforma (qualquer link vira texto simples).
const renderOptions: Options = {
    renderNode: {
        [INLINES.HYPERLINK]: textOnly,
        [INLINES.ENTRY_HYPERLINK]: textOnly,
        [INLINES.ASSET_HYPERLINK]: textOnly,
        [INLINES.RESOURCE_HYPERLINK]: textOnly,
        [BLOCKS.HR]: () => <hr />,
    },
};

const renderBody = (nodes: TopLevelBlock[]) =>
    documentToReactComponents({ nodeType: BLOCKS.DOCUMENT, data: {}, content: nodes } as Document, renderOptions);

const ArticleImage = ({
    image,
    fallbackAlt,
}: {
    image?: LinKnowledgeArticle['imagesCollection']['items'][number];
    fallbackAlt: string;
}) =>
    image ? (
        <figure>
            <Image src={image.url} alt={image.description || fallbackAlt} width={image.width} height={image.height} />
        </figure>
    ) : null;

// Um popup aberto por vez: id fixo para o aria-labelledby do modal.
export const METTLE_ARTICLE_TITLE_ID = 'mettle-article-title';

/** Corpo do artigo do Mettle Editor dentro do popup de leitura do LinKnowledge. */
export const MettleArticleReader = ({
    article,
    previous,
    next,
    onNavigate,
}: {
    article: LinKnowledgeArticle;
    previous?: LinKnowledgeArticle;
    next?: LinKnowledgeArticle;
    onNavigate(day: number): void;
}) => {
    const [imageTop, imageMiddle] = article.imagesCollection.items;
    const [firstHalf, secondHalf] = splitAtMiddle<TopLevelBlock>(article.body?.json?.content ?? []);
    const editionDate = formatEditionDate(article.editionDate);

    return (
        // key: ao trocar de dia, o scroll volta ao topo.
        <Scroll key={article.day}>
            <Paper>
                <Typography.Text style={{ color: '#8c8c8c', letterSpacing: 1, textTransform: 'uppercase' }}>
                    Day {article.day} · {GENRE_LABELS[article.genre] ?? article.genre}
                </Typography.Text>
                <Typography.Title id={METTLE_ARTICLE_TITLE_ID} level={2} style={{ marginTop: '0.5rem' }}>
                    {article.title}
                </Typography.Title>
                <Typography.Text style={{ color: '#595959' }}>
                    By {article.author || 'Mettle Editor'}
                    {editionDate && ` · ${editionDate}`} · {readingMinutes(article.wordCount)} min read
                </Typography.Text>

                <ArticleImage image={imageTop} fallbackAlt={article.title} />
                {renderBody(firstHalf)}
                <ArticleImage image={imageMiddle} fallbackAlt={article.title} />
                {renderBody(secondHalf)}

                <Flex justify="space-between" gap="1rem" style={{ marginTop: '2.5rem' }}>
                    {previous ? (
                        <Button icon={<ArrowBackIos fontSize="small" />} onClick={() => onNavigate(previous.day)}>
                            Day {previous.day}
                        </Button>
                    ) : (
                        <span />
                    )}
                    {next && (
                        <Button type="primary" onClick={() => onNavigate(next.day)}>
                            Day {next.day} <ArrowForwardIos fontSize="small" />
                        </Button>
                    )}
                </Flex>
            </Paper>
        </Scroll>
    );
};
