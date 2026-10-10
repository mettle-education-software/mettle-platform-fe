'use client';

import { Global } from '@emotion/react';
import { useQuery } from '@tanstack/react-query';
import { Button, ConfigProvider, Flex, Modal, Typography } from 'antd';
import { popupStyles } from 'components/_new/ui';
import { useNewDesign } from 'hooks/useNewDesign';
import { useNewAntdTheme } from 'hooks/useTheme';
import { MASTERCLASS_SALES_URL } from 'libs/masterclass';
import {
    ACCESS_DENIED_EVENT,
    accessKey,
    accessSource,
    IMERSO_PRODUCT,
    IMERSO_SALES_URL,
    levelsFromMe,
    MyAccessResponse,
    ProductAccess,
    RENEWAL_URLS,
    resolveAccess,
} from 'libs/productAccess';
import { usePathname } from 'next/navigation';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { accountService } from 'services';
import { useAppContext } from './AppProvider';

const { Title, Paragraph } = Typography;

export interface CtaTarget {
    product: string;
    name?: string;
    renewUrl?: string;
}

interface AccessContext {
    access: (product: string) => ProductAccess;
    /** a resposta de /v2/me/access ainda não chegou (negar acesso só depois dela: o produto pode vir só de lá) */
    accessLoading: boolean;
    imerso: MyAccessResponse['imerso'];
    cta: CtaTarget | null;
    openCta: (target: CtaTarget | null) => void;
}

const Context = createContext<AccessContext>({
    access: () => ({ state: 'none' }),
    accessLoading: false,
    imerso: null,
    cta: null,
    openCta: () => undefined,
});

const PRODUCT_NAMES: Record<string, string> = { [IMERSO_PRODUCT]: 'Programa Imerso' };

const renewUrlOf = (target: CtaTarget) =>
    // Masterclass: a página de vendas dela (o paymentCheckout do curso leva ao Imerso)
    (accessKey(target.product) === 'masterclass' ? MASTERCLASS_SALES_URL : target.renewUrl) ??
    RENEWAL_URLS[target.product] ??
    IMERSO_SALES_URL;

/** Plataforma nova: o convite é um título e a ação, sem parágrafo; dentro do IMERSO (rotas /imerso), em inglês. */
const useNewCopy = (target: CtaTarget) => {
    const en = (usePathname() ?? '').startsWith('/imerso');
    const title =
        target.product !== IMERSO_PRODUCT
            ? 'Acesso encerrado'
            : en
              ? 'Your IMERSO is read-only'
              : 'Seu IMERSO está em modo leitura';
    return { en, title, later: en ? 'Not now' : 'Agora não', renew: en ? 'Renew' : 'Renovar' };
};

const CtaContent: React.FC<{
    target: CtaTarget;
    imerso: MyAccessResponse['imerso'];
    onClose?: () => void;
    /** bloco no lugar do conteúdo: botão alinhado ao texto (no modal, à direita) */
    inline?: boolean;
}> = ({ target, imerso, onClose, inline }) => {
    const name = target.name ?? PRODUCT_NAMES[target.product] ?? 'este produto';
    // a semana em que parou (o "DEDAs concluídos" do servidor conta dias, não DEDAs: fica de fora)
    const week = target.product === IMERSO_PRODUCT && imerso?.week ? imerso.week : null;
    const newDesign = useNewDesign();
    const copy = useNewCopy(target);
    const renewUrl = newDesign
        ? renewUrlOf(target)
        : (target.renewUrl ?? RENEWAL_URLS[target.product] ?? IMERSO_SALES_URL);
    const t = newDesign
        ? { ...copy, text: null }
        : {
              en: false,
              title: `Seu acesso ao ${name} expirou`,
              text: `${week ? `Você parou na semana ${week}. ` : ''}Seu progresso está guardado. Renove para continuar de onde parou.`,
              later: 'Agora não',
              renew: 'Renovar meu acesso',
          };

    return (
        <Flex vertical gap="0.5rem" lang={t.en ? 'en' : 'pt-BR'}>
            <Title level={4}>{t.title}</Title>
            {t.text && <Paragraph>{t.text}</Paragraph>}
            <Flex gap="0.5rem" justify={inline ? 'flex-start' : 'flex-end'} wrap>
                {onClose && <Button onClick={onClose}>{t.later}</Button>}
                <Button type="primary" href={renewUrl}>
                    {t.renew}
                </Button>
            </Flex>
        </Flex>
    );
};

export const AccessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAppContext();
    const [cta, setCta] = useState<CtaTarget | null>(null);
    const newDesign = useNewDesign();
    const roles = user?.roles as unknown as string[] | undefined;

    // Modelo novo (claims `access`), só na plataforma nova: libs/productAccess.accessSource
    const source = newDesign ? accessSource(user) : { claim: undefined, me: false };
    const { data: meLevels, isLoading: meLoading } = useQuery({
        queryKey: ['me-access', user?.uid],
        // null, não undefined: o React Query não aceita undefined como resposta
        queryFn: () =>
            accountService
                .get<{ data?: unknown }>('/me')
                .then(({ data }) => levelsFromMe(data?.data, user?.uid) ?? null),
        enabled: source.me && !!user?.uid,
        retry: false,
        staleTime: 5 * 60 * 1000,
    });
    const levels = source.claim ?? (source.me ? (meLevels ?? undefined) : undefined);

    // Sem o endpoint (backend sem o PR #102) o erro é ignorado e vale o comportamento atual pelas roles.
    const { data, isLoading: accessLoading } = useQuery({
        queryKey: ['my-access', user?.uid],
        queryFn: () => accountService.get<{ data: MyAccessResponse }>('/v2/me/access').then(({ data }) => data.data),
        enabled: !!user?.uid,
        retry: false,
        staleTime: 5 * 60 * 1000,
    });

    useEffect(() => {
        const onDenied = (event: Event) => setCta((event as CustomEvent<CtaTarget>).detail);
        window.addEventListener(ACCESS_DENIED_EVENT, onDenied);
        return () => window.removeEventListener(ACCESS_DENIED_EVENT, onDenied);
    }, []);

    const value = useMemo<AccessContext>(
        () => ({
            access: (product) => resolveAccess(product, roles, data, levels),
            accessLoading: accessLoading || meLoading,
            imerso: data?.imerso ?? null,
            cta,
            openCta: setCta,
        }),
        [roles, data, levels, accessLoading, meLoading, cta],
    );

    return <Context.Provider value={value}>{children}</Context.Provider>;
};

export const useProductAccess = () => useContext(Context);

// Renderizado dentro do ConfigProvider do App (tema da Plataforma).
export const AccessCtaModal: React.FC = () => {
    const { cta, openCta, imerso } = useProductAccess();
    const newDesign = useNewDesign();
    const antdTheme = useNewAntdTheme();
    const modal = (
        <Modal
            open={!!cta}
            footer={null}
            onCancel={() => openCta(null)}
            destroyOnClose
            className={newDesign ? 'ui-new-modal' : undefined}
        >
            {cta && <CtaContent target={cta} imerso={imerso} onClose={() => openCta(null)} />}
        </Modal>
    );
    // Plataforma nova: o convite segue o tema escolhido (Claro/Escuro) e o acabamento dos demais modais.
    return newDesign ? (
        <ConfigProvider theme={antdTheme}>
            <Global styles={popupStyles} />
            {modal}
        </ConfigProvider>
    ) : (
        modal
    );
};

// Mesmo conteúdo do modal, no lugar de uma página/conteúdo trancado. Plataforma nova: o aviso de uma linha das
// páginas novas (classe `notice` de components/_new/ui; quem usa garante a página em volta).
export const AccessCtaBlock: React.FC<{ target: CtaTarget }> = ({ target }) => {
    const { imerso } = useProductAccess();
    const newDesign = useNewDesign();
    const copy = useNewCopy(target);
    if (newDesign)
        return (
            <div className="notice" role="status" lang={copy.en ? 'en' : 'pt-BR'}>
                <div>
                    <b>{copy.title}</b>
                </div>
                <a className="btn gold" href={renewUrlOf(target)}>
                    {copy.renew}
                </a>
            </div>
        );
    return (
        <Flex justify="center" style={{ padding: '3rem 1rem' }}>
            <div style={{ maxWidth: '32rem', width: '100%' }}>
                <CtaContent target={target} imerso={imerso} inline />
            </div>
        </Flex>
    );
};
