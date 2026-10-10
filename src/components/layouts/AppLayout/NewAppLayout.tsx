'use client';

import { css, Global, keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import { Drawer } from 'antd';
import { NewPage } from 'components/_new/NewPage';
import { NewContentLoading } from 'components/_new/NewStatus';
import { RunChip } from 'components/_new/RunGold';
import { ThemeCycle, ThemeSwitch } from 'components/_new/ThemeSwitch';
import { Logo } from 'components/atoms/Logo/Logo';
import { auth } from 'config/firebase';
import { useDeviceSize } from 'hooks';
import { useDedaRun } from 'hooks/melp/lampDays';
import { useProfile } from 'hooks/useProfile';
import { useLogoTheme } from 'hooks/useTheme';
import { saoPauloWeekday } from 'libs';
import { ADMIN_PANEL_PATH, adminPanelPath } from 'libs/adminPanel';
import { graceNotices } from 'libs/myProducts';
import { activeMenuKeys, displayName, MENU_OPEN_EVENT, readMenuCollapsed, saveMenuCollapsed } from 'libs/newDesign';
import { IMERSO_PRODUCT, IMERSO_SALES_URL, RENEWAL_URLS, renewalNotice, shellGate } from 'libs/productAccess';
import { VIEW_ONLY_EVENT } from 'libs/viewOnly';
import {
    GraduationCap,
    Eye,
    Headset,
    House,
    LogOut,
    Menu as MenuIcon,
    PanelLeftClose,
    PanelLeftOpen,
    Settings,
    ShieldCheck,
    Users,
    TriangleAlert,
    X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AccessCtaBlock, useAppContext, useMelpContext, useProductAccess } from 'providers';
import React, { forwardRef, useEffect, useMemo, useState } from 'react';
import { accountService } from 'services';
import { ICON, platformTokens, UI_FONT_CLASS, UI_FONT_VAR, ui } from 'themes/newDesign';
import { useAppMenu } from './appMenu';

/* ---------- estilos ---------- */

const chrome = css`
    ${ui};
    background: var(--r-bg2);

    .it {
        position: relative;
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
        min-height: 44px;
        padding: 0 12px;
        border: 0;
        border-radius: 10px;
        background: none;
        color: var(--r-text);
        font-size: 15px;
        font-weight: 400;
        letter-spacing: 0.01em;
        text-align: left;
        white-space: nowrap;
        cursor: pointer;
    }
    .it svg {
        flex: none;
        color: var(--r-muted);
    }
    .it .lbl {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    /* o rótulo do IMERSO é um Typography do antd (fonte da Plataforma): segue a fonte e a cor do item */
    .it .ant-typography {
        font: inherit;
        color: inherit;
        letter-spacing: inherit;
    }
    .it:hover:not(:disabled):not([aria-disabled='true']),
    .it:active:not(:disabled):not([aria-disabled='true']) {
        background: var(--r-hover);
    }
    .it[aria-current='page'],
    .it[aria-current='page'] svg,
    .grp.on > .it svg {
        color: var(--r-gold-hi);
    }
    .it:disabled,
    .it[aria-disabled='true'] {
        opacity: 0.45;
        cursor: default;
    }
    /* respostas não vistas do suporte (Mettle Chat); no menu recolhido vira um ponto sobre o ícone */
    .it .badge {
        margin-left: auto;
        min-width: 18px;
        height: 18px;
        padding: 0 5px;
        border-radius: 9px;
        background: var(--r-gold);
        color: var(--r-on-gold);
        font-size: 11px;
        font-weight: 600;
        line-height: 18px;
        text-align: center;
        font-variant-numeric: tabular-nums;
    }
    .it.s {
        min-height: 40px;
        padding-left: 44px;
        font-size: 14px;
        color: var(--r-muted);
    }
    .it.s[aria-current='page'] {
        color: var(--r-gold-hi);
    }
    .nav {
        display: grid;
        gap: 2px;
        padding: 0 12px;
    }
    .grp {
        position: relative;
    }
    .sub {
        display: grid;
        gap: 2px;
    }

    .melp {
        display: block;
        min-width: 0;
        padding: 12px 24px;
        border-top: 1px solid var(--r-line);
    }
    .melp small {
        display: block;
        font-size: var(--r-label-size);
        font-weight: 500;
        letter-spacing: var(--r-label-track);
        text-transform: uppercase;
        color: var(--r-muted);
    }
    .melp b {
        display: block;
        margin-top: 2px;
        font-size: 15px;
        font-weight: 500;
        line-height: 1.3;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .melp > span {
        display: block;
        margin-top: 1px;
        font-size: 12.5px;
        letter-spacing: 0.02em;
        color: var(--r-muted);
        white-space: nowrap;
    }
    .melp span.melp-run {
        margin-top: 8px;
    }
    .user {
        display: flex;
        align-items: center;
        gap: 12px;
        min-height: 44px;
        padding: 0 12px;
        font-size: 14px;
        color: var(--r-muted);
    }
    .av {
        display: grid;
        place-items: center;
        flex: none;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        overflow: hidden;
        background: var(--r-surf);
        border: 1px solid var(--r-line);
        font-size: 12px;
        font-weight: 500;
        color: var(--r-text);
        text-transform: uppercase;
    }
    .av img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    /* rodapé: avatar + nome completo numa linha (reticências só se for enorme) e o seletor de tema na linha de baixo */
    .who {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 4px;
        min-width: 0;
    }
    .who .user {
        flex: none;
        min-width: 0;
    }
    .who .theme {
        flex: none;
        align-self: flex-start;
        margin-left: 12px;
    }
    .user .lbl {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
`;

/* recolher/expandir o menu: UMA transição só (largura da coluna + largura dos itens + rótulos), 200 ms ease-out */
const MENU_MS = '200ms';
const MENU_EASE = 'ease-out';
const railFade = keyframes`from { opacity: 0; } to { opacity: 1; }`;

const Frame = styled.div`
    ${ui};
    display: grid;
    grid-template-columns: var(--r-sb-w) minmax(0, 1fr);
    height: 100vh;
    height: 100dvh;
    width: 100%;
    overflow: hidden;
    background: var(--r-bg);
    transition: grid-template-columns ${MENU_MS} ${MENU_EASE};

    &.rail {
        grid-template-columns: var(--r-rail-w) minmax(0, 1fr);
    }
    /* app instalado: a faixa da barra de status (env(safe-area-inset-top), 0 fora dele) é sólida e sem texto */
    &.m {
        grid-template-columns: minmax(0, 1fr);
        grid-template-rows: calc(var(--r-bar-h) + env(safe-area-inset-top, 0px)) minmax(0, 1fr);
    }
    &.immersive {
        grid-template-columns: minmax(0, 1fr);
        grid-template-rows: minmax(0, 1fr);
        padding-top: env(safe-area-inset-top, 0px);
        transition: none;
    }
    /* leitor com tema próprio: a faixa de cima acompanha o papel */
    &.immersive:has(.t-sepia) {
        background: #f3e9d2;
    }
    &.immersive:has(.t-night) {
        background: #000000;
    }

    .main {
        position: relative;
        min-height: 0;
        min-width: 0;
        overflow-y: auto;
        overflow-x: hidden;
        overscroll-behavior: contain;
        background: var(--r-bg);
    }

    /* ---------- menu lateral (computador) ---------- */
    .sb {
        ${chrome};
        display: flex;
        flex-direction: column;
        min-height: 0;
        overflow: hidden;
        border-right: 1px solid var(--r-line);
    }
    .brand {
        position: relative;
        display: flex;
        align-items: center;
        min-height: 64px;
        padding: 10px 10px 6px 24px;
        transition:
            min-height ${MENU_MS} ${MENU_EASE},
            padding ${MENU_MS} ${MENU_EASE};
    }
    /* o botão de recolher fica sempre no canto; ao recolher só desce para baixo do símbolo */
    .brand .ib {
        position: absolute;
        top: 10px;
        right: 10px;
        transition: top ${MENU_MS} ${MENU_EASE};
    }
    .logo {
        display: flex;
        align-items: center;
        min-height: 44px;
        width: 112px;
        color: inherit;
        border-radius: 8px;
        transition: width ${MENU_MS} ${MENU_EASE};
    }
    .logo:focus-visible {
        outline: 2px solid var(--r-gold-hi);
        outline-offset: 2px;
    }
    .logo svg {
        display: block;
        width: 100%;
        height: auto;
    }
    .sb .nav {
        padding: 0 10px;
    }
    .sb .foot {
        display: grid;
        gap: 2px;
        margin-top: auto;
        padding: 8px 10px 14px;
    }
    .sb .foot .melp {
        margin: 0 -10px 6px;
        padding: 12px 24px;
    }
    /* itens: a largura e o rótulo mudam juntos; o rótulo continua no lugar (só some em fade), sem salto */
    .sb .it,
    .sb .user {
        overflow: hidden;
        transition:
            width ${MENU_MS} ${MENU_EASE},
            padding ${MENU_MS} ${MENU_EASE},
            background-color var(--r-ease),
            color var(--r-ease),
            opacity var(--r-ease);
    }
    .sb .it .lbl,
    .sb .user .lbl {
        transition: opacity ${MENU_MS} ${MENU_EASE};
    }
    .sb .it:focus-visible {
        outline-offset: -2px;
    }
    .sb .sub {
        max-height: 200px;
        overflow: hidden;
        transition:
            max-height ${MENU_MS} ${MENU_EASE},
            opacity ${MENU_MS} ${MENU_EASE};
    }
    .sb .ib {
        color: var(--r-muted);
    }
    .sb .ib:hover {
        color: var(--r-text);
    }

    /* recolhido: trilho de ícones; cada item encolhe a um quadrado de 44 px (o ícone não se mexe) e o rótulo some em fade */
    &.rail .brand {
        align-items: flex-start;
        min-height: 112px;
        padding-left: 10px;
    }
    &.rail .brand .ib {
        top: 62px;
    }
    &.rail .logo {
        width: 44px;
        justify-content: center;
    }
    /* max-width: o svg do Logo traz width: 100% inline, que venceria um width aqui */
    &.rail .logo svg {
        max-width: 26px;
        margin: 0 auto;
    }
    &.rail .it:not(.s) {
        width: 44px;
    }
    &.rail .it .lbl,
    &.rail .user .lbl {
        opacity: 0;
    }
    &.rail .it .badge {
        position: absolute;
        top: 8px;
        left: 26px;
        min-width: 8px;
        width: 8px;
        height: 8px;
        padding: 0;
        font-size: 0;
    }
    &.rail .melp {
        display: none;
    }
    /* recolhido: só o número da DEDA Run, no centro do trilho */
    .rail-run {
        display: flex;
        justify-content: center;
        margin: 4px 0 8px;
    }
    &.rail .user {
        width: 44px;
        padding: 0 8px;
    }
    &.rail .who {
        align-items: center;
        gap: 2px;
    }
    &.rail .who .theme {
        margin-left: 0;
        align-self: center;
    }
    /* o que troca de forma ao recolher (símbolo, rodapé) entra em fade; A/B reinicia a animação a cada clique */
    &.swapA .logo,
    &.swapA .who,
    &.swapA .melp {
        animation: ${railFade} ${MENU_MS} ${MENU_EASE};
    }
    &.swapB .logo,
    &.swapB .who,
    &.swapB .melp {
        animation: ${railFade} ${MENU_MS} ${MENU_EASE} 0.001s;
    }
    /* IMERSO recolhido: a lista fecha em altura/fade; HPEC/DEDA/LAMP voltam num balão ao lado, ao passar o mouse ou focar */
    &.rail .sub {
        max-height: 0;
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transition:
            max-height ${MENU_MS} ${MENU_EASE},
            opacity ${MENU_MS} ${MENU_EASE},
            visibility 0s linear ${MENU_MS};
    }
    /* o menu recolhido corta o que passa da borda; só depois da animação o balão do IMERSO pode sair dele (antes ficava
       cortado e aparecia só uma faixa clara fina na borda interna) */
    &.rail.settled .sb {
        overflow: visible;
    }
    &.rail .grp:not([data-closed]):hover .sub,
    &.rail .grp:not([data-closed]):focus-within .sub {
        display: grid;
        position: absolute;
        left: calc(100% + 6px);
        top: 0;
        z-index: 6;
        min-width: 160px;
        max-height: none;
        overflow: visible;
        opacity: 1;
        visibility: visible;
        pointer-events: auto;
        padding: 6px;
        border: 1px solid var(--r-line);
        border-radius: 12px;
        background: var(--r-sheet-head);
        box-shadow: 0 10px 30px var(--r-card-shadow);
        transition: none;
    }
    &.rail .sub .it .lbl {
        opacity: 1;
    }
    &.rail .grp:not([data-closed]):hover .sub::before,
    &.rail .grp:not([data-closed]):focus-within .sub::before {
        content: '';
        position: absolute;
        left: -8px;
        top: 0;
        width: 8px;
        height: 100%;
    }
    &.rail .it.s {
        justify-content: flex-start;
        padding: 0 12px;
    }

    /* ---------- barra do celular ---------- */
    /* sticky no topo: o Safari 26 (iOS) reconhece a barra fixa e estende a cor dela sob a barra de status, em vez de
       aplicar o desfoque de borda (scroll edge effect) por cima da primeira linha de texto da barra */
    .bar {
        ${chrome};
        position: sticky;
        top: 0;
        z-index: 5;
        display: flex;
        align-items: center;
        gap: 4px;
        padding: env(safe-area-inset-top, 0px) 8px 0 4px;
        background: var(--r-bg2); /* sólido: nada translúcido sob a barra de status */
        border-bottom: 1px solid var(--r-line);
    }
    .bar .logo {
        width: 96px;
    }
    .bar .melp {
        margin-left: auto;
        padding: 0 4px;
        border: 0;
        text-align: right;
        min-width: 0;
        max-width: 50%;
    }
    .bar .melp small {
        display: none;
    }
    .bar .melp b {
        margin: 0;
        font-size: 13px;
    }
    .bar .melp span {
        font-size: 11.5px;
    }

    /* ---------- avisos da casca ---------- */
    /* impersonação: a linha fina "Visualizando como …", sempre à vista no alto da área de conteúdo */
    .viewas {
        position: sticky;
        top: 0;
        z-index: 5;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 4px 12px;
        padding: 8px 20px;
        border-bottom: 1px solid var(--r-line);
        background: var(--r-surf);
        font-size: 13.5px;
        line-height: 1.4;
        color: var(--r-muted);
    }
    .viewas b {
        font-weight: 500;
        color: var(--r-text);
    }
    .viewas svg {
        flex: none;
        color: var(--r-gold-hi);
    }
    .viewas span {
        flex: 1;
        min-width: 200px;
    }
    .viewas .lnk {
        min-height: 36px;
        margin-right: -8px;
    }
    .grace {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 4px 12px;
        padding: 8px 20px;
        border-bottom: 1px solid var(--r-line);
        background: var(--r-gold-tint);
        font-size: 13.5px;
        line-height: 1.4;
        color: var(--r-text);
    }
    .grace svg {
        flex: none;
        color: var(--r-gold-hi);
    }
    .grace span {
        flex: 1;
        min-width: 200px;
    }
    .grace .lnk {
        min-height: 36px;
        margin-right: -8px;
    }
`;

/* gaveta do celular (antd Drawer, fora da árvore): mesmo acabamento das folhas da página do DEDA */
const drawerStyles = css`
    .ui-new-drawer .ant-drawer-content {
        ${chrome};
        background: var(--r-sheet);
        color: var(--r-text);
        border-right: 1px solid var(--r-line);
    }
    .ui-new-drawer .ant-drawer-content-wrapper {
        box-shadow: var(--r-sheet-shadow);
    }
    .ui-new-drawer .ant-drawer-mask {
        background: var(--r-mask) !important;
    }
    .ui-new-drawer .ant-drawer-header {
        background: var(--r-sheet-head);
        border-bottom: 1px solid var(--r-line);
        padding: 10px 12px 10px 24px;
        min-height: 60px;
    }
    .ui-new-drawer .ant-drawer-title,
    .ui-new-drawer .ant-drawer-close {
        color: var(--r-text);
    }
    .ui-new-drawer .ant-drawer-close {
        display: inline-grid;
        place-items: center;
        width: 44px;
        height: 44px;
        order: 2;
        margin: 0;
        border-radius: 50%;
        color: var(--r-muted);
    }
    .ui-new-drawer .ant-drawer-close:hover {
        background: var(--r-hover);
        color: var(--r-text);
    }
    .ui-new-drawer .ant-drawer-body {
        display: flex;
        flex-direction: column;
        padding: 12px 0 16px;
    }
    .ui-new-drawer .foot {
        display: grid;
        gap: 2px;
        margin-top: auto;
        padding: 12px 12px 0;
        border-top: 1px solid var(--r-line);
    }
    .ui-new-drawer .logo {
        display: flex;
        align-items: center;
        width: 104px;
        min-height: 44px;
        border-radius: 8px;
    }
    .ui-new-drawer .logo svg {
        width: 100%;
        height: auto;
    }
    @media (prefers-reduced-motion: reduce) {
        .ui-new-drawer * {
            animation: none !important;
            transition: none !important;
        }
    }
`;

/* ---------- menu (fonte única: useAppMenu) ---------- */

type MenuItem = {
    key?: React.Key | null;
    icon?: React.ReactNode;
    label?: React.ReactNode;
    disabled?: boolean;
    onClick?: unknown;
    children?: MenuItem[];
    badge?: number;
};

/** Ícones de traço fino por chave do item (os itens e destinos vêm do menu da Plataforma). */
const MENU_ICONS: Record<string, React.ReactNode> = {
    home: <House {...ICON} aria-hidden />,
    imerso: <GraduationCap {...ICON} aria-hidden />,
    settings: <Settings {...ICON} aria-hidden />,
    support: <Headset {...ICON} aria-hidden />,
    community: <Users {...ICON} aria-hidden />,
    logout: <LogOut {...ICON} aria-hidden />,
};

const labelText = (item: MenuItem) => (typeof item.label === 'string' ? item.label : 'IMERSO');

/** Por que um item do IMERSO está apagado (o menu é da casca: português). */
const DISABLED_HINT: Record<string, string> = {
    melpLamp: 'Abre quando o DEDA começar',
    melpDeda: 'Acesso suspenso',
};

/** `onClick` dos itens do antd recebe `{ domEvent }`; o menu só usa `domEvent.preventDefault()`. */
const fire = (item: MenuItem, event: React.MouseEvent) =>
    (item.onClick as ((info: { domEvent: React.MouseEvent }) => void) | undefined)?.({ domEvent: event });

/**
 * IMERSO com HPEC/DEDA/LAMP. No menu recolhido a lista sai num balão ao passar o mouse ou focar; depois de um clique, ou de
 * trocar de rota, o balão FECHA (o link clicado continua com o foco, o que o manteria aberto) e só volta no próximo hover
 * ou foco de teclado. Esc fecha; sair com Tab fecha por si.
 */
const NavGroup: React.FC<{
    item: MenuItem;
    current: boolean;
    active: string[];
    rail: boolean;
    goImerso: (event: React.MouseEvent) => void;
}> = ({ item, current, active, rail, goImerso }) => {
    const pathname = usePathname();
    const [closed, setClosed] = useState(false);
    useEffect(() => setClosed(true), [pathname]);
    const dismiss = (el: HTMLElement | null) => {
        setClosed(true);
        el?.blur();
    };
    const key = String(item.key);
    return (
        <div
            className={`grp${current ? ' on' : ''}`}
            data-closed={closed || undefined}
            onMouseEnter={() => setClosed(false)}
            onFocus={(event) => event.target.matches(':focus-visible') && setClosed(false)}
            onKeyDown={(event) => event.key === 'Escape' && dismiss(event.target as HTMLElement)}
        >
            <button
                type="button"
                className="it"
                aria-current={current && active.length === 1 ? 'page' : undefined}
                title={rail ? labelText(item) : undefined}
                onClick={(event) => {
                    goImerso(event);
                    dismiss(event.currentTarget);
                }}
            >
                {MENU_ICONS[key]}
                <span className="lbl">{item.label}</span>
            </button>
            <div className="sub">
                {item.children?.map((child) => {
                    const childKey = String(child.key);
                    // apagado, mas com o motivo ao passar o mouse (botão desligado não mostraria o title)
                    return (
                        <button
                            key={childKey}
                            type="button"
                            className="it s"
                            aria-disabled={child.disabled || undefined}
                            title={child.disabled ? DISABLED_HINT[childKey] : undefined}
                            aria-current={active.includes(childKey) ? 'page' : undefined}
                            onClick={(event) => {
                                if (child.disabled) return;
                                fire(child, event);
                                dismiss(event.currentTarget);
                            }}
                        >
                            <span className="lbl">{child.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

const Nav: React.FC<{
    items: MenuItem[];
    active: string[];
    rail: boolean;
    goImerso: (event: React.MouseEvent) => void;
}> = ({ items, active, rail, goImerso }) => (
    <nav className="nav" aria-label="Menu">
        {items.map((item) => {
            const key = String(item.key);
            const current = active.includes(key);
            if (item.children)
                return (
                    <NavGroup key={key} item={item} current={current} active={active} rail={rail} goImerso={goImerso} />
                );
            return (
                <button
                    key={key}
                    type="button"
                    className="it"
                    disabled={item.disabled}
                    aria-current={current ? 'page' : undefined}
                    title={rail ? labelText(item) : undefined}
                    onClick={(event) => fire(item, event)}
                >
                    {MENU_ICONS[key]}
                    <span className="lbl">{item.label}</span>
                    {!!item.badge && (
                        <span className="badge" aria-label={`${item.badge} não lidas`}>
                            {item.badge > 9 ? '9+' : item.badge}
                        </span>
                    )}
                </button>
            );
        })}
    </nav>
);

/** DEDA Run no rodapé do menu (o KPI principal do programa), em ouro; recolhido, só o número (title "DEDA Run"). */
const MelpRun: React.FC<{ rail?: boolean }> = ({ rail }) => {
    const run = useDedaRun(2);
    const { melpSummary } = useMelpContext();
    if ((run.loading && !run.current) || (rail && melpSummary?.melp_status !== 'DEDA_STARTED')) return null;
    return (
        <span className={rail ? 'rail-run' : 'melp-run'}>
            <RunChip current={run.current} counted={run.todayCounted} label={rail ? '' : undefined} />
        </span>
    );
};

/** Resumo do DEDA em andamento (o mesmo conteúdo do MelpSummary atual): nome, semana e dia do calendário. */
const MelpMini: React.FC<{ bar?: boolean }> = ({ bar }) => {
    const { melpSummary } = useMelpContext();
    if (melpSummary?.melp_status !== 'DEDA_STARTED') return null;
    return (
        <div className="melp" title={`DEDA ${melpSummary.currentDedaName ?? ''}`}>
            <small>DEDA</small>
            <b>{melpSummary.currentDedaName}</b>
            <span>
                Week {melpSummary.current_deda_week} · Day {saoPauloWeekday()}
            </span>
            {!bar && <MelpRun />}
        </div>
    );
};

/**
 * Admin na casca: leva ao Início do Admin (/admin). Some na impersonação (a visão é a do aluno; a saída fica na barra
 * "Visualizando como").
 */
const AdminItem: React.FC = () => {
    const { user } = useAppContext();
    const onAdmin = (usePathname() ?? '').startsWith('/admin');
    if (!user?.roles?.includes('METTLE_ADMIN') || user.impersonating) return null;
    return (
        <Link className="it" href="/admin" title="Admin" aria-current={onAdmin ? 'page' : undefined}>
            <ShieldCheck {...ICON} aria-hidden />
            <span className="lbl">Admin</span>
        </Link>
    );
};

/**
 * Impersonação (plataforma nova): uma linha fina — de quem é a visão, o modo visualização (nada grava) e a saída, que
 * volta ao Painel de Contas na própria conta. Uma gravação recusada aparece aqui, sem janela.
 */
const ViewAsBar: React.FC = () => {
    const { user } = useAppContext();
    const viewAs = user?.viewAs;
    const [blocked, setBlocked] = useState(false);
    // o servidor recusou por impersonação sem esta aba saber (começou em outra): a barra aparece para sair
    const [stuck, setStuck] = useState(false);
    const [leaving, setLeaving] = useState<'idle' | 'busy' | 'failed'>('idle');
    const [expired, setExpired] = useState(false);
    useEffect(() => {
        let timer: number | undefined;
        const onBlocked = () => {
            setBlocked(true);
            setStuck(true);
            window.clearTimeout(timer);
            timer = window.setTimeout(() => setBlocked(false), 4000);
        };
        window.addEventListener(VIEW_ONLY_EVENT, onBlocked);
        return () => {
            window.removeEventListener(VIEW_ONLY_EVENT, onBlocked);
            window.clearTimeout(timer);
        };
    }, []);
    // a visualização vence em 1 h: a barra avisa na hora (o servidor segue recusando gravações até a saída)
    const expires = viewAs?.expires ?? 0;
    useEffect(() => {
        if (!expires) return;
        const left = expires - Date.now();
        if (left <= 0) return setExpired(true);
        const timer = window.setTimeout(() => setExpired(true), Math.min(left, 2 ** 31 - 1));
        return () => window.clearTimeout(timer);
    }, [expires]);
    if (!viewAs && !stuck) return null;
    const leave = async () => {
        setLeaving('busy');
        try {
            await accountService.post('/impersonate/remove');
            await auth.currentUser?.getIdToken(true);
            window.location.assign(viewAs ? adminPanelPath(viewAs.uid) : ADMIN_PANEL_PATH);
        } catch {
            setLeaving('failed');
        }
    };
    const live = !!user?.impersonating && !expired;
    return (
        <div className={`viewas ${UI_FONT_CLASS}`} role="status">
            <Eye {...ICON} aria-hidden />
            <span>
                {live ? (
                    <>
                        Visualizando como <b>{displayName(user.name) || user.email}</b> · modo visualização
                    </>
                ) : viewAs ? (
                    'A visualização como aluno terminou'
                ) : (
                    'Modo visualização ativo nesta conta'
                )}
                {blocked && ' · nada foi gravado'}
                {leaving === 'failed' && ' · não deu para sair, tente de novo'}
            </span>
            <button type="button" className="lnk gold" onClick={leave} disabled={leaving === 'busy'}>
                Sair
            </button>
        </div>
    );
};

const User: React.FC = () => {
    const { user } = useAppContext();
    const { data: profile } = useProfile();
    const fullName = profile ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') : user?.name;
    const name = displayName(fullName);
    const photo = profile?.photoURL ?? user?.profileImageSrc;
    return (
        <div className="user" title={fullName || undefined}>
            <span className="av" aria-hidden>
                {/* eslint-disable-next-line @next/next/no-img-element -- foto do perfil (Firebase) */}
                {photo ? <img src={photo} alt="" /> : name[0]}
            </span>
            <span className="lbl">{name}</span>
        </div>
    );
};

/**
 * Casca da plataforma nova (só para as contas de libs/newDesign): menu lateral fino que recolhe a um trilho de
 * ícones (lembrado por aparelho) no computador; barra fina + gaveta no celular. Os itens, o painel de administrador
 * e os avisos de acesso/pagamento são os mesmos do AppLayout atual — só a apresentação muda.
 */
export const NewAppLayout = forwardRef<HTMLDivElement, { children: React.ReactNode; withMelpSummary?: boolean }>(
    ({ children, withMelpSummary = false }, ref) => {
        const isMobile = useDeviceSize() === 'mobile';
        const [rail, setRail] = useState(() => typeof window !== 'undefined' && readMenuCollapsed());
        const [open, setOpen] = useState(false);
        const [swap, setSwap] = useState<'' | 'swapA' | 'swapB'>('');
        const [settled, setSettled] = useState(true);
        const router = useRouter();
        const pathname = usePathname();
        const menu = useAppMenu(() => setOpen(false));
        useEffect(() => {
            const onOpen = () => setOpen(true);
            window.addEventListener(MENU_OPEN_EVENT, onOpen);
            return () => window.removeEventListener(MENU_OPEN_EVENT, onOpen);
        }, []);
        const active = activeMenuKeys(pathname);
        // Na casca nova: Início, IMERSO, Comunidade, Suporte, Configurações, Sair (o menu atual mantém a ordem de sempre)
        const navItems = useMemo(() => {
            const items = [...(menu.items as MenuItem[])];
            const settings = items.findIndex((item) => item.key === 'settings');
            const logout = items.findIndex((item) => item.key === 'logout');
            if (settings >= 0 && logout > settings) items.splice(logout - 1, 0, items.splice(settings, 1)[0]);
            return items;
        }, [menu.items]);
        const { access, levelsLoading } = useProductAccess();
        // carência pelo modelo de acesso (/accounts/me): as claims dizem "ativo" e a casca não a via (PF2-03)
        const accessDetails = useProfile().data?.accessDetails;
        const logoTheme = useLogoTheme();

        // Fluidez: com a casca de pé, adianta (em tempo ocioso) o código das páginas novas e as rotas do menu, para a
        // primeira visita a cada uma não passar por um quadro vazio. Só leitura de código/rotas; nenhuma chamada de API.
        useEffect(() => {
            const warm = () => {
                ['/', '/imerso', '/imerso/deda', '/imerso/lamp', '/imerso/hpec/welcome', '/settings'].forEach((href) =>
                    router.prefetch(href),
                );
                void import('components/_new/NewHome');
                void import('components/_new/NewImersoHome');
                void import('components/_new/NewDedaList');
                void import('components/_new/NewLamp');
                void import('components/_new/NewHpecLesson');
                void import('components/_new/NewCourseLesson');
                void import('components/_new/NewSettings');
                void import('components/_melp/_deda/DedaReader/DedaReaderPage');
            };
            if (typeof window.requestIdleCallback === 'function') {
                const id = window.requestIdleCallback(warm);
                return () => window.cancelIdleCallback(id);
            }
            const id = window.setTimeout(warm, 1500);
            return () => window.clearTimeout(id);
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);

        const toggleRail = () => {
            setSwap((previous) => (previous === 'swapA' ? 'swapB' : 'swapA'));
            setSettled(false);
            window.setTimeout(() => setSettled(true), 260);
            setRail((previous) => {
                saveMenuCollapsed(!previous);
                return !previous;
            });
        };
        const goImerso = (event: React.MouseEvent) => {
            setOpen(false);
            menu.goImerso(event);
        };
        const goHome = (event: React.MouseEvent) => {
            event.preventDefault();
            setOpen(false);
            router.push('/');
        };

        // Imerso em leitura (claims do modelo novo; o "expired" do front): abrir um DEDA e a Comunidade dão lugar à
        // renovação; as demais rotas abrem só para ver (cada página tira o que grava: LAMP, HPEC, Configurações).
        // Com o /accounts/me decidindo (impersonação, conta sem a claim), nada abre antes da resposta.
        const gate = shellGate(access(IMERSO_PRODUCT).state, levelsLoading, pathname);
        const content =
            gate === 'loading' ? (
                <NewContentLoading />
            ) : gate === 'renew' ? (
                <NewPage className="narrow">
                    <AccessCtaBlock target={{ product: IMERSO_PRODUCT }} />
                </NewPage>
            ) : (
                children
            );
        // Carência e "vence em breve": uma linha com a data e "Renovar" (libs/productAccess.renewalNotice); dentro do
        // IMERSO em inglês. Carência do modelo de acesso (libs/myProducts.graceNotices): no Início (todo produto) e no
        // /imerso (o Imerso), no lugar da linha antiga (PF2-03).
        const en = pathname.startsWith('/imerso');
        const graces =
            pathname === '/' || pathname === '/imerso'
                ? graceNotices(accessDetails, { en, only: en ? 'imerso' : undefined })
                : [];
        const lines = graces.length
            ? graces
            : [{ key: 'imerso', name: 'Imerso', text: renewalNotice(access(IMERSO_PRODUCT), en), renew: undefined }];
        const graceBanner = lines.map(
            (line) =>
                line.text && (
                    <div key={line.key} className={`grace ${UI_FONT_CLASS}`} role="status" lang={en ? 'en' : 'pt-BR'}>
                        <TriangleAlert {...ICON} aria-hidden />
                        <span>{line.text}</span>
                        <a
                            className="lnk gold"
                            href={line.renew ?? RENEWAL_URLS[IMERSO_PRODUCT] ?? IMERSO_SALES_URL}
                            aria-label={`${en ? 'Renew' : 'Renovar'} ${line.name}`}
                        >
                            {en ? 'Renew' : 'Renovar'}
                        </a>
                    </div>
                ),
        );

        const brand = (
            <a className="logo" href="/" aria-label="Mettle — Início" onClick={goHome}>
                <Logo theme={logoTheme} mark={!isMobile && rail} />
            </a>
        );
        const foot = (
            <div className="foot">
                <MelpMini />
                {!isMobile && rail && <MelpRun rail />}
                <AdminItem />
                <div className="who">
                    <User />
                    {!isMobile && rail ? <ThemeCycle /> : <ThemeSwitch className="theme" />}
                </div>
            </div>
        );

        // Gaveta do menu: a MESMA da casca no celular e, no computador, a que o cabeçalho do leitor do DEDA abre (o leitor cobre
        // a barra lateral). Sempre o logo inteiro, o rodapé completo e o seletor de tema em três opções.
        const drawer = (
            <Drawer
                rootClassName={`ui-new-drawer ${UI_FONT_CLASS}`}
                rootStyle={UI_FONT_VAR}
                closeIcon={<X {...ICON} aria-label="Fechar" />}
                open={open}
                onClose={() => setOpen(false)}
                placement="left"
                width={290}
                title={
                    <a className="logo" href="/" aria-label="Mettle — Início" onClick={goHome}>
                        <Logo theme={logoTheme} />
                    </a>
                }
            >
                <Nav items={navItems} active={active} rail={false} goImerso={goImerso} />
                <div className="foot">
                    <MelpMini />
                    <AdminItem />
                    <div className="who">
                        <User />
                        <ThemeSwitch className="theme" />
                    </div>
                </div>
            </Drawer>
        );

        // leitor do e-book: tela inteira, sem menu nem barra da casca (o leitor tem a sua, com a volta para /guia)
        if (pathname === '/guia/ler')
            return (
                <Frame className="ui-new immersive" style={UI_FONT_VAR}>
                    <Global styles={[platformTokens, drawerStyles]} />
                    <div className="main" ref={ref}>
                        <ViewAsBar />
                        {content}
                    </div>
                </Frame>
            );

        return (
            <Frame
                className={`ui-new${isMobile ? ' m' : rail ? ' rail' : ''}${isMobile ? '' : ` ${swap}${settled ? ' settled' : ''}`}`}
                style={UI_FONT_VAR}
            >
                <Global styles={[platformTokens, drawerStyles]} />
                {isMobile ? (
                    <>
                        <header className={`bar ${UI_FONT_CLASS}`}>
                            <button type="button" className="ib" aria-label="Menu" onClick={() => setOpen(true)}>
                                <MenuIcon {...ICON} />
                            </button>
                            {brand}
                            {withMelpSummary && <MelpMini bar />}
                        </header>
                        {drawer}
                    </>
                ) : (
                    <aside className={`sb ${UI_FONT_CLASS}`}>
                        <div className="brand">
                            {brand}
                            <button
                                type="button"
                                className="ib"
                                aria-label={rail ? 'Expandir menu' : 'Recolher menu'}
                                aria-expanded={!rail}
                                onClick={toggleRail}
                            >
                                {rail ? <PanelLeftOpen {...ICON} /> : <PanelLeftClose {...ICON} />}
                            </button>
                        </div>
                        <Nav items={navItems} active={active} rail={rail} goImerso={goImerso} />
                        {foot}
                    </aside>
                )}
                {!isMobile && drawer}
                <div className="main" ref={ref}>
                    <ViewAsBar />
                    {graceBanner}
                    {content}
                </div>
            </Frame>
        );
    },
);

NewAppLayout.displayName = 'NewAppLayout';

export default NewAppLayout;
