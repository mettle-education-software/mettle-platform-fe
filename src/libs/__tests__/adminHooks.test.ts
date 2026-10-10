/** @jest-environment node */
// Contas v2: os dados do aluno gravados pelo administrador (PATCH na conta dele) e o CSV (todas as páginas do filtro).
import { fetchAllAccounts, useSaveStudentProfile } from '../../hooks/useAdmin';

const mockPatch = jest.fn();
const mockAdminGet = jest.fn();
const mockInvalidate = jest.fn().mockResolvedValue(undefined);
jest.mock('@tanstack/react-query', () => ({
    keepPreviousData: undefined,
    useQuery: (config: unknown) => config,
    useMutation: (config: unknown) => config,
    useQueryClient: () => ({ invalidateQueries: mockInvalidate }),
}));
jest.mock(
    'services',
    () => ({
        accountService: { patch: (...args: unknown[]) => mockPatch(...args) },
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
    await mutation.onSettled();
    expect(mockInvalidate).toHaveBeenCalledWith({ queryKey: ['admin-access', 'aluno/x'] });
    expect(mockInvalidate).toHaveBeenCalledWith({ queryKey: ['admin-accounts'] });
});

test('CSV: o filtro atual, todas as páginas de 100 em 100, até o total', async () => {
    const page = (prefix: string, length: number) => ({
        data: { data: Array.from({ length }, (_, i) => ({ uid: `${prefix}${i}` })), total: 150 },
    });
    mockAdminGet.mockResolvedValueOnce(page('a', 100)).mockResolvedValueOnce(page('b', 50));
    const rows = await fetchAllAccounts({
        product: 'imerso',
        situacao: 'vence30',
        sort: { key: 'name', dir: 'asc' },
        page: 3,
        pageSize: 25,
    });
    expect(rows).toHaveLength(150);
    expect(mockAdminGet).toHaveBeenCalledTimes(2);
    expect(mockAdminGet.mock.calls.map(([path, { params }]) => [path, params.page, params.pageSize])).toEqual([
        ['/accounts', 1, 100],
        ['/accounts', 2, 100],
    ]);
    expect(mockAdminGet.mock.calls[1][1].params).toMatchObject({ product: 'imerso', situacao: 'vence30' });
});
