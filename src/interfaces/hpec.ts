export interface IHPECLesson {
    drippingDayBeforeDedaStart: number;
    drippingDayAfterDedaStart: number;
    hpecId: string;
    hpecTitle: string;
    hpecLessonsCollection: {
        items: {
            lessonId: string;
            lessonTitle: string;
        }[];
    };
}

export interface IHpecModulesProcessed {
    unlockedHpecs: IHPECLesson[];
    blockedHpecs: IHPECLesson[];
}

export type HPECListType = IHPECLesson[];
