'use client';

import { useQuery } from '@tanstack/react-query';
import { IMERSO_PRODUCT } from 'libs/productAccess';
import { useProductAccess } from 'providers';
import { cfetch } from 'services/comunidadeService';
import { useNewDesign } from './useNewDesign';

export const COMUNIDADE_UNREAD_KEY = ['comunidade-unread'];

/**
 * Membro da Comunidade? (o Worker decide: 404 = não) e mensagens não lidas, para o item do menu. Só na plataforma nova
 * e nunca com o Imerso em leitura; 1 consulta a cada 2 min com a página à vista.
 */
export const useComunidade = (): { member: boolean; unread: number } => {
    const readOnly = useProductAccess().access(IMERSO_PRODUCT).state === 'expired';
    const newDesign = useNewDesign() && !readOnly;
    const { data, isError } = useQuery({
        queryKey: COMUNIDADE_UNREAD_KEY,
        queryFn: () => cfetch<{ unread: number }>('/unread'),
        enabled: newDesign,
        refetchInterval: 120_000,
        refetchOnWindowFocus: true,
        retry: false,
        staleTime: 30_000,
    });
    return { member: newDesign && !!data && !isError, unread: data?.unread ?? 0 };
};
