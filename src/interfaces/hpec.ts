export interface IHPECLesson {
    drippingDayBeforeDedaStart: number;
    drippingDayAfterDedaStart: number;
    hpecId: string;
    hpecTitle: string;
    moduleOrder: number;
    hpecLessonsCollection: {
        items: {
            lessonId: string;
            lessonTitle: string;
            lessonFeaturedText: string;
            lessonVideoEmbedUrl: string;
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
            lessonTitle: string;
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
