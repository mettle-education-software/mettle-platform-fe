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
