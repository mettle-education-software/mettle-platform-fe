import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { auth } from 'config/firebase';
import { QueryParams } from 'interfaces';
import type {
    AccessBody,
    AccessEvent,
    AccessRow,
    Product,
    StudentPurchase,
    StudentUser,
    TrashEntry,
} from 'libs/adminAccess';
import { type Range, readDashboard } from 'libs/adminDashboard';
import { ADMIN_HISTORY_URL, type HistorySnapshot } from 'libs/adminHistory';
import {
    accountRow,
    type AccountRow,
    type AccountsPage,
    type AccountsQuery,
    accountsParams,
    readSummary,
} from 'libs/adminPanel';
import { EBOOK_BUYERS_URL } from 'libs/adminSegments';
import { isLeituraOwner } from 'libs/leitura';
import { type Profile, profilePatch, type ProfileValues } from 'libs/profile';
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
export const useAdminHistory = (enabled = true) => {
    const uid = auth.currentUser?.uid;
    return useQuery({
        queryKey: ['admin-history', uid],
        queryFn: getHistory,
        enabled: enabled && isLeituraOwner(uid),
        staleTime: 5 * 60_000,
        retry: 1,
    });
};

// ---------- Acesso por produto de um aluno (accounts-service, só admin) ----------

/** A conta no painel: linhas de acesso, quem é, as compras e o LTV, e o perfil (para editar em Dados). */
export const useStudentAccess = (uid: string) =>
    useQuery({
        queryKey: ['admin-access', uid],
        queryFn: () =>
            accountService
                .get<{
                    data: AccessRow[];
                    user?: StudentUser;
                    purchases?: StudentPurchase[];
                    ltv?: { total?: number | null; compras?: number | null };
                    profile?: Partial<Profile> | null;
                }>(`/${encodeURIComponent(uid)}/access`)
                .then(({ data }) => data),
        retry: false,
        staleTime: 30_000,
    });

/** Dados do aluno editados pelo administrador: o mesmo PATCH (só o que mudou) e a mesma validação das Configurações. */
export const useSaveStudentProfile = (uid: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (changes: Partial<ProfileValues>) => {
            const body = profilePatch(changes);
            const { data } = await accountService.patch<typeof body, { data: Profile }>(
                `/${encodeURIComponent(uid)}/profile-data`,
                body,
            );
            const back = (data?.data ?? {}) as Partial<Profile>;
            const saved = Object.fromEntries(
                Object.entries(body).map(([field, value]) => [
                    field,
                    field in back ? back[field as keyof Profile] : value,
                ]),
            ) as Partial<Profile>;
            if (saved.birth_date) saved.birth_date = saved.birth_date.slice(0, 10);
            return { saved };
        },
        onSettled: () =>
            Promise.all([
                queryClient.invalidateQueries({ queryKey: ['admin-access', uid] }),
                queryClient.invalidateQueries({ queryKey: ['admin-accounts'] }),
            ]),
    });
};

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

/** Depois de mandar para a lixeira ou restaurar: a lixeira, a conta, a lista do Contas e o número da lixeira no Início. */
const invalidateAccount = (queryClient: ReturnType<typeof useQueryClient>, uid: string) =>
    Promise.all(
        [['admin-trash'], ['admin-access', uid], ['admin-accounts'], ['admin-dashboard']].map((queryKey) =>
            queryClient.invalidateQueries({ queryKey }),
        ),
    );

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
        onSettled: () => invalidateAccount(queryClient, uid),
    });
};

export const useRestoreAccount = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (uid: string) =>
            accountService.post(`/${encodeURIComponent(uid)}/restore`).then(({ data }) => data),
        onSettled: (_data, _error, uid) => invalidateAccount(queryClient, uid),
    });
};

// ---------- Painel de Contas ----------

/** A lista do painel: GET /admin/accounts (filtros, ordem, página e o resumo de auditoria no servidor). */
export const useAdminAccounts = (query: AccountsQuery, enabled = true) => {
    const params = accountsParams(query);
    return useQuery({
        queryKey: ['admin-accounts', params],
        queryFn: () =>
            adminService
                .get<{ data?: unknown[]; total?: number; summary?: unknown }>('/accounts', { params })
                .then(({ data }): AccountsPage => {
                    const rows = (data.data ?? []).map(accountRow).filter((row): row is AccountRow => !!row);
                    return {
                        rows,
                        total: typeof data.total === 'number' ? data.total : rows.length,
                        summary: readSummary(data.summary),
                    };
                }),
        enabled,
        retry: false,
        staleTime: 30_000,
        placeholderData: keepPreviousData,
    });
};

/** CSV do filtro atual (só o dono): todas as páginas, de 100 em 100. */
export const fetchAllAccounts = async (query: AccountsQuery, maxPages = 200) => {
    const rows: AccountRow[] = [];
    for (let page = 1; page <= maxPages; page++) {
        const params = accountsParams({ ...query, page, pageSize: 100 });
        const { data } = await adminService.get<{ data?: unknown[]; total?: number }>('/accounts', { params });
        const batch = (data.data ?? []).map(accountRow).filter((row): row is AccountRow => !!row);
        rows.push(...batch);
        if (batch.length < 100 || (typeof data.total === 'number' && rows.length >= data.total)) break;
    }
    return rows;
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

/** Início do Admin numa chamada; o período (datas de Brasília) só muda o bloco "No período". null sem a rota nova. */
export const useAdminDashboard = (range: Range) =>
    useQuery({
        queryKey: ['admin-dashboard', range.from, range.to],
        queryFn: () =>
            adminService
                .get<{ data?: unknown }>('/dashboard', { params: range })
                .then(({ data }) => readDashboard(data?.data ?? data)),
        retry: false,
        staleTime: 60_000,
        placeholderData: keepPreviousData,
    });
