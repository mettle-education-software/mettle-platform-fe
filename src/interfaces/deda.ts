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
}

export interface DedaContentCollection {
    items: DedaItem[];
}

export interface LastDedasResponse {
    dedaContentCollection: DedaContentCollection;
}

export interface NextDedasResponse {
    dedaContentCollection: DedaContentCollection;
}

export interface AllDedasResponse {
    dedaContentCollection: DedaContentCollection;
}

export interface DedaFeaturesResponse {
    dedaContentCollection: DedaContentCollection;
}

export interface DedaNotesQueryResponse {
    dedaContentCollection: {
        items: {
            dedaId: string;
            dedaSlug: string;
            dedaTitle: string;
            dedaNotesQuote: {
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
