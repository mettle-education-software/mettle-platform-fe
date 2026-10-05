import { css } from '@emotion/react';
import styled from '@emotion/styled';

/**
 * Tokens do leitor (cores, espaçamento, tipografia) num lugar só: ajuste aqui. Valem na página de estudo
 * (.deda-reader) e nas gavetas/folhas que abrem por cima dela (.deda-reader-drawer, fora da árvore).
 */
export const readerTokens = css`
    .deda-reader,
    .deda-reader-drawer {
        --r-bg: #2b2a29;
        --r-bg2: #232221;
        --r-surf: #363432;
        --r-surf2: #423f3c;
        --r-line: rgba(255, 255, 255, 0.11);
        --r-text: #f3ede4;
        --r-muted: #bdb4a8;
        --r-gold: #b78a5b;
        --r-gold-hi: #d3a878;
        --r-on-gold: #1d1a17;
        --r-red: #c2402f;

        --r-read-size: 20px; /* texto do passo no computador: ~65 caracteres por linha na medida abaixo */
        --r-read-line: 1.7;
        --r-read-measure: 33.5em;
        --r-ui-size: 15px;
        --r-gap: 24px;
        --r-strip-h: 56px;
        --r-dock-h: 84px; /* cabe o gravador com duas linhas: a barra não muda de altura entre os estados */
        --r-radius: 12px;
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

    /* Gavetas e folhas (antd Drawer) no escuro do leitor. */
    .deda-reader-drawer .ant-drawer-content {
        background: var(--r-bg);
        color: var(--r-text);
    }
    .deda-reader-drawer .ant-drawer-header {
        border-bottom: 1px solid var(--r-line);
    }
    .deda-reader-drawer .ant-drawer-title,
    .deda-reader-drawer .ant-drawer-close {
        color: var(--r-text);
    }
    .deda-reader-drawer .ant-drawer-close {
        min-width: 44px;
        min-height: 44px;
        order: 2;
        margin: 0;
    }
    .deda-reader-drawer.ant-drawer-bottom .ant-drawer-content {
        border-radius: 20px 20px 0 0;
        padding-bottom: env(safe-area-inset-bottom);
    }
    .deda-reader-drawer .ant-typography,
    .deda-reader-drawer p,
    .deda-reader-drawer li {
        color: var(--r-text);
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

    :focus-visible {
        outline: 2px solid var(--r-gold-hi);
        outline-offset: 2px;
    }

    .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        min-height: 44px;
        padding: 0 18px;
        border-radius: 999px;
        border: 1.5px solid transparent;
        font-weight: 600;
        font-size: var(--r-ui-size);
        line-height: 1.2;
        font-family: inherit;
        white-space: nowrap;
        background: none;
        color: var(--r-text);
        cursor: pointer;
    }
    .btn svg {
        width: 20px;
        height: 20px;
    }
    .btn.gold {
        background: var(--r-gold);
        color: var(--r-on-gold);
    }
    .btn.gold:hover:not(:disabled) {
        background: var(--r-gold-hi);
    }
    .btn.line {
        border-color: rgba(255, 255, 255, 0.38);
    }
    .btn.line:hover:not(:disabled) {
        border-color: var(--r-gold-hi);
        color: var(--r-gold-hi);
    }
    .btn:disabled {
        opacity: 0.5;
        cursor: default;
    }
    .ib {
        display: inline-grid;
        place-items: center;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        border: 0;
        background: none;
        color: var(--r-text);
        flex: none;
        cursor: pointer;
        font-size: 24px;
        line-height: 1;
    }
    .ib:hover {
        background: rgba(255, 255, 255, 0.08);
    }
    .lnk {
        background: none;
        border: 0;
        padding: 0 4px;
        min-height: 44px;
        color: var(--r-muted);
        text-decoration: underline;
        text-underline-offset: 3px;
        font-weight: 500;
        font-size: 13.5px;
        font-family: inherit;
        cursor: pointer;
    }
    .lnk:hover {
        color: var(--r-gold-hi);
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
        text-decoration-thickness: 2px;
        text-underline-offset: 5px;
        text-decoration-color: var(--r-gold-hi);
        border-radius: 2px;
    }
    .prose .term:hover,
    .prose .term[aria-expanded='true'] {
        background: rgba(183, 138, 91, 0.22);
    }
    .inote {
        position: relative;
        margin: -0.3em 0 1.3em;
        padding: 14px 48px 14px 18px;
        border-left: 3px solid var(--r-gold);
        background: var(--r-surf);
        border-radius: 0 var(--r-radius) var(--r-radius) 0;
        font-size: 15.5px;
        line-height: 1.55;
    }
    .inote h4 {
        margin: 0 0 4px;
        font-size: 15px;
        font-weight: 600;
        color: var(--r-gold-hi);
    }
    .inote h4 small {
        margin-left: 8px;
        font-size: 11px;
        font-weight: 500;
        letter-spacing: 0.1em;
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
    &.glossary .prose {
        font-size: 16.5px;
        line-height: 1.6;
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
        font-weight: 500;
        font-size: 16px;
        font-family: inherit;
        color: var(--r-text);
        text-align: left;
        cursor: pointer;
    }
    .menu button:hover,
    .menu button[aria-current] {
        background: var(--r-surf);
    }
    .menu button[aria-current] {
        color: var(--r-gold-hi);
    }
    .menu button:disabled {
        opacity: 0.45;
        cursor: default;
    }
    .menu button i {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 1.5px solid rgba(255, 255, 255, 0.3);
        display: grid;
        place-items: center;
        font-weight: 600;
        font-size: 13px;
        font-family: inherit;
        font-style: normal;
        flex: none;
    }
    .menu button.done i {
        background: var(--r-gold);
        border-color: var(--r-gold);
        color: var(--r-on-gold);
    }
    .menu button small {
        margin-left: auto;
        font-size: 12.5px;
        color: var(--r-muted);
    }
    .menu hr {
        border: 0;
        border-top: 1px solid var(--r-line);
        margin: 8px 0;
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
    grid-template-rows: auto minmax(0, 1fr) auto;
    grid-template-columns: minmax(0, 1fr); /* nada da barra empurra a largura: sem rolagem horizontal */
    background: var(--r-bg);
    color: var(--r-text);
    font-size: var(--r-ui-size);
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
        background: linear-gradient(90deg, rgba(28, 27, 26, 0.94), rgba(28, 27, 26, 0.8) 50%, rgba(28, 27, 26, 0.94));
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
        padding: 4px 8px 4px 4px;
        border: 0;
        border-radius: 10px;
        background: none;
        color: var(--r-text);
        text-align: left;
        cursor: pointer;
    }
    .idb img {
        width: 36px;
        height: 36px;
        border-radius: 8px;
        object-fit: cover;
        flex: none;
    }
    .idb b {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 17px;
        font-weight: 600;
        line-height: 1.1;
        color: var(--r-gold-hi);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .idb small {
        display: block;
        font-size: 12.5px;
        line-height: 1.2;
        color: var(--r-muted);
        white-space: nowrap;
    }
    .idb span {
        min-width: 0;
    }
    .tabs {
        display: flex;
        gap: 2px;
        margin-left: 12px;
    }
    .tabs button {
        position: relative;
        min-height: 44px;
        padding: 0 14px;
        border: 0;
        border-radius: 8px;
        background: none;
        color: var(--r-text);
        font-size: 15.5px;
        font-weight: 500;
        font-family: inherit;
        white-space: nowrap;
        cursor: pointer;
    }
    .tabs button:hover,
    .tabs button[aria-current='page'] {
        color: var(--r-gold-hi);
    }
    .tabs button[aria-current='page']::after {
        content: '';
        position: absolute;
        left: 14px;
        right: 14px;
        bottom: 4px;
        height: 2px;
        border-radius: 2px;
        background: var(--r-gold);
    }
    .sp {
        flex: 1;
    }
    .timer {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 44px;
        padding: 0 8px;
        border: 0;
        background: none;
        color: var(--r-muted);
        font-size: 13.5px;
        font-family: inherit;
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
        cursor: pointer;
    }
    .timer svg {
        width: 16px;
        height: 16px;
    }

    /* ---------- texto (a única rolagem) ---------- */
    .scroll {
        overflow-y: auto;
        overflow-x: hidden;
        overscroll-behavior: contain;
        min-height: 0;
    }
    .study {
        padding: 30px 28px 80px;
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
    .eyebrow {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 4px 12px;
        margin: 0 0 18px;
        font-size: 14.5px;
        line-height: 1.4;
        color: var(--r-muted);
    }
    .eyebrow b {
        font-size: 12.5px;
        font-weight: 600;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--r-gold-hi);
    }
    .stagecard {
        max-width: 620px;
        margin: 8px auto 0;
        text-align: center;
    }
    .stagecard img {
        display: block;
        width: 100%;
        aspect-ratio: 16 / 9;
        object-fit: cover;
        border-radius: 16px;
        box-shadow: 0 18px 50px rgba(0, 0, 0, 0.35);
    }
    .stagecard h2 {
        margin: 22px 0 6px;
        font-size: 30px;
        font-weight: 500;
        line-height: 1.15;
        color: var(--r-text);
    }
    .stagecard p {
        max-width: 28em;
        margin: 0 auto;
        font-size: 16.5px;
        line-height: 1.5;
        color: var(--r-muted);
    }
    .stagecard p.start {
        color: var(--r-gold-hi);
    }
    .video {
        max-width: 900px;
        margin: 0 auto;
        aspect-ratio: 16 / 9;
        border-radius: 14px;
        overflow: hidden;
        background: #000;
    }
    .video iframe {
        width: 100%;
        height: 100%;
        border: 0;
    }
    .endcap {
        max-width: var(--r-read-measure);
        margin: 28px auto 0;
        padding-top: 24px;
        border-top: 1px solid var(--r-line);
        font-size: 14.5px;
        color: var(--r-muted);
    }

    /* passo 5: dias */
    .days {
        display: grid;
        grid-template-columns: repeat(7, minmax(0, 1fr));
        gap: 6px;
        margin: 0 0 10px;
    }
    .days button {
        min-height: 56px;
        padding: 4px 0;
        border: 1.5px solid var(--r-line);
        border-radius: var(--r-radius);
        background: none;
        color: var(--r-text);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 3px;
        font-size: 13.5px;
        font-weight: 600;
        font-family: inherit;
        cursor: pointer;
    }
    .days button small {
        height: 14px;
        display: flex;
        align-items: center;
        font-size: 11px;
        font-weight: 500;
        color: var(--r-muted);
    }
    .days button small svg {
        width: 13px;
        height: 13px;
    }
    .days button.today {
        border-color: var(--r-gold);
    }
    .days button[aria-pressed='true'] {
        border-color: var(--r-gold);
        background: rgba(183, 138, 91, 0.2);
    }
    .days button:disabled {
        opacity: 0.42;
        border-style: dashed;
        cursor: default;
    }
    .daykey {
        display: flex;
        flex-wrap: wrap;
        gap: 4px 14px;
        margin: 0 0 20px;
        font-size: 12.5px;
        line-height: 1.4;
        color: var(--r-muted);
    }
    .daykey span {
        display: inline-flex;
        align-items: center;
        gap: 4px;
    }
    .daykey svg {
        width: 13px;
        height: 13px;
    }
    .past {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 8px 14px;
        margin: 0 0 20px;
        padding: 8px 8px 8px 16px;
        border-radius: var(--r-radius);
        background: rgba(183, 138, 91, 0.16);
        font-size: 14.5px;
        line-height: 1.4;
    }

    /* ---------- barra fixa ---------- */
    .dock {
        background: var(--r-bg2);
        border-top: 1px solid var(--r-line);
    }
    .dock .in {
        display: flex;
        align-items: center;
        gap: 20px;
        min-height: var(--r-dock-h);
        max-width: 1320px;
        margin: 0 auto;
        padding: 8px 20px;
    }
    .pips {
        display: flex;
        align-items: center;
        flex: none;
    }
    .pips button {
        position: relative;
        width: 44px;
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
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 1.5px solid rgba(255, 255, 255, 0.3);
        display: grid;
        place-items: center;
        font-size: 13.5px;
        font-weight: 600;
        font-style: normal;
        color: var(--r-muted);
    }
    .pips button i svg {
        width: 16px;
        height: 16px;
    }
    .pips button.done i {
        background: var(--r-gold);
        border-color: var(--r-gold);
        color: var(--r-on-gold);
    }
    .pips button.cur i {
        border-color: var(--r-gold-hi);
        color: var(--r-gold-hi);
        box-shadow: 0 0 0 3px rgba(183, 138, 91, 0.28);
    }
    .pips button.cur.done i {
        color: var(--r-on-gold);
    }
    .pips button + button::before {
        content: '';
        position: absolute;
        left: -7px;
        width: 14px;
        height: 1.5px;
        background: rgba(255, 255, 255, 0.22);
    }
    .pips button:not(:disabled):hover i {
        border-color: var(--r-gold-hi);
    }
    .stl {
        flex: none;
        min-width: 128px;
        font-size: 16px;
        font-weight: 600;
        line-height: 1.2;
    }
    .stl small {
        display: block;
        font-size: 12.5px;
        font-weight: 400;
        color: var(--r-muted);
    }
    .mid {
        flex: 1;
        min-width: 0;
        display: flex;
        align-items: center;
        min-height: 52px;
        padding: 0 20px;
        border-left: 1px solid var(--r-line);
        border-right: 1px solid var(--r-line);
    }
    .mid > * {
        flex: 1;
        min-width: 0;
    }
    .hint {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14.5px;
        color: var(--r-muted);
    }
    .hint svg {
        width: 20px;
        height: 20px;
        flex: none;
    }
    .cta {
        display: flex;
        gap: 8px;
        flex: none;
    }

    /* player do react-audio-play no escuro da barra */
    .dock .rap-container {
        max-width: none;
        height: 48px;
        padding: 0;
        box-shadow: none;
    }
    .dock .rap-container .rap-controls {
        margin: 0 0 0 16px;
        font-family: inherit;
        font-size: 13px;
        font-variant-numeric: tabular-nums;
    }
    .dock .rap-container .rap-pp-button {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: var(--r-gold);
        display: grid;
        place-items: center;
        flex: none;
    }
    .dock .rap-container .rap-pp-button svg path {
        fill: var(--r-on-gold);
    }
    .dock .rap-container .rap-slider .rap-progress .rap-pin {
        background-color: var(--r-gold-hi);
    }

    /* ---------- celular ---------- */
    @media (max-width: 860px) {
        .strip {
            padding: 0 6px 0 4px;
            gap: 2px;
        }
        .study {
            padding: 20px 22px 48px;
        }
        .stagecard h2 {
            font-size: 26px;
        }
        .days {
            gap: 4px;
        }
        .days button {
            font-size: 12.5px;
        }
        .days button .wd {
            display: none;
        }
        .segs {
            display: grid;
            grid-template-columns: repeat(var(--n, 6), 1fr);
            gap: 3px;
            height: 3px;
        }
        .segs i {
            background: rgba(255, 255, 255, 0.16);
        }
        .segs i.done {
            background: var(--r-gold);
        }
        .segs i.cur {
            background: var(--r-gold-hi);
            opacity: 0.6;
        }
        .dock .mid {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            min-height: 56px;
            padding: 8px 14px 0;
            border: 0;
        }
        .dock .mid:empty {
            display: none;
        }
        .dock .nav {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 12px calc(8px + env(safe-area-inset-bottom));
        }
        .stepchip {
            flex: 1;
            min-width: 0;
            display: flex;
            align-items: center;
            gap: 10px;
            min-height: 48px;
            padding: 0 6px 0 0;
            border: 0;
            border-radius: var(--r-radius);
            background: none;
            color: var(--r-text);
            text-align: left;
            cursor: pointer;
        }
        .stepchip i {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: 1.5px solid var(--r-gold-hi);
            display: grid;
            place-items: center;
            font-size: 13px;
            font-weight: 600;
            font-style: normal;
            color: var(--r-gold-hi);
            flex: none;
        }
        .stepchip b {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 15.5px;
            font-weight: 600;
            line-height: 1.2;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .stepchip small {
            display: block;
            font-size: 12px;
            color: var(--r-muted);
        }
        .stepchip span {
            min-width: 0;
        }
        .cta .btn {
            padding: 0 16px;
        }
    }
    @media (max-width: 380px) {
        .stepchip {
            gap: 8px;
        }
        .stepchip b {
            font-size: 14.5px;
        }
        .cta .btn {
            padding: 0 12px;
            gap: 4px;
        }
    }
`;
