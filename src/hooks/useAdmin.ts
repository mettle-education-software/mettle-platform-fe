import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { auth } from 'config/firebase';
import { QueryParams } from 'interfaces';
import type { AccessBody, AccessEvent, AccessRow, Product, StudentUser, TrashEntry } from 'libs/adminAccess';
import { readDashboard } from 'libs/adminDashboard';
import { ADMIN_HISTORY_URL, type HistorySnapshot } from 'libs/adminHistory';
import {
    accountRow,
    type AccountRow,
    type AccountsPage,
    type AccountsQuery,
    accountsParams,
    snapshotPage,
} from 'libs/adminPanel';
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

/** O retrato noturno do histórico (Worker, só o dono): reserva da lista de Contas e o histórico do programa de cada conta. */
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

// ---------- Lixeira (só o dono; o servidor confere) ----------

export const useTrash = (enabled: boolean) =>
    useQuery({
        queryKey: ['admin-trash'],
        queryFn: () => adminService.get<{ data: TrashEntry[] }>('/trash').then(({ data }) => data.data),
        enabled,
        retry: false,
        staleTime: 30_000,
    });

/** Manda a conta para a lixeira (30 dias, sem login, restaurável); repetir é seguro. */
export const useTrashAccount = (uid: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (confirmEmail: string) =>
            accountService
                .post<
                    { confirmEmail: string },
                    { data: { purgeAfter: string } }
                >(`/${encodeURIComponent(uid)}/trash`, { confirmEmail })
                .then(({ data }) => data.data),
        onSettled: () =>
            Promise.all([
                queryClient.invalidateQueries({ queryKey: ['admin-trash'] }),
                queryClient.invalidateQueries({ queryKey: ['admin-access', uid] }),
            ]),
    });
};

export const useRestoreAccount = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (uid: string) =>
            accountService.post(`/${encodeURIComponent(uid)}/restore`).then(({ data }) => data),
        onSettled: (_data, _error, uid) =>
            Promise.all([
                queryClient.invalidateQueries({ queryKey: ['admin-trash'] }),
                queryClient.invalidateQueries({ queryKey: ['admin-access', uid] }),
            ]),
    });
};

// ---------- Painel de Contas ----------

/**
 * A lista do painel: GET /admin/accounts (filtros, ordem e página no servidor). Enquanto o servidor não publica a rota
 * (404 no gateway), o retrato noturno do histórico (só o dono), no mesmo formato.
 */
export const useAdminAccounts = (query: AccountsQuery) => {
    const params = accountsParams(query);
    const live = useQuery({
        queryKey: ['admin-accounts', params],
        queryFn: () =>
            adminService
                .get<{ data?: unknown[]; total?: number }>('/accounts', { params })
                .then(({ data }): AccountsPage => {
                    const rows = (data.data ?? []).map(accountRow).filter((row): row is AccountRow => !!row);
                    return { rows, total: typeof data.total === 'number' ? data.total : rows.length, snapshot: false };
                }),
        retry: false,
        staleTime: 30_000,
        placeholderData: keepPreviousData,
    });
    const missing = (live.error as { response?: { status?: number } } | null)?.response?.status === 404;
    const snapshot = useAdminHistory();
    if (missing && snapshot.data)
        return {
            data: snapshotPage(snapshot.data.students, query),
            isLoading: false,
            isError: false,
            refetch: live.refetch,
        };
    return {
        data: live.data,
        isLoading: live.isLoading || (missing && snapshot.isLoading),
        isError: live.isError && !(missing && snapshot.isLoading),
        refetch: live.refetch,
    };
};

/** Entra como o aluno (modo visualização) e abre o Início dele. */
export const useImpersonateStudent = () =>
    useMutation({
        mutationFn: (uid: string) => accountService.post(`/impersonate/add/${encodeURIComponent(uid)}`),
        onSuccess: () => window.location.assign('/'),
    });

/** Pausas e/ou resets a mais no Programa Imerso (1 a 3 de cada), com registro. */
export const useProgramAllowances = (uid: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: { addPauses?: number; addResets?: number }) =>
            accountService
                .put<
                    typeof body,
                    { data: { remainingPauses: number; remainingResets: number } }
                >(`/${encodeURIComponent(uid)}/program/allowances`, body)
                .then(({ data }) => data.data),
        onSettled: () => queryClient.invalidateQueries({ queryKey: ['admin-accounts'] }),
    });
};

/** Reset de fábrica (só o dono): o programa volta ao primeiro acesso; a LAMP vai para o arquivo. 501 NOT_YET = em breve. */
export const useFactoryReset = (uid: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (confirmEmail: string) =>
            accountService
                .post<{ confirmEmail: string }, unknown>(`/${encodeURIComponent(uid)}/program/factory-reset`, {
                    confirmEmail,
                })
                .then(({ data }) => data),
        onSettled: () => queryClient.invalidateQueries({ queryKey: ['admin-accounts'] }),
    });
};

/** Início do Admin: os números do dia numa chamada (null enquanto a rota nova não está publicada). */
export const useAdminDashboard = () =>
    useQuery({
        queryKey: ['admin-dashboard'],
        queryFn: () =>
            adminService.get<{ data?: unknown }>('/dashboard').then(({ data }) => readDashboard(data?.data ?? data)),
        retry: false,
        staleTime: 60_000,
    });
