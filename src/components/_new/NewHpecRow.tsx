'use client';

import { useGetHpecsModules } from 'hooks';
import { hpecLessonPath } from 'libs/cleanUrls';
import Link from 'next/link';
import React from 'react';

/**
 * HPEC na home do IMERSO: as lições do último módulo liberado, numa fila — a primeira é "Watch" e as demais
 * "Next up", como no ComingHpecs atual (mesmos módulos, mesma ordem, mesmos destinos).
 */
export const NewHpecRow: React.FC = () => {
    const { unlockedModules, loading } = useGetHpecsModules();

    if (loading || unlockedModules.length === 0)
        return (
            <section aria-label="HPEC" aria-busy>
                <div className="sh">
                    <h2>HPEC</h2>
                </div>
                <div className="hrow">
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="hc skel" aria-hidden>
                            <span className="img" />
                        </div>
                    ))}
                </div>
            </section>
        );

    const lastModule = unlockedModules[unlockedModules.length - 1];
    const lessons = lastModule?.hpecLessonsCollection.items ?? [];

    return (
        <section aria-label="HPEC">
            <div className="sh">
                <h2>
                    HPEC<span>Module {lastModule?.moduleOrder}</span>
                </h2>
            </div>
            <div className="hrow">
                {lessons.map((lesson, index) => {
                    const vimeoId = lesson.lessonVideoEmbedUrl.split('/').pop() as string;
                    return (
                        <Link
                            key={lesson.lessonId}
                            href={hpecLessonPath(lesson.lessonId)}
                            className={`hc${index === 0 ? ' first' : ''}`}
                        >
                            <span className="img">
                                {/* eslint-disable-next-line @next/next/no-img-element -- miniatura do Vimeo */}
                                <img src={`https://vumbnail.com/${vimeoId}.jpg`} alt="" loading="lazy" />
                            </span>
                            <span className="t" title={lesson.lessonTitle}>
                                {lesson.lessonTitle}
                            </span>
                            <small>{index === 0 ? 'Watch' : 'Next up'}</small>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
};
