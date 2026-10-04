// Imagem de cabeçalho do DEDA pela Images API do Contentful, mobile-first e com direção de arte:
// no celular, recorte centralizado na proporção da faixa; no tablet/desktop, a imagem inteira nas larguras maiores.
// O navegador escolhe uma fonte só (<picture>): o celular nunca baixa a versão desktop.

const CONTENTFUL_IMAGES = 'images.ctfassets.net';

/**
 * Celular (até 640 px): a faixa do cabeçalho da página tem 8vh de altura (≈360×72, 5:1 a 6:1). O recorte pedido
 * tem a proporção da faixa (800×140, ≈5,7:1), centralizado, para a imagem aparecer inteira na altura; um recorte
 * mais alto era cortado em dois terços pelo `cover`. 1×, 2× e 3× para telas de 360–430 px.
 */
export const MOBILE_CROPS = [
    [430, 76],
    [800, 140],
    [1290, 226],
] as const;
/** Home no celular: faixa ainda mais baixa (≈360×58, 6,2:1); recorte 800×128 na mesma lógica. */
export const HOME_MOBILE_CROPS = [
    [430, 69],
    [800, 128],
    [1290, 208],
] as const;
export type MobileCrops = readonly (readonly [number, number])[];

// Arte da home (ultra-panorâmica 3:1, assunto na faixa central): a faixa do cabeçalho mostra só ~19% da
// altura em telas de 2560 px, menos que o assunto (~22%). Em vez de centrar (50%), a janela sobe um pouco
// para o TOPO do assunto ficar sempre visível; a base some no gradiente que já a escurece.
export const HOME_ART_OBJECT_POSITION = '50% 46%';
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
export const headerSources = (
    raw: string | null | undefined,
    intrinsicWidth?: number | null,
    mobileCrops: MobileCrops = MOBILE_CROPS,
): HeaderSources | null => {
    const mobile = mobileCrops.map(([w, h]) => {
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

/** Opacidade do escurecimento numa posição (%), por interpolação linear entre os stops. */
export const shadeAt = (stops: [number, number][], at: number) => {
    for (let i = 1; i < stops.length; i += 1) {
        const [x0, a0] = stops[i - 1];
        const [x1, a1] = stops[i];
        if (at <= x1) return a0 + ((a1 - a0) * (at - x0)) / (x1 - x0 || 1);
    }
    return stops[stops.length - 1][1];
};

/**
 * Primeira imagem candidata que `headerSources` aceita, na ordem de preferência. `null` = não há;
 * `undefined` = ainda carregando: enquanto houver uma candidata anterior carregando, devolve -1 (espera),
 * para não mostrar/baixar uma imagem de menor preferência e trocá-la logo depois.
 */
export const pickHeaderImage = <T extends { url: string; width?: number | null }>(
    candidates: (T | null | undefined)[],
) => {
    for (let i = 0; i < candidates.length; i += 1) {
        const candidate = candidates[i];
        if (candidate === undefined) return -1;
        if (candidate && headerSources(candidate.url, candidate.width)) return i;
    }
    return -1;
};

// Consulta que nunca responde não pode deixar o cabeçalho sem imagem: depois deste prazo, candidata
// ainda `undefined` passa a valer como `null` e o cabeçalho usa a próxima imagem disponível.
export const HEADER_IMAGE_WAIT_MS = 3000;

/** Dispara `onTimeout` depois do prazo; devolve o cancelamento (para o unmount). */
export const startHeaderImageWait = (onTimeout: () => void, ms = HEADER_IMAGE_WAIT_MS) => {
    const id = setTimeout(onTimeout, ms);
    return () => clearTimeout(id);
};

export const settleHeaderImages = <T>(candidates: (T | null | undefined)[], timedOut: boolean) =>
    timedOut ? candidates.map((candidate) => candidate ?? null) : candidates;

// Overlay dos cabeçalhos (home, Free e página do DEDA): uma camada #2b2b2b sobre a IMAGEM INTEIRA, sempre
// (padrão do Pedro: "overlay sempre"), mais forte de cima para baixo, terminando exatamente no #2b2b2b do
// fundo da página (a imagem se dilui, sem linha). É ela que dá leitura ao título e à citação; não há
// sombra localizada atrás dos textos (André, 02-Out-2026: parecia sujeira). Stops [% a partir do topo,
// opacidade do #2b2b2b]. A opacidade do topo fica numa constante fácil de ajustar.
export const HOME_HEADER_TOP_OPACITY = 0.45;
export const HEADER_VERTICAL: [number, number][] = [
    [0, HOME_HEADER_TOP_OPACITY],
    [40, 0.6],
    [80, 0.85],
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
 * Contraste de um texto (`textHex`) sobre a PIOR imagem (branca): imagem → sombra preta de opacidade `shade`
 * (0 = sem sombra) → overlay vertical com opacidade `vertical`.
 */
export const contrastOverWhite = (textHex: string, shade: number, vertical = HEADER_VERTICAL[0][1]) => {
    const background = toLinear(43 * vertical + 255 * (1 - shade) * (1 - vertical));
    const text = hexLuminance(textHex);
    return (Math.max(text, background) + 0.05) / (Math.min(text, background) + 0.05);
};
