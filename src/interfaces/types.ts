export type QueryNameType =
    | 'deda-notes'
    | 'deda-listen'
    | 'deda-read-record'
    | 'deda-listen-read'
    | 'deda-watch'
    | 'deda-write';

export type DedaType = {
    id: string;
    title: string;
    subTitle: Array<string>;
    src: string;
    summary: string;
    status?: string;
    locked?: boolean;
};
