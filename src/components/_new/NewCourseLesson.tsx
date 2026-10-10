'use client';

import { useGetCourseDetails } from 'hooks';
import { CourseModule } from 'libs/newDesign';
import { renewUrlOf, useProductAccess } from 'providers';
import React from 'react';
import { NewLesson } from './NewLesson';

/**
 * Curso avulso (Masterclass e os próximos) no molde de cursos: mesmos módulos e aulas de useGetCourseDetails. Em
 * leitura, a prévia da aula com a renovação (como o HPEC).
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
            preview={
                lockedCourse
                    ? {
                          renew: renewUrlOf({
                              product: lockedCourse.coursePurchaseId,
                              renewUrl: lockedCourse.paymentCheckout,
                          }),
                          note: 'Acesso encerrado',
                      }
                    : undefined
            }
        />
    );
};

export default NewCourseLesson;
