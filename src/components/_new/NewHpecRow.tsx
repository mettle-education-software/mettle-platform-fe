'use client';

import { useQuery } from '@tanstack/react-query';
import { useGetHpecsModules } from 'hooks';
import { hpecLessonPath } from 'libs/cleanUrls';
import { vimeoIdOf, vimeoOembedUrl, vumbnailUrl } from 'libs/newDesign';
import Link from 'next/link';
import React, { useState } from 'react';

/** Miniatura do Vimeo (oEmbed; vumbnail se o oEmbed não der; sem imagem, o fundo neutro do card). */
const Thumb: React.FC<{ embedUrl: string }> = ({ embedUrl }) => {
    const id = vimeoIdOf(embedUrl);
    const [failed, setFailed] = useState(false);
    const { data: oembed, isPending } = useQuery({
        queryKey: ['vimeo-oembed', id],
        queryFn: () =>
            fetch(vimeoOembedUrl(id as string))
                .then((r) => (r.ok ? r.json() : null))
                .then((j: { thumbnail_url?: string } | null) => j?.thumbnail_url ?? null)
                .catch(() => null),
        enabled: !!id,
        staleTime: Infinity,
        gcTime: Infinity,
        retry: false,
    });
    if (!id || isPending || failed) return null;
    return (
        // eslint-disable-next-line @next/next/no-img-element -- miniatura do Vimeo
        <img src={oembed || vumbnailUrl(id)} alt="" loading="lazy" onError={() => setFailed(true)} />
    );
};

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
                    return (
                        <Link
                            key={lesson.lessonId}
                            href={hpecLessonPath(lesson.lessonId)}
                            className={`hc${index === 0 ? ' first' : ''}`}
                        >
                            <span className="img">
                                <Thumb embedUrl={lesson.lessonVideoEmbedUrl} />
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
