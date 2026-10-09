'use client';

import { Row, Col, Skeleton } from 'antd';
import { useGetCourses } from 'hooks';
import { MASTERCLASS_COURSE, MASTERCLASS_SALES_URL } from 'libs/masterclass';
import { IMERSO_PRODUCT, imersoSalesUrl } from 'libs/productAccess';
import { CtaTarget, useProductAccess } from 'providers';
import React from 'react';
import { CourseCard } from '../../atoms';

export interface CourseCardData {
    key: string;
    imgUrl: string;
    title: string;
    type: string;
    href: string;
    isLocked: boolean;
    isExpired: boolean;
    cta: CtaTarget;
}

/**
 * Cards da home (IMERSO + cursos da consulta): mesma ordem, mesmos destinos e mesmo estado (bloqueado/expirado)
 * da lista atual. A lista atual e a home da plataforma nova (components/_new) leem daqui.
 */
export const useCourseCards = () => {
    const { access, openCta } = useProductAccess();
    const { data, loading, error } = useGetCourses();

    const courseList = data?.courseCollection.items;

    const imersoState = access(IMERSO_PRODUCT).state;
    const isImersoLocked = imersoState === 'none';

    const cards: CourseCardData[] = [
        {
            key: 'imerso',
            imgUrl: '/img/imerso_thumb.webp',
            title: 'IMERSO',
            type: 'Programa',
            href: isImersoLocked ? imersoSalesUrl('home') : '/imerso',
            isLocked: isImersoLocked,
            isExpired: imersoState === 'expired',
            cta: { product: IMERSO_PRODUCT },
        },
        ...(courseList
            ?.slice()
            ?.sort((course) => {
                const state = access(course?.coursePurchaseId).state;
                const isLocked = state === 'none';
                return isLocked ? 1 : -1;
            })
            ?.map((course) => {
                const state = access(course?.coursePurchaseId).state;
                const isLocked = state === 'none';

                // curso sem módulo/aula publicada (acontece nos produtos de teste): o card aponta para o curso, sem quebrar a home.
                // Trancado: a venda do próprio curso (o paymentCheckout da Masterclass leva ao Imerso); sem página, sem link.
                const href = isLocked
                    ? course.courseSlug === MASTERCLASS_COURSE
                        ? MASTERCLASS_SALES_URL
                        : course.paymentCheckout
                    : `/course/${course.courseSlug}/${
                          course.courseModulesCollection?.items?.[0]?.lessonsCollection?.items?.[0]?.lessonId ?? ''
                      }`;

                return {
                    key: course.courseSlug,
                    imgUrl: course.courseFeaturedImage.url,
                    title: course.courseTitle,
                    type: course.courseCategory,
                    href,
                    isLocked,
                    isExpired: state === 'expired',
                    cta: {
                        product: course.coursePurchaseId,
                        name: course.courseTitle,
                        renewUrl: course.paymentCheckout,
                    },
                };
            }) ?? []),
    ];

    return { cards, loading, error, openCta };
};

export const MettleCoursesList: React.FC = () => {
    const { cards, loading, error, openCta } = useCourseCards();

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

    return (
        <Row gutter={[16, 16]}>
            {cards.map((card) => (
                <Col xs={24} sm={12} md={6} key={card.key}>
                    <CourseCard
                        imgUrl={card.imgUrl}
                        title={card.title}
                        type={card.type}
                        href={card.href}
                        isLocked={card.isLocked}
                        isExpired={card.isExpired}
                        onClick={() => openCta(card.cta)}
                    />
                </Col>
            ))}
        </Row>
    );
};
