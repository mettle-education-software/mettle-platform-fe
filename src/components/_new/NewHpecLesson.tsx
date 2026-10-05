'use client';

import { useGetHpecsModules } from 'hooks/queries/hpecQueries';
import { hpecLessonPath } from 'libs/cleanUrls';
import { CourseModule } from 'libs/newDesign';
import { IMERSO_PRODUCT } from 'libs/productAccess';
import { AccessCtaBlock, useMelpContext, useProductAccess } from 'providers';
import React from 'react';
import { NewLesson } from './NewLesson';

/**
 * HPEC no molde de cursos: os mesmos módulos liberados/trancados (e as mesmas datas) de useGetHpecsModules, na
 * mesma ordem da lista atual (liberados, depois trancados). Imerso expirado: o conteúdo dá lugar ao convite.
 */
const NewHpecLesson: React.FC<{ lessonId: string }> = ({ lessonId }) => {
    const { melpSummary } = useMelpContext();
    const { unlockedModules, lockedModules, unlockedLessons, totalLessons, loading } = useGetHpecsModules();
    const imersoLocked = useProductAccess().access(IMERSO_PRODUCT).state === 'expired';

    const modules: CourseModule[] = [
        ...unlockedModules.map((hpec) => ({
            id: hpec.hpecId,
            title: hpec.hpecTitle,
            lessons: hpec.hpecLessonsCollection.items.map((lesson) => ({
                id: lesson.lessonId,
                title: lesson.lessonTitle,
                href: hpecLessonPath(lesson.lessonId),
            })),
        })),
        ...lockedModules.map((hpec) => ({
            id: hpec.hpecId,
            title: hpec.hpecTitle,
            lessons: hpec.hpecLessonsCollection.items.map((lesson) => ({
                id: lesson.lessonId,
                title: lesson.lessonTitle,
                href: hpecLessonPath(lesson.lessonId),
            })),
            locked: hpec.unlockDate,
        })),
    ];

    return (
        <NewLesson
            course={{ eyebrow: 'IMERSO', title: 'HPEC' }}
            modules={modules}
            modulesLoading={loading || !melpSummary}
            lessonId={lessonId}
            progress={{ unlocked: unlockedLessons, total: totalLessons }}
            lang="en"
            lockedContent={imersoLocked ? <AccessCtaBlock target={{ product: IMERSO_PRODUCT }} /> : undefined}
        />
    );
};

export default NewHpecLesson;
