export interface InputDataDTO {
    inputData: {
        dedaInputData: {
            dedaFocus: number;
            dedaSteps: number;
            dedaPredPlace: number;
            dedaStateBeing: number;
            dedaStateMind: number;
            readingTime: number;
            dedaTime: number;
        };
        activeInputData: {
            book: number;
            dedaNotes: number;
            mooc: number;
            others: number;
            review: number;
        };
        passiveInputData: {
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
        reviewInputData?: {
            review1: {
                status: boolean;
            };
            review2?: {
                status: boolean;
            };
            review3?: {
                status: boolean;
            };
        };
    };
}

export interface InputDataResponse {
    data: {
        dedaInput: {
            created_at: string;
            updated_at: string;
            deda_average: number;
            deda_concluded_score: number;
            deda_focus: number;
            deda_pred_place: number;
            deda_steps: number;
            deda_state_mind: number;
            deda_state_being: number;
            deda_time: number;
            reading_time: number;
        };
        activeInput: {
            created_at: string;
            updated_at: string;
            concluded_score: number;
            book: number;
            deda_notes: number;
            mooc: number;
            others: number;
            review: number;
        };
        passiveInput: {
            created_at: string;
            updated_at: string;
            concluded_score: number;
            audiobook: number;
            conversation: number;
            movie_doc: number;
            news_shows: number;
            others: number;
            podcast: number;
            series: number;
            ted: number;
            youtube: number;
        };
        reviewInput?: {
            review1: {
                status: boolean;
                name: string;
            };
            review2?: {
                status: boolean;
                name: string;
            };
            review3?: {
                status: boolean;
                name: string;
            };
            reviewProgress: 100;
        };
    };
}
