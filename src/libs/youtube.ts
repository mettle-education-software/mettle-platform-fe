// Capa de vídeo do YouTube. Sem capa HD, o maxresdefault devolve um placeholder cinza 120×90
// (com 404, mas o navegador desenha); o hqdefault sempre existe.
export const youTubeThumbnail = (videoId: string, quality: 'maxresdefault' | 'hqdefault' = 'maxresdefault') =>
    `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;

/** Próxima capa a tentar depois de carregar (ou falhar) `src`; null = fica como está. */
export const youTubeThumbnailFallback = (videoId: string, src: string, naturalWidth: number | null) => {
    const fallback = youTubeThumbnail(videoId, 'hqdefault');
    if (src === fallback) return null;
    return naturalWidth === null || naturalWidth <= 120 ? fallback : null;
};
