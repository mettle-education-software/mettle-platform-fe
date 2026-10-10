/** @jest-environment node */
// Resumo do IMERSO: conta sem programa (404) é "sem programa" (null), não falha nem carregando eterno (PF2-01).
import { useMelpSummary } from '../../hooks/melp/melp';

const mockGet = jest.fn();
jest.mock('@tanstack/react-query', () => ({
    useQuery: (config: unknown) => config,
    useMutation: (config: unknown) => config,
    useQueryClient: () => ({}),
}));
jest.mock('services', () => ({ melpService: { get: (...args: unknown[]) => mockGet(...args) } }), { virtual: true });
jest.mock('interfaces', () => ({ MettleRoles: { METTLE_STUDENT: 'METTLE_STUDENT', METTLE_ADMIN: 'METTLE_ADMIN' } }), {
    virtual: true,
});
jest.mock('interfaces/melp', () => ({}), { virtual: true });
jest.mock('libs/dedaClock', () => ({ lampWeekOptions: () => [] }), { virtual: true });
jest.mock('libs/productAccess', () => ({ IMERSO_PRODUCT: 'METTLE_STUDENT' }), { virtual: true });
jest.mock(
    'providers',
    () => ({
        useAppContext: () => ({ user: { uid: 'aluno', roles: ['METTLE_STUDENT'] } }),
        useMelpContext: () => ({}),
        useNotificationsContext: () => ({}),
        useProductAccess: () => ({ access: () => ({ state: 'expired' }) }),
    }),
    { virtual: true },
);

const useSummaryQuery = () => useMelpSummary('aluno') as unknown as { queryFn: () => Promise<unknown> };

test('404: sem programa (null), sem lançar (nada de nova tentativa)', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(useSummaryQuery().queryFn()).resolves.toBeNull();
});

test('outra falha continua falha (a tela oferece "Try again")', async () => {
    const failure = { response: { status: 503 } };
    mockGet.mockRejectedValueOnce(failure);
    await expect(useSummaryQuery().queryFn()).rejects.toBe(failure);
});

test('com programa: o resumo', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: { melp_status: 'DEDA_STARTED' } } });
    await expect(useSummaryQuery().queryFn()).resolves.toEqual({ melp_status: 'DEDA_STARTED' });
});
