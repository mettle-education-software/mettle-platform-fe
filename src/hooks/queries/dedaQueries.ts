import { DocumentNode, useQuery } from '@apollo/client';
import gql from 'graphql-tag';
import { DedaFeaturesResponse, DedaQueryName, DedaQuoteResponse, DedaVideosArticlesQueryResponse } from 'interfaces';

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
                dedaListenAudioMedia {
                    url
                }
                dedaListenSoundCloudLink
                dedaTitle
                dedaFeaturedImage {
                    url
                }
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
                dedaListenSoundCloudLink
                dedaListenAudioMedia {
                    url
                }
                dedaTitle
                dedaFeaturedImage {
                    url
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

const queries: Record<DedaQueryName, DocumentNode> = {
    'deda-notes': dedaNotesQuery,
    'deda-listen': dedaListenQuery,
    'deda-read-record': dedaReadRecordQuery,
    'deda-listen-read': dedaListenReadQuery,
    'deda-watch': dedaWatchQuery,
    'deda-write': dedaWriteQuery,
};

export const useDeda = <T>(queryName: DedaQueryName, dedaId?: string) =>
    useQuery<T>(queries[queryName], {
        variables: {
            dedaId,
        },
        skip: !dedaId || !queryName,
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
                            width
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

export const useGetDedaQuote = (dedaId: string) => {
    return useQuery<DedaQuoteResponse>(
        gql`
            query GetDedaQuote($dedaId: String) {
                dedaContentCollection(where: { dedaId: $dedaId }, limit: 1) {
                    items {
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
                    }
                }
            }
        `,
        { variables: { dedaId }, skip: !dedaId, fetchPolicy: 'cache-first' },
    );
};

const dedaVideosArticlesQuery = gql`
    query DedaVideosArticlesQuery($dedaId: String) {
        dedaContentCollection(where: { dedaId: $dedaId }, limit: 1) {
            items {
                dedaTitle
                dedaNotesArticlesLinksCollection {
                    items {
                        magicLinkUrl
                        magicLinkLabel
                    }
                }
                dedaNotesVideosLinksCollection {
                    items {
                        magicLinkUrl
                        magicLinkLabel
                    }
                }
            }
        }
    }
`;

export const useGetDedaVideosArticles = (dedaId: string) => {
    return useQuery<DedaVideosArticlesQueryResponse>(dedaVideosArticlesQuery, {
        variables: { dedaId },
        skip: !dedaId,
        fetchPolicy: 'cache-first',
    });
};

export const useDedaIdBySlug = (dedaSlug: string, skip = false) =>
    useQuery<{ dedaContentCollection: { items: { dedaId: string }[] } }>(
        gql`
            query DedaIdBySlug($dedaSlug: String) {
                dedaContentCollection(where: { dedaSlug: $dedaSlug }, limit: 1) {
                    items {
                        dedaId
                    }
                }
            }
        `,
        { variables: { dedaSlug }, skip: skip || !dedaSlug, fetchPolicy: 'cache-first' },
    );

export type LinKnowledgeArticle = {
    title: string;
    day: number;
    genre: string;
    author?: string | null;
    editionDate?: string | null;
    wordCount?: number | null;
    body?: { json: any };
    imagesCollection: { items: { url: string; description?: string | null; width: number; height: number }[] };
};

type LinKnowledgeResponse = {
    dedaContentCollection: {
        items: {
            dedaId: string;
            dedaSlug: string;
            dedaTitle: string;
            dedaLinKnowledgeArticlesCollection: { items: (LinKnowledgeArticle | null)[] };
        }[];
    };
};

const linKnowledgeArticleFields = `
    title
    day
    genre
    author
    editionDate
    wordCount
    imagesCollection(limit: 2) {
        items {
            url
            description
            width
            height
        }
    }
`;

// Consulta separada de propósito: enquanto o campo novo não existir no ambiente do Contentful
// (hoje só no `testing`), ela falha sozinha e a seção simplesmente não aparece.
export const useLinKnowledgeEdition = (dedaId: string) =>
    useQuery<LinKnowledgeResponse>(
        gql`
            query LinKnowledgeEdition($dedaId: String) {
                dedaContentCollection(where: { dedaId: $dedaId }, limit: 1) {
                    items {
                        dedaId
                        dedaSlug
                        dedaTitle
                        dedaLinKnowledgeArticlesCollection(limit: 7) {
                            items {
                                ${linKnowledgeArticleFields}
                                body {
                                    json
                                }
                            }
                        }
                    }
                }
            }
        `,
        { variables: { dedaId }, skip: !dedaId, fetchPolicy: 'cache-first' },
    );

export type PodcastEpisode = {
    title: string;
    showName?: string | null;
    coverImageUrl?: string | null;
    audioUrl: string;
    durationSeconds?: number | null;
    accentColor?: string | null;
};

// Consulta separada: sem o campo no schema (ou sem episódios), a seção mantém os embeds do Spotify.
export const usePodcastEpisodes = (dedaId: string) =>
    useQuery<{
        dedaContentCollection: { items: { dedaPodcastEpisodesCollection?: { items: (PodcastEpisode | null)[] } }[] };
    }>(
        gql`
            query DedaPodcastEpisodes($dedaId: String) {
                dedaContentCollection(where: { dedaId: $dedaId }, limit: 1) {
                    items {
                        dedaPodcastEpisodesCollection(limit: 7) {
                            items {
                                title
                                showName
                                coverImageUrl
                                audioUrl
                                durationSeconds
                                accentColor
                            }
                        }
                    }
                }
            }
        `,
        { variables: { dedaId }, skip: !dedaId, fetchPolicy: 'cache-first' },
    );

// Imagem própria do cabeçalho (campo `dedaHeaderImage`). Consulta separada: campo ausente/vazio ou
// erro → o cabeçalho usa a `dedaFeaturedImage`, como antes.
export const useDedaHeaderImage = (dedaId?: string) => {
    const { data } = useQuery<{
        dedaContentCollection: { items: { dedaHeaderImage?: { url: string; width: number; height: number } | null }[] };
    }>(
        gql`
            query DedaHeaderImage($dedaId: String) {
                dedaContentCollection(where: { dedaId: $dedaId }, limit: 1) {
                    items {
                        dedaHeaderImage {
                            url
                            width
                            height
                        }
                    }
                }
            }
        `,
        { variables: { dedaId }, skip: !dedaId, fetchPolicy: 'cache-first' },
    );
    return data?.dedaContentCollection.items[0]?.dedaHeaderImage ?? null;
};
