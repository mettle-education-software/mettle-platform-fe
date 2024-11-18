'use client';

import { FileTextFilled, PlayCircleFilled, SpotifyFilled } from '@ant-design/icons';
import styled from '@emotion/styled';
import { ArrowBackIos, ArrowForwardIos } from '@mui/icons-material';
import { Button, Card as AntCard, Flex, Skeleton, Typography } from 'antd';
import { ArticleFrame, MaxWidthContainer, VideoFrame } from 'components';
import { useDeda } from 'hooks/queries/dedaQueries';
import { DedaNotesQueryResponse } from 'interfaces';
import { padding, SMALL_VIEWPORT } from 'libs';
import React, { useMemo, useRef } from 'react';
import { PodcastFrame } from '../../../PodcastFrame/PodcastFrame';

const LinKnowledgeContainer = styled.div`
    background: #2b2b2b;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: ${padding.y.sm} ${padding.x.lg};
    position: relative;
    z-index: 0;

    @media (max-width: ${SMALL_VIEWPORT}px) {
        padding: ${padding.y.sm} 0;
    }
`;

const MainFlexColumn = styled(Flex)`
    @media (max-width: ${SMALL_VIEWPORT}px) {
        width: 100%;
    }
`;

const Card = styled(AntCard)`
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.03);

    .ant-card-head {
        border: none;
    }

    & h4 {
        color: white;
        font-weight: 700;
    }
`;

const CarouselScrollableContent = styled.div`
    max-width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    scroll-behavior: smooth;
`;

const PodcastRow = styled.div`
    display: flex;
    flex-wrap: nowrap;
    gap: 1rem;
    align-items: center;
    justify-content: flex-start;

    @media (max-width: ${SMALL_VIEWPORT}px) {
        flex-direction: column;
    }
`;

const ArticlesRow = styled.div`
    display: flex;
    flex-wrap: nowrap;
    gap: 1rem;
    align-items: flex-start;
    justify-content: flex-start;
    padding-bottom: 1rem;
`;

const CarouselCard = ({
    title,
    hideScroll = false,
    children,
}: {
    title: React.ReactNode;
    hideScroll?: boolean;
    children: React.ReactNode;
}) => {
    const scrollableContentRef = useRef<HTMLDivElement>(null);

    const handleScrollLeft = () => {
        if (scrollableContentRef.current) {
            scrollableContentRef.current.scrollLeft -= 200;
        }
    };

    const handleScrollRight = () => {
        if (scrollableContentRef.current) {
            scrollableContentRef.current.scrollLeft += 200;
        }
    };

    return (
        <Card
            title={title}
            extra={
                hideScroll ? undefined : (
                    <Flex>
                        <Button onClick={handleScrollLeft} style={{ border: 'none' }} ghost icon={<ArrowBackIos />} />
                        <Button
                            onClick={handleScrollRight}
                            style={{ border: 'none' }}
                            ghost
                            icon={<ArrowForwardIos />}
                        />
                    </Flex>
                )
            }
        >
            <CarouselScrollableContent ref={scrollableContentRef}>{children}</CarouselScrollableContent>
        </Card>
    );
};

const CarouselTitle = styled(Typography.Title)`
    font-weight: 500 !important;
`;

export const LinKnowledge = ({ dedaId }: { dedaId: string }) => {
    const dedaNotesResult = useDeda<DedaNotesQueryResponse>('deda-notes', dedaId);
    const dedaNotesContent = useMemo(() => dedaNotesResult?.data?.dedaContentCollection?.items[0], [dedaNotesResult]);

    if (!dedaNotesContent)
        return (
            <MaxWidthContainer>
                <Skeleton active paragraph />
            </MaxWidthContainer>
        );

    const articles = dedaNotesContent.dedaNotesArticlesLinksCollection?.items.map(
        ({ magicLinkLabel, magicLinkUrl }) => ({
            title: magicLinkLabel,
            href: magicLinkUrl,
        }),
    );
    const videos = dedaNotesContent.dedaNotesVideosLinksCollection.items.map(({ magicLinkLabel, magicLinkUrl }) => ({
        title: magicLinkLabel,
        href: magicLinkUrl,
    }));
    const podcasts = dedaNotesContent.dedaNotesPodcasts;

    return (
        <LinKnowledgeContainer>
            <MaxWidthContainer>
                <MainFlexColumn vertical align="stretch" gap="1.5rem">
                    <CarouselCard
                        title={
                            <CarouselTitle level={4}>
                                <FileTextFilled /> Articles
                            </CarouselTitle>
                        }
                    >
                        <ArticlesRow>
                            {articles.map(({ title, href }) => (
                                <div key={href}>
                                    <ArticleFrame title={title} href={href} />
                                </div>
                            ))}
                        </ArticlesRow>
                    </CarouselCard>
                    <CarouselCard
                        title={
                            <CarouselTitle level={4}>
                                <PlayCircleFilled /> Videos
                            </CarouselTitle>
                        }
                    >
                        <ArticlesRow>
                            {videos.map(({ title, href }) => (
                                <div key={href}>
                                    <VideoFrame title={title} videoSrc={href} />
                                </div>
                            ))}
                        </ArticlesRow>
                    </CarouselCard>
                    <CarouselCard
                        hideScroll
                        title={
                            <CarouselTitle level={4}>
                                <SpotifyFilled /> Podcasts
                            </CarouselTitle>
                        }
                    >
                        <PodcastRow>
                            {podcasts.map((podcastSrc) => (
                                <div style={{ flexGrow: 1 }} key={podcastSrc}>
                                    <PodcastFrame src={podcastSrc} />
                                </div>
                            ))}
                        </PodcastRow>
                    </CarouselCard>
                </MainFlexColumn>
            </MaxWidthContainer>
        </LinKnowledgeContainer>
    );
};
