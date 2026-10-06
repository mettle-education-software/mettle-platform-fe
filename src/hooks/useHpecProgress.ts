'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { auth } from 'config/firebase';
import { clearWatched, DoneMap, HPEC_PROGRESS_URL, readWatched } from 'libs/hpecTrail';
import { useAppContext } from 'providers';
import { useRef } from 'react';

const call = async (init?: RequestInit): Promise<DoneMap> => {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch(HPEC_PROGRESS_URL, {
        ...init,
        headers: { Authorization: `Bearer ${token}`, ...(init?.body ? { 'Content-Type': 'application/json' } : {}) },
        cache: 'no-store',
    });
    if (!res.ok) throw new Error(String(res.status));
    return ((await res.json()) as { done: DoneMap }).done;
};

/**
 * Aulas do HPEC concluídas pelo aluno (Worker, todos os aparelhos). Na primeira leitura, as marcas antigas deste
 * aparelho (localStorage) sobem numa ida só e saem do aparelho. Sem a resposta do Worker: `done` vazio (a home
 * segue com a regra por módulo).
 */
export const useHpecProgress = () => {
    // o uid só reavalia quando a sessão troca; a conta é a do token (o Worker verifica)
    const uid = useAppContext().user?.uid;
    const queryClient = useQueryClient();
    const key = ['hpec-progress', uid];

    const query = useQuery({
        queryKey: key,
        enabled: !!uid,
        staleTime: 60_000,
        retry: 1,
        queryFn: async () => {
            const done = await call();
            const local = [...readWatched()].filter((id) => !done[id]).slice(0, 100);
            if (!local.length) return done;
            const merged = await call({
                method: 'PUT',
                body: JSON.stringify({ set: Object.fromEntries(local.map((id) => [id, true])) }),
            }).catch(() => null);
            if (merged) clearWatched();
            return merged ?? done;
        },
    });

    const mutationKey = ['hpec-progress-set', uid];
    // cliques seguidos com respostas em voo: no fim, uma leitura do Worker fecha a conta (a ordem das respostas não é garantida)
    const overlapped = useRef(false);
    const mutation = useMutation({
        mutationKey,
        mutationFn: ({ lessonId, done }: { lessonId: string; done: boolean }) =>
            call({ method: 'PUT', body: JSON.stringify({ set: { [lessonId]: done } }) }),
        // a marca aparece na hora; se o Worker recusar, volta ao que era
        onMutate: async ({ lessonId, done }) => {
            if (queryClient.isMutating({ mutationKey }) > 1) overlapped.current = true;
            await queryClient.cancelQueries({ queryKey: key });
            const before = queryClient.getQueryData<DoneMap>(key);
            const next = { ...(before ?? {}) };
            if (done) next[lessonId] ??= new Date().toISOString();
            else delete next[lessonId];
            queryClient.setQueryData(key, next);
            return { before };
        },
        onError: (_e, _v, ctx) => queryClient.setQueryData(key, ctx?.before),
        // cliques seguidos: resposta de um clique antigo não desfaz o seguinte
        onSuccess: (done) => {
            if (queryClient.isMutating({ mutationKey }) <= 1 && !overlapped.current)
                queryClient.setQueryData(key, done);
        },
        onSettled: () => {
            if (queryClient.isMutating({ mutationKey }) <= 1 && overlapped.current) {
                overlapped.current = false;
                queryClient.invalidateQueries({ queryKey: key });
            }
        },
    });

    const done = query.data ?? {};
    return {
        done,
        ready: query.isSuccess,
        isDone: (lessonId: string) => !!done[lessonId],
        setDone: (lessonId: string, value: boolean) => mutation.mutate({ lessonId, done: value }),
        /** fim do vídeo / 90%: marca só se ainda não estiver marcada */
        markDone: (lessonId: string) => !done[lessonId] && mutation.mutate({ lessonId, done: true }),
    };
};
