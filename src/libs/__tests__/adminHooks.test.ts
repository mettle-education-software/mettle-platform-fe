/** @jest-environment node */
// Contas v2: os dados do aluno gravados pelo administrador (PATCH na conta dele) e o CSV (todas as páginas do filtro).
import { fetchAllAccounts, useSaveStudentAccess, useSaveStudentProfile } from '../../hooks/useAdmin';

const mockPatch = jest.fn();
const mockAdminGet = jest.fn();
const mockInvalidate = jest.fn().mockResolvedValue(undefined);
const mockSetData = jest.fn();
jest.mock('@tanstack/react-query', () => ({
    keepPreviousData: undefined,
    useQuery: (config: unknown) => config,
    useMutation: (config: unknown) => config,
    useQueryClient: () => ({ invalidateQueries: mockInvalidate, setQueryData: mockSetData }),
}));
jest.mock(
    'services',
    () => ({
        accountService: { patch: (...args: unknown[]) => mockPatch(...args), put: jest.fn() },
        adminService: { get: (...args: unknown[]) => mockAdminGet(...args) },
    }),
    { virtual: true },
);
jest.mock('config/firebase', () => ({ auth: { currentUser: null } }), { virtual: true });
jest.mock('interfaces', () => ({}), { virtual: true });
jest.mock('providers', () => ({ useAppContext: () => ({}) }), { virtual: true });
jest.mock('libs/adminDashboard', () => ({ readDashboard: jest.fn() }), { virtual: true });
jest.mock('libs/adminHistory', () => ({ ADMIN_HISTORY_URL: '/historico' }), { virtual: true });
jest.mock('libs/adminSegments', () => ({ EBOOK_BUYERS_URL: '/ebook' }), { virtual: true });
jest.mock('libs/leitura', () => ({ isLeituraOwner: () => false }), { virtual: true });
jest.mock('libs/adminAccess', () => jest.requireActual('../adminAccess'), { virtual: true });
jest.mock('libs/adminPanel', () => jest.requireActual('../adminPanel'), { virtual: true });
jest.mock('libs/profile', () => jest.requireActual('../profile'), { virtual: true });

beforeEach(() => jest.clearAllMocks());

test('dados do aluno pelo administrador: PATCH na conta dele, telefone em E.164, e a conta e a lista recarregam', async () => {
    const mutation = useSaveStudentProfile('aluno/x') as any;
    mockPatch.mockResolvedValue({ data: { data: { city: 'Recife', birth_date: '2000-02-29T00:00:00.000Z' } } });
    await expect(
        mutation.mutationFn({ city: 'Recife', phone: '(11) 91234-5678', birth_date: '2000-02-29' }),
    ).resolves.toEqual({ saved: { city: 'Recife', phone: '+5511912345678', birth_date: '2000-02-29' } });
    expect(mockPatch).toHaveBeenCalledTimes(1);
    expect(mockPatch.mock.calls[0][0]).toBe('/aluno%2Fx/profile-data');
    expect(mockPatch.mock.calls[0][1]).toMatchObject({ city: 'Recife', phone: '+5511912345678' });
    // o perfil da conta em cache já com o salvo
    mutation.onSuccess({ saved: { city: 'Recife' } });
    const [key, update] = mockSetData.mock.calls[0];
    expect(key).toEqual(['admin-access', 'aluno/x']);
    expect(update({ data: [], profile: { city: 'Olinda', first_name: 'Ana' } })).toEqual({
        data: [],
        profile: { city: 'Recife', first_name: 'Ana' },
    });
    await mutation.onSettled();
    expect(mockInvalidate).toHaveBeenCalledWith({ queryKey: ['admin-access', 'aluno/x'] });
    expect(mockInvalidate).toHaveBeenCalledWith({ queryKey: ['admin-accounts'] });
});

test('CSV: o filtro atual, todas as páginas de 200 em 200, até o total, sem repetir conta', async () => {
    const page = (prefix: string, length: number, from = 0) => ({
        data: { data: Array.from({ length }, (_, i) => ({ uid: `${prefix}${i + from}` })), total: 250 },
    });
    // a lista mudou entre as páginas: a conta a199 volta na segunda (fica uma vez só)
    mockAdminGet.mockResolvedValueOnce(page('a', 200)).mockResolvedValueOnce({
        data: { data: [{ uid: 'a199' }, ...page('b', 50).data.data], total: 250 },
    });
    const rows = await fetchAllAccounts({
        product: 'imerso',
        situacao: 'vence30',
        sort: { key: 'name', dir: 'asc' },
        page: 3,
        pageSize: 25,
    });
    expect(rows).toHaveLength(250);
    expect(mockAdminGet).toHaveBeenCalledTimes(2);
    expect(mockAdminGet.mock.calls.map(([path, { params }]) => [path, params.page, params.pageSize])).toEqual([
        ['/accounts', 1, 200],
        ['/accounts', 2, 200],
    ]);
    expect(mockAdminGet.mock.calls[1][1].params).toMatchObject({ product: 'imerso', situacao: 'vence30' });
});

test('acesso salvo na conta: relê a conta e o registro (esperando) e marca a lista e o Início para reler (sem esperar)', async () => {
    const mutation = useSaveStudentAccess('aluno', 'imerso') as any;
    await mutation.onSettled();
    expect(mockInvalidate.mock.calls.map(([{ queryKey }]) => queryKey)).toEqual([
        ['admin-accounts'],
        ['admin-dashboard'],
        ['admin-access', 'aluno'],
        ['admin-access-events', 'aluno'],
    ]);
});
