'use client';

import { Row, Col, Skeleton } from 'antd';
import { useGetCourses } from 'hooks';
import { useAppContext } from 'providers';
import React from 'react';
import { CourseCard } from '../../atoms';

export const MettleCoursesList: React.FC = () => {
    const { user } = useAppContext();
    const { data, loading, error } = useGetCourses();

    if (loading) {
        return (
            <Row gutter={[8, 16]} style={{ minHeight: '15rem' }} justify="start">
                <Col xs={24} md={6}>
                    <div style={{ width: '100%', height: '100%' }}>
                        <Skeleton.Image style={{ minWidth: '19rem', minHeight: '14rem' }} active />
                    </div>
                </Col>
                <Col xs={24} md={6}>
                    <Skeleton.Image style={{ minWidth: '19rem', minHeight: '14rem' }} active />
                </Col>
                <Col xs={24} md={6}>
                    <Skeleton.Image style={{ minWidth: '19rem', minHeight: '14rem' }} active />
                </Col>
            </Row>
        );
    }

    if (error) {
        return <div>error</div>;
    }

    const courseList = data?.courseCollection.items;

    const isImersoLocked = !user || !user?.roles.includes('METTLE_STUDENT');

    return (
        <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
                <CourseCard
                    imgUrl={'/img/imerso_thumb.webp'}
                    title="IMERSO"
                    type="Programa"
                    href={isImersoLocked ? 'https://mettle.com.br' : '/imerso'}
                    isLocked={isImersoLocked}
                />
            </Col>
            {courseList
                ?.slice()
                ?.sort((course) => {
                    const isLocked = !user?.roles.includes(course?.coursePurchaseId);
                    return isLocked ? 1 : -1;
                })
                ?.map((course) => {
                    const isLocked = !user?.roles.includes(course?.coursePurchaseId);

                    const href = isLocked
                        ? course.paymentCheckout
                        : `/course/${course.courseSlug}/${
                              course.courseModulesCollection.items[0].lessonsCollection.items[0].lessonId
                          }`;

                    return (
                        <Col xs={24} sm={12} md={6} key={course.courseSlug}>
                            <CourseCard
                                imgUrl={course.courseFeaturedImage.url}
                                title={course.courseTitle}
                                type={course.courseCategory}
                                href={href}
                                isLocked={isLocked}
                            />
                        </Col>
                    );
                })}
        </Row>
    );
};
