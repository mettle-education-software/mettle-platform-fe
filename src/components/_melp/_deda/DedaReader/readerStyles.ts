import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { DARK, LIGHT, LIGHT_ROOT, LK_LIGHT, tokenText } from 'themes/newDesign';

/** Ícones da página nova (lucide): traço fino e um tamanho só; exceções passam `size`. */
export const ICON = { size: 20, strokeWidth: 1.5 } as const;

/**
 * Tokens do leitor (cores, espaçamento, tipografia) num lugar só: ajuste aqui. Valem na página de estudo
 * (.deda-reader) e nas gavetas/folhas que abrem por cima dela (.deda-reader-drawer, fora da árvore).
 */
export const readerTokens = css`
    /* Cores nos dois temas: as mesmas da plataforma nova (themes/newDesign: DARK e LIGHT). */
    [data-reader-theme='dark'],
    .reader-theme-dark,
    .deda-reader-shell-on .context-note-drawer {
        ${tokenText(DARK)}
        /* LinKnowledge entra sem alteração: o contêiner devolve o que ele herda na página atual (fundo claro do Layout). */
        --r-lk-inherit-color: rgba(0, 0, 0, 0.88);
        color-scheme: dark;
    }
    ${LIGHT_ROOT} [data-reader-theme='dark'],
    ${LIGHT_ROOT} .reader-theme-dark,
    ${LIGHT_ROOT} .deda-reader-shell-on .context-note-drawer {
        ${tokenText(LIGHT)}
        color-scheme: light;
    }

    .deda-reader,
    .deda-reader-drawer {
        /* --r-scale: tamanho escolhido no "Aa" (0,9 a 1,3; padrão 1), posto no <html> enquanto a página nova está
           aberta. A medida da coluna é em em: acompanha o tamanho. */
        --r-read-size: calc(20px * var(--r-scale, 1)); /* computador: ~65 caracteres por linha na medida abaixo */
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
            --r-read-size: calc(18px * var(--r-scale, 1));
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
        font-size: calc(15.5px * var(--r-scale, 1));
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
    /* nota aberta de dentro de uma folha: "‹" discreto + termo, no lugar do título */
    .deda-reader-drawer .sheet-back {
        display: flex;
        align-items: center;
        gap: 2px;
        margin-left: -12px;
        min-width: 0;
    }
    .deda-reader-drawer .sheet-back .ib {
        display: inline-grid;
        place-items: center;
        flex: none;
        width: 44px;
        height: 44px;
        padding: 0;
        border: 0;
        border-radius: 50%;
        background: none;
        color: var(--r-muted);
        cursor: pointer;
    }
    .deda-reader-drawer .sheet-back .ib:hover {
        background: var(--r-hover);
        color: var(--r-text);
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
    /* Leitor de artigo do LinKnowledge (MettleArticleReader, sem alteração): só o texto do artigo segue o "Aa". */
    .deda-reader-shell-on article:has(> #mettle-article-title) :is(p, li) {
        font-size: calc(1.15rem * var(--r-scale, 1));
    }
    .deda-reader-shell-on article:has(> #mettle-article-title) blockquote p {
        font-size: calc(1.3rem * var(--r-scale, 1));
    }
    /* Leitores do LinKnowledge (artigo e vídeo; ArticleReaderModal, fora da árvore): seguem o tema da conta, escuro no
       escuro e claro no claro (folha, cabeçalho e texto). Só valem com a página nova aberta (classe no <body>). */
    .deda-reader-shell-on .article-reader :is(.ant-modal-content, .ant-drawer-content) {
        background: var(--r-sheet);
        color: var(--r-text);
        box-shadow: var(--r-sheet-shadow);
    }
    .deda-reader-shell-on .article-reader .ant-drawer-header {
        background: var(--r-sheet-head);
        border-bottom: 1px solid var(--r-line);
    }
    .deda-reader-shell-on .article-reader :is(.ant-drawer-close, .ant-modal-close) {
        color: var(--r-muted);
    }
    .deda-reader-shell-on .article-reader :is(.ant-drawer-close, .ant-modal-close):hover {
        color: var(--r-text);
        background: var(--r-hover);
    }
    .deda-reader-shell-on .article-reader .ant-modal-mask,
    .deda-reader-shell-on .article-reader .ant-drawer-mask {
        background: var(--r-mask);
    }
    .deda-reader-shell-on .article-reader :is(h1, h2, h3, h4, h5, h6, .ant-typography, article) {
        color: var(--r-text);
    }
    .deda-reader-shell-on .article-reader :is(.ant-typography-secondary, article > span.ant-typography) {
        color: var(--r-muted) !important;
    }
    .deda-reader-shell-on .article-reader :is(p, li, blockquote, figcaption) {
        color: var(--r-text);
    }
    /* botões do leitor (Day N anterior/seguinte): o leitor abre fora do tema antd da casca, então o branco do antd claro vazava */
    .deda-reader-shell-on .article-reader .ant-btn-default {
        background: transparent;
        color: var(--r-text);
        border-color: var(--r-line-strong);
    }
    .deda-reader-shell-on .article-reader .ant-btn-default:hover {
        background: var(--r-hover);
        color: var(--r-text);
        border-color: var(--r-gold-hi);
    }
    .deda-reader-shell-on .article-reader .ant-btn-primary {
        background: var(--r-gold);
        color: var(--r-on-gold);
    }
    .deda-reader-shell-on .article-reader .ant-btn-primary:hover {
        background: var(--r-gold-hi);
        color: var(--r-on-gold);
    }
    /* termo de consentimento do gravador (modal/folha, fora da árvore): segue o tema */
    .deda-reader-shell-on .recording-consent :is(.ant-modal-content, .ant-drawer-content) {
        background: var(--r-sheet);
        color: var(--r-text);
        box-shadow: var(--r-sheet-shadow);
    }
    .deda-reader-shell-on .recording-consent :is(h2, p, li, div) {
        color: var(--r-text);
    }
    .deda-reader-shell-on .recording-consent [role='alert'] {
        color: var(--r-error) !important;
    }
    .deda-reader-shell-on .recording-consent .actions .ghost {
        color: var(--r-text);
        border-color: var(--r-line-strong);
    }
    .deda-reader-shell-on .recording-consent .actions button:focus-visible {
        outline-color: var(--r-gold-hi);
    }
    .deda-reader-shell-on .article-reader a {
        color: var(--r-gold-hi);
    }
    .deda-reader-shell-on .article-reader :is(hr, blockquote) {
        border-color: var(--r-line-strong);
    }
    .deda-reader-shell-on .article-reader article blockquote {
        border-left-color: var(--secondary);
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
    .btn.tint {
        background: var(--r-gold-tint);
        color: var(--r-gold-hi);
    }
    .btn:disabled {
        opacity: 0.45;
        cursor: default;
    }
    /* dourado desabilitado legível nos dois temas (a 45% o rótulo claro sumia sobre o bege do tema claro) */
    .btn.gold:disabled {
        opacity: 1;
        background: var(--r-surf);
        border-color: var(--r-line-strong);
        color: var(--r-muted);
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
        font-size: calc(15.5px * var(--r-scale, 1));
        line-height: 1.55;
    }
    .inote h4 {
        margin: 0 0 4px;
        font-size: calc(15px * var(--r-scale, 1));
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
        &,
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
        font-size: calc(16.5px * var(--r-scale, 1));
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

    &[hidden] {
        display: none;
    }
    /* nota de contexto no lugar da citação: entra suave, na leitura das outras notas */
    &.note {
        max-width: 34em;
        margin: 0 auto;
        animation: r-sheet-swap 200ms ease;
    }
    &.note .ant-typography {
        font-family: inherit;
        font-size: calc(15.5px * var(--r-scale, 1));
        line-height: 1.6;
    }
    @keyframes r-sheet-swap {
        from {
            opacity: 0;
            transform: translateX(8px);
        }
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

/** Seletor "Aa" (tamanho do texto): na faixa do topo e no cabeçalho do leitor de artigo do LinKnowledge. */
const textSizeStyles = css`
    /* "Aa": tamanho do texto de leitura */
    .tsize {
        display: inline-flex;
    }
    .tsize .panel {
        position: absolute;
        right: 0;
        top: calc(100% + 6px);
        display: flex;
        padding: 6px;
        border: 1px solid var(--r-line);
        border-radius: 14px;
        background: var(--r-sheet-head);
        box-shadow: 0 10px 30px var(--r-card-shadow);
        animation: r-pop var(--r-ease);
    }
    .tsize .panel button {
        display: grid;
        place-items: center;
        width: 44px;
        height: 44px;
        padding: 0;
        border: 0;
        border-radius: 10px;
        background: none;
        color: var(--r-muted);
        font-family: var(--r-read-font), system-ui, sans-serif;
        line-height: 1;
        cursor: pointer;
    }
    .tsize .panel button:hover {
        color: var(--r-text);
    }
    .tsize .panel button[aria-checked='true'] {
        background: var(--r-gold-tint);
        color: var(--r-text);
    }
`;

export const Shell = styled.div`
    ${shared};
    position: fixed;
    inset: 0;
    z-index: 900; /* acima do layout da Plataforma; abaixo das gavetas e modais do antd (1000) */
    animation: r-fade 160ms ease-out; /* entra sobre a casca com um esmaecer curto, sem corte seco */
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
        z-index: 4; /* o seletor "Aa" abre por cima do corpo */
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
    /* abas da página (DEDA Notes / DEDA / Review / My recordings): controle segmentado como o da LAMP, sobre a faixa */
    .tabs {
        display: flex;
        align-self: center;
        gap: 4px;
        margin-left: 16px;
        padding: 3px;
        border: 1px solid var(--r-line);
        border-radius: 999px;
        background: rgba(var(--r-bg-rgb), 0.72);
    }
    .tabs button {
        position: relative;
        min-height: 34px;
        padding: 0 16px;
        border: 0;
        border-radius: 999px;
        background: none;
        color: var(--r-muted);
        font-size: 14px;
        font-weight: 400;
        letter-spacing: 0.01em;
        font-family: inherit;
        white-space: nowrap;
        cursor: pointer;
    }
    .tabs button:hover {
        color: var(--r-text);
        background: var(--r-hover);
    }
    .tabs button[aria-current='page'] {
        background: var(--r-gold);
        color: var(--r-on-gold);
        font-weight: 500;
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
    /* aviso de início: o próprio cronômetro diz "Timer started" por alguns segundos, em dourado */
    .timer span {
        animation: r-fade 240ms ease;
    }
    .timer.fresh {
        color: var(--r-gold-hi);
    }
    @keyframes r-fade {
        from {
            opacity: 0;
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
    ${textSizeStyles};

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
        /* troca de aba: o corpo novo entra com um esmaecer curto (a faixa do topo fica) */
        animation: r-tab-in 160ms ease-out;
    }
    @keyframes r-tab-in {
        from {
            opacity: 0.4;
        }
    }
    .scroll:focus {
        outline: none; /* recebe o foco a cada passo/aba para o teclado rolar o texto; não é um controle */
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
        max-width: 670px; /* a coluna de leitura no tamanho padrão */
        font-size: inherit;
    }
    .hint {
        font-size: 13.5px;
        color: var(--r-muted);
    }
    /* rótulo do passo e, na mesma linha, o ⓘ (alvo de 44 px que não aumenta a altura da linha) */
    .eyebrow {
        position: relative;
        display: flex;
        align-items: center;
        min-height: 16px;
        margin: 0 0 20px;
        font-size: var(--r-label-size);
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
    /* ⓘ: a explicação abre para baixo, alinhada ao começo da linha do rótulo (o contêiner com position: relative),
       sem cobrir o rótulo e sem sair da coluna */
    .info {
        display: inline-flex;
        flex: none;
    }
    .info button {
        display: grid;
        place-items: center;
        width: 44px;
        height: 44px;
        margin: -14px 0 -14px -8px;
        padding: 0;
        border: 0;
        border-radius: 50%;
        background: none;
        color: var(--r-faint);
        cursor: pointer;
    }
    .info button:hover,
    .info button[aria-expanded='true'] {
        color: var(--r-gold-hi);
    }
    .info .tip:not([hidden]) {
        position: absolute;
        left: 0;
        top: calc(100% + 10px);
        z-index: 3;
        display: block;
        width: max-content;
        max-width: min(340px, 100%);
        padding: 12px 14px;
        border: 1px solid var(--r-line);
        border-radius: var(--r-radius);
        background: var(--r-sheet-head);
        box-shadow: 0 10px 30px var(--r-card-shadow);
        font-size: 13.5px;
        font-weight: 400;
        line-height: 1.5;
        letter-spacing: 0;
        text-transform: none;
        text-align: left;
        white-space: normal;
        color: var(--r-text);
        animation: r-pop var(--r-ease);
    }
    /* sem espaço embaixo: o balão abre para cima da linha do rótulo */
    .info .tip.up:not([hidden]) {
        top: auto;
        bottom: calc(100% + 10px);
        animation-name: r-pop-up;
    }
    @keyframes r-pop {
        from {
            opacity: 0;
            transform: translateY(-4px);
        }
    }
    @keyframes r-pop-up {
        from {
            opacity: 0;
            transform: translateY(4px);
        }
    }

    /* Summary: os cinco quesitos, de 1 a 5 */
    .summary h2 {
        margin: 0 0 6px;
        font-size: 22px;
        font-weight: 400;
        line-height: 1.3;
        letter-spacing: 0.005em;
        color: var(--r-text);
    }
    .summary ul {
        list-style: none;
        margin: 0;
        padding: 0;
    }
    .summary li {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0 16px;
        padding: 8px 0;
        border-bottom: 1px solid var(--r-line);
    }
    .summary li:last-child {
        border-bottom: 0;
    }
    .crit {
        display: flex;
        align-items: center;
        min-width: 0;
        font-size: 16px;
        line-height: 1.4;
        color: var(--r-text);
    }
    .stars {
        display: flex;
        align-items: center;
        flex: none;
        margin-right: -10px; /* a última estrela encosta na margem da coluna */
    }
    .stars button {
        display: grid;
        place-items: center;
        width: 44px;
        height: 44px;
        padding: 0;
        border: 0;
        border-radius: 50%;
        background: none;
        color: var(--r-line-strong);
        cursor: pointer;
    }
    .stars button svg {
        transition:
            fill var(--r-ease),
            stroke var(--r-ease);
    }
    .stars button.on svg {
        fill: var(--r-gold);
        stroke: var(--r-gold);
    }
    .stars button:not(.on):not(:disabled):hover {
        color: var(--r-gold-hi);
    }
    .stars button:disabled {
        cursor: default;
        opacity: 0.6;
    }
    .stars .word {
        order: -1;
        min-width: 84px;
        padding-right: 8px;
        font-size: 12.5px;
        letter-spacing: 0.02em;
        text-align: right;
        color: var(--r-muted);
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

    /* player compacto (react-audio-play) da barra e da linha de My recordings — os únicos players dentro da casca: botão dourado com o ícone no centro óptico, trilho fino, tempos discretos */
    .rap-container {
        max-width: none;
        height: 44px;
        padding: 0;
        box-shadow: none;
        font-family: inherit;
    }
    .rap-container .rap-pp-button {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: var(--r-gold);
        display: grid;
        place-items: center;
        flex: none;
        transition: background-color var(--r-ease);
    }
    .rap-container .rap-pp-button:hover {
        background: var(--r-gold-hi);
    }
    .rap-container .rap-pp-button svg {
        display: block;
        width: 14px;
        height: 14px;
    }
    .rap-container .rap-pp-button svg path {
        fill: var(--r-on-gold);
    }
    /* centro óptico: o triângulo do play pesa para a esquerda; desloca 1/6 da largura (3 de 18 unidades). O pause é simétrico. */
    .rap-container .rap-pp-button svg path[d^='M18 12L0'] {
        transform: translateX(3px);
    }
    .rap-container .rap-controls {
        margin: 0 0 0 14px;
        font-family: inherit;
        font-size: 12px;
        letter-spacing: 0.02em;
        font-variant-numeric: tabular-nums;
        color: var(--r-muted);
    }
    .rap-container .rap-controls > .rap-slider {
        margin: 0 12px;
        height: 2px;
        border-radius: 2px;
        background: var(--r-track);
    }
    .rap-container .rap-controls > .rap-slider .rap-pin {
        width: 10px;
        height: 10px;
        top: -4px;
        right: -5px;
        box-shadow: none;
    }
    .rap-container .rap-slider .rap-progress .rap-pin {
        background-color: var(--r-gold-hi);
    }
    /* tempo total e volume: respiro entre os dois; ícone do volume no peso do resto */
    .rap-container .rap-volume {
        margin-left: 14px;
        display: grid;
        place-items: center;
    }
    .rap-container .rap-volume-btn svg {
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
    /* "Skip today" e o foco dos botões do gravador seguem o tema (os do componente são claros, feitos para o cartão escuro) */
    .dock [aria-label='Reading recorder'] .link {
        color: var(--r-muted);
    }
    .dock [aria-label='Reading recorder'] .link:hover {
        color: var(--r-text);
    }
    .dock [aria-label='Reading recorder'] button:focus-visible {
        outline-color: var(--r-gold-hi);
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
    /* "My reading | Original": pílula baixa e leve; a área de toque de cada lado continua com 44 px de altura */
    .dock .docked .switch {
        padding: 2px;
        background: none;
        border: 1px solid var(--r-line);
    }
    .dock .docked .switch button {
        position: relative;
        min-height: 30px;
        padding: 0 14px;
        font-size: 13px;
        font-weight: 400;
        letter-spacing: 0.01em;
    }
    .dock .docked .switch button::after {
        content: '';
        position: absolute;
        inset: -8px 0;
    }
    .dock .docked .switch button[aria-pressed='true'] {
        background: var(--r-gold-tint);
        color: var(--r-gold-hi);
    }
    /* passo 4 sem gravação hoje: faixas à esquerda e um "Record" pequeno à direita, na mesma linha e altura */
    .dock .docked .swrow {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        width: 100%;
        min-width: 0;
    }
    .dock .docked .rec {
        position: relative;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 34px;
        padding: 0 14px;
        border: 1px solid var(--r-line-strong);
        border-radius: 999px;
        background: none;
        color: var(--r-text);
        font: inherit;
        font-size: 13px;
        letter-spacing: 0.01em;
        white-space: nowrap;
        cursor: pointer;
    }
    .dock .docked .rec::after {
        content: '';
        position: absolute;
        inset: -5px 0;
    }
    .dock .docked .rec svg {
        color: var(--r-gold-hi);
    }
    .dock .docked .rec:hover {
        border-color: var(--r-gold-hi);
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
        padding: 10px 16px;
        background: var(--r-bg);
    }
    /* sub-abas (Introduction / Glossary / LinKnowledge): o mesmo controle, um degrau abaixo (aba aberta em tom suave) */
    .seg {
        display: flex;
        gap: 4px;
        max-width: 100%;
        padding: 3px;
        border: 1px solid var(--r-line);
        border-radius: 999px;
        background: var(--r-surf);
    }
    .seg button {
        position: relative;
        min-height: 34px;
        padding: 0 18px;
        border: 0;
        border-radius: 999px;
        background: none;
        color: var(--r-muted);
        font-size: 14px;
        font-weight: 400;
        letter-spacing: 0.01em;
        white-space: nowrap;
        cursor: pointer;
    }
    .seg button:hover {
        color: var(--r-text);
        background: var(--r-hover);
    }
    .seg button[aria-pressed='true'] {
        background: var(--r-gold-tint);
        color: var(--r-gold-hi);
        font-weight: 500;
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
    /* montado em segundo plano (sem espaço, invisível, sem foco) enquanto outra sub-aba está aberta */
    .lk.off {
        height: 0 !important;
        padding: 0 !important;
        overflow: hidden;
        visibility: hidden;
        pointer-events: none;
    }
    .lk {
        font-size: 16px;
        font-weight: normal;
        line-height: normal;
        color: var(--r-lk-inherit-color);
        padding-bottom: 48px;
    }
    /* Tema claro: o LinKnowledge troca só as cores (mesma estrutura, carrosséis e comportamento): superfície marfim um
       tom acima do fundo (não branca), painéis e cards claros com texto escuro; o card do dia segue dourado. Recuado e
       com cantos, em vez de uma faixa escura de ponta a ponta. */
    ${LIGHT_ROOT} & .lk {
        padding: 20px 20px 48px;
    }
    ${LIGHT_ROOT} & .lk > * {
        border-radius: 16px;
        overflow: hidden;
        background: ${LK_LIGHT.bg};
    }
    ${LIGHT_ROOT} & .lk .ant-card {
        background: ${LK_LIGHT.panel};
        border-color: var(--r-line);
    }
    ${LIGHT_ROOT} & .lk .ant-card h4,
    ${LIGHT_ROOT} & .lk .ant-card .ant-card-head-title {
        color: ${LK_LIGHT.text};
    }
    ${LIGHT_ROOT} & .lk .ant-card .ant-btn {
        color: ${LK_LIGHT.arrow};
    }
    ${LIGHT_ROOT} & .lk button[aria-label^='Day '] {
        background: ${LK_LIGHT.card};
        color: ${LK_LIGHT.text};
        box-shadow: 0 1px 0 var(--r-line);
    }
    ${LIGHT_ROOT} & .lk button[aria-label^='Day ']:hover,
    ${LIGHT_ROOT} & .lk button[aria-label^='Day ']:focus-visible {
        background: ${LK_LIGHT.cardHover};
    }
    ${LIGHT_ROOT} & .lk button[aria-label^='Day ']:not([aria-current]) > div:last-child > span {
        color: ${LK_LIGHT.text};
    }
    /* pílula "TODAY" no tema claro: nada de caixa escura. Os podcasts mantêm as cores próprias (da capa) nos dois temas. */
    ${LIGHT_ROOT} & .lk button[aria-label^='Day '] > div:last-child span[aria-hidden] {
        background: ${LK_LIGHT.card};
        color: ${LK_LIGHT.todayText};
    }
    /* "Day N · gênero" nos cards comuns: dourado do tema com contraste AA nos dois temas (o do dia mantém o escuro) */
    .lk button[aria-label^='Day ']:not([aria-current]) .ant-typography {
        color: var(--r-gold-hi) !important;
    }
    /* podcasts: duração e tempos em branco pleno e botões num tom mais fundo do fundo do card (AA nos dois temas) */
    .lk [role='group'] :is(span, div) {
        opacity: 1;
    }
    .lk [role='group'] div button {
        background: rgba(0, 0, 0, 0.2);
    }

    /* ---------- Review e My recordings ---------- */
    .tabpage {
        max-width: 1180px;
        margin: 0 auto;
        padding: 28px 28px 72px;
    }
    .tabpage h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 400;
        line-height: 1.3;
        letter-spacing: 0.005em;
        color: var(--r-text);
    }
    .review .head {
        position: relative;
        display: flex;
        align-items: center;
        margin: 0 0 20px;
    }
    .review .head .info button {
        margin: -9px 0 -9px -4px;
    }
    .review .cards {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 32px 24px;
    }
    .review .cards li {
        min-width: 0;
    }
    .review .when {
        display: flex;
        align-items: baseline;
        gap: 8px;
        margin: 0 0 10px;
        font-size: var(--r-label-size);
        letter-spacing: var(--r-label-track);
        text-transform: uppercase;
        line-height: 1.4;
        color: var(--r-muted);
    }
    .review .when b {
        font-weight: 500;
        color: var(--r-text);
    }
    .review .video {
        max-width: none;
        border-radius: var(--r-radius);
    }
    .review .video.placeholder {
        display: grid;
        place-items: center;
        background: none;
        border: 1px dashed var(--r-line-strong);
        font-size: 13.5px;
        color: var(--r-faint);
    }
    .review .meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        min-height: 44px;
        margin-top: 10px;
    }
    .review .name {
        min-width: 0;
    }
    /* título longo: até duas linhas, depois reticências (o título inteiro fica no title) */
    .review .name b {
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
        font-size: 15px;
        font-weight: 500;
        line-height: 1.3;
        color: var(--r-text);
    }
    .review .name small {
        display: block;
        margin-top: 2px;
        font-size: 12px;
        letter-spacing: 0.02em;
        color: var(--r-muted);
    }
    .review .meta .btn {
        position: relative;
        flex: none;
        min-height: 36px;
        padding: 0 14px;
        font-size: 13px;
    }
    .review .meta .btn::after {
        content: '';
        position: absolute;
        inset: -4px 0;
    }
    .review .empty {
        margin: 0;
        padding: 40px 24px;
        border: 1px dashed var(--r-line-strong);
        border-radius: var(--r-radius);
        font-size: 15px;
        line-height: 1.5;
        color: var(--r-muted);
    }

    .recs {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 36px 56px;
    }
    @media (min-width: 861px) {
        .recs {
            grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
            align-items: start;
        }
    }
    .recs h2 {
        margin: 0 0 16px;
    }
    /* três indicadores numa linha só, separados por um fio: mesma altura, rótulo sem quebra */
    .stats {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        margin: 0;
    }
    .stats > div {
        min-width: 0;
        padding: 0 0 0 14px;
        border-left: 1px solid var(--r-line);
    }
    .stats > div:first-of-type {
        padding-left: 0;
        border-left: 0;
    }
    .stats dt {
        font-size: 12px;
        letter-spacing: 0.02em;
        white-space: nowrap;
        color: var(--r-muted);
    }
    .stats dd {
        margin: 4px 0 0;
        font-size: 20px;
        font-weight: 400;
        line-height: 1.3;
        font-variant-numeric: tabular-nums;
        color: var(--r-text);
    }
    .stats small {
        display: block;
        margin-top: 2px;
        font-size: 12px;
        letter-spacing: 0.02em;
        white-space: nowrap;
        color: var(--r-muted);
    }
    .bars {
        list-style: none;
        display: grid;
        grid-template-columns: repeat(7, minmax(0, 1fr));
        height: 112px;
        margin: 28px 0 0;
        padding: 0;
    }
    .bars li {
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        align-items: center;
        gap: 8px;
        font-size: 11px;
        letter-spacing: 0.04em;
        color: var(--r-muted);
    }
    .bar {
        width: 6px;
        min-height: 6px;
        border-radius: 3px;
        background: var(--r-gold);
    }
    .bar.none {
        width: 4px;
        height: 4px;
        min-height: 0;
        border-radius: 50%;
        background: var(--r-track);
    }
    .list {
        list-style: none;
        margin: 0;
        padding: 0;
        border-top: 1px solid var(--r-line);
    }
    /* a linha do dia e a mesma linha tocando têm a mesma altura: nada salta */
    .row {
        display: flex;
        align-items: center;
        gap: 4px;
        min-height: 60px;
        border-bottom: 1px solid var(--r-line);
    }
    .row .play {
        flex: 1;
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 14px;
        min-height: 60px;
        padding: 0;
        border: 0;
        background: none;
        color: var(--r-text);
        text-align: left;
        cursor: pointer;
    }
    .row .play i {
        display: grid;
        place-items: center;
        flex: none;
        width: 40px;
        height: 40px;
        border: 1px solid var(--r-ring);
        border-radius: 50%;
        color: var(--r-gold-hi);
        transition: border-color var(--r-ease);
    }
    .row .play i svg {
        transform: translateX(1px); /* centro óptico do triângulo */
    }
    .row .play:hover i {
        border-color: var(--r-gold-hi);
    }
    .row .day {
        flex: 1;
        min-width: 0;
    }
    .row .day b {
        display: block;
        font-size: 15px;
        font-weight: 500;
        line-height: 1.3;
    }
    .row .day span {
        display: block;
        margin-top: 1px;
        font-size: 12px;
        letter-spacing: 0.02em;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: var(--r-muted);
    }
    .row .duration {
        flex: none;
        padding: 0 8px;
        font-size: 14px;
        font-variant-numeric: tabular-nums;
        color: var(--r-muted);
    }
    .row.none {
        gap: 10px;
        min-height: 44px;
        padding-left: 54px; /* alinha "Day N" com o das linhas gravadas (botão de 40 + 14) */
        font-size: 13.5px;
        color: var(--r-faint);
    }
    .row.none b {
        font-weight: 400;
        color: var(--r-muted);
    }
    /* confirmação de "Remove" na própria linha: pergunta curta, dois botões finos; a ação destrutiva é discreta */
    .rowc {
        gap: 8px;
        padding-left: 54px; /* a pergunta começa onde começa "Day N" nas outras linhas */
        animation: r-fade 200ms ease;
    }
    .rowc .ask {
        flex: 1;
        min-width: 0;
    }
    .rowc .ask b {
        display: block;
        font-size: 15px;
        font-weight: 500;
        line-height: 1.3;
    }
    .rowc .ask span {
        display: block;
        margin-top: 1px;
        font-size: 12px;
        letter-spacing: 0.02em;
        color: var(--r-muted);
    }
    .rowc .btn {
        flex: none;
        min-height: 36px;
        padding: 0 14px;
        font-size: 13px;
    }
    .btn.danger {
        color: var(--r-danger);
    }
    .btn.danger:hover:not(:disabled) {
        border-color: var(--r-danger);
        color: var(--r-danger);
    }
    .rowp .rap-container {
        flex: 1;
        min-width: 0;
    }
    .rowp .rap-volume {
        display: none;
    }
    .rowp .msg {
        flex: 1;
        margin: 0;
        font-size: 13.5px;
        color: var(--r-muted);
    }
    .hint.recs {
        margin: 0;
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
            padding: 20px 22px 48px;
        }
        .review .cards {
            grid-template-columns: minmax(0, 1fr);
        }
        .rowc {
            padding-left: 0;
        }
        .rowc .ask span {
            display: none; /* a pergunta basta; a linha fica numa altura só */
        }
        /* Summary: rótulo em cima, estrelas embaixo, tudo começando na margem do texto */
        .summary li {
            flex-wrap: wrap;
            padding: 12px 0 4px;
        }
        .crit {
            flex: 1 1 100%;
        }
        .stars {
            margin: 0 0 0 -10px;
        }
        .stars .word {
            order: 0;
            padding: 0 0 0 8px;
            text-align: left;
        }
        /* toque: a área do passo é sempre rolável (1 px a mais que a tela), então o gesto nunca passa para a
           página de trás nem depende do que acontece na barra */
        .study {
            min-height: calc(100% + 1px);
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
        .stagecard h2 {
            font-size: 22px;
        }
        .days {
            gap: 4px;
        }
        .days button .wd {
            display: none;
        }
        .timer .wd {
            display: none;
        }
        .timer.fresh span {
            text-transform: capitalize;
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

/** "Aa" no cabeçalho claro do leitor de artigo: o gatilho herda a cor do cabeçalho; o painel é o mesmo, escuro. */
export const ArticleTools = styled.span`
    ${textSizeStyles};
    position: relative;
    z-index: 2;
    display: inline-flex;
    font-family: var(--r-ui-font), system-ui, sans-serif;

    /* computador (antd Modal): ao lado do X, no canto do popup */
    .ant-modal-header & {
        position: absolute;
        top: 2px;
        right: 48px;
    }
    .tsize {
        position: relative;
    }
    .ib {
        display: inline-grid;
        place-items: center;
        width: 44px;
        height: 44px;
        padding: 0;
        border: 0;
        border-radius: 50%;
        background: none;
        color: inherit;
        cursor: pointer;
        transition: background-color var(--r-ease, 180ms ease);
    }
    .ib:hover {
        background: var(--r-hover-on-light);
    }
    .ib:focus-visible,
    .panel button:focus-visible {
        outline: 2px solid var(--r-gold);
        outline-offset: 2px;
    }
`;
