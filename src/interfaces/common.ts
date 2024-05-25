import { Timestamp } from 'firebase/firestore';

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type QueryParams = Record<string, unknown>;

interface Cancel {
    message: string;
}

export type HTTPOptions = {
    params?: QueryParams;
    data?: unknown;
    cancelToken?: {
        promise: Promise<Cancel>;
        reason?: Cancel;
        throwIfRequested(): void;
    };
    headers?: Record<string, string>;
};

export interface HTTPResponse<T> {
    status: number;
    statusText: string;
    data: T;
}

export interface HTTPError<T = Record<string, string[]>> {
    status: number;
    message: string;
}

export interface HTTPClient {
    get<T>(url: string, options?: HTTPOptions): Promise<HTTPResponse<T>>;

    post<D, R>(url: string, data?: D, options?: HTTPOptions): Promise<HTTPResponse<R>>;

    put<D, R>(url: string, data?: D, options?: HTTPOptions): Promise<HTTPResponse<R>>;

    patch<D, R>(url: string, data?: D, options?: HTTPOptions): Promise<HTTPResponse<R>>;

    delete<T>(url: string, options?: HTTPOptions): Promise<HTTPResponse<T>>;
}

export interface IPagination {
    total: number;
    pageSize: number;
    pageOffset: number;
}

export type AccountCaseType =
    | 'FIRST_DAYS'
    | 'WEEK_ZERO'
    | 'DEDA_CONFIRMED_AND_STARTED'
    | 'DEDA_CONFIRMED_NOT_STARTED'
    | 'DEDA_STARTED_ACCOUNT_PAUSED'
    | 'PROMPT_CONFIRM';

export interface Notification {
    title: string;
    body: string;
    actionLink?: string;
    isRead: boolean;
    notificationId: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface FireUser {
    email: string;
    roles: string[];
    uid: string;
    businessUuid: string;
    name: string;
    profileImageSrc: string | null;
}
