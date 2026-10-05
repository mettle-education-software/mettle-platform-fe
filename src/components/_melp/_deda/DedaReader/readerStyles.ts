import { css } from '@emotion/react';
import styled from '@emotion/styled';

/** Ícones da página nova (lucide): traço fino e um tamanho só; exceções passam `size`. */
export const ICON = { size: 20, strokeWidth: 1.5 } as const;

/**
 * Tokens do leitor (cores, espaçamento, tipografia) num lugar só: ajuste aqui. Valem na página de estudo
 * (.deda-reader) e nas gavetas/folhas que abrem por cima dela (.deda-reader-drawer, fora da árvore).
 */
export const readerTokens = css`
    /* Tema escuro (único por enquanto). Tema claro = outro bloco com os mesmos nomes, ex. [data-reader-theme='light']. */
    [data-reader-theme='dark'],
    .reader-theme-dark,
    .deda-reader-shell-on .context-note-drawer {
        --r-bg: #2b2a29;
        --r-bg2: #262524;
        --r-surf: #363432;
        /* folhas e gavetas: corpo mais claro que a página, cabeçalho mais claro que o corpo */
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
        --r-on-gold-alt: #1f1b16;
        --r-error: #f0b3a8;
        --r-pill: rgba(127, 120, 110, 0.2);
        --r-strong: #ffffff;
        --r-strong-line: #d9d2c7;
        --r-strip-shade: linear-gradient(
            90deg,
            rgba(28, 27, 26, 0.95),
            rgba(28, 27, 26, 0.82) 50%,
            rgba(28, 27, 26, 0.95)
        );
        --r-card-shadow: rgba(0, 0, 0, 0.3);
        --r-video-bg: #000000;
        /* LinKnowledge entra sem alteração: o contêiner devolve o que ele herda na página atual (fundo claro do Layout). */
        --r-lk-inherit-color: rgba(0, 0, 0, 0.88);
    }

    .deda-reader,
    .deda-reader-drawer {
        --r-read-size: 20px; /* texto do passo no computador: ~65 caracteres por linha na medida abaixo */
        --r-read-line: 1.7;
        --r-read-measure: 33.5em;
        --r-ui-size: 14.5px;
        --r-label-size: 11px; /* rótulos pequenos, em caixa alta e com tracking aberto */
        --r-label-track: 0.14em;
        --r-gap: 24px;
        --r-strip-h: 56px;
        --r-dock-h: 76px; /* cabe o gravador com duas linhas: a barra não muda de altura entre os estados */
        --r-radius: 12px;
        --r-ease: 180ms ease;
    }

    @media (max-width: 860px) {
        .deda-reader,
        .deda-reader-drawer {
            --r-read-size: 18px;
            --r-read-line: 1.66;
            --r-gap: 20px;
            --r-strip-h: 52px;
        }
    }

    /* Gavetas e folhas (antd Drawer): corpo distinto da página, cabeçalho distinto do corpo, borda e sombra. A nota de
       contexto (ContextNote) recebe o mesmo acabamento enquanto a página nova está aberta. */
    .deda-reader-drawer .ant-drawer-content,
    .deda-reader-shell-on .context-note-drawer .ant-drawer-content {
        background: var(--r-sheet);
        color: var(--r-text);
        border: 1px solid var(--r-line);
    }
    .deda-reader-drawer .ant-drawer-content-wrapper,
    .deda-reader-shell-on .context-note-drawer .ant-drawer-content-wrapper {
        box-shadow: var(--r-sheet-shadow);
    }
    .deda-reader-drawer .ant-drawer-mask,
    .deda-reader-shell-on .context-note-drawer .ant-drawer-mask {
        background: var(--r-mask) !important;
    }
    .deda-reader-drawer .ant-drawer-header,
    .deda-reader-shell-on .context-note-drawer .ant-drawer-header {
        background: var(--r-sheet-head);
        border-bottom: 1px solid var(--r-line);
        padding: 10px 12px 10px 20px;
        min-height: 60px;
    }
    .deda-reader-drawer .ant-drawer-title,
    .deda-reader-drawer .ant-drawer-close,
    .deda-reader-shell-on .context-note-drawer .ant-drawer-title,
    .deda-reader-shell-on .context-note-drawer .ant-drawer-close {
        color: var(--r-text);
    }
    .deda-reader-drawer .ant-drawer-title,
    .deda-reader-shell-on .context-note-drawer .ant-drawer-title {
        min-width: 0;
        font-size: 16px;
        font-weight: 500;
        line-height: 1.3;
    }
    .deda-reader-shell-on .context-note-drawer .ant-drawer-content {
        font-family: var(--r-ui-font), system-ui, sans-serif;
    }
    .deda-reader-shell-on .context-note-drawer .ant-typography {
        font-family: inherit;
        font-size: 15.5px;
        line-height: 1.6;
    }
    .deda-reader-drawer .ant-drawer-close,
    .deda-reader-shell-on .context-note-drawer .ant-drawer-close {
        display: inline-grid;
        place-items: center;
        width: 44px;
        height: 44px;
        order: 2;
        margin: 0;
        border-radius: 50%;
        color: var(--r-muted);
    }
    .deda-reader-drawer .ant-drawer-close:hover,
    .deda-reader-shell-on .context-note-drawer .ant-drawer-close:hover {
        background: var(--r-hover);
        color: var(--r-text);
    }
    .deda-reader-drawer .ant-drawer-body,
    .deda-reader-shell-on .context-note-drawer .ant-drawer-body {
        padding: 16px 20px 24px;
    }
    .deda-reader-drawer.ant-drawer-bottom .ant-drawer-content,
    .deda-reader-shell-on .context-note-drawer.ant-drawer-bottom .ant-drawer-content {
        border-radius: 20px 20px 0 0;
        border-bottom: 0;
        padding-bottom: env(safe-area-inset-bottom);
    }
    .deda-reader-drawer.ant-drawer-bottom .ant-drawer-content-wrapper,
    .deda-reader-shell-on .context-note-drawer.ant-drawer-bottom .ant-drawer-content-wrapper {
        border-radius: 20px 20px 0 0;
        max-height: 92%;
    }
    .deda-reader-drawer .ant-typography,
    .deda-reader-drawer p,
    .deda-reader-drawer li,
    .deda-reader-shell-on .context-note-drawer .ant-typography {
        color: var(--r-text);
    }
    /* título do DEDA numa linha só (reticências se preciso) e "Week N · Day N" menor embaixo */
    .deda-reader-drawer .sheet-title {
        display: block;
        min-width: 0;
    }
    .deda-reader-drawer .sheet-title b {
        display: block;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .deda-reader-drawer .sheet-title small {
        display: block;
        margin-top: 2px;
        font-size: 12px;
        font-weight: 400;
        letter-spacing: 0.02em;
        color: var(--r-muted);
    }
    .deda-reader-drawer .brand {
        display: flex;
        align-items: center;
        width: 104px;
        min-height: 44px;
        padding: 0;
        border: 0;
        background: none;
        cursor: pointer;
    }
    .deda-reader-drawer .brand svg {
        width: 100%;
        height: auto;
    }
    @media (prefers-reduced-motion: reduce) {
        .deda-reader-drawer *,
        .deda-reader-shell-on .context-note-drawer * {
            animation: none !important;
            transition: none !important;
        }
    }
`;

/** Botões, texto do passo e nota entre parágrafos: usados no estudo e nas gavetas. */
const shared = css`
    font-family: inherit;

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
        font-family: inherit;
        white-space: nowrap;
        text-decoration: none;
        background: none;
        color: var(--r-text);
        cursor: pointer;
    }
    .btn svg {
        flex: none;
    }
    /* seta depois do rótulo: a folga da direita compensa o respiro interno do ícone, para o conjunto ficar no centro */
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
        font-size: 22px;
        font-weight: 300;
        line-height: 1;
    }
    .ib:hover {
        background: var(--r-hover);
    }
    .lnk {
        background: none;
        border: 0;
        padding: 0 8px;
        min-height: 44px;
        color: var(--r-faint);
        font-weight: 400;
        font-size: 12.5px;
        letter-spacing: 0.02em;
        font-family: inherit;
        white-space: nowrap;
        cursor: pointer;
    }
    .lnk:hover {
        color: var(--r-text);
    }

    .prose {
        font-family: var(--r-read-font), system-ui, sans-serif;
        font-size: var(--r-read-size);
        line-height: var(--r-read-line);
        color: var(--r-text);
        max-width: var(--r-read-measure);
        margin: 0 auto;
        text-align: left;
        overflow-wrap: break-word;
    }
    .prose p {
        margin: 0 0 1.15em;
        white-space: break-spaces;
    }
    .prose h2,
    .prose h3,
    .prose h4 {
        color: var(--r-text);
        margin: 1.2em 0 0.5em;
        line-height: 1.3;
        font-weight: 600;
    }
    .prose ul,
    .prose ol {
        margin: 0 0 1.15em;
        padding-left: 1.4em;
    }
    .prose a {
        color: var(--r-gold-hi);
        text-decoration: underline;
    }
    .prose .embed {
        display: block;
        max-width: 100%;
        height: auto;
        margin: 1em auto;
        border-radius: var(--r-radius);
    }
    .prose .term {
        cursor: pointer;
        text-decoration: underline dotted;
        text-decoration-thickness: 1.5px;
        text-underline-offset: 5px;
        text-decoration-color: var(--r-gold-hi);
        border-radius: 2px;
        transition: background-color var(--r-ease);
    }
    .prose .term:hover,
    .prose .term[aria-expanded='true'] {
        background: var(--r-gold-tint);
    }
    .inote {
        position: relative;
        margin: -0.3em 0 1.3em;
        padding: 14px 48px 14px 18px;
        border: 1px solid var(--r-line);
        border-left: 1px solid var(--r-gold);
        background: var(--r-surf);
        border-radius: var(--r-radius);
        font-size: 15.5px;
        line-height: 1.55;
    }
    .inote h4 {
        margin: 0 0 4px;
        font-size: 15px;
        font-weight: 600;
        color: var(--r-text);
    }
    .inote h4 small {
        margin-left: 8px;
        font-size: var(--r-label-size);
        font-weight: 500;
        letter-spacing: var(--r-label-track);
        text-transform: uppercase;
        color: var(--r-muted);
    }
    .inote p {
        margin: 0 0 0.6em;
    }
    .inote p:last-of-type {
        margin: 0;
    }
    .inote .inote-img {
        width: 100%;
        height: auto;
        border-radius: 8px;
        margin: 6px 0 10px;
    }
    .inote .inote-x {
        position: absolute;
        right: 2px;
        top: 2px;
        color: var(--r-muted);
    }

    @media (prefers-reduced-motion: reduce) {
        * {
            animation: none !important;
            transition: none !important;
            scroll-behavior: auto !important;
        }
    }
`;

export const DrawerBody = styled.div`
    ${shared};
    font-size: var(--r-ui-size);

    &.glossary .prose {
        font-size: 16.5px;
        line-height: 1.6;
    }
    /* citação do DEDA: o componente atual (com a nota do autor), em leitura leve */
    &.quote {
        max-width: 34em;
        margin: 0 auto;
        padding: 8px 0 12px;
        font-family: var(--r-read-font), system-ui, sans-serif;
        font-size: 19px;
        font-style: italic;
        line-height: 1.6;
    }
    &.quote * {
        color: var(--r-text) !important;
        font-family: inherit;
        font-size: inherit;
        line-height: inherit;
    }
    &.quote [role='button'] {
        font-style: normal;
        text-decoration-color: var(--r-gold-hi);
    }

    .menu button {
        display: flex;
        align-items: center;
        gap: 14px;
        width: 100%;
        min-height: 48px;
        border: 0;
        background: none;
        border-radius: 10px;
        padding: 0 12px;
        font-weight: 400;
        font-size: 15px;
        font-family: inherit;
        color: var(--r-text);
        text-align: left;
        cursor: pointer;
    }
    .menu button:hover:not(:disabled),
    .menu button[aria-current] {
        background: var(--r-hover);
    }
    .menu button[aria-current] {
        color: var(--r-gold-hi);
    }
    .menu button:disabled {
        opacity: 0.45;
        cursor: default;
    }
    .menu button i {
        width: 26px;
        height: 26px;
        border-radius: 50%;
        border: 1px solid var(--r-ring);
        display: grid;
        place-items: center;
        font-weight: 500;
        font-size: 12px;
        font-family: inherit;
        font-style: normal;
        flex: none;
    }
    .menu button[aria-current] i {
        border-color: var(--r-gold-hi);
    }
    .menu button.done i {
        background: var(--r-gold-tint);
        border-color: transparent;
        color: var(--r-gold-hi);
    }
    .menu button small {
        margin-left: auto;
        font-size: 12px;
        color: var(--r-muted);
    }
    .menu hr {
        border: 0;
        border-top: 1px solid var(--r-line);
        margin: 8px 0;
    }

    /* menu da Plataforma (antd Menu, mesmos itens do menu lateral) no acabamento do leitor */
    .appmenu.ant-menu {
        background: transparent;
        border: 0 !important;
        font-family: inherit;
        font-size: 15px;
        color: var(--r-text);
    }
    .appmenu .ant-menu-sub.ant-menu-inline {
        background: transparent;
    }
    .appmenu .ant-menu-item,
    .appmenu .ant-menu-submenu-title {
        width: 100%;
        height: 48px;
        line-height: 48px;
        margin: 2px 0;
        border-radius: 10px;
        color: var(--r-text);
    }
    .appmenu .ant-menu-title-content,
    .appmenu .ant-menu-title-content .ant-typography {
        font-family: inherit;
        font-size: inherit;
        font-weight: 400;
        letter-spacing: 0.01em;
        color: inherit;
    }
    .appmenu .ant-menu-item-icon,
    .appmenu .ant-menu-submenu-arrow {
        color: var(--r-muted);
    }
    /* ícone do IMERSO (o da Plataforma, de cor fixa) na cor do item */
    .appmenu .ant-menu-submenu-title > svg path {
        fill: currentColor;
    }
    .appmenu .ant-menu-item:not(.ant-menu-item-disabled):hover,
    .appmenu .ant-menu-submenu-title:hover,
    .appmenu .ant-menu-item:not(.ant-menu-item-disabled):active,
    .appmenu .ant-menu-submenu-title:active {
        background: var(--r-hover) !important;
        color: var(--r-text) !important;
    }
    .appmenu .ant-menu-submenu-selected > .ant-menu-submenu-title,
    .appmenu .ant-menu-submenu-selected > .ant-menu-submenu-title .ant-menu-item-icon,
    .appmenu .ant-menu-item-selected {
        color: var(--r-gold-hi);
        background: transparent;
    }
    .appmenu .ant-menu-sub .ant-menu-item {
        height: 44px;
        line-height: 44px;
        color: var(--r-muted);
    }
    .appmenu .ant-menu-item-disabled {
        color: var(--r-faint) !important;
        opacity: 0.6;
    }
`;

export const Shell = styled.div`
    ${shared};
    position: fixed;
    inset: 0;
    z-index: 900; /* acima do layout da Plataforma; abaixo das gavetas e modais do antd (1000) */
    height: 100vh;
    height: 100dvh;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr); /* faixa fixa + corpo da aba (a faixa nunca remonta ao trocar de aba) */
    grid-template-columns: minmax(0, 1fr); /* nada da barra empurra a largura: sem rolagem horizontal */
    background: var(--r-bg);
    color: var(--r-text);
    font-size: var(--r-ui-size);
    font-weight: 400;
    overflow: hidden;
    overflow: clip;

    /* ---------- faixa do topo ---------- */
    .strip {
        position: relative;
        display: flex;
        align-items: center;
        gap: 8px;
        min-height: var(--r-strip-h);
        padding: 0 16px;
        background: var(--r-bg2);
        border-bottom: 1px solid var(--r-line);
        overflow: hidden;
    }
    .strip > .bg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center 42%;
        pointer-events: none;
    }
    .strip > .shade {
        position: absolute;
        inset: 0;
        background: var(--r-strip-shade);
        pointer-events: none;
    }
    .strip > :not(.bg):not(.shade) {
        position: relative;
    }
    .idb {
        display: flex;
        align-items: center;
        gap: 10px;
        min-height: 44px;
        min-width: 0;
        max-width: 300px;
        padding: 4px 8px 4px 4px;
        border: 0;
        border-radius: 10px;
        background: none;
        color: var(--r-text);
        text-align: left;
        cursor: pointer;
    }
    .idb img {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        object-fit: cover;
        flex: none;
    }
    .idb > span {
        min-width: 0;
    }
    /* título numa linha só, reticências se não couber; "Week N · Day N" menor na linha de baixo */
    .idb b {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 15px;
        font-weight: 500;
        line-height: 1.25;
        letter-spacing: 0.005em;
        color: var(--r-text);
    }
    .idb b span {
        min-width: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .idb b svg {
        flex: none;
        color: var(--r-muted);
    }
    .idb small {
        display: block;
        margin-top: 1px;
        font-size: 11.5px;
        line-height: 1.25;
        letter-spacing: 0.02em;
        color: var(--r-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .tabs {
        display: flex;
        align-self: stretch;
        gap: 4px;
        margin-left: 16px;
    }
    .tabs button {
        position: relative;
        padding: 0 12px;
        border: 0;
        background: none;
        color: var(--r-muted);
        font-size: 14px;
        font-weight: 400;
        letter-spacing: 0.01em;
        font-family: inherit;
        white-space: nowrap;
        cursor: pointer;
    }
    .tabs button:hover,
    .tabs button[aria-current='page'] {
        color: var(--r-text);
    }
    .tabs button::after {
        content: '';
        position: absolute;
        left: 12px;
        right: 12px;
        bottom: 0;
        height: 1.5px;
        background: var(--r-gold);
        opacity: 0;
        transition: opacity var(--r-ease);
    }
    .tabs button[aria-current='page']::after {
        opacity: 1;
    }
    .sp {
        flex: 1;
    }
    .timer {
        position: relative; /* entra por portal num span sem caixa: precisa ficar acima da sombra da faixa */
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 44px;
        padding: 0 8px;
        border: 0;
        background: none;
        color: var(--r-muted);
        font-size: 12.5px;
        letter-spacing: 0.02em;
        font-family: inherit;
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
        cursor: pointer;
    }
    .timer svg {
        width: 16px;
        height: 16px;
    }

    /* ---------- corpo da aba ---------- */
    /* aba DEDA: texto (a única rolagem) + barra fixa embaixo */
    .stage {
        display: grid;
        grid-template-rows: minmax(0, 1fr) auto;
        grid-template-columns: minmax(0, 1fr);
        min-height: 0;
    }
    .body {
        position: relative;
        display: grid;
        grid-template-rows: minmax(0, 1fr);
        grid-template-columns: minmax(0, 1fr);
        min-height: 0;
    }
    .scroll {
        overflow-y: auto;
        overflow-x: hidden;
        overscroll-behavior: contain;
        min-height: 0;
    }
    .study {
        padding: 28px 28px 80px;
    }
    .col {
        max-width: var(--r-read-measure);
        margin: 0 auto;
        font-size: var(--r-read-size);
    }
    .col.wide {
        max-width: 900px;
        font-size: inherit;
    }
    .col.form {
        max-width: 680px;
        font-size: inherit;
    }
    .col.form .ant-typography,
    .col.form input {
        font-family: inherit;
    }
    .hint {
        font-size: 13.5px;
        color: var(--r-muted);
    }
    .eyebrow {
        margin: 0 0 20px;
        line-height: 1.4;
    }
    .eyebrow b {
        font-size: var(--r-label-size);
        font-weight: 500;
        letter-spacing: var(--r-label-track);
        text-transform: uppercase;
        color: var(--r-muted);
    }
    .stagecard {
        max-width: 620px;
        margin: 0 auto;
        text-align: center;
    }
    .stagecard img {
        display: block;
        width: 100%;
        aspect-ratio: 16 / 9;
        object-fit: cover;
        border-radius: 14px;
        box-shadow: 0 14px 40px var(--r-card-shadow);
    }
    .stagecard h2 {
        margin: 22px 0 0;
        font-size: 24px;
        font-weight: 400;
        line-height: 1.25;
        letter-spacing: 0.005em;
        color: var(--r-text);
    }
    .video {
        max-width: 900px;
        margin: 0 auto;
        aspect-ratio: 16 / 9;
        border-radius: 14px;
        overflow: hidden;
        background: var(--r-video-bg);
    }
    .video iframe {
        width: 100%;
        height: 100%;
        border: 0;
    }
    .endcap {
        max-width: var(--r-read-measure);
        margin: 28px auto 0;
        padding-top: 20px;
        border-top: 1px solid var(--r-line);
        font-size: 12.5px;
        letter-spacing: 0.02em;
        color: var(--r-faint);
    }

    /* ⓘ do passo: canto inferior esquerdo, logo acima da barra; abre a instrução do passo */
    .info {
        position: absolute;
        left: 4px;
        bottom: 2px;
        z-index: 3;
    }
    .info button {
        display: grid;
        place-items: center;
        width: 44px;
        height: 44px;
        padding: 0;
        border: 0;
        background: none;
        color: var(--r-faint);
        cursor: pointer;
    }
    .info button svg {
        width: 15px;
        height: 15px;
    }
    .info button:hover,
    .info button[aria-expanded='true'] {
        color: var(--r-gold-hi);
    }
    .info p {
        position: absolute;
        left: 8px;
        bottom: 48px;
        width: max-content;
        max-width: min(300px, calc(100vw - 32px));
        margin: 0;
        padding: 12px 14px;
        border: 1px solid var(--r-line);
        border-radius: var(--r-radius);
        background: var(--r-sheet-head);
        box-shadow: 0 10px 30px var(--r-card-shadow);
        font-size: 13.5px;
        line-height: 1.5;
        color: var(--r-text);
        animation: r-pop var(--r-ease);
    }
    @keyframes r-pop {
        from {
            opacity: 0;
            transform: translateY(4px);
        }
    }

    /* passo 5: dias */
    .days {
        display: grid;
        grid-template-columns: repeat(7, minmax(0, 1fr));
        gap: 6px;
        margin: 0 0 24px;
    }
    .days button {
        min-height: 52px;
        padding: 4px 0;
        border: 1px solid var(--r-line);
        border-radius: var(--r-radius);
        background: none;
        color: var(--r-text);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 3px;
        font-size: 13px;
        font-family: inherit;
        cursor: pointer;
    }
    .days button b {
        font-weight: 500;
    }
    .days button small {
        height: 14px;
        display: flex;
        align-items: center;
        font-size: 10.5px;
        letter-spacing: 0.04em;
        color: var(--r-muted);
    }
    .days button small svg {
        width: 12px;
        height: 12px;
    }
    .days button.today {
        border-color: var(--r-gold);
    }
    .days button[aria-pressed='true'] {
        border-color: var(--r-gold);
        background: var(--r-gold-tint);
    }
    .days button:disabled {
        opacity: 0.4;
        cursor: default;
    }
    .past {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 8px 14px;
        margin: 0 0 24px;
        padding: 8px 8px 8px 16px;
        border: 1px solid var(--r-line);
        border-radius: var(--r-radius);
        font-size: 13.5px;
        line-height: 1.4;
        color: var(--r-muted);
    }
    .past b {
        font-weight: 500;
        color: var(--r-text);
    }
    .past .btn {
        min-height: 36px;
        padding: 0 14px;
        font-size: 13px;
    }

    /* ---------- barra fixa ---------- */
    .dock {
        background: var(--r-bg2);
        border-top: 1px solid var(--r-line);
    }
    .dock .in {
        display: flex;
        align-items: center;
        gap: 24px;
        min-height: var(--r-dock-h);
        max-width: 1320px;
        margin: 0 auto;
        padding: 8px 24px;
    }
    .pips {
        display: flex;
        align-items: center;
        flex: none;
        margin-left: -8px;
    }
    .pips button {
        position: relative;
        width: 40px;
        height: 44px;
        padding: 0;
        border: 0;
        background: none;
        display: grid;
        place-items: center;
        cursor: pointer;
    }
    .pips button:disabled {
        cursor: default;
    }
    .pips button i {
        width: 26px;
        height: 26px;
        border-radius: 50%;
        border: 1px solid var(--r-ring);
        display: grid;
        place-items: center;
        font-size: 12px;
        font-weight: 500;
        font-style: normal;
        font-variant-numeric: tabular-nums;
        color: var(--r-muted);
        transition:
            border-color var(--r-ease),
            background-color var(--r-ease),
            color var(--r-ease);
    }
    .pips button.done i {
        background: var(--r-gold-tint);
        border-color: transparent;
        color: var(--r-gold-hi);
    }
    .pips button.cur i {
        border-color: var(--r-gold-hi);
        color: var(--r-gold-hi);
    }
    .pips button + button::before {
        content: '';
        position: absolute;
        left: -7px;
        width: 14px;
        height: 1px;
        background: var(--r-line-strong);
    }
    .pips button:not(:disabled):hover i {
        border-color: var(--r-gold-hi);
    }
    .stl {
        flex: none;
        min-width: 120px;
        font-size: 15px;
        font-weight: 500;
        line-height: 1.3;
    }
    .stl small {
        display: block;
        font-size: var(--r-label-size);
        font-weight: 400;
        letter-spacing: var(--r-label-track);
        text-transform: uppercase;
        color: var(--r-muted);
    }
    .mid {
        flex: 1;
        min-width: 0;
        display: flex;
        align-items: center;
        min-height: 52px;
    }
    .mid > * {
        flex: 1;
        min-width: 0;
    }
    .cta {
        display: flex;
        gap: 8px;
        flex: none;
    }

    /* player (react-audio-play) na barra: botão dourado com o ícone no centro óptico, trilho fino, tempos discretos */
    .dock .rap-container {
        max-width: none;
        height: 44px;
        padding: 0;
        box-shadow: none;
        font-family: inherit;
    }
    .dock .rap-container .rap-pp-button {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: var(--r-gold);
        display: grid;
        place-items: center;
        flex: none;
        transition: background-color var(--r-ease);
    }
    .dock .rap-container .rap-pp-button:hover {
        background: var(--r-gold-hi);
    }
    .dock .rap-container .rap-pp-button svg {
        display: block;
        width: 14px;
        height: 14px;
    }
    .dock .rap-container .rap-pp-button svg path {
        fill: var(--r-on-gold);
    }
    /* centro óptico: o triângulo do play pesa para a esquerda; desloca 1/6 da largura (3 de 18 unidades). O pause é simétrico. */
    .dock .rap-container .rap-pp-button svg path[d^='M18 12L0'] {
        transform: translateX(3px);
    }
    .dock .rap-container .rap-controls {
        margin: 0 0 0 14px;
        font-family: inherit;
        font-size: 12px;
        letter-spacing: 0.02em;
        font-variant-numeric: tabular-nums;
        color: var(--r-muted);
    }
    .dock .rap-container .rap-controls > .rap-slider {
        margin: 0 12px;
        height: 2px;
        border-radius: 2px;
        background: var(--r-track);
    }
    .dock .rap-container .rap-controls > .rap-slider .rap-pin {
        width: 10px;
        height: 10px;
        top: -4px;
        right: -5px;
        box-shadow: none;
    }
    .dock .rap-container .rap-slider .rap-progress .rap-pin {
        background-color: var(--r-gold-hi);
    }
    /* tempo total e volume: respiro entre os dois; ícone do volume no peso do resto */
    .dock .rap-container .rap-volume {
        margin-left: 14px;
        display: grid;
        place-items: center;
    }
    .dock .rap-container .rap-volume-btn svg {
        display: block;
        width: 20px;
        height: 20px;
        opacity: 0.75;
    }
    /* gravador e duas faixas (componentes atuais) no peso da barra: borda de 1 px, nada de negrito; "Record again"
       deixa o dourado para a ação principal */
    .dock [aria-label='Reading recorder'] .headline {
        font-size: 14px;
        font-weight: 500;
    }
    .dock [aria-label='Reading recorder'] .timer {
        font-weight: 500;
    }
    .dock [aria-label='Reading recorder'] button,
    .dock .switch button,
    .dock .note button {
        border-width: 1px;
        font-size: 14px;
        font-weight: 500;
    }
    .dock [aria-label='Reading recorder'] .ghost,
    .dock [aria-label='Reading recorder'] button:not(.record):not(.link):has([data-testid='MicIcon']) {
        background: transparent;
        border-color: var(--r-line-strong);
        color: var(--r-text);
    }
    .dock .docked .switch {
        background: none;
        border: 1px solid var(--r-line);
    }
    .dock .docked .switch button[aria-pressed='true'] {
        background: var(--r-gold-tint);
        color: var(--r-gold-hi);
    }
    /* "Listen" do gravador: o mesmo player da barra, sem o cartão branco */
    .dock .player .rap-container {
        background: transparent !important;
        color: var(--r-text);
    }
    .dock .player .rap-volume-btn svg path {
        fill: currentColor;
    }
    .dock [aria-label='Reading recorder'] button svg {
        width: 18px;
        height: 18px;
    }

    /* ---------- DEDA Notes: sub-abas e leitura ---------- */
    .subnav {
        position: sticky;
        top: 0;
        z-index: 2;
        display: flex;
        justify-content: center;
        padding: 0 16px;
        background: var(--r-bg);
        border-bottom: 1px solid var(--r-line);
    }
    .seg {
        display: flex;
        gap: 8px;
        max-width: 100%;
    }
    .seg button {
        position: relative;
        min-height: 44px;
        padding: 0 14px;
        border: 0;
        background: none;
        color: var(--r-muted);
        font-size: 14px;
        font-weight: 400;
        letter-spacing: 0.01em;
        white-space: nowrap;
        cursor: pointer;
    }
    .seg button:hover,
    .seg button[aria-pressed='true'] {
        color: var(--r-text);
    }
    .seg button::after {
        content: '';
        position: absolute;
        left: 14px;
        right: 14px;
        bottom: -1px;
        height: 1.5px;
        background: var(--r-gold);
        opacity: 0;
        transition: opacity var(--r-ease);
    }
    .seg button[aria-pressed='true']::after {
        opacity: 1;
    }
    .notes {
        padding: 28px 28px 80px;
    }
    /* Introdução e Glossário: o mesmo texto e as mesmas notas (RichTextRenderer + ContextNote), na tipografia do leitor. */
    .rt {
        max-width: var(--r-read-measure);
        margin: 0 auto;
        font-family: var(--r-read-font), system-ui, sans-serif;
        font-size: var(--r-read-size);
        line-height: var(--r-read-line);
        color: var(--r-text);
    }
    .rt > div > *,
    .rt .ant-typography {
        text-align: left !important;
        color: var(--r-text);
        font-family: inherit;
        font-size: inherit;
        line-height: inherit;
    }
    .rt h1.ant-typography,
    .rt h2.ant-typography,
    .rt h3.ant-typography,
    .rt h4.ant-typography,
    .rt h5.ant-typography {
        line-height: 1.3;
        color: var(--r-text);
        font-size: 1.1em;
        font-weight: 600;
    }
    .rt a {
        color: var(--r-gold-hi);
    }
    .rt [role='button'][aria-haspopup='dialog'] {
        text-decoration-color: var(--r-gold-hi);
        text-decoration-thickness: 1.5px;
        text-underline-offset: 5px;
    }
    .rt li {
        color: var(--r-text);
    }
    /* LinKnowledge: componentes sem nenhuma alteração; aqui só devolvemos o que eles herdam na página atual. */
    .lk {
        font-size: 16px;
        font-weight: normal;
        line-height: normal;
        color: var(--r-lk-inherit-color);
        padding-bottom: 48px;
    }

    /* ---------- Review e My recordings: componentes atuais, acabamento do leitor ---------- */
    .tabpage {
        max-width: 1320px;
        margin: 0 auto;
        padding: 28px 0 72px;
    }
    .tabpage > * {
        background: transparent !important;
    }
    .tabpage h4.ant-typography,
    .tabpage h2 {
        font-family: inherit;
        font-weight: 500;
        color: var(--r-text) !important;
    }
    .r-recs h2 {
        font-size: 20px;
    }
    .tabpage .ant-typography {
        font-family: inherit;
    }
    .r-review .color-white {
        color: var(--r-text) !important;
    }
    /* My recordings foi feito para o fundo claro: no escuro, títulos, legendas e dias vazios com contraste AA. */
    .r-recs .card,
    .r-recs .row {
        background: var(--r-surf);
        border-radius: var(--r-radius);
    }
    .r-recs .card dt,
    .r-recs .card .sub,
    .r-recs .row .day span {
        color: var(--r-muted);
    }
    .r-recs .bars li {
        color: var(--r-muted);
    }
    .r-recs .bar {
        background: var(--r-gold);
    }
    .r-recs .bar.none {
        background: var(--r-track);
    }
    .r-recs .row.none {
        background: transparent;
        border: 1px dashed var(--r-line-strong);
        color: var(--r-muted);
    }
    .r-recs .row.none .day span {
        color: var(--r-muted);
    }
    .r-recs .row.active {
        outline-color: var(--r-gold);
    }

    /* ---------- celular ---------- */
    @media (max-width: 860px) {
        .notes {
            padding: 20px 22px 56px;
        }
        .subnav {
            padding: 0 8px;
        }
        .seg {
            gap: 4px;
        }
        .tabpage {
            padding: 20px 0 48px;
        }
        .strip {
            padding: 0 4px;
            gap: 2px;
        }
        .idb {
            max-width: none;
        }
        .study {
            padding: 20px 22px 56px;
        }
        .info {
            left: -11px; /* o ícone cabe inteiro na margem do texto: não cobre a primeira letra */
        }
        .info p {
            left: 23px;
        }
        .stagecard h2 {
            font-size: 22px;
        }
        .days {
            gap: 4px;
        }
        .days button .wd {
            display: none;
        }
        .segs {
            display: grid;
            grid-template-columns: repeat(var(--n, 6), 1fr);
            gap: 3px;
            height: 2px;
        }
        .segs i {
            background: var(--r-track);
            transition: background-color var(--r-ease);
        }
        .segs i.done {
            background: var(--r-gold);
        }
        .segs i.cur {
            background: var(--r-gold-hi);
            opacity: 0.55;
        }
        .dock .mid {
            flex-wrap: wrap;
            gap: 8px;
            min-height: 52px;
            padding: 8px 16px 0;
        }
        .dock .mid:empty {
            display: none;
        }
        .dock .nav {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 8px 16px calc(8px + env(safe-area-inset-bottom));
        }
        .stepchip {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 2px;
            min-height: 44px;
            padding: 0;
            border: 0;
            background: none;
            color: var(--r-text);
            text-align: left;
            cursor: pointer;
        }
        .stepchip small {
            font-size: var(--r-label-size);
            letter-spacing: var(--r-label-track);
            text-transform: uppercase;
            line-height: 1.2;
            color: var(--r-muted);
        }
        .stepchip small:empty {
            display: none;
        }
        .stepchip b {
            display: flex;
            align-items: center;
            gap: 4px;
            max-width: 100%;
            font-size: 15px;
            font-weight: 500;
            line-height: 1.25;
        }
        .stepchip b span {
            min-width: 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .stepchip b svg {
            flex: none;
            color: var(--r-muted);
        }
    }
    @media (max-width: 380px) {
        .seg button {
            padding: 0 10px;
        }
        .seg button::after {
            left: 10px;
            right: 10px;
        }
        .cta .btn {
            padding: 0 16px;
        }
    }
`;
