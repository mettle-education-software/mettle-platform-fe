'use client';

import styled from '@emotion/styled';
import { Col, Flex, Row, Typography } from 'antd';
import {
    AppLayout,
    CourseModulesList,
    LessonMobile,
    LessonResources,
    LessonSummary,
    LessonVideo,
    LoadingLayout,
    MaxWidthContainer,
    TabNav,
} from 'components';
import { useDeviceSize, useGetCourseDetails } from 'hooks';
import useGetLessonContent from 'hooks/queries/useGetLessonContent';
import { useNewDesign } from 'hooks/useNewDesign';
import { withAuthentication } from 'libs';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { AccessCtaBlock, useAppContext, useProductAccess } from 'providers';
import React, { useState } from 'react';

// Aula de curso no molde de cursos da plataforma nova (libs/newDesign), só para as contas da lista: fora do bundle dos alunos.
const NewCourseLesson = dynamic(() => import('components/_new/NewCourseLesson'), { ssr: false, loading: () => null });

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
    const { access, levelsLoading } = useProductAccess();
    const [emptyVideo, setEmptyVideo] = useState(false);
    const device = useDeviceSize();
    const newDesign = useNewDesign();

    if (lessonLoading || courseLoading) return <LoadingLayout />;

    if (lessonError || courseError) throw new Error(lessonError?.message ?? courseError?.message);

    const course = courseDetails?.courseCollection?.items[0];
    const courseState = course ? access(course.coursePurchaseId).state : 'none';

    // temporary solution for permission to access (plataforma nova: depois do /accounts/me, quando é ele quem decide)
    if (!!user && !!course && courseState === 'none' && !levelsLoading) {
        router.push('/403');
        return null;
    }

    // plataforma nova: a aula mostra a renovação no lugar do conteúdo (NewCourseLesson)
    if (!!course && courseState === 'expired' && !newDesign) {
        return (
            <AppLayout>
                <AccessCtaBlock
                    target={{
                        product: course.coursePurchaseId,
                        name: course.courseTitle,
                        renewUrl: course.paymentCheckout,
                    }}
                />
            </AppLayout>
        );
    }

    if (newDesign)
        return (
            <AppLayout>
                <NewCourseLesson courseSlug={courseSlug} lessonId={lessonId} />
            </AppLayout>
        );

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
                                                ?.items?.length === 0,
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
