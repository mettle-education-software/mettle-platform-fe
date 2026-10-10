'use client';

import { useGetCourseDetails } from 'hooks';
import { CourseModule } from 'libs/newDesign';
import { AccessCtaBlock, useProductAccess } from 'providers';
import React from 'react';
import { NewLesson } from './NewLesson';

/**
 * Curso avulso (Masterclass e os próximos) no molde de cursos: mesmos módulos e aulas de useGetCourseDetails. Em
 * leitura, a aula dá lugar à renovação (como o HPEC).
 */
const NewCourseLesson: React.FC<{ courseSlug: string; lessonId: string }> = ({ courseSlug, lessonId }) => {
    const { data, loading } = useGetCourseDetails(courseSlug);
    const course = data?.courseCollection?.items[0];
    const { access } = useProductAccess();
    const lockedCourse = course && access(course.coursePurchaseId).state === 'expired' ? course : null;

    const modules: CourseModule[] = (course?.courseModulesCollection.items ?? []).map((module) => ({
        id: module.moduleId,
        title: module.moduleName,
        lessons: module.lessonsCollection.items.map((lesson) => ({
            id: lesson.lessonId,
            title: lesson.lessonTitle,
            href: `/course/${courseSlug}/${lesson.lessonId}`,
        })),
    }));

    return (
        <NewLesson
            course={{ eyebrow: 'Curso', title: course?.courseTitle ?? '' }}
            modules={modules}
            modulesLoading={loading}
            lessonId={lessonId}
            lang="pt"
            lockedContent={
                lockedCourse ? (
                    <AccessCtaBlock
                        target={{
                            product: lockedCourse.coursePurchaseId,
                            name: lockedCourse.courseTitle,
                            renewUrl: lockedCourse.paymentCheckout,
                        }}
                    />
                ) : undefined
            }
        />
    );
};

export default NewCourseLesson;
