export interface IUserResponse {
    notifications: {
        link: string;
        isRead: boolean;
        description: string;
        title: string;
    }[];
    accountStatus: {
        purchaseDate: {
            _seconds: number;
            _nanoseconds: number;
        };
        melpStartDate: {
            _seconds: number;
            _nanoseconds: number;
        };
        isTutorialWatched: boolean;
        purchasedProducts: string[];
        isUserNewApi: boolean;
        payment: string;
        dedaStart: {
            isDedaStartConfirmed: boolean;
            startDates: {
                _seconds: number;
                _nanoseconds: number;
            }[];
        };
        pause: {
            pauseWeek: string;
            isAccountPaused: boolean;
            pauseDates: {
                _seconds: number;
                _nanoseconds: number;
            }[];
            lastPauseDate: {
                _seconds: number;
                _nanoseconds: number;
            };
        };
    };
    settings: {
        theme: string;
        remainingResetAttempts: number;
        notifications: boolean;
        remainingPauses: number;
    };
    userData: {
        transactionId: string;
        firstName: string;
        uid: string;
        isAdmin: boolean;
        email: string;
        lastName: string;
        profilePhotoUrl: string;
    };
    userHistory: {
        lastInputDate: {
            _seconds: number;
            _nanoseconds: number;
        };
    };
    currentTime: {
        daysSinceMelpBegin: number;
        daysSinceFirstPurchase: number;
        currentDay: number;
        currentWeek: number;
        currentDedaName: string;
    };
    unlockedDEDAs: string[];
    dedaConfirmedAndStarted: boolean;
    totalDedasAvailable: number;
}

export interface IWeeklyStatistics {
    deda: number;
    review: number;
    active: number;
    passive: number;
}

export interface IDedaDaily {
    readingTime: number;
    dedaTime: number;
}

export interface IChosenDay {
    weekNumber: string;
    weekDay: string;
}

export interface IGeneral {
    review: number;
    dedaQuality: number;
    active: number;
    overall: number;
    passive: number;
}

export interface IPerformanceResponseObject {
    weeklyStatistics: IWeeklyStatistics;
    dedaDaily: IDedaDaily;
    chosen: IChosenDay;
    general?: IGeneral;
}

export type WeeksType = `week${number}`;

export type DaysType = `day${1 | 2 | 3 | 4 | 5 | 6 | 7}`;

export interface ILampWeeklyStatistics {
    [key: WeeksType]: {
        [key in DaysType]: {
            averageActive: number;
            averagePassive: number;
            averageDeda: number;
            dedaDaily: {
                readingTime: 0;
                dedaTime: 0;
            };
        };
    };
}

export type DedaIdType = `DEDA${number}`;

export interface IDedasList {
    [key: DedaIdType]: string;
}

export type DedasListType = {
    dedaId: string;
    dedaTitle: string;
}[];

export interface IDedaEvaluation {
    average: number;
    stateBeing: number;
    stateMind: number;
    predPlace: number;
    dedaFocus: number;
    fiveSteps: number;
    percentageConcluded: number;
}

export interface IActive {
    dedaNotes: number;
    mooc: number;
    book: number;
    review: number;
    others: number;
    percentageConcluded: number;
}

export interface IPassive {
    newsShows: number;
    youtube: number;
    audiobook: number;
    movieDoc: number;
    ted: number;
    series: number;
    podcast: number;
    percentageConcluded: number;
    others: number;
    conversation: number;
}

export interface ReviewDataItem {
    status: boolean;
    name: string;
}

export interface InputDataResponse {
    chosenWeekNumber: number;
    inputData: {
        dedaEvaluation: IDedaEvaluation;
        active: IActive;
        passive: IPassive;
    };
    reviewData:
        | {
              review1?: ReviewDataItem;
              review2?: ReviewDataItem;
              review3?: ReviewDataItem;
              reviewProgress: number;
          }
        | false;
    dedaDaily: {
        readingTime: number;
        dedaTime: number;
    };
    chosenDedaid: string;
}

export type InputDataKeys = keyof InputDataResponse['inputData'];

export type InputDataKeyStats =
    | keyof InputDataResponse['inputData']['dedaEvaluation']
    | keyof InputDataResponse['inputData']['active']
    | keyof InputDataResponse['inputData']['passive'];

export interface InputDataDTO {
    inputDataToSave: {
        active: {
            book: number;
            dedaNotes: number;
            mooc: number;
            others: number;
            review: number;
        };
        passive: {
            audiobook: number;
            conversation: number;
            movieDoc: number;
            newsShows: number;
            others: number;
            podcast: number;
            series: number;
            ted: number;
            youtube: number;
        };
        dedaEvaluation: {
            dedaFocus: number;
            fiveSteps: number;
            predPlace: number;
            stateBeing: number;
            stateMind: number;
            dedaDaily: {
                readingTime: number;
                dedaTime: number;
            };
        };
        review?:
            | {
                  review1?: {
                      status?: boolean;
                  };
                  review2?: {
                      status?: boolean;
                  };
                  review3?: {
                      status?: boolean;
                  };
              }
            | false;
    };
}
