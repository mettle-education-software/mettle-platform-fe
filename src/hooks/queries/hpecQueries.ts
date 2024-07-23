import { useQuery } from '@apollo/client';
import gql from 'graphql-tag';
import { HpecModulesResponse, HpecResourcesResponse, IHPECLesson } from 'interfaces';
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
    const [lockedModules, setLockedModules] = useState<IHPECLesson[]>([]);
    const [unlockedLessons, setUnlockedLessons] = useState(0);
    const [totalLessons, setTotalLessons] = useState(0);

    useEffect(() => {
        if (melpSummary && modulesContentData) {
            const drippingBeforeDedaStatuses = ['MELP_BEGIN', 'CAN_START_DEDA', 'DEDA_STARTED_NOT_BEGUN'];

            const melpStatus = melpSummary.melp_status;
            const daysSinceMelpStart = melpSummary.days_since_melp_start;
            const currentDedaDay = melpSummary.current_deda_day;

            const unlocked: IHPECLesson[] = [];
            const locked: IHPECLesson[] = [];

            modulesContentData.hpecContentCollection.items.forEach((hpec) => {
                if (drippingBeforeDedaStatuses.includes(melpStatus)) {
                    if (daysSinceMelpStart < hpec.drippingDayBeforeDedaStart) {
                        return locked.push({
                            ...hpec,
                        });
                    }
                    if (!!hpec.drippingDayAfterDedaStart) {
                        return locked.push({
                            ...hpec,
                        });
                    }
                }

                if (melpStatus === 'DEDA_STARTED') {
                    if (currentDedaDay < hpec.drippingDayBeforeDedaStart) {
                        return locked.push({
                            ...hpec,
                        });
                    }
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
