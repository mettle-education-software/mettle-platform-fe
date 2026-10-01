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
export const DESKTOP_WIDTHS = [1280, 1920, 2560] as const;
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

/** `srcset` do celular (recorte) e do desktop (larguras); null se a imagem não for do Contentful. */
export const headerSources = (raw: string | null | undefined): HeaderSources | null => {
    const mobile = MOBILE_CROPS.map(([w, h]) => {
        const href = contentfulImage(raw, { w, h, fit: 'fill', f: 'center', fm: 'webp', q: 70 });
        return href && `${href} ${w}w`;
    });
    const desktop = DESKTOP_WIDTHS.map((w) => {
        const href = contentfulImage(raw, { w, fm: 'webp', q: 75 });
        return href && `${href} ${w}w`;
    });
    if ([...mobile, ...desktop].some((entry) => !entry)) return null;
    return {
        mobile: mobile.join(', '),
        desktop: desktop.join(', '),
        fallback: contentfulImage(raw, { w: DESKTOP_WIDTHS[0], fm: 'webp', q: 75 }) as string,
    };
};

// Escurecimento horizontal atrás do texto (pedido do André, imagem B): título à esquerda, citação e
// botão à direita. Stops [posição %, opacidade do preto]. A partir de 66% a sombra é ≥ 0,6, o que
// cobre a citação (começa em 69–74% da largura) com contraste ≥ 4.5:1 mesmo sobre imagem branca.
export const DESKTOP_SHADE: [number, number][] = [
    [0, 0.55],
    [32, 0],
    [55, 0],
    [66, 0.6],
    [100, 0.72],
];
// Celular (coluna única): só à esquerda, onde fica o ← (0–18% da largura); a base já tem o gradiente da página.
export const MOBILE_SHADE: [number, number][] = [
    [0, 0.7],
    [25, 0.6],
    [55, 0],
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
