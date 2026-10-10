import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { auth } from 'config/firebase';
import { QueryParams } from 'interfaces';
import type { AccessBody, AccessEvent, AccessRow, Product, StudentUser } from 'libs/adminAccess';
import { ADMIN_HISTORY_URL, type HistorySnapshot } from 'libs/adminHistory';
import { ADMIN_SEGMENTS, AdminSegment, EBOOK_BUYERS_URL, onlyBuyers } from 'libs/adminSegments';
import { isLeituraOwner } from 'libs/leitura';
import { useAppContext } from 'providers';
import { accountService, adminService } from 'services';

export const useGetMettleUsers = (params: QueryParams) => {
    const { user } = useAppContext();

    return useQuery({
        queryKey: ['mettle-users', params],
        queryFn: () =>
            adminService
                .get<{
                    data: {
                        user_uid: string;
                        first_name: string;
                        last_name: string;
                        email: string;
                    }[];
                    pagination: {
                        limit: number;
                        offset: number;
                    };
                }>('/v2/users', {
                    params: {
                        ...params,
                        offset: 0,
                        limit: 1000,
                    },
                })
                .then(({ data }) => data),
        enabled: !!user && user?.roles?.includes('METTLE_ADMIN'),
    });
};

/** Compradores ativos do e-book (e-mails), do Worker mettle-events; só METTLE_ADMIN recebe (os demais, 404). */
export const useEbookBuyers = (enabled: boolean) =>
    useQuery({
        queryKey: ['admin-ebook-buyers'],
        queryFn: async () => {
            const token = await auth.currentUser?.getIdToken();
            const res = await fetch(EBOOK_BUYERS_URL, {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store',
            });
            if (!res.ok) throw new Error(`ebook-buyers ${res.status}`);
            return ((await res.json()) as { emails: string[] }).emails;
        },
        enabled,
        staleTime: 5 * 60_000,
    });

type UsersPage = { data: { user_uid: string; email: string }[]; pagination: { total: number } };

/** Quantos alunos ativos em cada segmento (sem a busca). E-book: no_imerso ∩ compradores, contado aqui. */
export const useSegmentCounts = (enabled: boolean) => {
    const buyers = useEbookBuyers(enabled);
    const q = useQuery({
        queryKey: ['admin-segment-counts', buyers.data?.length ?? null],
        queryFn: async () => {
            const counts: Partial<Record<AdminSegment, number>> = {};
            await Promise.all(
                ADMIN_SEGMENTS.filter((s) => !s.ebook || buyers.data).map(async (s) => {
                    const { data } = await adminService.get<UsersPage>('/v2/users', {
                        params: { accountStatusIn: 'ACTIVE', segment: s.server, offset: 0, limit: s.ebook ? 1000 : 1 },
                    });
                    counts[s.key] = s.ebook
                        ? onlyBuyers(data.data, buyers.data as string[]).length
                        : data.pagination.total;
                }),
            );
            return counts;
        },
        // Sem o Worker (erro), Imerso e Masterclass contam do mesmo jeito; o e-book fica sem número.
        enabled: enabled && !buyers.isPending,
        staleTime: 5 * 60_000,
    });
    return q;
};

// ---------- Histórico do programa (retrato do Worker, só o dono) ----------

const getHistory = async (): Promise<HistorySnapshot> => {
    const user = auth.currentUser;
    if (!isLeituraOwner(user?.uid) || !user) throw new Error('Acesso restrito');
    const token = await user.getIdToken();
    const response = await fetch(ADMIN_HISTORY_URL, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
    });
    if (!response.ok) throw new Error(String(response.status));
    return response.json();
};

/** O retrato de /admin/historico (mesma consulta e cache da tabela e da página do aluno). */
export const useAdminHistory = () => {
    const uid = auth.currentUser?.uid;
    return useQuery({
        queryKey: ['admin-history', uid],
        queryFn: getHistory,
        enabled: isLeituraOwner(uid),
        staleTime: 5 * 60_000,
        retry: 1,
    });
};

// ---------- Acesso por produto de um aluno (accounts-service, só admin) ----------

/** Linhas dos três produtos e quem é o aluno. 404 até o servidor publicar as rotas: a tela fica calma. */
export const useStudentAccess = (uid: string) =>
    useQuery({
        queryKey: ['admin-access', uid],
        queryFn: () =>
            accountService
                .get<{ data: AccessRow[]; user?: StudentUser }>(`/${encodeURIComponent(uid)}/access`)
                .then(({ data }) => data),
        retry: false,
        staleTime: 30_000,
    });

export const useStudentAccessEvents = (uid: string) =>
    useQuery({
        queryKey: ['admin-access-events', uid],
        queryFn: () =>
            accountService
                .get<{ data: AccessEvent[] }>(`/${encodeURIComponent(uid)}/access-events`)
                .then(({ data }) => data.data),
        retry: false,
        staleTime: 30_000,
    });

/** PUT de um produto; depois relê as linhas e o registro. */
export const useSaveStudentAccess = (uid: string, product: Product) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: AccessBody) =>
            accountService
                .put<
                    AccessBody,
                    { data: AccessRow & { claimsSynced?: boolean } }
                >(`/${encodeURIComponent(uid)}/access/${product}`, body)
                .then(({ data }) => data.data),
        onSettled: () =>
            Promise.all([
                queryClient.invalidateQueries({ queryKey: ['admin-access', uid] }),
                queryClient.invalidateQueries({ queryKey: ['admin-access-events', uid] }),
            ]),
    });
};
