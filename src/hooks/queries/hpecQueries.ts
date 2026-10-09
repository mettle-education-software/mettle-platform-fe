import { useQuery } from '@apollo/client';
import gql from 'graphql-tag';
import { HpecModulesResponse, HpecResourcesResponse, IHPECLesson } from 'interfaces';
import { getUnlockedDate } from 'libs';
import { hpecIdOfLesson } from 'libs/cleanUrls';
import { hpecDay } from 'libs/dedaClock';
import { useMelpContext } from 'providers';
import { useEffect, useState } from 'react';

const hpecTitlesQuery = gql`
    query HpecTitles {
        hpecContentCollection(order: [moduleOrder_ASC]) {
            items {
                hpecTitle
                hpecId
                moduleOrder
                drippingDayBeforeDedaStart
                drippingDayAfterDedaStart
                hpecLessonsCollection {
                    items {
                        lessonId
                        lessonTitle
                        lessonFeaturedText
                        lessonVideoEmbedUrl
                    }
                }
            }
        }
    }
`;

export const useGetHpecsModules = () => {
    const { melpSummary } = useMelpContext();

    const {
        data: modulesContentData,
        loading,
        error,
    } = useQuery<HpecModulesResponse>(hpecTitlesQuery, {
        fetchPolicy: 'cache-first',
    });

    const [unlockedModules, setUnlockedModules] = useState<IHPECLesson[]>([]);
    const [lockedModules, setLockedModules] = useState<({ unlockDate: string } & IHPECLesson)[]>([]);
    const [unlockedLessons, setUnlockedLessons] = useState(0);
    const [totalLessons, setTotalLessons] = useState(0);

    useEffect(() => {
        if (melpSummary && modulesContentData) {
            const daysSinceMelpStart = melpSummary.days_since_melp_start;
            // depois do start, o dia que goteja (libs/dedaClock.hpecDay): relógio novo = calendário em todo estado;
            // legado = dia ativo, congelado em pausa/fim/espera (antes, pausado via o HPEC inteiro aberto — PF-19)
            const after = hpecDay(melpSummary);

            const unlocked: IHPECLesson[] = [];
            const locked: ({ unlockDate: string } & IHPECLesson)[] = [];

            modulesContentData.hpecContentCollection.items.forEach((hpec) => {
                if (!after) {
                    if (daysSinceMelpStart < hpec.drippingDayBeforeDedaStart) {
                        return locked.push({
                            ...hpec,
                            unlockDate: getUnlockedDate(daysSinceMelpStart, hpec.drippingDayBeforeDedaStart),
                        });
                    }
                    if (!!hpec.drippingDayAfterDedaStart) {
                        return locked.push({
                            ...hpec,
                            unlockDate: 'Start DEDA to unlock this module',
                        });
                    }
                } else if (after.day < hpec.drippingDayAfterDedaStart) {
                    return locked.push({
                        ...hpec,
                        // dia congelado (legado parado): a data não existe até o DEDA voltar a contar
                        unlockDate: after.frozen
                            ? 'Opens when DEDA resumes'
                            : getUnlockedDate(after.day, hpec.drippingDayAfterDedaStart),
                    });
                }

                unlocked.push(hpec);
            });

            let unlockedLessonsCount = 0;
            let totalLessonsCount = 0;

            unlocked.forEach((module) => {
                const moduleLessonsLength = module.hpecLessonsCollection.items.length;
                unlockedLessonsCount += moduleLessonsLength;
                totalLessonsCount += moduleLessonsLength;
            });

            locked.forEach((module) => {
                const moduleLessonsLength = module.hpecLessonsCollection.items.length;

                totalLessonsCount += moduleLessonsLength;
            });

            setUnlockedLessons(unlockedLessonsCount);
            setTotalLessons(totalLessonsCount);

            setUnlockedModules(unlocked);
            setLockedModules(locked);
        }
    }, [modulesContentData, melpSummary]);

    return {
        unlockedModules,
        lockedModules,
        unlockedLessons,
        totalLessons,
        progressCount: (unlockedLessons / totalLessons) * 100,
        loading,
        error,
    };
};

const hpecResourcesQuery = gql`
    query HpecResources($lessonId: String) {
        singleLessonCollection(where: { lessonId: $lessonId }, limit: 1) {
            items {
                lessonTitle
                lessonResourcesCollection {
                    items {
                        url
                        title
                        fileName
                        contentType
                        size
                    }
                }
            }
        }
    }
`;

export const useGetHpecResources = (lessonId: string) =>
    useQuery<HpecResourcesResponse>(hpecResourcesQuery, {
        variables: {
            lessonId,
        },
        fetchPolicy: 'cache-first',
        skip: lessonId === 'first-lesson',
    });

// lessonId é único entre os módulos (conferido no Contentful em 30-Set-2026), então a URL leva só a aula.
export const useHpecIdOfLesson = (lessonId: string) => {
    const { data, loading } = useQuery<HpecModulesResponse>(hpecTitlesQuery, { fetchPolicy: 'cache-first' });
    const hpecId = hpecIdOfLesson(lessonId, data?.hpecContentCollection.items);
    return { hpecId, loading };
};
