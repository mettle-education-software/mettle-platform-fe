import { useQuery } from '@apollo/client';
import gql from 'graphql-tag';
import { DedaFeaturesResponse, DedaQueryName } from 'interfaces';

const dedaMetaDataQuery = gql`
    query DedaNotes($dedaId: String) {
        dedaContentCollection(where: { dedaId: $dedaId }, limit: 1) {
            items {
                dedaSlug
                dedaTitle
                dedaFeaturedImage {
                    url
                }
            }
        }
    }
`;

const dedaNotesQuery = gql`
    query DedaNotes($dedaId: String) {
        dedaContentCollection(where: { dedaId: $dedaId }, limit: 1) {
            items {
                dedaId
                dedaSlug
                dedaTitle
                dedaNotesQuote {
                    json
                    links {
                        assets {
                            block {
                                sys {
                                    id
                                }
                                url
                                title
                                width
                                height
                                description
                            }
                        }
                    }
                }
                dedaNotesIntroductionContent {
                    json
                    links {
                        assets {
                            block {
                                sys {
                                    id
                                }
                                url
                                title
                                width
                                height
                                description
                            }
                        }
                    }
                }
                dedaNotesIntroductionMotivationQuote
                dedaFeaturedImage {
                    url
                }
                dedaNotesGlossaryContent {
                    json
                    links {
                        assets {
                            block {
                                sys {
                                    id
                                }
                                url
                                title
                                width
                                height
                                description
                            }
                        }
                    }
                }
                dedaNotesSecondaryImage {
                    url
                }
                dedaNotesArticlesLinksCollection {
                    items {
                        magicLinkLabel
                        magicLinkUrl
                    }
                }
                dedaNotesVideosLinksCollection {
                    items {
                        magicLinkLabel
                        magicLinkUrl
                    }
                }
                dedaNotesPodcasts
                dedaNotesEndImage {
                    url
                }
            }
        }
    }
`;

const dedaListenQuery = gql`
    query DedaListen($dedaId: String) {
        dedaContentCollection(where: { dedaId: $dedaId }, limit: 1) {
            items {
                dedaListenSoundCloudLink
            }
        }
    }
`;

const dedaReadRecordQuery = gql`
    query DedaListen($dedaId: String) {
        dedaContentCollection(where: { dedaId: $dedaId }, limit: 1) {
            items {
                dedaReadContent {
                    json
                    links {
                        assets {
                            block {
                                sys {
                                    id
                                }
                                url
                                title
                                width
                                height
                                description
                            }
                        }
                    }
                }
            }
        }
    }
`;

const dedaWatchQuery = gql`
    query DedaListen($dedaId: String) {
        dedaContentCollection(where: { dedaId: $dedaId }, limit: 1) {
            items {
                dedaWatchVideoLink
            }
        }
    }
`;

const dedaListenReadQuery = gql`
    query DedaListen($dedaId: String) {
        dedaContentCollection(where: { dedaId: $dedaId }, limit: 1) {
            items {
                dedaListenSoundCloudLink
                dedaReadContent {
                    json
                    links {
                        assets {
                            block {
                                sys {
                                    id
                                }
                                url
                                title
                                width
                                height
                                description
                            }
                        }
                    }
                }
            }
        }
    }
`;

const dedaWriteQuery = gql`
    query DedaListen($dedaId: String) {
        dedaContentCollection(where: { dedaId: $dedaId }, limit: 1) {
            items {
                dedaWriteContentDayOne {
                    json
                    links {
                        assets {
                            block {
                                sys {
                                    id
                                }
                                url
                                title
                                width
                                height
                                description
                            }
                        }
                    }
                }
                dedaWriteContentDayTwo {
                    json
                    links {
                        assets {
                            block {
                                sys {
                                    id
                                }
                                url
                                title
                                width
                                height
                                description
                            }
                        }
                    }
                }
                dedaWriteContentDayThree {
                    json
                    links {
                        assets {
                            block {
                                sys {
                                    id
                                }
                                url
                                title
                                width
                                height
                                description
                            }
                        }
                    }
                }
                dedaWriteContentDayFour {
                    json
                    links {
                        assets {
                            block {
                                sys {
                                    id
                                }
                                url
                                title
                                width
                                height
                                description
                            }
                        }
                    }
                }
                dedaWriteContentDayFive {
                    json
                    links {
                        assets {
                            block {
                                sys {
                                    id
                                }
                                url
                                title
                                width
                                height
                                description
                            }
                        }
                    }
                }
                dedaWriteContentDaySix {
                    json
                    links {
                        assets {
                            block {
                                sys {
                                    id
                                }
                                url
                                title
                                width
                                height
                                description
                            }
                        }
                    }
                }
                dedaWriteContentDaySeven {
                    json
                    links {
                        assets {
                            block {
                                sys {
                                    id
                                }
                                url
                                title
                                width
                                height
                                description
                            }
                        }
                    }
                }
            }
        }
    }
`;

const queries = {
    'deda-notes': dedaNotesQuery,
    'deda-listen': dedaListenQuery,
    'deda-read-record': dedaReadRecordQuery,
    'deda-listen-read': dedaListenReadQuery,
    'deda-watch': dedaWatchQuery,
    'deda-write': dedaWriteQuery,
};

export const useDeda = (queryName?: DedaQueryName, dedaId?: string) =>
    useQuery(queries[queryName as DedaQueryName], {
        variables: {
            dedaId,
        },
        fetchPolicy: 'cache-first',
    });

export const useDedaMeta = (dedaId: string) =>
    useQuery(dedaMetaDataQuery, {
        variables: {
            dedaId,
        },
    });

export const useFeaturedDedaData = (dedaId?: string) => {
    return useQuery<DedaFeaturesResponse>(
        gql`
            query FeaturedDeda($dedaId: String) {
                dedaContentCollection(where: { dedaId: $dedaId }, limit: 1) {
                    items {
                        dedaId
                        dedaSlug
                        dedaTitle
                        dedaFeaturedImage {
                            url
                        }
                    }
                }
            }
        `,
        {
            variables: { dedaId },
            skip: !dedaId,
            fetchPolicy: 'cache-first',
        },
    );
};
