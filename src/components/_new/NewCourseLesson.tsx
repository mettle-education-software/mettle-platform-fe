'use client';

import { useGetCourseDetails } from 'hooks';
import { CourseModule } from 'libs/newDesign';
import React from 'react';
import { NewLesson } from './NewLesson';

/** Curso avulso (Masterclass e os próximos) no molde de cursos: mesmos módulos e aulas de useGetCourseDetails. */
const NewCourseLesson: React.FC<{ courseSlug: string; lessonId: string }> = ({ courseSlug, lessonId }) => {
    const { data, loading } = useGetCourseDetails(courseSlug);
    const course = data?.courseCollection?.items[0];

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
        />
    );
};

export default NewCourseLesson;
