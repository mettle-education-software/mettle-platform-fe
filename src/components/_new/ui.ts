import { css, keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import { ui } from 'themes/newDesign';

const pulse = keyframes`
    0%, 100% { opacity: 0.55; }
    50% { opacity: 1; }
`;

/** Modais e balões das páginas novas (antd, fora da árvore): corpo em grade, rótulos e destaque do nível. */
export const popupStyles = css`
    @media (max-width: 860px) {
        .ui-new-modal input,
        .ui-new-modal select,
        .ui-new-modal textarea,
        .ui-new-modal .ant-select-selection-item,
        .ui-new-modal .ant-select-selection-placeholder,
        .ui-new-modal .ant-select-selection-search-input,
        .ant-select-dropdown .ant-select-item,
        .ant-select-dropdown input {
            font-size: 16px;
        }
    }
    .ui-new-modal .ant-btn-primary:not(:disabled) {
        background: var(--r-gold);
        color: var(--r-on-gold);
    }
    .ui-new-modal .ant-btn-primary:not(:disabled):hover,
    .ui-new-modal .ant-btn-primary:not(:disabled):active {
        background: var(--r-gold-hi);
        color: var(--r-on-gold);
    }
    .ui-new-modal .ant-modal-content {
        padding: 24px 24px 20px;
    }
    .ui-new-modal .modal-body {
        display: grid;
        gap: 14px;
        padding: 12px 0 8px;
        font-size: 14.5px;
        line-height: 1.5;
    }
    /* o corpo é uma grade: sem isto a coluna cresce com o texto longo (ex.: nome + e-mail) e empurra o botão para fora */
    .ui-new-modal .modal-body {
        grid-template-columns: minmax(0, 1fr);
    }
    .ui-new-modal .ant-select-selection-item {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .ui-new-modal .modal-body p {
        margin: 0;
    }
    /* segmentos de alunos no painel de administração: o mesmo controle segmentado das páginas, compacto */
    .ui-new-modal .modal-body .seg {
        display: flex;
        gap: 4px;
        max-width: 100%;
        margin: 0 0 12px;
        padding: 4px;
        border: 1px solid var(--r-line);
        /* cabe numa linha no computador; no celular quebra em duas (nada escondido por rolagem) */
        flex-wrap: wrap;
        border-radius: 20px;
        background: var(--r-surf);
    }
    .ui-new-modal .modal-body .seg button {
        flex: 1 1 auto;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        min-height: 34px;
        padding: 0 10px;
        border: 0;
        border-radius: 999px;
        background: none;
        color: var(--r-muted);
        font: inherit;
        font-size: 12.5px;
        white-space: nowrap;
        cursor: pointer;
    }
    .ui-new-modal .modal-body .seg button:hover {
        color: var(--r-text);
        background: var(--r-hover);
    }
    .ui-new-modal .modal-body .seg button[aria-pressed='true'] {
        background: var(--r-gold);
        color: var(--r-on-gold);
        font-weight: 500;
    }
    .ui-new-modal .modal-body .seg .n {
        font-variant-numeric: tabular-nums;
        opacity: 0.75;
    }
    .ui-new-modal .modal-body .eyebrow {
        margin: 0 0 -6px;
        font-size: 11px;
        font-weight: 500;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--r-muted);
    }
    .ui-new-modal .modal-body .level {
        padding: 12px 14px;
        border-radius: 10px;
        background: var(--r-gold-tint);
    }
    .ui-new-modal .modal-body .level strong {
        font-weight: 500;
        color: var(--r-gold-hi);
    }
    .ui-new-modal .ant-select-selection-placeholder {
        color: var(--r-muted);
    }
    .ui-new-modal .modal-body .hint {
        font-size: 13px;
        color: var(--r-muted);
    }
    /* título com o seletor de idioma (EN | PT) à direita, antes do X */
    .ui-new-modal .title-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-right: 36px;
    }
    .ui-new-modal .lang {
        display: inline-flex;
        flex: none;
        padding: 2px;
        border: 1px solid var(--r-line-strong);
        border-radius: 999px;
    }
    .ui-new-modal .lang button {
        min-width: 36px;
        height: 26px;
        padding: 0 8px;
        border: 0;
        border-radius: 999px;
        background: none;
        color: var(--r-muted);
        font: inherit;
        font-size: 11.5px;
        font-weight: 500;
        letter-spacing: 0.08em;
        cursor: pointer;
    }
    .ui-new-modal .lang button:hover {
        color: var(--r-text);
    }
    .ui-new-modal .lang button[aria-pressed='true'] {
        background: var(--r-gold-tint);
        color: var(--r-gold-hi);
    }
    .ui-new-modal .lang button:focus-visible {
        outline: 2px solid var(--r-gold-hi);
        outline-offset: 1px;
    }
`;

/**
 * Página da plataforma nova: coluna centrada, cabeçalho, seções, grades e cards. Só apresentação; os dados e as
 * ações vêm dos mesmos hooks das páginas atuais. Tokens em themes/newDesign (`--r-*`).
 */
const enter = keyframes`
    from { opacity: 0.4; }
`;

export const Page = styled.div`
    ${ui};
    /* troca de página: só o conteúdo entra com um esmaecer curto; a casca fica (movimento reduzido: sem animação) */
    animation: ${enter} 160ms ease-out;
    max-width: 1180px;
    margin: 0 auto;
    padding: 36px 32px 72px;

    &.wide {
        max-width: 1320px;
    }
    /* painel (home do IMERSO): até 1440px nas telas grandes; nos notebooks a coluna disponível já é menor */
    &.xwide {
        max-width: 1440px;
    }
    &.narrow {
        max-width: 860px;
    }
    /* molde de aula: trilho encostado à esquerda, sem a coluna centrada */
    &.lesson {
        max-width: none;
        padding: 0;
    }
    /* página que ocupa a área inteira da casca e rola por dentro (Mettle Chat) */
    &.fill {
        height: 100%;
    }

    /* ---------- cabeçalho da página ---------- */
    .ph {
        margin: 0 0 32px;
    }
    .ph .eyebrow {
        margin-bottom: 10px;
    }
    .ph .ctx {
        margin-top: 8px;
        font-size: 13.5px;
        letter-spacing: 0.01em;
        color: var(--r-muted);
    }
    .ph .ctx b {
        font-weight: 500;
        color: var(--r-text);
    }
    /* cabeçalho com abas (PageHead): abas à direita do título a partir de 1024 px; abaixo, sob o título */
    .phead {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 16px 32px;
    }
    .phead .phead-id {
        flex: 1 1 360px;
        min-width: 0;
    }
    .phead .seg {
        flex: none;
        margin: 0;
    }
    @media (max-width: 1023px) {
        .phead .seg {
            display: flex;
            flex: 1 1 100%;
        }
        .phead .seg button {
            flex: 1 1 auto;
        }
    }
    /* citação: leitura leve, sem moldura */
    .ph .quote {
        max-width: 44em;
        margin-top: 14px;
        font-family: var(--r-read-font), system-ui, sans-serif;
        font-size: 16px;
        font-style: italic;
        line-height: 1.55;
        color: var(--r-muted);
    }
    .ph .quote cite {
        display: block;
        margin-top: 4px;
        font-family: inherit;
        font-size: 12.5px;
        font-style: normal;
        letter-spacing: 0.02em;
        color: var(--r-faint);
    }

    /* ---------- seções ---------- */
    section + section {
        margin-top: 44px;
    }
    .sh {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px 16px;
        min-height: 44px;
        margin: 0 0 12px;
    }
    .sh h2 {
        min-width: 0;
        font-size: 20px;
        font-weight: 400;
        letter-spacing: 0.005em;
    }
    .sh h2 span {
        margin-left: 6px;
        font-weight: 400;
        color: var(--r-muted);
    }
    .sh .lnk {
        margin-right: -8px;
    }

    /* ---------- aviso com ação (início, pausa, conclusão do DEDA) ---------- */
    .notice {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 14px 24px;
        margin: 0 0 40px;
        padding: 20px 24px;
        border: 1px solid var(--r-line);
        border-left: 2px solid var(--r-gold);
        border-radius: var(--r-radius);
        background: var(--r-surf);
    }
    .notice > div {
        flex: 1 1 320px;
        min-width: 0;
    }
    .notice b {
        display: block;
        margin: 0 0 4px;
        font-size: 17px;
        font-weight: 500;
        line-height: 1.3;
    }
    .notice p {
        font-size: 14px;
        line-height: 1.5;
        color: var(--r-muted);
    }
    .notice p strong {
        font-weight: 500;
        color: var(--r-text);
    }
    .notice .btn {
        flex: none;
    }

    /* ---------- grades ---------- */
    .grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 28px 20px;
    }
    .cards {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 28px 20px;
    }

    /* ---------- card de curso/programa (home) ---------- */
    .cc {
        display: block;
        position: relative;
        color: var(--r-text);
        text-decoration: none;
        border-radius: var(--r-radius);
        cursor: pointer;
    }
    .cc .img {
        position: relative;
        display: block;
        aspect-ratio: 16 / 10;
        border-radius: var(--r-radius);
        overflow: hidden;
        background: var(--r-surf);
    }
    .cc img,
    .dc img,
    .hc img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition:
            transform 400ms ease,
            opacity var(--r-ease);
    }
    .cc:hover img,
    .dc:hover:not(:disabled) img,
    .hc:hover img {
        transform: scale(1.03);
    }
    .cc.locked img,
    .dc.locked img {
        opacity: 0.35;
        filter: saturate(0.5);
    }
    .lock {
        position: absolute;
        inset: 0;
        margin: auto;
        color: var(--r-faint);
    }
    .cc .meta,
    .dc .meta {
        display: flex;
        align-items: center;
        gap: 8px;
        min-height: 16px;
        margin: 12px 0 3px;
        font-size: var(--r-label-size);
        font-weight: 500;
        letter-spacing: var(--r-label-track);
        text-transform: uppercase;
        line-height: 1.4;
        color: var(--r-muted);
    }
    .meta em {
        font-style: normal;
        color: var(--r-gold-hi);
    }
    .meta svg {
        flex: none;
        color: var(--r-gold-hi);
    }
    .cc b,
    .dc b {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        font-size: 15.5px;
        font-weight: 500;
        line-height: 1.3;
    }
    .cc .act {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        min-height: 36px;
        margin-top: 4px;
        font-size: 13.5px;
        letter-spacing: 0.01em;
        color: var(--r-gold-hi);
    }
    .cc .act svg {
        transition: transform var(--r-ease);
    }
    .cc:hover .act svg {
        transform: translateX(2px);
    }
    .cc.locked .act,
    .cc.locked b {
        color: var(--r-muted);
    }
    /* card trancado (convite): cadeado pequeno no canto, nunca sobre o logotipo da capa */
    .cc .lock {
        inset: 10px 10px auto auto;
        margin: 0;
        color: var(--r-text);
        opacity: 0.75;
    }
    .cc.still {
        cursor: default;
    }
    .cc .ctx {
        display: block;
        margin-top: 2px;
        font-size: 12.5px;
        letter-spacing: 0.01em;
        color: var(--r-muted);
    }
    /* o card expirado é um botão (abre o convite de renovação): mesmo desenho do link */
    button.cc {
        width: 100%;
        padding: 0;
        border: 0;
        background: none;
        text-align: left;
        font: inherit;
    }
    /* DEDA de hoje (home): imagem à esquerda, texto à direita */
    .cc.today {
        display: grid;
        grid-template-columns: 280px minmax(0, 1fr);
        align-items: center;
        gap: 0 28px;
        max-width: 780px;
    }
    .cc.today .img {
        grid-row: 1 / 5;
        aspect-ratio: 16 / 10;
    }
    .cc.today .meta {
        flex-wrap: wrap;
        margin-top: 0;
    }
    .cc.today .meta small {
        white-space: nowrap;
    }
    .cc.today b {
        font-size: 24px;
        font-weight: 400;
    }
    /* o resto da home fica mais quieto que o DEDA de hoje */
    .cards .cc b {
        font-weight: 400;
    }

    /* ---------- card de DEDA ---------- */
    .dc {
        display: block;
        width: 100%;
        padding: 0;
        border: 0;
        border-radius: var(--r-radius);
        background: none;
        color: var(--r-text);
        text-align: left;
        font: inherit;
        cursor: pointer;
    }
    .dc .img {
        position: relative;
        display: block;
        aspect-ratio: 4 / 3;
        border-radius: var(--r-radius);
        overflow: hidden;
        background: var(--r-surf);
    }
    .dc.current .img {
        box-shadow: 0 0 0 1.5px var(--r-gold);
    }
    .dc .cats {
        display: block;
        margin-top: 3px;
        font-size: 12.5px;
        letter-spacing: 0.01em;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: var(--r-faint);
    }
    .dc:disabled {
        cursor: default;
    }
    .dc:disabled b {
        color: var(--r-muted);
    }
    .dc.skel .img {
        animation: ${pulse} 1.4s ease-in-out infinite;
    }
    .dc.skel b {
        display: block;
        height: 14px;
        width: 60%;
        margin-top: 14px;
        border-radius: 7px;
        background: var(--r-surf);
    }

    /* ---------- DEDA atual (cabeçalho de /imerso/deda) ---------- */
    .cur {
        position: relative;
        display: flex;
        align-items: flex-end;
        min-height: 230px;
        margin: 0 0 40px;
        border-radius: 16px;
        overflow: hidden;
        background: var(--r-surf);
    }
    .cur .art {
        position: absolute;
        inset: 0;
    }
    .cur .art img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center 42%;
    }
    .cur .art span {
        position: absolute;
        inset: 0;
        background: linear-gradient(
            180deg,
            rgba(var(--r-bg-rgb), 0.08) 0%,
            rgba(var(--r-bg-rgb), 0.72) 62%,
            rgba(var(--r-bg-rgb), 0.92)
        );
    }
    .cur .over {
        position: relative;
        display: flex;
        flex-wrap: wrap;
        align-items: flex-end;
        justify-content: space-between;
        gap: 16px 24px;
        width: 100%;
        padding: 28px;
    }
    .cur .over > div {
        min-width: 0;
        flex: 1 1 320px;
    }
    .cur h1 {
        margin-top: 8px;
        font-size: 32px;
        overflow-wrap: anywhere;
    }
    .cur .eyebrow {
        color: var(--r-muted);
    }
    .cur .eyebrow em {
        font-style: normal;
        color: var(--r-gold-hi);
    }

    /* ---------- HPEC: lições do módulo liberado, numa fila ---------- */
    .hrow {
        display: flex;
        gap: 16px;
        margin: 0 -4px;
        padding: 4px 4px 10px;
        overflow-x: auto;
        scroll-snap-type: x proximity;
        /* o encaixe respeita o recuo de 4px: sem isso a fila rola 4px e o anel do primeiro card sai cortado */
        scroll-padding-inline: 4px;
        scrollbar-width: thin;
        scrollbar-color: var(--r-track) transparent;
    }
    .hrow::-webkit-scrollbar {
        height: 4px;
    }
    .hrow::-webkit-scrollbar-thumb {
        background: var(--r-track);
        border-radius: 2px;
    }
    .hc {
        flex: 0 0 250px;
        scroll-snap-align: start;
        display: block;
        color: var(--r-text);
        text-decoration: none;
        border-radius: var(--r-radius);
    }
    .hc .img {
        position: relative;
        display: block;
        aspect-ratio: 16 / 9;
        border-radius: var(--r-radius);
        overflow: hidden;
        background: var(--r-surf);
    }
    /* anel do primeiro card por dentro da imagem: nada fica de fora para a fila (overflow) cortar */
    .hc.first .img::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
        box-shadow: inset 0 0 0 1.5px var(--r-gold);
        pointer-events: none;
    }
    .hc .t {
        display: block;
        margin-top: 10px;
        font-size: 14px;
        font-weight: 500;
        line-height: 1.3;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .hc small {
        display: block;
        margin-top: 2px;
        font-size: var(--r-label-size);
        font-weight: 500;
        letter-spacing: var(--r-label-track);
        text-transform: uppercase;
        color: var(--r-muted);
    }
    .hc.first small {
        color: var(--r-gold-hi);
    }
    .hc.skel .img {
        animation: ${pulse} 1.4s ease-in-out infinite;
    }

    /* ---------- abas e formulários ---------- */
    /* abas da página: controle segmentado (o mesmo da LAMP), claramente clicável; a aba aberta em dourado */
    .seg {
        display: inline-flex;
        gap: 4px;
        max-width: 100%;
        margin: 0 0 32px;
        padding: 4px;
        border: 1px solid var(--r-line);
        border-radius: 999px;
        background: var(--r-surf);
        overflow-x: auto;
        scrollbar-width: none;
    }
    .seg::-webkit-scrollbar {
        display: none;
    }
    .seg button {
        position: relative;
        min-height: 40px;
        padding: 0 22px;
        border: 0;
        border-radius: 999px;
        background: none;
        color: var(--r-muted);
        font-size: 14.5px;
        font-weight: 400;
        letter-spacing: 0.01em;
        white-space: nowrap;
        cursor: pointer;
    }
    .seg button:hover {
        color: var(--r-text);
        background: var(--r-hover);
    }
    .seg button[aria-selected='true'] {
        background: var(--r-gold);
        color: var(--r-on-gold);
        font-weight: 500;
    }
    /* Configurações: edição por campo e dados de acesso só para leitura. */
    &.settings > section + section {
        margin-top: 28px;
    }
    &.settings .sh {
        min-height: 32px;
        margin-bottom: 8px;
    }
    .profile-edit,
    .profile-photo {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    .profile-edit .ant-input {
        min-width: 0;
    }
    .profile-avatar {
        display: grid;
        place-items: center;
        width: 64px;
        height: 64px;
        overflow: hidden;
        border-radius: 50%;
        background: var(--r-hover);
        font-size: 24px;
    }
    .profile-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    .profile-error {
        color: var(--r-error);
        font-size: 13px;
        margin: 6px 0 0;
    }
    .profile-saved {
        color: var(--r-muted);
        font-size: 13px;
    }
    .settings-data,
    .settings-data dd {
        margin: 0;
    }
    .settings-data .field {
        overflow-wrap: anywhere;
    }
    .panel h2 {
        font-size: 20px;
    }
    .panel > .hint {
        margin: 4px 0 20px;
    }
    .rows {
        border-top: 1px solid var(--r-line);
    }
    .row {
        display: grid;
        grid-template-columns: 220px minmax(0, 1fr);
        gap: 8px 24px;
        align-items: center;
        padding: 18px 0;
        border-bottom: 1px solid var(--r-line);
    }
    .row > label,
    .row > .lab {
        font-size: 14px;
        line-height: 1.4;
        color: var(--r-muted);
    }
    .row .lab b {
        display: flex;
        align-items: center;
        gap: 6px;
        font-weight: 400;
        color: var(--r-text);
    }
    .row .lab span {
        display: block;
        margin-top: 2px;
        font-size: 12.5px;
        color: var(--r-faint);
    }
    .row .lab span strong {
        font-weight: 500;
        color: var(--r-muted);
    }
    .row .lab svg {
        color: var(--r-faint);
    }
    .row .field {
        min-width: 0;
    }
    .row .field .ant-form-item {
        margin: 0;
    }
    .row .field .ant-form-item-explain {
        margin-top: 6px;
        font-size: 12.5px;
    }
    .actions {
        display: flex;
        justify-content: flex-end;
        padding: 20px 0 0;
    }
    /* Histórico do programa (Configurações → IMERSO): título + a mesma lista de linhas */
    .history {
        margin-top: 36px;
    }
    .history h3 {
        margin: 0 0 12px;
        font-size: 16px;
        font-weight: 500;
    }
    .history ol.rows {
        margin: 0;
        padding: 0;
        list-style: none;
    }
    .history .row {
        padding: 14px 0;
    }
    .history .row .field {
        font-variant-numeric: tabular-nums;
        color: var(--r-text);
    }
    .links {
        display: grid;
        gap: 2px;
    }
    .links a {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 44px;
        color: var(--r-text);
        text-decoration: none;
    }
    .links a:hover {
        color: var(--r-gold-hi);
    }
    .links a svg {
        color: var(--r-faint);
    }

    /* ---------- celular ---------- */
    @media (max-width: 1100px) {
        .grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
        }
    }
    @media (max-width: 860px) {
        padding: 20px 20px 56px;

        &.lesson {
            padding: 0;
        }

        .ph {
            margin-bottom: 24px;
        }
        section + section {
            margin-top: 36px;
        }
        .grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 20px 14px;
        }
        .cards {
            grid-template-columns: minmax(0, 1fr);
            gap: 24px;
        }
        .cc b,
        .dc b {
            font-size: 14.5px;
        }
        .cc.today {
            grid-template-columns: 128px minmax(0, 1fr);
            gap: 0 14px;
        }
        /* o convite é secundário: card trancado em linha (miniatura + nome), nunca a primeira tela inteira */
        .cards .cc.locked {
            display: grid;
            grid-template-columns: 128px minmax(0, 1fr);
            align-content: center;
            gap: 0 14px;
        }
        .cards .cc.locked .img {
            grid-row: 1 / span 3;
            align-self: center;
        }
        .cards .cc.locked .meta {
            margin-top: 0;
        }
        .cards .cc.locked .act {
            min-height: 0;
        }
        .dc .cats {
            font-size: 12px;
        }
        .notice {
            padding: 18px 18px;
            margin-bottom: 32px;
        }
        .notice .btn {
            flex: 1 1 100%;
        }
        .cur {
            min-height: 200px;
            margin-bottom: 32px;
        }
        .cur .over {
            padding: 20px;
        }
        .cur h1 {
            font-size: 26px;
        }
        .cur .btn {
            flex: 1 1 100%;
        }
        .cur .wd {
            display: none;
        }
        .seg {
            display: flex;
            margin-bottom: 24px;
        }
        .seg button {
            flex: 1 1 auto;
            padding: 0 12px;
            font-size: 14px;
        }
        .hc {
            flex-basis: 210px;
        }
        .row {
            grid-template-columns: minmax(0, 1fr);
            gap: 8px;
            padding: 16px 0;
        }
        .actions .ant-btn {
            width: 100%;
        }
    }
    @media (max-width: 400px) {
        .grid {
            gap: 16px 12px;
        }
    }
`;
