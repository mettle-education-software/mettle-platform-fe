'use client';

import { css, Global } from '@emotion/react';
import styled from '@emotion/styled';
import { Button, ConfigProvider, Drawer, Flex, Modal, Select } from 'antd';
import { ThemeCycle, ThemeSwitch } from 'components/_new/ThemeSwitch';
import { popupStyles } from 'components/_new/ui';
import { Logo } from 'components/atoms/Logo/Logo';
import { useDeviceSize } from 'hooks';
import { useLogoTheme, useNewAntdTheme } from 'hooks/useTheme';
import { getWeekDay } from 'libs';
import { activeMenuKeys, firstName, readMenuCollapsed, saveMenuCollapsed } from 'libs/newDesign';
import { IMERSO_PRODUCT, IMERSO_SALES_URL, isImersoRouteAllowedWhenExpired, RENEWAL_URLS } from 'libs/productAccess';
import {
    GraduationCap,
    Headset,
    House,
    LogOut,
    Menu as MenuIcon,
    PanelLeftClose,
    PanelLeftOpen,
    Settings,
    ShieldCheck,
    TriangleAlert,
    X,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { AccessCtaBlock, useAppContext, useMelpContext, useProductAccess } from 'providers';
import React, { forwardRef, useEffect, useState } from 'react';
import { ICON, platformTokens, UI_FONT_CLASS, UI_FONT_VAR, ui } from 'themes/newDesign';
import { useAdminImpersonation } from '../AdminActions/AdminActions';
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
    .it:hover:not(:disabled),
    .it:active:not(:disabled) {
        background: var(--r-hover);
    }
    .it[aria-current='page'],
    .it[aria-current='page'] svg,
    .grp.on > .it svg {
        color: var(--r-gold-hi);
    }
    .it:disabled {
        opacity: 0.45;
        cursor: default;
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
    .melp span {
        display: block;
        margin-top: 1px;
        font-size: 12.5px;
        letter-spacing: 0.02em;
        color: var(--r-muted);
        white-space: nowrap;
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
    .who {
        display: flex;
        align-items: center;
        gap: 4px;
        min-width: 0;
    }
    .who .user {
        flex: 1;
        min-width: 0;
    }
    .who .theme {
        flex: none;
    }
    .user .lbl {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
`;

const Frame = styled.div`
    ${ui};
    display: grid;
    grid-template-columns: var(--r-sb-w) minmax(0, 1fr);
    height: 100vh;
    height: 100dvh;
    width: 100%;
    overflow: hidden;
    background: var(--r-bg);
    transition: grid-template-columns var(--r-ease);

    &.rail {
        grid-template-columns: var(--r-rail-w) minmax(0, 1fr);
    }
    &.m {
        grid-template-columns: minmax(0, 1fr);
        grid-template-rows: var(--r-bar-h) minmax(0, 1fr);
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
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 4px;
        min-height: 64px;
        padding: 10px 10px 6px 24px;
    }
    .logo {
        display: flex;
        align-items: center;
        min-height: 44px;
        width: 112px;
        color: inherit;
        border-radius: 8px;
    }
    .logo svg {
        display: block;
        width: 100%;
        height: auto;
    }
    .sb .foot {
        display: grid;
        gap: 2px;
        margin-top: auto;
        padding: 8px 12px 14px;
    }
    .sb .foot .melp {
        margin: 0 -12px 6px;
        padding: 12px 24px;
    }
    .sb .ib {
        color: var(--r-muted);
    }
    .sb .ib:hover {
        color: var(--r-text);
    }

    /* recolhido: trilho de ícones; rótulos saem, cada item vira um quadrado de 44 px centrado */
    &.rail .brand {
        flex-direction: column;
        justify-content: center;
        padding: 10px 0 6px;
    }
    &.rail .logo {
        width: 44px;
        justify-content: center;
    }
    &.rail .logo svg {
        width: 26px;
    }
    &.rail .nav,
    &.rail .foot {
        padding-left: 10px;
        padding-right: 10px;
    }
    &.rail .it {
        justify-content: center;
        gap: 0;
        padding: 0;
    }
    &.rail .it .lbl,
    &.rail .user .lbl,
    &.rail .melp {
        display: none;
    }
    &.rail .user {
        justify-content: center;
        padding: 0;
    }
    &.rail .who {
        flex-direction: column;
        gap: 2px;
    }
    /* IMERSO recolhido: HPEC/DEDA/LAMP num balão ao lado, ao passar o mouse ou focar pelo teclado */
    &.rail .sub {
        display: none;
        position: absolute;
        left: calc(100% + 6px);
        top: 0;
        z-index: 6;
        min-width: 160px;
        padding: 6px;
        border: 1px solid var(--r-line);
        border-radius: 12px;
        background: var(--r-sheet-head);
        box-shadow: 0 10px 30px var(--r-card-shadow);
    }
    &.rail .sub::before {
        content: '';
        position: absolute;
        left: -8px;
        top: 0;
        width: 8px;
        height: 100%;
    }
    &.rail .grp:hover .sub,
    &.rail .grp:focus-within .sub {
        display: grid;
    }
    &.rail .it.s {
        justify-content: flex-start;
        padding: 0 12px;
    }

    /* ---------- barra do celular ---------- */
    .bar {
        ${chrome};
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 0 8px 0 4px;
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
    .cta {
        ${ui};
        padding: 24px 20px;
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
};

/** Ícones de traço fino por chave do item (os itens e destinos vêm do menu da Plataforma). */
const MENU_ICONS: Record<string, React.ReactNode> = {
    home: <House {...ICON} aria-hidden />,
    imerso: <GraduationCap {...ICON} aria-hidden />,
    settings: <Settings {...ICON} aria-hidden />,
    support: <Headset {...ICON} aria-hidden />,
    logout: <LogOut {...ICON} aria-hidden />,
};

const labelText = (item: MenuItem) => (typeof item.label === 'string' ? item.label : 'IMERSO');

/** `onClick` dos itens do antd recebe `{ domEvent }`; o menu só usa `domEvent.preventDefault()`. */
const fire = (item: MenuItem, event: React.MouseEvent) =>
    (item.onClick as ((info: { domEvent: React.MouseEvent }) => void) | undefined)?.({ domEvent: event });

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
                    <div key={key} className={`grp${current ? ' on' : ''}`}>
                        <button
                            type="button"
                            className="it"
                            aria-current={current && active.length === 1 ? 'page' : undefined}
                            title={rail ? labelText(item) : undefined}
                            onClick={goImerso}
                        >
                            {MENU_ICONS[key]}
                            <span className="lbl">{item.label}</span>
                        </button>
                        <div className="sub">
                            {item.children.map((child) => {
                                const childKey = String(child.key);
                                return (
                                    <button
                                        key={childKey}
                                        type="button"
                                        className="it s"
                                        disabled={child.disabled}
                                        aria-current={active.includes(childKey) ? 'page' : undefined}
                                        onClick={(event) => fire(child, event)}
                                    >
                                        <span className="lbl">{child.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
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
                </button>
            );
        })}
    </nav>
);

/** Resumo do DEDA em andamento (o mesmo conteúdo do MelpSummary atual): nome, semana e dia do calendário. */
const MelpMini: React.FC = () => {
    const { melpSummary } = useMelpContext();
    if (melpSummary?.melp_status !== 'DEDA_STARTED') return null;
    const day = getWeekDay();
    return (
        <div className="melp" title={`DEDA ${melpSummary.currentDedaName ?? ''}`}>
            <small>DEDA</small>
            <b>{melpSummary.currentDedaName}</b>
            <span>
                Week {melpSummary.current_deda_week} · Day {day}
            </span>
        </div>
    );
};

/**
 * Painel de administração (impersonar alunos): as mesmas funções do AdminActions atual (useAdminImpersonation), na
 * linguagem nova — escuro, Manrope, campo e botão finos, sem moldura de card e sem "Cancelar" (X, Esc e fora fecham).
 */
const AdminItem: React.FC = () => {
    const admin = useAdminImpersonation();
    const antdTheme = useNewAntdTheme();
    if (!admin.isAdmin) return null;
    return (
        <>
            <button type="button" className="it" onClick={() => admin.setVisible(true)} title="Admin panel">
                <ShieldCheck {...ICON} aria-hidden />
                <span className="lbl">Admin panel</span>
            </button>
            <ConfigProvider theme={antdTheme}>
                <Global styles={popupStyles} />
                <Modal
                    open={admin.visible}
                    onCancel={admin.handleClose}
                    footer={null}
                    title="Painel de administração"
                    className={`ui-new-modal ${UI_FONT_CLASS}`}
                    width={520}
                >
                    <div className="modal-body">
                        <p className="eyebrow" id="admin-impersonate">
                            Impersonar alunos
                        </p>
                        {admin.impersonating ? (
                            <Flex gap={12} align="center" justify="space-between" wrap>
                                <p>Você está impersonando.</p>
                                <Button
                                    type="primary"
                                    onClick={admin.handleStopImpersonating}
                                    loading={admin.stopImpersonate.isPending}
                                >
                                    Retornar à conta normal
                                </Button>
                            </Flex>
                        ) : (
                            <Flex gap={8}>
                                <Select
                                    aria-labelledby="admin-impersonate"
                                    loading={admin.isMettleUsersLoading}
                                    showSearch
                                    allowClear
                                    onClear={admin.handleClear}
                                    onSearch={admin.handleSearch}
                                    filterOption={false}
                                    onSelect={(value) => admin.setSelectedUserToImpersonate(value)}
                                    value={admin.selectedUserToImpersonate}
                                    style={{ flex: 1, minWidth: 0 }}
                                    placeholder="Nome ou e-mail do aluno"
                                    options={admin.options}
                                />
                                <Button
                                    type="primary"
                                    loading={admin.impersonate.isPending}
                                    onClick={admin.handleImpersonate}
                                    disabled={!admin.selectedUserToImpersonate}
                                >
                                    Acessar
                                </Button>
                            </Flex>
                        )}
                    </div>
                </Modal>
            </ConfigProvider>
        </>
    );
};

const User: React.FC = () => {
    const { user } = useAppContext();
    const name = firstName(user?.name);
    return (
        <div className="user" title={user?.name ?? undefined}>
            <span className="av" aria-hidden>
                {/* eslint-disable-next-line @next/next/no-img-element -- foto do perfil (Firebase) */}
                {user?.profileImageSrc ? <img src={user.profileImageSrc} alt="" /> : name[0]}
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
        const router = useRouter();
        const pathname = usePathname();
        const menu = useAppMenu(() => setOpen(false));
        const active = activeMenuKeys(pathname);
        const { access, openCta } = useProductAccess();
        const antdTheme = useNewAntdTheme();
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

        const toggleRail = () =>
            setRail((previous) => {
                saveMenuCollapsed(!previous);
                return !previous;
            });
        const goImerso = (event: React.MouseEvent) => {
            setOpen(false);
            menu.goImerso(event);
        };
        const goHome = (event: React.MouseEvent) => {
            event.preventDefault();
            setOpen(false);
            router.push('/');
        };

        // Imerso expirado: mesma regra do AppLayout atual (rotas liberadas abrem o convite a cada clique; as demais
        // mostram o convite no lugar do conteúdo).
        const imersoState = access(IMERSO_PRODUCT).state;
        const imersoLocked = imersoState === 'expired' && pathname.startsWith('/imerso');
        const guardClick = (event: React.MouseEvent) => {
            if ((event.target as HTMLElement).closest('[data-access-allow], .ant-tabs-tab')) return;
            event.preventDefault();
            event.stopPropagation();
            openCta({ product: IMERSO_PRODUCT });
        };
        const content = !imersoLocked ? (
            children
        ) : isImersoRouteAllowedWhenExpired(pathname) ? (
            <div onClickCapture={guardClick}>{children}</div>
        ) : (
            <ConfigProvider theme={antdTheme}>
                <div className={`cta ${UI_FONT_CLASS}`}>
                    <AccessCtaBlock target={{ product: IMERSO_PRODUCT }} />
                </div>
            </ConfigProvider>
        );
        const graceBanner = imersoState === 'grace' && (
            <div className={`grace ${UI_FONT_CLASS}`} role="status">
                <TriangleAlert {...ICON} aria-hidden />
                <span>Não conseguimos processar seu pagamento — atualize para manter o acesso.</span>
                <a className="lnk gold" href={RENEWAL_URLS[IMERSO_PRODUCT] ?? IMERSO_SALES_URL}>
                    Atualizar pagamento
                </a>
            </div>
        );

        const brand = (
            <a className="logo" href="/" aria-label="Mettle — Início" onClick={goHome}>
                <Logo theme={logoTheme} mark={!isMobile && rail} />
            </a>
        );
        const foot = (
            <div className="foot">
                {withMelpSummary && !isMobile && <MelpMini />}
                <AdminItem />
                <div className="who">
                    <User />
                    {!isMobile && rail ? <ThemeCycle /> : <ThemeSwitch className="theme" />}
                </div>
            </div>
        );

        return (
            <Frame className={`ui-new${isMobile ? ' m' : rail ? ' rail' : ''}`} style={UI_FONT_VAR}>
                <Global styles={[platformTokens, drawerStyles]} />
                {isMobile ? (
                    <>
                        <header className={`bar ${UI_FONT_CLASS}`}>
                            <button type="button" className="ib" aria-label="Menu" onClick={() => setOpen(true)}>
                                <MenuIcon {...ICON} />
                            </button>
                            {brand}
                            {withMelpSummary && <MelpMini />}
                        </header>
                        <Drawer
                            rootClassName={`ui-new-drawer ${UI_FONT_CLASS}`}
                            rootStyle={UI_FONT_VAR}
                            closeIcon={<X {...ICON} aria-label="Fechar" />}
                            open={open}
                            onClose={() => setOpen(false)}
                            placement="left"
                            width={290}
                            title={brand}
                        >
                            <Nav items={menu.items as MenuItem[]} active={active} rail={false} goImerso={goImerso} />
                            {foot}
                        </Drawer>
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
                        <Nav items={menu.items as MenuItem[]} active={active} rail={rail} goImerso={goImerso} />
                        {foot}
                    </aside>
                )}
                <div className="main" ref={ref}>
                    {graceBanner}
                    {content}
                </div>
            </Frame>
        );
    },
);

NewAppLayout.displayName = 'NewAppLayout';

export default NewAppLayout;
