'use client';

import { documentToReactComponents, Options } from '@contentful/rich-text-react-renderer';
import { BLOCKS, Document, INLINES, TopLevelBlock } from '@contentful/rich-text-types';
import styled from '@emotion/styled';
import { ArrowBackIos, ArrowForwardIos } from '@mui/icons-material';
import { Button, Flex, Skeleton, Typography } from 'antd';
import { MaxWidthContainer, withRoles } from 'components';
import { AppLayout } from 'components/layouts';
import { LinKnowledgeArticle, useLinKnowledgeEdition } from 'hooks/queries/dedaQueries';
import { withAuthentication } from 'libs';
import { withDedaSlug } from 'libs/authentication/withDedaSlug';
import { withDedaUnlocked } from 'libs/authentication/withDedaUnlocked';
import { dedaPath } from 'libs/cleanUrls';
import {
    formatEditionDate,
    GENRE_LABELS,
    linKnowledgeArticlePath,
    readingMinutes,
    splitAtMiddle,
} from 'libs/linknowledge';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import React from 'react';

const Page = styled.section`
    width: 100%;
    background: #2b2b2b;
    padding: 2rem 1rem 4rem;
`;

const Paper = styled.article`
    max-width: 44rem;
    margin: 0 auto;
    background: #ffffff;
    border-radius: 6px;
    padding: 2.5rem clamp(1.25rem, 5vw, 3.5rem) 3rem;
    color: #262626;

    p,
    li {
        font-size: 1.125rem;
        line-height: 1.8;
        margin: 0 0 1.25rem;
    }

    h2 {
        font-size: 1.6rem;
        margin: 2.25rem 0 1rem;
    }

    h3 {
        font-size: 1.3rem;
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
        margin: 2rem 0;
    }

    figure img {
        width: 100%;
        height: auto;
        border-radius: 6px;
    }
`;

// Sem links: o aluno lê tudo dentro da Plataforma (hyperlink vira texto simples).
const renderOptions: Options = {
    renderNode: {
        [INLINES.HYPERLINK]: (_node, children) => <>{children}</>,
        [INLINES.ENTRY_HYPERLINK]: (_node, children) => <>{children}</>,
        [INLINES.ASSET_HYPERLINK]: (_node, children) => <>{children}</>,
        [INLINES.RESOURCE_HYPERLINK]: (_node, children) => <>{children}</>,
        [BLOCKS.HR]: () => <hr />,
    },
};

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

const renderBody = (nodes: TopLevelBlock[]) =>
    documentToReactComponents({ nodeType: BLOCKS.DOCUMENT, data: {}, content: nodes } as Document, renderOptions);

function LinKnowledgeReader({ params: { dedaId, day } }: { params: { dedaId: string; day: string } }) {
    const { data, loading, error } = useLinKnowledgeEdition(dedaId);
    const deda = data?.dedaContentCollection.items[0];
    const articles = (deda?.dedaLinKnowledgeArticlesCollection?.items ?? [])
        .filter((article): article is LinKnowledgeArticle => !!article)
        .sort((a, b) => a.day - b.day);
    const index = articles.findIndex((article) => String(article.day) === day);
    const article = articles[index];

    if (!loading && (error || !article)) notFound();
    if (!deda || !article) {
        return (
            <AppLayout withMelpSummary>
                <Page>
                    <Paper>
                        <Skeleton active paragraph={{ rows: 12 }} />
                    </Paper>
                </Page>
            </AppLayout>
        );
    }

    const [imageTop, imageMiddle] = article.imagesCollection.items;
    const [firstHalf, secondHalf] = splitAtMiddle<TopLevelBlock>(article.body?.json?.content ?? []);
    const previous = articles[index - 1];
    const next = articles[index + 1];
    const editionDate = formatEditionDate(article.editionDate);

    return (
        <AppLayout withMelpSummary>
            <Page>
                <MaxWidthContainer style={{ maxWidth: '44rem', margin: '0 auto 1rem' }}>
                    <Link href={dedaPath(deda.dedaSlug)} style={{ color: 'var(--secondary)' }}>
                        ← {deda.dedaTitle} · LinKnowledge
                    </Link>
                </MaxWidthContainer>
                <Paper>
                    <Typography.Text style={{ color: '#8c8c8c', letterSpacing: 1, textTransform: 'uppercase' }}>
                        Day {article.day} · {GENRE_LABELS[article.genre] ?? article.genre}
                    </Typography.Text>
                    <Typography.Title level={1} style={{ marginTop: '0.5rem' }}>
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
                            <Link href={linKnowledgeArticlePath(deda.dedaSlug, previous.day)}>
                                <Button icon={<ArrowBackIos fontSize="small" />}>Day {previous.day}</Button>
                            </Link>
                        ) : (
                            <span />
                        )}
                        {next && (
                            <Link href={linKnowledgeArticlePath(deda.dedaSlug, next.day)}>
                                <Button type="primary">
                                    Day {next.day} <ArrowForwardIos fontSize="small" />
                                </Button>
                            </Link>
                        )}
                    </Flex>
                </Paper>
            </Page>
        </AppLayout>
    );
}

const LinKnowledgeReaderWithRoles = withRoles(LinKnowledgeReader, {
    roles: ['METTLE_STUDENT', 'METTLE_ADMIN'],
    fallback: {
        type: 'redirect',
        to: '/',
    },
});

export default withAuthentication(withDedaSlug(withDedaUnlocked(LinKnowledgeReaderWithRoles)));
