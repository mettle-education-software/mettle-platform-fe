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
    week: string;
    status?: string;
    locked: boolean;
    current?: boolean;
};

export type ArticleType = {
    text: string;
    link: string;
    image: string;
    day: number;
};
