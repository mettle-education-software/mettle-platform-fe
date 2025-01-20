'use client';

import styled from '@emotion/styled';
import { Col, Flex, Row, Typography } from 'antd';
import {
    AppLayout,
    withRoles,
    MaxWidthContainer,
    LoadingLayout,
    LessonVideo,
    LessonSummary,
    LessonResources,
    TabNav,
    CourseModulesList,
    LessonMobile,
} from 'components';
import { useDeviceSize, useGetCourseDetails } from 'hooks';
import useGetLessonContent from 'hooks/queries/useGetLessonContent';
import { withAuthentication } from 'libs';
import { useRouter } from 'next/navigation';
import { useAppContext } from 'providers';
import React, { useState } from 'react';

const { Title } = Typography;

interface LessonProps {
    params: Record<string, string>;
}

const Header = styled.div`
    width: 100%;
    padding: 1.8rem 0;
    display: flex;
    justify-content: center;
    background:
        linear-gradient(180deg, rgba(0, 0, 0, 0.6) 0%, #2b2b2b 100%),
        url('/img/hpec-bg.webp') lightgray 50% / cover no-repeat;
    background-blend-mode: normal, luminosity;
`;

const LessonSection = styled.section`
    width: 100%;
    min-height: 100%;
    padding-bottom: 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: #2b2b2b;
`;

const Lesson: React.FC<LessonProps> = ({ params: { courseSlug, lessonId } }) => {
    const { data: lessonData, loading: lessonLoading, error: lessonError } = useGetLessonContent(lessonId);
    const { data: courseDetails, loading: courseLoading, error: courseError } = useGetCourseDetails(courseSlug);

    const router = useRouter();
    const { user } = useAppContext();
    const [emptyVideo, setEmptyVideo] = useState(false);
    const device = useDeviceSize();

    if (lessonLoading || courseLoading) return <LoadingLayout />;

    if (lessonError || courseError) throw new Error(lessonError?.message ?? courseError?.message);

    // temporary solution for permission to access
    if (
        !!user &&
        !!courseDetails &&
        !user?.roles.includes(courseDetails?.courseCollection?.items[0]?.coursePurchaseId)
    ) {
        router.push('/403');
        return null;
    }

    const lesson = lessonData?.singleLessonCollection?.items[0];

    const activeModuleId = courseDetails?.courseCollection?.items[0].courseModulesCollection.items?.find(
        (module) => !!module.lessonsCollection.items.find((lesson) => lesson.lessonId === lessonId),
    )?.moduleId as string;

    if (device === 'mobile')
        return (
            <AppLayout>
                <LessonMobile
                    params={{
                        lessonId: lessonId,
                        courseSlug: courseSlug,
                        moduleId: activeModuleId,
                    }}
                />
            </AppLayout>
        );

    return (
        <AppLayout>
            <Header>
                <MaxWidthContainer>
                    <Flex vertical gap="0.2rem">
                        <Title level={1} className="color-secondary">
                            {lesson?.lessonTitle}
                        </Title>
                    </Flex>
                </MaxWidthContainer>
            </Header>
            <LessonSection>
                <MaxWidthContainer>
                    <Row gutter={[16, 16]}>
                        <Col span={6}>
                            <CourseModulesList
                                activeLessonId={lessonId}
                                courseSlug={courseSlug}
                                activeModuleId={
                                    courseDetails?.courseCollection?.items[0].courseModulesCollection.items?.find(
                                        (module) =>
                                            !!module.lessonsCollection.items.find(
                                                (lesson) => lesson.lessonId === lessonId,
                                            ),
                                    )?.moduleId as string
                                }
                                onModuleFirstLesson={() => null}
                            />
                        </Col>
                        <Col span={18}>
                            <TabNav
                                items={[
                                    ...(emptyVideo
                                        ? []
                                        : [
                                              {
                                                  key: 'video',
                                                  label: 'Vídeo',
                                                  children: (
                                                      <LessonVideo
                                                          lessonId={lessonId}
                                                          onEmptyVideo={() => {
                                                              setEmptyVideo(true);
                                                          }}
                                                      />
                                                  ),
                                              },
                                          ]),
                                    {
                                        key: 'summary',
                                        label: 'Texto',
                                        children: <LessonSummary lessonId={lessonId} />,
                                    },
                                    {
                                        key: 'resources',
                                        label: 'Material',
                                        children: <LessonResources lessonId={lessonId} />,
                                        disabled:
                                            lessonData?.singleLessonCollection?.items[0].lessonResourcesCollection
                                                ?.items.length === 0 ||
                                            !lessonData?.singleLessonCollection?.items[0].lessonResourcesCollection,
                                    },
                                ]}
                            />
                        </Col>
                    </Row>
                </MaxWidthContainer>
            </LessonSection>
        </AppLayout>
    );
};

export default withAuthentication(Lesson);
