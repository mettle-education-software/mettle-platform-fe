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

export interface HpecModulesResponse {
    hpecContentCollection: {
        items: IHPECLesson[];
    };
}

export interface HpecResourcesResponse {
    singleLessonCollection: {
        items: {
            lessonResourcesCollection: {
                items: {
                    url: string;
                    title: string;
                    fileName: string;
                    contentType: string;
                    size: number;
                }[];
            };
        }[];
    };
}
