'use client';

import { useQuery } from '@tanstack/react-query';
import { chatFetch } from 'services/chatService';
import { useNewDesign } from './useNewDesign';

export const CHAT_UNREAD_KEY = ['chat-unread'];

/** Respostas da equipe ainda não vistas (badge do Suporte no menu). Só na plataforma nova; 1 consulta por minuto. */
export const useChatUnread = (): number => {
    const newDesign = useNewDesign();
    const { data } = useQuery({
        queryKey: CHAT_UNREAD_KEY,
        queryFn: () => chatFetch<{ unread: number }>('/unread'),
        enabled: newDesign,
        refetchInterval: 60_000,
        refetchOnWindowFocus: true,
        retry: false,
    });
    return newDesign ? (data?.unread ?? 0) : 0;
};
