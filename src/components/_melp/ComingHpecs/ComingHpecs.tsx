'use client';

import styled from '@emotion/styled';
import { Card, Col, Flex, Row, Typography } from 'antd';
import { useGetHpecsModules } from 'hooks';
import Link from 'next/link';
import React from 'react';

const { Text, Title } = Typography;

interface ComingHpecsProps {
    withStartHere?: boolean;
}

const ComingHpecsContainer = styled.div`
    width: 100%;
`;

const StartHere = styled(Card)`
    background: var(--brown-bg);
    border: none;
`;

const ComingNextCarousel = styled.div`
    max-width: 100%;
    width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    position: relative;
`;

const VideoThumbCard = styled(Card)`
    min-height: 10rem;
    aspect-ratio: 16 / 9;
    border: none;
    background-size: contain;
`;

const VideoThumbnail: React.FC<{
    title: React.ReactNode;
    link: string;
    description?: string;
    vimeoId: string;
    moduleOrder: number;
}> = ({ title, link, description, vimeoId }) => {
    return (
        <Flex vertical gap="1rem">
            <Link href={link}>
                <VideoThumbCard
                    hoverable
                    style={{
                        background: `linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, #000 100%), url("https://vumbnail.com/${vimeoId}.jpg") lightgray 0px 0px 100% 100% no-repeat`,
                    }}
                ></VideoThumbCard>
            </Link>
            {description ? <Text className="color-white">{description}</Text> : title}
        </Flex>
    );
};

export const ComingHpecs: React.FC<ComingHpecsProps> = ({ withStartHere = false }) => {
    const { unlockedModules, lockedModules, unlockedLessons, totalLessons, progressCount, loading } =
        useGetHpecsModules();

    if (loading || unlockedModules.length === 0) return 'loading...';

    const lastModule = unlockedModules[unlockedModules.length - 1];

    const lastModuleItems = lastModule?.hpecLessonsCollection.items;

    const firstModuleLesson = lastModuleItems[0];

    return (
        <ComingHpecsContainer>
            <Row gutter={[16, 16]}>
                <Col xs={24} md={6}>
                    <StartHere>
                        <Card.Meta
                            style={{ marginBottom: '1rem' }}
                            title={<Text className="color-secondary">Start here</Text>}
                        />
                        <VideoThumbnail
                            moduleOrder={lastModule?.moduleOrder}
                            title={firstModuleLesson?.lessonTitle}
                            link={`/melp/hpec/${lastModule?.hpecId}/${firstModuleLesson?.lessonId}`}
                            vimeoId={firstModuleLesson.lessonVideoEmbedUrl.split('/').pop() as string}
                            description={firstModuleLesson?.lessonFeaturedText}
                        />
                    </StartHere>
                </Col>
                <Col xs={24} md={18}>
                    <Card
                        style={{ background: 'transparent', border: 'none', width: '100%' }}
                        styles={{
                            body: { paddingRight: 0 },
                        }}
                    >
                        <Card.Meta
                            style={{ marginBottom: '1rem' }}
                            title={<Text className="color-secondary">Watch next...</Text>}
                        />
                        <ComingNextCarousel>
                            <Row gutter={[16, 16]} wrap={false}>
                                {lastModuleItems?.slice(1)?.map((lesson) => (
                                    <Col key={lesson.lessonId}>
                                        <VideoThumbnail
                                            moduleOrder={lastModule?.moduleOrder}
                                            title={lesson.lessonTitle}
                                            link={`/melp/hpec/${lastModule?.hpecId}/${lesson.lessonId}`}
                                            vimeoId={lesson.lessonVideoEmbedUrl.split('/').pop() as string}
                                        />
                                    </Col>
                                ))}
                            </Row>
                        </ComingNextCarousel>
                    </Card>
                </Col>
            </Row>
        </ComingHpecsContainer>
    );
};
