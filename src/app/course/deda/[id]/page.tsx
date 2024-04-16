'use client';

import styled from '@emotion/styled';
import { Tabs, TabsProps } from 'antd';
import { RichTextRenderer } from 'components';
import Article from 'components/molecules/article';
import { useDeda } from 'hooks';
import { CSSProperties } from 'react';
import { largeAndBigger } from 'styles/media.constants';

const Content = styled.div`
    min-height: 100vh;
`;

const HeaderImage = styled.div`
    height: 6.25rem;
    ${largeAndBigger} {
        height: 15.375rem;
    }
`;

function Page({ params }: { params: { id: string } }) {
    const dedaData = useDeda('deda-notes', params.id);
    if (!dedaData) {
        return null;
    }
    const { data } = dedaData;
    if (!data) {
        return null;
    }

    const { dedaContentCollection: collection } = data;
    const deda = collection.items[0];

    const headerImageStyle: CSSProperties = {
        background: `linear-gradient(180deg, rgba(0, 0, 0, 0.00) 0%, #2B2B2B 87.55%), url(${deda.dedaFeaturedImage.url}) lightgray 50% / cover no-repeat`,
    };

    const items: TabsProps['items'] = [
        {
            key: 'deda-notes',
            label: 'DEDA Notes',
            children: DedaNotes(deda),
        },
        {
            key: 'deda',
            label: 'DEDA',
            children: 'Content of Tab Pane 2',
        },
        {
            key: 'review',
            label: 'Review',
            children: 'Content of Tab Pane 3',
        },
    ];

    return (
        <Content>
            <HeaderImage style={headerImageStyle} />
            <Tabs defaultActiveKey="deda-notes" items={items} />
        </Content>
    );
}

function DedaNotes(deda: any) {
    const Container = styled.div``;
    const Introduction = styled.div`
        padding: 1.125rem 1rem;
        background-color: #fff;
        text-wrap: wrap;
        ${largeAndBigger} {
            padding: 2.5rem 12.5rem;
        }
    `;
    const Glossary = styled.div`
        padding: 1.125rem 1rem;
        background-color: #fff;
        text-wrap: wrap;
        ${largeAndBigger} {
            padding: 1.125rem 12.5rem;
        }
    `;
    const LinKnowledged = styled.div`
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
        align-self: stretch;
        padding: 0 0.75rem;
    `;

    const Articles = styled.div`
        display: flex;
        flex-direction: column;
        background-color: var(--brown-dark);
        align-items: flex-start;
        gap: 1.5rem;
    `;

    const items: TabsProps['items'] = [
        {
            key: 'introduction',
            label: 'Introduction',
            children: (
                <Introduction>
                    <RichTextRenderer
                        rawContent={deda.dedaNotesIntroductionContent.json}
                        links={deda.dedaNotesIntroductionContent.links}
                    />
                </Introduction>
            ),
        },
        {
            key: 'glossary',
            label: 'Glossary',
            children: (
                <Glossary>
                    <RichTextRenderer
                        rawContent={deda.dedaNotesGlossaryContent.json}
                        links={deda.dedaNotesGlossaryContent.links}
                    />
                </Glossary>
            ),
        },
        {
            key: 'link-knowledged',
            label: 'LinKnowledged',
            children: (
                <LinKnowledged>
                    <Articles>
                        {deda.dedaNotesArticlesLinksCollection.items.map((item: any, index: number) => (
                            <Article
                                key={`article-${index}`}
                                text={item.magicLinkLabel}
                                link={item.magicLinkUrl}
                                image=""
                                day={index + 1}
                            />
                        ))}
                    </Articles>
                </LinKnowledged>
            ),
        },
    ];
    return (
        <Container>
            <Tabs defaultActiveKey="deda-notes" items={items} />
        </Container>
    );
}

export default Page;
