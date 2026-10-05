import { css } from '@emotion/react';
import { theme, ThemeConfig } from 'antd';
import { uiFont } from 'components/_melp/_deda/DedaReader/readerFonts';
import React from 'react';

/**
 * Tema da plataforma nova (só para as contas de libs/newDesign): os mesmos tokens da página nova do DEDA
 * (DedaReader/readerStyles.ts, `--r-*`), aplicados à plataforma inteira. Cores sempre em variáveis: o tema claro
 * entra depois como outro bloco com os mesmos nomes. Injetado uma vez pela casca nova (NewAppLayout) e pelas páginas
 * de erro/carregamento; nunca entra no bundle dos alunos.
 *
 * Quando o PR feat/deda-reader-r4 estiver na main, o bloco de tokens de readerStyles.ts passa a importar daqui
 * (mesmos nomes e valores: nada muda na página do DEDA).
 */
export const platformTokens = css`
    :root {
        --r-bg: #2b2a29;
        --r-bg2: #262524;
        --r-surf: #363432;
        --r-sheet: #353331;
        --r-sheet-head: #413e3b;
        --r-sheet-shadow: 0 0 48px rgba(0, 0, 0, 0.55);
        --r-mask: rgba(0, 0, 0, 0.5);
        --r-line: rgba(255, 255, 255, 0.09);
        --r-line-strong: rgba(255, 255, 255, 0.28);
        --r-ring: rgba(255, 255, 255, 0.24);
        --r-track: rgba(255, 255, 255, 0.14);
        --r-hover: rgba(255, 255, 255, 0.06);
        --r-text: #f3ede4;
        --r-muted: #bdb4a8;
        --r-faint: #8f877c;
        --r-gold: #b78a5b;
        --r-gold-hi: #d3a878;
        --r-gold-tint: rgba(183, 138, 91, 0.16);
        --r-on-gold: #1d1a17;
        --r-error: #f0b3a8;
        --r-pill: rgba(127, 120, 110, 0.2);
        --r-strong: #ffffff;
        --r-card-shadow: rgba(0, 0, 0, 0.3);
        --r-video-bg: #000000;
        /* escurecimento de imagens de cabeçalho: termina no fundo da página */
        --r-img-shade: linear-gradient(180deg, rgba(43, 42, 41, 0.15) 0%, rgba(43, 42, 41, 0.55) 55%, #2b2a29 100%);

        --r-ui-size: 14.5px;
        --r-label-size: 11px;
        --r-label-track: 0.14em;
        --r-radius: 12px;
        --r-ease: 180ms ease;
        /* casca */
        --r-sb-w: 236px; /* menu lateral aberto */
        --r-rail-w: 64px; /* menu recolhido (trilho de ícones) */
        --r-bar-h: 52px; /* barra do celular */
    }
`;

/** Ícones (lucide): traço fino e um tamanho só, como na página do DEDA. */
export const ICON = { size: 20, strokeWidth: 1.5 } as const;

/** Família da interface (Manrope), a mesma da página do DEDA. */
export const UI_FONT_CLASS = uiFont.className;
/** Variável CSS com a família (para o `ui` acima e para o que abre fora da árvore: gavetas, modais). */
export const UI_FONT_VAR = { '--r-ui-font': uiFont.style.fontFamily } as React.CSSProperties;

/**
 * Acabamento compartilhado das páginas novas: botões, rótulos, foco, movimento reduzido. Mesmos valores da página
 * do DEDA (`shared` em readerStyles.ts).
 */
export const ui = css`
    /* --r-ui-font: família da interface (Manrope), posta inline pela casca/página a partir de next/font */
    font-family: var(--r-ui-font, system-ui), system-ui, sans-serif;
    font-size: var(--r-ui-size);
    color: var(--r-text);

    button,
    input,
    a {
        font-family: inherit;
    }
    button,
    a {
        transition:
            background-color var(--r-ease),
            border-color var(--r-ease),
            color var(--r-ease),
            opacity var(--r-ease);
    }
    :focus-visible {
        outline: 2px solid var(--r-gold-hi);
        outline-offset: 2px;
    }

    .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        min-height: 44px;
        padding: 0 20px;
        border-radius: 999px;
        border: 1px solid transparent;
        font-weight: 500;
        font-size: var(--r-ui-size);
        line-height: 1;
        letter-spacing: 0.01em;
        white-space: nowrap;
        text-decoration: none;
        background: none;
        color: var(--r-text);
        cursor: pointer;
    }
    .btn svg {
        flex: none;
    }
    .btn .arrow {
        margin: 0 -6px 0 -2px;
    }
    .btn.gold {
        background: var(--r-gold);
        color: var(--r-on-gold);
    }
    .btn.gold:hover:not(:disabled) {
        background: var(--r-gold-hi);
    }
    .btn.line {
        border-color: var(--r-line-strong);
    }
    .btn.line:hover:not(:disabled) {
        border-color: var(--r-gold-hi);
        color: var(--r-gold-hi);
    }
    .btn.ghost {
        padding: 0 12px;
        color: var(--r-muted);
        font-weight: 400;
    }
    .btn.ghost:hover {
        color: var(--r-text);
    }
    .btn:disabled {
        opacity: 0.45;
        cursor: default;
    }
    .ib {
        display: inline-grid;
        place-items: center;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        border: 0;
        padding: 0;
        background: none;
        color: var(--r-text);
        flex: none;
        cursor: pointer;
    }
    .ib:hover {
        background: var(--r-hover);
    }
    .lnk {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        background: none;
        border: 0;
        padding: 0 8px;
        min-height: 44px;
        color: var(--r-muted);
        font-weight: 400;
        font-size: 13.5px;
        letter-spacing: 0.01em;
        white-space: nowrap;
        text-decoration: none;
        cursor: pointer;
    }
    .lnk:hover {
        color: var(--r-text);
    }
    .lnk.gold {
        color: var(--r-gold-hi);
    }
    .eyebrow {
        margin: 0;
        font-size: var(--r-label-size);
        font-weight: 500;
        letter-spacing: var(--r-label-track);
        text-transform: uppercase;
        line-height: 1.4;
        color: var(--r-muted);
    }
    .hint {
        font-size: 13.5px;
        line-height: 1.5;
        color: var(--r-muted);
    }
    h1,
    h2,
    h3 {
        margin: 0;
        font-weight: 400;
        line-height: 1.25;
        letter-spacing: 0.005em;
        color: var(--r-text);
    }
    h1 {
        font-size: 28px;
    }
    h2 {
        font-size: 18px;
    }
    p {
        margin: 0;
    }
    .sr {
        position: absolute !important;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0 0 0 0);
        white-space: nowrap;
    }

    @media (max-width: 860px) {
        h1 {
            font-size: 24px;
        }
    }
    @media (prefers-reduced-motion: reduce) {
        * {
            animation: none !important;
            transition: none !important;
            scroll-behavior: auto !important;
        }
    }
`;

/**
 * antd nas páginas novas (formulários de Configurações, modal de início do DEDA): escuro quente, dourado, Manrope,
 * controles de 44 px. Envolve só as páginas novas (ConfigProvider local): a página do DEDA e as páginas atuais
 * dentro da casca continuam com o tema da Plataforma.
 */
export const newAntdTheme: ThemeConfig = {
    algorithm: theme.darkAlgorithm,
    token: {
        colorPrimary: '#b78a5b',
        colorInfo: '#b78a5b',
        colorBgBase: '#2b2a29',
        colorBgContainer: '#363432',
        colorBgElevated: '#413e3b',
        colorText: '#f3ede4',
        colorTextSecondary: '#bdb4a8',
        colorTextTertiary: '#8f877c',
        colorBorder: 'rgba(255, 255, 255, 0.28)',
        colorBorderSecondary: 'rgba(255, 255, 255, 0.09)',
        colorSplit: 'rgba(255, 255, 255, 0.09)',
        borderRadius: 10,
        fontFamily: uiFont.style.fontFamily,
        fontSize: 14.5,
        controlHeight: 44,
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
        boxShadowSecondary: '0 10px 30px rgba(0, 0, 0, 0.3)',
        wireframe: false,
    },
    components: {
        Button: {
            borderRadius: 999,
            fontWeight: 500,
            primaryColor: '#1d1a17',
            paddingContentHorizontal: 20,
            defaultBg: 'transparent',
            defaultBorderColor: 'rgba(255, 255, 255, 0.28)',
            primaryShadow: 'none',
            defaultShadow: 'none',
        },
        Input: { borderRadius: 10, paddingInline: 14 },
        Select: { borderRadius: 10 },
        Modal: { borderRadiusLG: 16, titleFontSize: 18, fontWeightStrong: 500 },
        Tooltip: { colorBgSpotlight: '#413e3b', colorTextLightSolid: '#f3ede4', borderRadius: 10 },
        Rate: { starColor: '#b78a5b', starBg: 'rgba(255, 255, 255, 0.14)', starSize: 18, marginXS: 6 },
        Form: { labelColor: '#bdb4a8', itemMarginBottom: 0 },
        Typography: { titleMarginBottom: 0, titleMarginTop: 0 },
    },
};
