export interface LessonItem {
    lessonId: string;
    lessonTitle: string;
}

export interface ModuleItem {
    moduleId: string;
    moduleName: string;
    lessonsCollection: {
        items: LessonItem[];
    };
}

export interface CourseItem {
    courseSlug: string;
    courseTitle: string;
    courseFeaturedText: string;
    introductionVideo: string | null;
    paymentCheckout: string;
    coursePurchaseId: string;
    courseCategory: string;
    courseFeaturedImage: {
        url: string;
    };
    courseModulesCollection: {
        items: ModuleItem[];
    };
}

export interface CourseCollectionResponse {
    courseCollection: {
        items: CourseItem[];
    };
}

export interface CourseDetailsResponse {
    courseCollection: {
        items: CourseItem[];
    };
}
