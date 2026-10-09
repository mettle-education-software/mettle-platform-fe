'use client';

import { Global } from '@emotion/react';
import { useQuery } from '@tanstack/react-query';
import { Button, ConfigProvider, Flex, Modal, Typography } from 'antd';
import { popupStyles } from 'components/_new/ui';
import { useNewDesign } from 'hooks/useNewDesign';
import { useNewAntdTheme } from 'hooks/useTheme';
import {
    ACCESS_DENIED_EVENT,
    IMERSO_PRODUCT,
    IMERSO_SALES_URL,
    MyAccessResponse,
    ProductAccess,
    RENEWAL_URLS,
    resolveAccess,
} from 'libs/productAccess';
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

const CtaContent: React.FC<{
    target: CtaTarget;
    imerso: MyAccessResponse['imerso'];
    onClose?: () => void;
    /** bloco no lugar do conteúdo: botão alinhado ao texto (no modal, à direita) */
    inline?: boolean;
}> = ({ target, imerso, onClose, inline }) => {
    const name = target.name ?? PRODUCT_NAMES[target.product] ?? 'este produto';
    const renewUrl = target.renewUrl ?? RENEWAL_URLS[target.product] ?? IMERSO_SALES_URL;
    // a semana em que parou (o "DEDAs concluídos" do servidor conta dias, não DEDAs: fica de fora)
    const week = target.product === IMERSO_PRODUCT && imerso?.week ? imerso.week : null;
    const newDesign = useNewDesign();
    // dentro do Imerso, na plataforma nova, tudo em inglês
    const en = newDesign && target.product === IMERSO_PRODUCT;
    const t = en
        ? {
              title: 'Your IMERSO access has expired',
              text: `${week ? `You stopped at week ${week}. ` : ''}Your progress is saved.`,
              later: 'Not now',
              renew: 'Renew access',
          }
        : {
              title: `Seu acesso ao ${name} expirou`,
              text: `${week ? `Você parou na semana ${week}. ` : ''}Seu progresso está guardado. Renove para continuar de onde parou.`,
              later: 'Agora não',
              renew: 'Renovar meu acesso',
          };

    return (
        <Flex vertical gap="0.5rem" lang={en ? 'en' : 'pt-BR'}>
            <Title level={4}>{t.title}</Title>
            <Paragraph>{t.text}</Paragraph>
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

    const roles = user?.roles as unknown as string[] | undefined;
    const value = useMemo<AccessContext>(
        () => ({
            access: (product) => resolveAccess(product, roles, data),
            accessLoading,
            imerso: data?.imerso ?? null,
            cta,
            openCta: setCta,
        }),
        [roles, data, accessLoading, cta],
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

// Mesmo conteúdo do modal, no lugar de uma página/conteúdo trancado.
export const AccessCtaBlock: React.FC<{ target: CtaTarget }> = ({ target }) => {
    const { imerso } = useProductAccess();
    return (
        <Flex justify="center" style={{ padding: '3rem 1rem' }}>
            <div style={{ maxWidth: '32rem', width: '100%' }}>
                <CtaContent target={target} imerso={imerso} inline />
            </div>
        </Flex>
    );
};
