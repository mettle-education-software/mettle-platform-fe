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
/**
 * Home (faixa de ~6,8:1 no celular): recorte central mais baixo, 800×240 (3,33:1), para o assunto da arte
 * ultra-panorâmica (faixa central da imagem) aparecer inteiro em vez de ser cortado pelo recorte alto.
 */
export const HOME_MOBILE_CROPS = [
    [430, 129],
    [800, 240],
    [1290, 387],
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

// Esfumados atrás do texto, PRESOS AO TEXTO (não à largura do cabeçalho): cada um é uma elipse
// (`radial-gradient(closest-side, …)`) desenhada sob o gradiente vertical, num retângulo que envolve o
// título/chip ou a citação com folga proporcional + fixa. Assim cobre o texto em qualquer largura de tela
// (861–2560 px) e com títulos longos, e nunca escurece a base (sem linha). Só existe onde há texto
// (desktop); no celular, nada.
// Folga horizontal maior que a vertical: o esfumado fica largo e cai devagar (sem "oval" visível).
export const TEXT_SHADE_PAD = { xRatio: 1.12, yRatio: 0.6, px: 280, pxY: 200 };
// Opacidade plana até 60% do raio (os cantos do texto ficam a ≤ 60% para qualquer tamanho, testado)
// e depois cai em curva suave até a borda — sem "mancha" de borda nítida ao redor do texto.
export const TEXT_SHADE_CORE = 60;
// Mínimos (passos de 0,05) para ≥ 4.5:1 sobre imagem branca, contando só o topo do gradiente vertical
// (0,15, o caso mais claro): dourado #b89261 do título → 0,85; branco da citação → 0,5.
export const TITLE_SHADE_OPACITY = 0.85;
export const QUOTE_SHADE_OPACITY = 0.5;

/** Retângulo do esfumado (px, relativo ao cabeçalho) para um texto em `rect`. */
export const textShadeRect = (rect: { left: number; top: number; width: number; height: number }) => {
    const padX = rect.width * TEXT_SHADE_PAD.xRatio + TEXT_SHADE_PAD.px;
    const padY = rect.height * TEXT_SHADE_PAD.yRatio + TEXT_SHADE_PAD.pxY;
    return {
        left: rect.left - padX,
        top: rect.top - padY,
        width: rect.width + 2 * padX,
        height: rect.height + 2 * padY,
    };
};

// Queda gradual depois do núcleo (proporções da opacidade cheia; com 0,85: .85 → .75 → .5 → .25 → 0).
const FALLOFF: [number, number][] = [
    [0, 1],
    [TEXT_SHADE_CORE, 1],
    [70, 0.88],
    [80, 0.59],
    [90, 0.29],
    [100, 0],
];

export const textShadeCss = (opacity: number) =>
    `radial-gradient(closest-side, ${FALLOFF.map(
        ([at, k]) => `rgba(0, 0, 0, ${Math.round(opacity * k * 1000) / 1000}) ${at}%`,
    ).join(', ')})`;

/** Posição do canto do texto no esfumado, em % do raio (0 = centro, 100 = borda). */
export const textCornerRadius = (width: number, height: number) => {
    const box = textShadeRect({ left: 0, top: 0, width, height });
    return Math.hypot(width / box.width, height / box.height) * 100;
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
 * Contraste de um texto (`textHex`) sobre a PIOR imagem (branca): imagem → esfumado de opacidade `shade`
 * → gradiente vertical com opacidade `vertical` (padrão: 0,15, o topo, o caso mais claro).
 */
export const contrastOverWhite = (textHex: string, shade: number, vertical = HEADER_VERTICAL[0][1]) => {
    const background = toLinear(43 * vertical + 255 * (1 - shade) * (1 - vertical));
    const text = hexLuminance(textHex);
    return (Math.max(text, background) + 0.05) / (Math.min(text, background) + 0.05);
};
