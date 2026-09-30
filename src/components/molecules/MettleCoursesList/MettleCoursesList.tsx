'use client';

import { Row, Col, Skeleton } from 'antd';
import { useGetCourses } from 'hooks';
import { IMERSO_PRODUCT, IMERSO_SALES_URL } from 'libs/productAccess';
import { useProductAccess } from 'providers';
import React from 'react';
import { CourseCard } from '../../atoms';

export const MettleCoursesList: React.FC = () => {
    const { access, openCta } = useProductAccess();
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

    const imersoState = access(IMERSO_PRODUCT).state;
    const isImersoLocked = imersoState === 'none';

    return (
        <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
                <CourseCard
                    imgUrl={'/img/imerso_thumb.webp'}
                    title="IMERSO"
                    type="Programa"
                    href={isImersoLocked ? IMERSO_SALES_URL : '/imerso'}
                    isLocked={isImersoLocked}
                    isExpired={imersoState === 'expired'}
                    onClick={() => openCta({ product: IMERSO_PRODUCT })}
                />
            </Col>
            {courseList
                ?.slice()
                ?.sort((course) => {
                    const state = access(course?.coursePurchaseId).state;
                    const isLocked = state === 'none';
                    return isLocked ? 1 : -1;
                })
                ?.map((course) => {
                    const state = access(course?.coursePurchaseId).state;
                    const isLocked = state === 'none';

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
                                isExpired={state === 'expired'}
                                onClick={() =>
                                    openCta({
                                        product: course.coursePurchaseId,
                                        name: course.courseTitle,
                                        renewUrl: course.paymentCheckout,
                                    })
                                }
                            />
                        </Col>
                    );
                })}
        </Row>
    );
};
