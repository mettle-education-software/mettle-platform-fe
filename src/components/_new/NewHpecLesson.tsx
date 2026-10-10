'use client';

import { useGetHpecsModules } from 'hooks/queries/hpecQueries';
import { useHpecProgress } from 'hooks/useHpecProgress';
import { hpecLessonPath } from 'libs/cleanUrls';
import { opensLabel } from 'libs/hpecTrail';
import { CourseModule } from 'libs/newDesign';
import { IMERSO_PRODUCT } from 'libs/productAccess';
import { Check } from 'lucide-react';
import { AccessCtaBlock, useMelpContext, useProductAccess } from 'providers';
import React from 'react';
import { ICON } from 'themes/newDesign';
import { NewLesson } from './NewLesson';

/**
 * HPEC no molde de cursos: os mesmos módulos liberados/trancados (e as mesmas datas) de useGetHpecsModules, na
 * mesma ordem da lista atual (liberados, depois trancados). Imerso expirado: o conteúdo dá lugar ao convite.
 */
const NewHpecLesson: React.FC<{ lessonId: string }> = ({ lessonId }) => {
    const { melpSummary } = useMelpContext();
    const { unlockedModules, lockedModules, unlockedLessons, totalLessons, loading } = useGetHpecsModules();
    const imersoLocked = useProductAccess().access(IMERSO_PRODUCT).state === 'expired';
    const progress = useHpecProgress();

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
            // "Opens Oct 12" / "Opens with DEDA", como no trilho do IMERSO; nunca vazio (vazio = módulo aberto)
            locked: opensLabel(hpec.unlockDate) || 'Not open yet',
        })),
    ].map((module) =>
        // Leitura: todo módulo com cadeado (o modelo de acesso); a aula aberta mostra o convite de renovação (PF2-02)
        imersoLocked ? { ...module, locked: 'Read-only' } : module,
    );

    return (
        <NewLesson
            course={{ eyebrow: 'IMERSO', title: 'HPEC' }}
            modules={modules}
            modulesLoading={loading || melpSummary === undefined}
            lessonId={lessonId}
            progress={imersoLocked ? undefined : { unlocked: unlockedLessons, total: totalLessons }}
            lang="en"
            lockedContent={imersoLocked ? <AccessCtaBlock target={{ product: IMERSO_PRODUCT }} /> : undefined}
            onWatched={progress.markDone}
            doneToggle={(id) => {
                const done = progress.isDone(id);
                return (
                    <button
                        type="button"
                        className="btn line done-toggle"
                        aria-pressed={done}
                        disabled={!progress.ready}
                        onClick={() => progress.setDone(id, !done)}
                    >
                        <Check {...ICON} size={16} aria-hidden /> {done ? 'Done' : 'Mark as done'}
                    </button>
                );
            }}
        />
    );
};

export default NewHpecLesson;
