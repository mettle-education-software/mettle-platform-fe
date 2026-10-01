// Imagem de cabeçalho do DEDA pela Images API do Contentful, mobile-first e com direção de arte:
// no celular, recorte centralizado mais alto; no tablet/desktop, a imagem inteira nas larguras maiores.
// O navegador escolhe uma fonte só (<picture>): o celular nunca baixa a versão desktop.

const CONTENTFUL_IMAGES = 'images.ctfassets.net';

/** Celular (até 640 px): recorte 800×440 (≈1,82:1), centralizado; 1×, 2× e 3× para telas de 360–430 px. */
export const MOBILE_CROPS = [
    [430, 236],
    [800, 440],
    [1290, 709],
] as const;
// Larguras do desktop até a largura real do asset (a Images API não amplia; DPR ≥ 2 pega a maior).
export const DESKTOP_WIDTHS = [1280, 1920, 2560, 3840] as const;
const MAX_IMAGES_API_WIDTH = 4000;
export const MOBILE_MAX_WIDTH = 640;

/** URL da Images API (só https em images.ctfassets.net); qualquer outra coisa → null. */
export const contentfulImage = (raw: string | null | undefined, params: Record<string, string | number>) => {
    try {
        const url = new URL(raw ?? '');
        if (url.protocol !== 'https:' || url.hostname !== CONTENTFUL_IMAGES) return null;
        url.search = '';
        Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, String(value)));
        return url.href;
    } catch {
        return null;
    }
};

export type HeaderSources = { mobile: string; desktop: string; fallback: string };

/** Larguras do desktop para um asset de `intrinsic` px: as padrão abaixo dele + a própria largura do asset. */
export const desktopWidths = (intrinsic?: number | null) => {
    if (!intrinsic || intrinsic <= 0) return [1280, 1920, 2560];
    const max = Math.min(Math.round(intrinsic), MAX_IMAGES_API_WIDTH);
    return [...DESKTOP_WIDTHS.filter((w) => w < max), max];
};

/** `srcset` do celular (recorte) e do desktop (larguras reais); null se a imagem não for do Contentful. */
export const headerSources = (raw: string | null | undefined, intrinsicWidth?: number | null): HeaderSources | null => {
    const mobile = MOBILE_CROPS.map(([w, h]) => {
        const href = contentfulImage(raw, { w, h, fit: 'fill', f: 'center', fm: 'webp', q: 70 });
        return href && `${href} ${w}w`;
    });
    const widths = desktopWidths(intrinsicWidth);
    const desktop = widths.map((w) => {
        const href = contentfulImage(raw, { w, fm: 'webp', q: 75 });
        return href && `${href} ${w}w`;
    });
    if ([...mobile, ...desktop].some((entry) => !entry)) return null;
    return {
        mobile: mobile.join(', '),
        desktop: desktop.join(', '),
        fallback: contentfulImage(raw, { w: widths[0], fm: 'webp', q: 75 }) as string,
    };
};

// Escurecimento só na página do DEDA, no terço direito atrás da citação (máx. 0,45, pedido do André);
// nada à esquerda, nada na home e nada no celular. A legibilidade vem junto com o text-shadow da citação.
export const QUOTE_SHADE: [number, number][] = [
    [0, 0],
    [62, 0],
    [78, 0.45],
    [100, 0.45],
];

export const shadeGradient = (stops: [number, number][]) =>
    `linear-gradient(90deg, ${stops.map(([at, alpha]) => `rgba(0, 0, 0, ${alpha}) ${at}%`).join(', ')})`;

/** Opacidade do escurecimento numa posição (%), por interpolação linear entre os stops. */
export const shadeAt = (stops: [number, number][], at: number) => {
    for (let i = 1; i < stops.length; i += 1) {
        const [x0, a0] = stops[i - 1];
        const [x1, a1] = stops[i];
        if (at <= x1) return a0 + ((a1 - a0) * (at - x0)) / (x1 - x0 || 1);
    }
    return stops[stops.length - 1][1];
};

/** Primeira imagem candidata que `headerSources` aceita (ex.: dedaHeaderImage, depois dedaFeaturedImage). */
export const pickHeaderImage = <T extends { url: string; width?: number | null }>(
    candidates: (T | null | undefined)[],
    from = 0,
) => {
    for (let i = from; i < candidates.length; i += 1) {
        const candidate = candidates[i];
        if (candidate && headerSources(candidate.url, candidate.width)) return i;
    }
    return -1;
};

// Gradientes verticais (de baixo para cima) sobre a imagem. Terminam no #2b2b2b do fundo da página.
// Home/Free: opacidade do topo ajustável (André decide vendo a imagem nova do London).
export const HOME_HEADER_TOP_OPACITY = 0.7;
export const HOME_HEADER_GRADIENT = `linear-gradient(0deg, rgb(43, 43, 43) 0%, rgba(43, 43, 43, ${HOME_HEADER_TOP_OPACITY}) 100%)`;

// Página do DEDA: sólido até 15% da altura (onde ficam as abas) e transparente no topo.
// Stops [posição % a partir de baixo, opacidade do #2b2b2b].
export const DEDA_HEADER_VERTICAL: [number, number][] = [
    [0, 1],
    [15, 1],
    [100, 0],
];
export const DEDA_HEADER_GRADIENT = `linear-gradient(0deg, ${DEDA_HEADER_VERTICAL.map(
    ([at, alpha]) => `rgba(43, 43, 43, ${alpha}) ${at}%`,
).join(', ')})`;

const toLinear = (channel: number) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

/**
 * Contraste do texto branco da citação sobre a PIOR imagem (branca), somando as camadas reais:
 * imagem → sombra horizontal (QUOTE_SHADE em x%) → gradiente vertical da página (em y% a partir de baixo).
 */
export const quoteContrastOverWhite = (xPct: number, yPctFromBottom: number) => {
    const afterShade = 255 * (1 - shadeAt(QUOTE_SHADE, xPct));
    const vertical = shadeAt(DEDA_HEADER_VERTICAL, yPctFromBottom);
    const channel = 43 * vertical + afterShade * (1 - vertical);
    return 1.05 / (toLinear(channel) + 0.05);
};
