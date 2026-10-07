import { css } from '@emotion/react';
import { theme, ThemeConfig } from 'antd';
import { uiFont } from 'components/_melp/_deda/DedaReader/readerFonts';
import React from 'react';
import { DARK, LIGHT } from './palette';

export { DARK, LIGHT, LK_LIGHT } from './palette';

export const tokenText = (set: Record<string, string>) =>
    Object.entries(set)
        .map(([name, value]) => `${name}: ${value};`)
        .join('\n');

/** Seletor do tema claro (o <html> recebe data-theme antes da primeira pintura: libs/theme.ts). */
export const LIGHT_ROOT = "html[data-theme='light']";

/** Injetado uma vez pela casca nova (NewAppLayout) e pelas páginas de erro/carregamento; nunca no bundle dos alunos. */
export const platformTokens = css`
    :root {
        ${tokenText(DARK)}
        /* escurecimento de imagens de cabeçalho: termina no fundo da página (segue o tema) */
        --r-img-shade: linear-gradient(
            180deg,
            rgba(var(--r-bg-rgb), 0.15) 0%,
            rgba(var(--r-bg-rgb), 0.55) 55%,
            var(--r-bg) 100%
        );

        --r-ui-size: 14.5px;
        --r-label-size: 11px;
        --r-label-track: 0.14em;
        --r-radius: 12px;
        --r-ease: 180ms ease;
        /* casca */
        --r-sb-w: 236px; /* menu lateral aberto */
        --r-rail-w: 64px; /* menu recolhido (trilho de ícones) */
        --r-bar-h: 52px; /* barra do celular */
        color-scheme: dark;
    }
    ${LIGHT_ROOT} {
        ${tokenText(LIGHT)}
        color-scheme: light;
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
    /* o aninhado do emotion sem "&" só valia para a própria raiz: o anel de foco tem de valer para todos os controles dentro dela */
    &:focus-visible,
    & :focus-visible {
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
        font-size: 20px;
    }
    p {
        margin: 0;
    }
    /* Selects: o título longo nunca passa por baixo da seta (reserva à direita + reticências); cresce até o limite do contêiner */
    .ant-select {
        max-width: 100%;
    }
    /* seletor aberto: o valor atual aparece esmaecido pelo antd (placeholder); aqui continua legível */
    .ant-select-single.ant-select-open .ant-select-selection-item {
        color: var(--r-muted) !important;
    }
    .ant-select-single .ant-select-selector .ant-select-selection-item,
    .ant-select-single .ant-select-selector .ant-select-selection-placeholder {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        padding-inline-end: 30px;
    }
    /* botão principal do antd: o algoritmo escuro apaga o dourado e o hover traz texto branco; valem os do tema (texto AA) */
    .ant-btn-primary:not(:disabled) {
        background: var(--r-gold);
        color: var(--r-on-gold);
    }
    .ant-btn-primary:not(:disabled):hover,
    .ant-btn-primary:not(:disabled):active {
        background: var(--r-gold-hi);
        color: var(--r-on-gold);
    }
    /* celular: campos com menos de 16 px fazem o Safari do iPhone ampliar a página ao tocar; 16 px evita (sem travar o zoom) */
    @media (max-width: 860px) {
        input,
        select,
        textarea,
        .ant-input,
        .ant-input-affix-wrapper input,
        .ant-select-selection-item,
        .ant-select-selection-placeholder,
        .ant-select-selection-search-input {
            font-size: 16px;
        }
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
        &,
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
const antdFor = (c: Record<keyof typeof DARK, string>, light: boolean): ThemeConfig => ({
    algorithm: light ? theme.defaultAlgorithm : theme.darkAlgorithm,
    token: {
        colorPrimary: c['--r-gold'],
        colorInfo: c['--r-gold'],
        colorLink: c['--r-gold-hi'],
        colorBgBase: c['--r-bg'],
        colorBgContainer: c['--r-surf'],
        colorBgElevated: light ? c['--r-surf'] : c['--r-sheet-head'],
        colorText: c['--r-text'],
        colorTextSecondary: c['--r-muted'],
        colorTextTertiary: c['--r-faint'],
        colorBorder: c['--r-line-strong'],
        colorBorderSecondary: c['--r-line'],
        colorSplit: c['--r-line'],
        borderRadius: 10,
        fontFamily: uiFont.style.fontFamily,
        fontSize: 14.5,
        controlHeight: 44,
        boxShadow: `0 10px 30px ${c['--r-card-shadow']}`,
        boxShadowSecondary: `0 10px 30px ${c['--r-card-shadow']}`,
        wireframe: false,
    },
    components: {
        Button: {
            borderRadius: 999,
            fontWeight: 500,
            primaryColor: c['--r-on-gold'],
            paddingContentHorizontal: 20,
            defaultBg: 'transparent',
            defaultBorderColor: c['--r-line-strong'],
            primaryShadow: 'none',
            defaultShadow: 'none',
        },
        Input: { borderRadius: 10, paddingInline: 14 },
        Select: { borderRadius: 10 },
        Modal: {
            borderRadiusLG: 16,
            titleFontSize: 18,
            fontWeightStrong: 500,
            ...(light ? { contentBg: c['--r-sheet'], headerBg: c['--r-sheet'] } : {}),
        },
        Tooltip: { colorBgSpotlight: c['--r-tip-bg'], colorTextLightSolid: c['--r-tip-text'], borderRadius: 10 },
        Rate: { starColor: c['--r-gold'], starBg: c['--r-track'], starSize: 18, marginXS: 6 },
        Form: { labelColor: c['--r-muted'], itemMarginBottom: 0 },
        Typography: { titleMarginBottom: 0, titleMarginTop: 0 },
    },
});

/**
 * antd nas páginas novas (formulários de Configurações, modal de início do DEDA): os mesmos tons do tema em vigor,
 * dourado, Manrope, controles de 44 px. Envolve só as páginas novas (ConfigProvider local): as páginas atuais
 * continuam com o tema da Plataforma. Use `useNewAntdTheme()` (hooks/useTheme) para seguir o tema escolhido.
 */
export const newAntdTheme: ThemeConfig = antdFor(DARK, false);
export const newAntdThemeLight: ThemeConfig = antdFor(LIGHT, true);
