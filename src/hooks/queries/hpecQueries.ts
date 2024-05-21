import { useQuery } from '@apollo/client';
import gql from 'graphql-tag';
import {
    AccountCaseType,
    HpecModulesResponse,
    HpecResourcesResponse,
    IHPECLesson,
    IHpecModulesProcessed,
} from 'interfaces';
import { useMelpContext } from 'providers/MelpProvider';
import { useEffect, useState } from 'react';

const hpecTitlesQuery = gql`
    query HpecTitles {
        hpecContentCollection(order: [moduleOrder_ASC]) {
            items {
                hpecTitle
                hpecId
                drippingDayBeforeDedaStart
                drippingDayAfterDedaStart
                hpecLessonsCollection {
                    items {
                        lessonId
                        lessonTitle
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

            console.log('after here', unlocked, locked);

            setUnlockedModules(unlocked);
            setLockedModules(locked);
        }
    }, [modulesContentData, melpSummary]);

    return {
        unlockedModules,
        lockedModules,
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
    });
