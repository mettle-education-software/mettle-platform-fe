import { useQuery } from '@apollo/client';
import gql from 'graphql-tag';
import { AccountCaseType, IHPECLesson, IHpecModulesProcessed } from 'interfaces';

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

export const useGetHpecsModules = () => useQuery(hpecTitlesQuery);

export const useHpecModulesWithDripping: (
    currentTime: { daysSinceMelpBegin: number; currentDay: number },
    accountCase: AccountCaseType,
) => IHpecModulesProcessed = (currentTime, accountCase) => {
    const hpecModulesQueryResponse = useGetHpecsModules();

    if (hpecModulesQueryResponse.error) throw new Error('Error while fetching hpec modules');

    if (!hpecModulesQueryResponse.data || !currentTime || !accountCase) return { unlockedHpecs: [], blockedHpecs: [] };

    const { items: queryItems }: { items: IHPECLesson[] } = hpecModulesQueryResponse.data.hpecContentCollection;

    const hpecsBeforeDedaStart = queryItems.filter(
        ({ drippingDayBeforeDedaStart }) => drippingDayBeforeDedaStart !== null,
    );

    const hpecsAfterDedaStart = queryItems.filter(
        ({ drippingDayAfterDedaStart }) => drippingDayAfterDedaStart !== null,
    );

    switch (accountCase) {
        case 'WEEK_ZERO':
        case 'FIRST_DAYS': {
            const unlockedHpecs: IHPECLesson[] = [];
            const blockedHpecs: IHPECLesson[] = [];

            const { daysSinceMelpBegin } = currentTime;

            hpecsBeforeDedaStart.forEach((hpec) => {
                if (daysSinceMelpBegin >= hpec.drippingDayBeforeDedaStart) {
                    unlockedHpecs.push(hpec);
                } else {
                    blockedHpecs.push(hpec);
                }
            });

            blockedHpecs.concat(hpecsAfterDedaStart);

            return {
                unlockedHpecs,
                blockedHpecs,
            };
        }
        default: {
            const unlockedHpecs: IHPECLesson[] = [];
            const blockedHpecs: IHPECLesson[] = [];

            const { daysSinceMelpBegin, currentDay } = currentTime;

            hpecsBeforeDedaStart.forEach((hpec) => {
                if (daysSinceMelpBegin >= hpec.drippingDayBeforeDedaStart) {
                    unlockedHpecs.push(hpec);
                } else {
                    blockedHpecs.push(hpec);
                }
            });

            hpecsAfterDedaStart.forEach((hpec) => {
                if (currentDay >= hpec.drippingDayAfterDedaStart) {
                    unlockedHpecs.push(hpec);
                } else {
                    blockedHpecs.push(hpec);
                }
            });

            return {
                unlockedHpecs,
                blockedHpecs,
            };
        }
    }
};
