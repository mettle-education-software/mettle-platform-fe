'use client';

import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Col, Drawer, Flex, Row, Typography } from 'antd';
import {
    MobileLessonNavigation,
    LessonResources,
    LessonSummary,
    LessonVideo,
    MaxWidthContainer,
    CourseModulesList,
} from 'components';
import { useGetHpecResources } from 'hooks';
import useGetModulesList from 'hooks/queries/useGetModulesList';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

const { Title, Text } = Typography;

interface LessonMobileProps {
    params: Record<string, string>;
}

const Content = styled.div`
    width: 100%;
    min-height: 100%;
    background: var(--main-bg);
    position: relative;
    padding-top: 1rem;
    padding-bottom: 2rem;
`;

const LessonTabButton = styled.button`
    width: 100%;
    padding: 0.5rem;
    border-radius: 0.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: none;
    background: rgba(183, 144, 96, 0.2);
    color: #fff;
    font-weight: 400;
    font-family: inherit;
    font-size: 1rem;
`;

const LessonView = ({
    onChangeView,
    lessonId,
    courseSlug,
}: {
    onChangeView(): void;
    lessonId: string;
    courseSlug: string;
}) => {
    const [lessonTab, setLessonTab] = useState<'video' | 'summary' | 'resources'>('video');

    const { data } = useGetHpecResources(lessonId);

    const withoutResources = data?.singleLessonCollection?.items[0].lessonResourcesCollection.items.length === 0;

    const { data: courseData } = useGetModulesList(courseSlug);

    const modulesList = courseData?.courseCollection.items[0]?.courseModulesCollection?.items;

    const lessonsList = modulesList ? modulesList.map((module) => module.lessonsCollection.items).flat() : [];

    const lessonIndex = lessonsList.findIndex((lesson: Record<string, string>) => lesson.lessonId === lessonId);

    const router = useRouter();

    const videoTab = () => (
        <Row gutter={[16, 24]}>
            <Col span={24}>
                <LessonVideo lessonId={lessonId} />
            </Col>
            <Col span={24}>
                <Row gutter={[16, 8]}>
                    <Col span={24}>
                        <LessonTabButton
                            onClick={() => {
                                setLessonTab('summary');
                            }}
                        >
                            Summary <RightOutlined />
                        </LessonTabButton>
                    </Col>
                    {!withoutResources && (
                        <Col span={24}>
                            <LessonTabButton
                                onClick={() => {
                                    setLessonTab('resources');
                                }}
                            >
                                Resources <RightOutlined />
                            </LessonTabButton>
                        </Col>
                    )}
                </Row>
            </Col>
        </Row>
    );

    const returnRow = (type: string) => (
        <Row gutter={[16, 8]}>
            <Col span={24}>
                <Flex justify="flex-end">
                    <Title level={5} className="color-white">
                        {data?.singleLessonCollection?.items[0].lessonTitle}
                    </Title>
                </Flex>
            </Col>
            <Col span={24}>
                <Flex justify="space-between">
                    <button
                        style={{ color: 'white', border: 'none', background: 'none' }}
                        onClick={() => {
                            setLessonTab('video');
                        }}
                        onFocus={() => {}}
                    >
                        <Text className="color-white">
                            <LeftOutlined style={{ marginRight: '0.5rem' }} />
                            Back
                        </Text>
                    </button>

                    <Text className="color-white">{type}</Text>
                </Flex>
            </Col>
        </Row>
    );

    const summaryTab = () => (
        <Flex vertical gap={16}>
            {returnRow('Summary')}
            <LessonSummary lessonId={lessonId} />
        </Flex>
    );

    const resourcesTab = () => (
        <Flex vertical gap={16}>
            {returnRow('Resources')}
            <LessonResources lessonId={lessonId} />
        </Flex>
    );

    return (
        <>
            <MaxWidthContainer>
                {lessonTab === 'video' && videoTab()}
                {lessonTab === 'summary' && summaryTab()}
                {lessonTab === 'resources' && resourcesTab()}
            </MaxWidthContainer>
            <div style={{ position: 'absolute', bottom: 0, width: '100%' }}>
                <MobileLessonNavigation
                    onChangeView={() => {
                        onChangeView();
                        setLessonTab('video');
                    }}
                    onNext={() => {
                        const nextLesson = lessonsList[lessonIndex + 1].lessonId;
                        router.push(`/course/${courseSlug}/${nextLesson}`);
                    }}
                    onPrevious={() => {
                        const previousLesson = lessonsList[lessonIndex - 1].lessonId;
                        router.push(`/course/${courseSlug}/${previousLesson}`);
                    }}
                    firstItem={lessonIndex === 0}
                    lastItem={lessonIndex === lessonsList.length - 1}
                />
            </div>
        </>
    );
};

export const LessonMobile: React.FC<LessonMobileProps> = ({ params: { lessonId, moduleId, courseSlug } }) => {
    const [viewMode, setViewMode] = useState<'list' | 'lesson'>('lesson');

    const [activeLessonId, setActiveLessonId] = useState<string>(lessonId);

    const onModuleFirstLesson = (firsLessonId: string) => {
        if (lessonId === 'first-lesson') {
            setActiveLessonId(firsLessonId);
        }
    };

    return (
        <Content>
            <LessonView
                lessonId={activeLessonId}
                onChangeView={() => {
                    setViewMode('list');
                }}
                courseSlug={courseSlug}
            />
            <Drawer
                open={viewMode === 'list'}
                onClose={() => setViewMode('lesson')}
                maskClosable
                placement="bottom"
                size="large"
                style={{ background: 'var(--main-bg)' }}
            >
                <CourseModulesList
                    activeLessonId={activeLessonId}
                    courseSlug={courseSlug}
                    activeModuleId={moduleId}
                    onModuleFirstLesson={onModuleFirstLesson}
                />
            </Drawer>
        </Content>
    );
};
