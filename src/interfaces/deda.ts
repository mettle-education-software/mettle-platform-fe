export type DedaQueryName =
    | 'deda-notes'
    | 'deda-listen'
    | 'deda-read-record'
    | 'deda-listen-read'
    | 'deda-watch'
    | 'deda-write';

export interface DedaFeaturedImage {
    url: string;
}

export interface DedaItem {
    dedaId: string;
    dedaSlug: string;
    dedaFeaturedImage: DedaFeaturedImage;
    dedaTitle: string;
    dedaCategories: string[];
}

export interface DedaContentCollectionItems {
    items: DedaItem[];
}

export interface LastDedasResponse {
    dedaContentCollection: DedaContentCollectionItems;
}

export interface NextDedasResponse {
    dedaContentCollection: DedaContentCollectionItems;
}

export interface AllDedasResponse {
    dedaContentCollection: DedaContentCollectionItems;
}

export interface DedaFeaturesResponse {
    dedaContentCollection: DedaContentCollectionItems;
}

export type LinkType = {
    assets: {
        block: {
            sys: {
                id: string;
            };
            url: string;
            title: string;
            width: number;
            height: number;
            description: string;
        }[];
    };
};

export interface DedaNotesQueryResponse {
    dedaContentCollection: {
        items: {
            dedaId: string;
            dedaSlug: string;
            dedaTitle: string;
            dedaNotesQuote: {
                json: any;
                links: LinkType[];
            };
            dedaNotesIntroductionContent: {
                json: any;
                links: {
                    assets: {
                        block: {
                            sys: {
                                id: string;
                            };
                            url: string;
                            title: string;
                            width: number;
                            height: number;
                            description: string;
                        }[];
                    };
                };
            };
            dedaNotesIntroductionMotivationQuote: string;
            dedaFeaturedImage: {
                url: string;
            };
            dedaNotesGlossaryContent: {
                json: any;
                links: {
                    assets: {
                        block: {
                            sys: {
                                id: string;
                            };
                            url: string;
                            title: string;
                            width: number;
                            height: number;
                            description: string;
                        }[];
                    };
                };
            };
            dedaNotesSecondaryImage: {
                url: string;
            };
            dedaNotesArticlesLinksCollection: {
                items: {
                    magicLinkLabel: string;
                    magicLinkUrl: string;
                }[];
            };
            dedaNotesVideosLinksCollection: {
                items: {
                    magicLinkLabel: string;
                    magicLinkUrl: string;
                }[];
            };
            dedaNotesPodcasts: string[];
            dedaNotesEndImage: {
                url: string;
            };
        }[];
    };
}

export type DedaContentCollection<T> = {
    dedaContentCollection: {
        items: T[];
    };
};

export type DedaQuoteResponse = DedaContentCollection<{
    dedaNotesQuote: {
        json: any;
        links: LinkType;
    };
}>;

export type DedaListenQueryResponse = DedaContentCollection<{
    dedaListenSoundCloudLink: string;
}>;

export type DedaReadRecordQueryResponse = DedaContentCollection<{
    dedaReadContent: {
        json: any;
        links: LinkType;
    };
}>;

export type DedaWatchQueryResponse = DedaContentCollection<{
    dedaWatchVideoLink: string;
}>;

export type DedaListenReadQueryResponse = DedaContentCollection<{
    dedaListenSoundCloudLink: string;
    dedaReadContent: {
        json: any;
        links: LinkType;
    };
}>;

export type DedaWriteQueryResponse = DedaContentCollection<{
    dedaWriteContentDayOne: {
        json: unknown;
        links: LinkType;
    };
    dedaWriteContentDayTwo: {
        json: unknown;
        links: LinkType;
    };
    dedaWriteContentDayThree: {
        json: unknown;
        links: LinkType;
    };
    dedaWriteContentDayFour: {
        json: unknown;
        links: LinkType;
    };
    dedaWriteContentDayFive: {
        json: unknown;
        links: LinkType;
    };
    dedaWriteContentDaySix: {
        json: unknown;
        links: LinkType;
    };
    dedaWriteContentDaySeven: {
        json: unknown;
        links: LinkType;
    };
}>;

export interface DedaActivityStatusResponse {
    isDedaCompleted: boolean;
}

export interface DedaVideosArticlesQueryResponse {
    dedaContentCollection: {
        items: {
            dedaTitle: string;
            dedaNotesArticlesLinksCollection: {
                items: {
                    magicLinkUrl: string;
                    magicLinkLabel: string;
                }[];
            };
            dedaNotesVideosLinksCollection: {
                items: {
                    magicLinkUrl: string;
                    magicLinkLabel: string;
                }[];
            };
        }[];
    };
}

export interface CurrentDedaResponse {
    dbIndex: number;
    dedaName: string;
    id: string;
    number: number;
}
