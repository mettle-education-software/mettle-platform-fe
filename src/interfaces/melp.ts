export enum MelpStatuses {
    MELP_BEGIN = 'Melp start',
    CAN_START_DEDA = 'Can start DEDA',
    DEDA_STARTED_NOT_BEGUN = 'Waiting for DEDA to begin',
    DEDA_STARTED = 'DEDA started',
    DEDA_PAUSED = 'DEDA paused',
    DEDA_FINISHED = 'DEDA completed',
    MELP_SUSPENDED = 'MELP suspended',
}

export type MelpStatus = keyof typeof MelpStatuses;

export interface MelpSummaryResponse {
    data: {
        current_deda_day: number;
        current_deda_week: number;
        days_since_melp_start: number;
        deda_pause_dates: string[];
        deda_start_dates: string[];
        melp_start_date: string;
        melp_status: MelpStatus;
        unlocked_dedas: string[];
        user_uuid: string;
        currentDedaName?: string;
    };
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
