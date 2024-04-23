'use client';

import Icon, { FileTextOutlined, HomeOutlined, SpotifyOutlined, YoutubeOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Tabs, TabsProps } from 'antd';
import { RichTextRenderer } from 'components';
import Article from 'components/molecules/article';
import Chip from 'components/molecules/chip';
import Video from 'components/molecules/video';
import { useDeda } from 'hooks';
import React, { CSSProperties, useState } from 'react';
import { largeAndBigger } from 'styles/media.constants';

const Content = styled.div`
    min-height: 100vh;
`;

const ContentTabs = styled(Tabs)`
    .ant-tabs-nav-list {
        justify-content: space-between;
        width: 100vw;
    }

    .ant-tabs-tab {
        display: flex;
        flex: 1 0 0;
        justify-content: center;
        margin: 0;
        color: var(--white);
    }

    .ant-tabs-tab-active {
        color: var(--brown-light);
    }
`;

const HeaderImage = styled.div`
    height: 6.25rem;
    ${largeAndBigger} {
        height: 15.375rem;
    }
`;

function Page({ params }: { params: { id: string } }) {
    const [tabIndex, setTabIndex] = useState(0);
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
            children: DedaNotes(deda, [tabIndex, setTabIndex]),
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
            <ContentTabs defaultActiveKey="deda-notes" items={items} />
        </Content>
    );
}

function DedaNotes(deda: any, tabs: [number, React.Dispatch<React.SetStateAction<number>>]) {
    const tabIndex = 0;
    const setTabIndex = 1;

    const Container = styled.div``;

    const DedaNotesTabs = styled.div`
        display: flex;
        background-color: var(--grey-light);
        justify-content: space-between;
        .active {
            background: rgba(60, 54, 47, 0.15);
        }
    `;

    const DedaNotesTab = styled.div`
        border-right: 1px solid var(--brown-main);
        border-left: 1px solid var(--brown-main);
        display: flex;
        flex: 1 0 0;
        gap: 0.25rem;
        padding: 0.75rem 0.5rem;
    `;

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

    const LinKnowledgedTopBar = styled.div`
        display: flex;
        gap: 1rem;
        padding: 0.5rem 0.75rem;
    `;

    const Articles = styled.div`
        display: flex;
        flex-direction: column;
        background-color: var(--brown-dark);
        align-items: flex-start;
        gap: 1.5rem;
    `;

    const Videos = styled.div`
        display: flex;
        flex-direction: column;
        background-color: var(--brown-dark);
        align-items: flex-start;
        gap: 1.5rem;
    `;

    const Podcasts = styled.div`
        display: flex;
        flex-direction: column;
        background-color: var(--brown-dark);
        align-items: flex-start;
        gap: 1.5rem;
    `;

    const bookmark_outline = () => <img src={'/bookmark-outline.svg'} alt={'bookmark'} />;

    const head_snowflake_outline = () => <img src={'/head-snowflake-outline.svg'} alt={'head-snowflake'} />;

    const onClick = (index: number) => {
        tabs[setTabIndex](index);
    };

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
            icon: <HomeOutlined />,
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
            icon: <Icon component={bookmark_outline} />,
        },
        {
            key: 'link-knowledged',
            label: 'LinKnowledged',
            children: (
                <LinKnowledged>
                    <LinKnowledgedTopBar>
                        <Chip
                            text={'Articles'}
                            color={'var(--white)'}
                            background={'var(--brown-light)'}
                            border={'1px solid var(--chip-border-color)'}
                            icon={FileTextOutlined}
                        />
                        <Chip
                            text={'Videos'}
                            color={'var(--white)'}
                            background={'var(--brown-light)'}
                            border={'1px solid var(--chip-border-color)'}
                            icon={YoutubeOutlined}
                        />
                        <Chip
                            text={'Podcasts'}
                            color={'var(--white)'}
                            background={'var(--brown-light)'}
                            border={'1px solid var(--chip-border-color)'}
                            icon={SpotifyOutlined}
                        />
                    </LinKnowledgedTopBar>
                    <Articles>
                        {deda.dedaNotesArticlesLinksCollection.items.map((item: any, index: number) => (
                            <Article
                                key={`article-${index}`}
                                text={item.magicLinkLabel}
                                link={item.magicLinkUrl}
                                image={''}
                                day={index + 1}
                            />
                        ))}
                    </Articles>
                    <Videos>
                        {deda.dedaNotesVideosLinksCollection.items.map((item: any, index: number) => (
                            <Video
                                key={`article-${index}`}
                                text={item.magicLinkLabel}
                                link={item.magicLinkUrl}
                                day={index + 1}
                            />
                        ))}
                    </Videos>
                    <Podcasts></Podcasts>
                </LinKnowledged>
            ),
            icon: <Icon component={head_snowflake_outline} />,
        },
    ];
    return (
        <Container>
            <DedaNotesTabs>
                {items.map((item, index) => (
                    <DedaNotesTab key={index} onClick={() => onClick(index)}>
                        {item.icon}
                        {item.label}
                    </DedaNotesTab>
                ))}
            </DedaNotesTabs>
            {items[tabs[tabIndex]].children}
        </Container>
    );
}

export default Page;
