'use client';

import { MenuOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Alert, Button, Drawer, Flex, Layout, Menu } from 'antd';
import { Logo } from 'components';
import { MelpSummary } from 'components/_melp/MelpSummary/MelpSummary';
import { useDeviceSize } from 'hooks';
import { useNewDesign } from 'hooks/useNewDesign';
import { SMALL_VIEWPORT } from 'libs';
import { IMERSO_PRODUCT, IMERSO_SALES_URL, isImersoRouteAllowedWhenExpired, RENEWAL_URLS } from 'libs/productAccess';
import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import { AccessCtaBlock, useAppContext, useMelpContext, useProductAccess } from 'providers';
import React, { forwardRef, useEffect, useState } from 'react';
import { UserMenu } from '../../molecules/UserMenu/UserMenu';
import { AdminActions } from '../AdminActions/AdminActions';
import { useAppMenu } from './appMenu';

const { Header, Content, Sider } = Layout;

// Casca da plataforma nova (libs/newDesign), só para as contas da lista: carregada à parte, fora do bundle dos alunos.
const NewAppLayout = dynamic(() => import('./NewAppLayout'), { ssr: false, loading: () => null });

const AppHeader = styled(Header)`
    background: var(--tertiary);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-left: 1rem;
    padding-right: 1rem;

    @media (max-width: ${SMALL_VIEWPORT}px) {
        max-height: 3rem;
    }
`;

const LogoWrapper = styled.div`
    max-width: 6.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
`;

const Sidebar = styled(Sider)`
    width: 12rem;
    max-width: 20vw;
    max-height: 100%;
    height: 100%;
    min-height: 100%;
    background: var(--tertiary) !important;
    box-shadow: 0 2px 8px 0 #00000026;
    padding: 1rem 1rem;
`;

const PageLayout = styled(Layout)<{ mobileMaxHeight?: number }>`
    height: 100vh;
    max-height: 100vh;
    width: 100vw;
    max-width: 100vw;

    @media (max-width: ${SMALL_VIEWPORT}px) {
        overflow-y: hidden;
        max-height: ${({ mobileMaxHeight }) => (mobileMaxHeight ? mobileMaxHeight : 800)}px;
    }
`;

const ContentLayout = styled(Layout)`
    max-height: 100vh;
    overflow-x: hidden;
    overflow-y: hidden; // check this later if scroll does not work
`;

const AppContent = styled(Content)`
    padding: 0;
    overflow-y: auto;
`;

const CustomMenu = styled(Menu)`
    background: transparent;
    border: none !important;
    box-shadow: none !important;

    /* "Configurações" cabe inteiro no menu lateral (faltavam 3 px): folga da direita de 16 para 8 px. */
    &.ant-menu .ant-menu-item {
        padding-inline-end: 8px;
    }
`;

interface AppLayoutProps {
    children: React.ReactNode;
    withMelpSummary?: boolean;
}

/** Chave ligada (libs/newDesign): a casca nova; desligada: a casca atual, intocada. */
export const AppLayout = forwardRef<HTMLDivElement, AppLayoutProps>((props, ref) =>
    useNewDesign() ? <NewAppLayout {...props} ref={ref} /> : <ClassicAppLayout {...props} ref={ref} />,
);

AppLayout.displayName = 'AppLayout';

const ClassicAppLayout = forwardRef<
    HTMLDivElement,
    {
        children: React.ReactNode;
        withMelpSummary?: boolean;
    }
>(
    (
        {
            children,
            withMelpSummary = false,
        }: {
            children: React.ReactNode;
            withMelpSummary?: boolean;
        },
        ref,
    ) => {
        const device = useDeviceSize();

        const defaultCollapsed = window?.localStorage?.getItem('menuCollapsed') === 'true';

        const [collapsed, setCollapsed] = useState(defaultCollapsed);

        useEffect(() => {
            if (device === 'mobile') {
                setCollapsed(true);
            }
        }, [device]);

        const menu = useAppMenu(() => {
            if (device === 'mobile') setCollapsed(true);
        });

        const pathname = usePathname();
        const router = useRouter();

        const { melpSummary } = useMelpContext();
        const { user } = useAppContext();
        const { access, openCta } = useProductAccess();

        // Imerso expirado: rotas fora da lista liberada mostram o CTA no lugar do conteúdo; nas liberadas, qualquer clique
        // no conteúdo abre o modal, exceto o que estiver marcado com data-access-allow (e as abas, para navegar na LAMP).
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
            <AccessCtaBlock target={{ product: IMERSO_PRODUCT }} />
        );
        const graceBanner = imersoState === 'grace' && (
            <Alert
                banner
                type="warning"
                message="Não conseguimos processar seu pagamento — atualize para manter o acesso."
                action={
                    <Button size="small" href={RENEWAL_URLS[IMERSO_PRODUCT] ?? IMERSO_SALES_URL}>
                        Atualizar pagamento
                    </Button>
                }
            />
        );

        const trigger = (
            <Button
                ghost
                className="trigger"
                onClick={() =>
                    setCollapsed((previous) => {
                        window?.localStorage.setItem('menuCollapsed', String(!previous));
                        return !previous;
                    })
                }
                icon={
                    <MenuOutlined
                        style={{ color: device === 'mobile' ? 'var(--secondary)' : 'var(--primary)', fontSize: '1rem' }}
                    />
                }
            />
        );

        const customMenu = <CustomMenu mode="inline" selectedKeys={menu.selectedKeys} items={menu.items} />;

        if (device === 'mobile') {
            return (
                <PageLayout mobileMaxHeight={window?.innerHeight}>
                    <Layout>
                        <AppHeader>
                            <Flex gap="0.5rem" align="center" justify="space-between" style={{ width: '100%' }}>
                                {trigger}
                                {withMelpSummary && <MelpSummary />}
                                <div />
                            </Flex>
                            <Drawer open={!collapsed} onClose={() => setCollapsed(true)}>
                                {customMenu}
                            </Drawer>
                        </AppHeader>
                        <ContentLayout>
                            <AppContent>
                                {graceBanner}
                                {content}
                            </AppContent>
                        </ContentLayout>
                    </Layout>
                </PageLayout>
            );
        }

        return (
            <PageLayout>
                <Sidebar collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)} trigger={null}>
                    <Flex
                        align="center"
                        gap="12px"
                        justify={collapsed ? 'center' : 'flex-start'}
                        style={{ marginBottom: '1rem' }}
                    >
                        {trigger}
                        {!collapsed && (
                            <LogoWrapper
                                onClick={() => {
                                    router.push('/');
                                }}
                            >
                                <Logo theme="dark" />
                            </LogoWrapper>
                        )}
                    </Flex>
                    {customMenu}
                </Sidebar>
                <Layout>
                    <AppHeader>
                        <div>{withMelpSummary && melpSummary?.melp_status === 'DEDA_STARTED' && <MelpSummary />}</div>
                        <div>
                            <AdminActions />
                        </div>
                        <div>
                            <UserMenu />
                        </div>
                    </AppHeader>
                    <ContentLayout>
                        <AppContent ref={ref}>
                            {graceBanner}
                            {content}
                        </AppContent>
                    </ContentLayout>
                </Layout>
            </PageLayout>
        );
    },
);

ClassicAppLayout.displayName = 'ClassicAppLayout';
