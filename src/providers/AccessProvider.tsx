'use client';

import { useQuery } from '@tanstack/react-query';
import { Button, Flex, Modal, Typography } from 'antd';
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
    imerso: MyAccessResponse['imerso'];
    cta: CtaTarget | null;
    openCta: (target: CtaTarget | null) => void;
}

const Context = createContext<AccessContext>({
    access: () => ({ state: 'none' }),
    imerso: null,
    cta: null,
    openCta: () => undefined,
});

const PRODUCT_NAMES: Record<string, string> = { [IMERSO_PRODUCT]: 'Programa Imerso' };

const CtaContent: React.FC<{ target: CtaTarget; imerso: MyAccessResponse['imerso']; onClose?: () => void }> = ({
    target,
    imerso,
    onClose,
}) => {
    const name = target.name ?? PRODUCT_NAMES[target.product] ?? 'este produto';
    const renewUrl = target.renewUrl ?? RENEWAL_URLS[target.product] ?? IMERSO_SALES_URL;
    const progress =
        target.product === IMERSO_PRODUCT && imerso
            ? `Você parou na semana ${imerso.week}, com ${imerso.dedasConcluded} DEDAs concluídos. Seu progresso está guardado.`
            : 'Seu progresso está guardado.';

    return (
        <Flex vertical gap="0.5rem">
            <Title level={4}>Seu acesso ao {name} expirou</Title>
            <Paragraph>{progress} Renove para continuar de onde parou.</Paragraph>
            <Flex gap="0.5rem" justify="flex-end">
                {onClose && <Button onClick={onClose}>Agora não</Button>}
                <Button type="primary" href={renewUrl}>
                    Renovar meu acesso
                </Button>
            </Flex>
        </Flex>
    );
};

export const AccessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAppContext();
    const [cta, setCta] = useState<CtaTarget | null>(null);

    // Sem o endpoint (backend sem o PR #102) o erro é ignorado e vale o comportamento atual pelas roles.
    const { data } = useQuery({
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
            imerso: data?.imerso ?? null,
            cta,
            openCta: setCta,
        }),
        [roles, data, cta],
    );

    return <Context.Provider value={value}>{children}</Context.Provider>;
};

export const useProductAccess = () => useContext(Context);

// Renderizado dentro do ConfigProvider do App (tema da Plataforma).
export const AccessCtaModal: React.FC = () => {
    const { cta, openCta, imerso } = useProductAccess();
    return (
        <Modal open={!!cta} footer={null} onCancel={() => openCta(null)} destroyOnClose>
            {cta && <CtaContent target={cta} imerso={imerso} onClose={() => openCta(null)} />}
        </Modal>
    );
};

// Mesmo conteúdo do modal, no lugar de uma página/conteúdo trancado.
export const AccessCtaBlock: React.FC<{ target: CtaTarget }> = ({ target }) => {
    const { imerso } = useProductAccess();
    return (
        <Flex justify="center" style={{ padding: '3rem 1rem' }}>
            <div style={{ maxWidth: '32rem', width: '100%' }}>
                <CtaContent target={target} imerso={imerso} />
            </div>
        </Flex>
    );
};
