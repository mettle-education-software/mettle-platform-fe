// Imagens do Contentful servidas pelo espelho (desde 7-Out-2026): a banda de assets do Contentful tem teto mensal e,
// estourado, as imagens param para todos. O espelho (mettle-content-mirror) já devolve nas consultas a url
// <espelho>/ctfimg/<espaço>/<id>/<hash>/<arquivo>, com os mesmos parâmetros da Images API; ele guarda cada variante no
// R2 e só busca no Contentful uma vez. Desligar: IMG_MIRROR=off no Worker, ou CONTENT_MIRROR = false no next.config
// (as consultas voltam ao Contentful e as urls também).
export const CONTENTFUL_IMAGES = 'images.ctfassets.net';
export const IMAGE_MIRROR_HOSTS = [
    'mettle-content-mirror.mettle.workers.dev',
    'mettle-content-mirror-next.mettle.workers.dev',
];
const MIRROR_PATH = '/ctfimg/';

/** https em images.ctfassets.net ou no espelho (/ctfimg/…): as duas aceitam os parâmetros da Images API. */
export const isContentImageUrl = (url: URL) =>
    url.protocol === 'https:' &&
    (url.hostname === CONTENTFUL_IMAGES ||
        (IMAGE_MIRROR_HOSTS.includes(url.hostname) && url.pathname.startsWith(MIRROR_PATH)));

/** Mesma imagem direto no Contentful (com os mesmos parâmetros); null se `src` não é imagem do espelho. */
export const contentfulOriginal = (src: string): string | null => {
    try {
        let url = new URL(src);
        // next/image: /_next/image?url=<imagem>&w=…
        if (url.pathname === '/_next/image' && url.searchParams.get('url')) url = new URL(url.searchParams.get('url')!);
        if (!IMAGE_MIRROR_HOSTS.includes(url.hostname) || !url.pathname.startsWith(MIRROR_PATH)) return null;
        return `https://${CONTENTFUL_IMAGES}/${url.pathname.slice(MIRROR_PATH.length)}${url.search}`;
    } catch {
        return null;
    }
};

/**
 * Se uma imagem do espelho falhar, a mesma imagem vem do Contentful (uma vez por elemento; sem laço). Um ouvinte só, na
 * captura do documento: cobre <img>, next/image e <picture>. Devolve a remoção (useEffect).
 */
export const installImageFallback = () => {
    const onError = (event: Event) => {
        const img = event.target;
        if (!(img instanceof HTMLImageElement) || img.dataset.ctfFallback) return;
        const original = contentfulOriginal(img.currentSrc || img.src);
        if (!original) return;
        img.dataset.ctfFallback = '1';
        if (img.parentElement instanceof HTMLPictureElement)
            img.parentElement.querySelectorAll('source').forEach((source) => source.remove());
        img.removeAttribute('srcset');
        img.src = original;
    };
    document.addEventListener('error', onError, true);
    return () => document.removeEventListener('error', onError, true);
};
