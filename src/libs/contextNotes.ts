import type { ContextNoteEntry, ContextNoteLinks } from '../interfaces/deda';
import { isContentImageUrl } from './contentImage';

export interface ContextNoteData {
    id: string;
    term: string;
    paragraphs: string[];
    image?: { src: string; width: number; height: number; alt: string };
}

// Só imagens do CDN do Contentful (ou do espelho, /ctfimg/…); qualquer outra coisa é descartada (a nota continua sem imagem).
export const safeNoteImageUrl = (url?: string | null): string | null => {
    try {
        const u = new URL(url ?? '');
        return isContentImageUrl(u) ? u.toString() : null;
    } catch {
        return null;
    }
};

// Corpo em texto puro: parágrafos separados por linha em branco.
export const splitParagraphs = (body: string): string[] =>
    body
        .split(/\r?\n\s*\r?\n/)
        .map((p) => p.trim())
        .filter(Boolean);

export const toContextNote = (entry?: ContextNoteEntry | null): ContextNoteData | null => {
    if (!entry?.sys?.id || typeof entry.term !== 'string' || typeof entry.body !== 'string') return null;
    const src = safeNoteImageUrl(entry.image?.url);
    return {
        id: entry.sys.id,
        term: entry.term,
        paragraphs: splitParagraphs(entry.body),
        image: src
            ? {
                  src,
                  width: entry.image?.width || 800,
                  height: entry.image?.height || 450,
                  alt: entry.image?.description || '',
              }
            : undefined,
    };
};

// Nota ligada ao entry-hyperlink; null (texto simples) se faltar, não for contextNote ou estiver incompleta.
export const findContextNote = (targetId: unknown, links?: ContextNoteLinks): ContextNoteData | null => {
    if (typeof targetId !== 'string') return null;
    return toContextNote(links?.entries?.hyperlink?.find((e) => e?.sys?.id === targetId));
};
