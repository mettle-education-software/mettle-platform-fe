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

// Esfumados RADIAIS atrás do texto (desktop, onde o cabeçalho tem texto; nada no celular): sem
// borda nem "parede" vertical. Geometria do coordenador; opacidades no mínimo (passos de 0,05) que
// mantém ≥ 4.5:1 sobre imagem branca na área do texto (testado):
// - título dourado e chip: o dourado #b89261 precisa de fundo quase tão escuro quanto #2b2b2b, então
//   o núcleo fica em 0,8 até 45% do raio e some até a borda da elipse (centro na altura do título);
// - citação (página do DEDA): 0,6 no centro, 0,45 a 50% do raio, some até a borda.
export type RadialShade = {
    /** raios da elipse, em % da largura e da altura */
    rx: number;
    ry: number;
    /** centro, em % da largura e da altura (a partir do topo) */
    cx: number;
    cy: number;
    /** [posição % do raio, opacidade do preto] */
    stops: [number, number][];
};

export const TITLE_SHADE_HOME: RadialShade = {
    rx: 42,
    ry: 120,
    cx: 12,
    cy: 55,
    stops: [
        [0, 0.8],
        [45, 0.8],
        [100, 0],
    ],
};
// Página do DEDA: o título fica mais alto (26–45% da altura), por isso o centro em 40%.
export const TITLE_SHADE_DEDA: RadialShade = { ...TITLE_SHADE_HOME, cy: 40 };
export const QUOTE_SHADE: RadialShade = {
    rx: 42,
    ry: 140,
    cx: 86,
    cy: 45,
    stops: [
        [0, 0.6],
        [50, 0.45],
        [100, 0],
    ],
};

export const radialShadeCss = ({ rx, ry, cx, cy, stops }: RadialShade) =>
    `radial-gradient(ellipse ${rx}% ${ry}% at ${cx}% ${cy}%, ${stops
        .map(([at, alpha]) => `rgba(0, 0, 0, ${alpha}) ${at}%`)
        .join(', ')})`;

/** Opacidade do esfumado num ponto (x%, y% a partir do topo), como o navegador desenha a elipse. */
export const radialShadeAt = ({ rx, ry, cx, cy, stops }: RadialShade, xPct: number, yPct: number) =>
    shadeAt(stops, Math.min(100, Math.hypot((xPct - cx) / rx, (yPct - cy) / ry) * 100));

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

// Gradiente vertical dos cabeçalhos (home, Free e página do DEDA), de cima para baixo: topo leve e
// fim exatamente no #2b2b2b do fundo da página (a imagem se dilui, sem linha). Stops [% a partir do
// topo, opacidade do #2b2b2b]. A opacidade do topo fica numa constante fácil de ajustar.
export const HOME_HEADER_TOP_OPACITY = 0.15;
export const HEADER_VERTICAL: [number, number][] = [
    [0, HOME_HEADER_TOP_OPACITY],
    [40, 0.25],
    [80, 0.75],
    [100, 1],
];
// Escurece antes da base para a imagem clara não "acabar" numa faixa; termina exatamente no #2b2b2b.
export const HEADER_GRADIENT = `linear-gradient(180deg, ${HEADER_VERTICAL.map(([at, alpha]) =>
    alpha === 1 ? `#2b2b2b ${at}%` : `rgba(43, 43, 43, ${alpha}) ${at}%`,
).join(', ')})`;

const toLinear = (channel: number) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

/** Luminância relativa (WCAG) de um hex #rrggbb. */
export const hexLuminance = (hex: string) =>
    [1, 3, 5]
        .map((i) => toLinear(parseInt(hex.slice(i, i + 2), 16)))
        .reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i], 0);

/**
 * Contraste de um texto (`textHex`) sobre a PIOR imagem (branca), somando as camadas reais:
 * imagem → esfumados radiais → gradiente vertical (em y% a partir do topo).
 */
export const contrastOverWhite = (textHex: string, shades: RadialShade[], xPct: number, yPctFromTop: number) => {
    const afterShades = shades.reduce((channel, shade) => channel * (1 - radialShadeAt(shade, xPct, yPctFromTop)), 255);
    const vertical = shadeAt(HEADER_VERTICAL, yPctFromTop);
    const background = toLinear(43 * vertical + afterShades * (1 - vertical));
    const text = hexLuminance(textHex);
    return (Math.max(text, background) + 0.05) / (Math.min(text, background) + 0.05);
};
