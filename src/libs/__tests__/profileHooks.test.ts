/** @jest-environment node */
import { useProfile, useSaveProfile, useSaveProfilePhoto } from '../../hooks/useProfile';

let mockUser = { uid: 'student-1' };
const mockGet = jest.fn();
const mockPatch = jest.fn();
const mockPut = jest.fn();
const mockCancel = jest.fn().mockResolvedValue(undefined);
const mockCache = jest.fn();
const mockReload = jest.fn().mockResolvedValue(undefined);
const mockToken = jest.fn().mockResolvedValue('token');
const mockAuth = { currentUser: { uid: 'student-1', reload: mockReload, getIdToken: mockToken } };
jest.mock('providers', () => ({ useAppContext: () => ({ user: mockUser }) }), { virtual: true });
jest.mock('libs/profile', () => jest.requireActual('../profile'), { virtual: true });
jest.mock(
    'services',
    () => ({
        accountService: {
            get: (...args: unknown[]) => mockGet(...args),
            patch: (...args: unknown[]) => mockPatch(...args),
            put: (...args: unknown[]) => mockPut(...args),
        },
    }),
    { virtual: true },
);
jest.mock(
    'config/firebase',
    () => ({
        get auth() {
            return mockAuth;
        },
    }),
    { virtual: true },
);
jest.mock('@tanstack/react-query', () => ({
    useQuery: (config: unknown) => config,
    useMutation: (config: unknown) => config,
    useQueryClient: () => ({ cancelQueries: mockCancel, setQueryData: mockCache }),
}));

beforeEach(() => {
    jest.clearAllMocks();
    mockUser = { uid: 'student-1' };
    mockAuth.currentUser.uid = 'student-1';
});

test('GET verifica a conta e normaliza nascimento para input date', async () => {
    const query = useProfile() as any;
    mockGet.mockResolvedValue({
        data: {
            data: {
                userRecord: [{ user_uid: 'student-1', birth_date: '2000-02-29T00:00:00.000Z' }],
                fbData: { photoURL: 'photo', phoneNumber: '11999999999' },
            },
        },
    });
    await expect(query.queryFn()).resolves.toMatchObject({
        birth_date: '2000-02-29',
        photoURL: 'photo',
        phone: '11999999999',
    });
    expect(mockGet).toHaveBeenCalledWith('/me');
    mockGet.mockResolvedValue({ data: { data: { userRecord: [{ user_uid: 'admin-real' }], fbData: {} } } });
    await expect(query.queryFn()).rejects.toThrow('Perfil indisponível para esta sessão');
});

test('um PATCH com só os campos alterados; o cache recebe o que o servidor devolveu, na conta original', async () => {
    const mutation = useSaveProfile() as any;
    mockPatch.mockResolvedValue({
        data: {
            data: {
                user_uid: 'student-1',
                first_name: 'André',
                city: 'São Paulo',
                birth_date: '2000-02-29T00:00:00.000Z',
                profile_updated_at: 'today',
            },
        },
    });
    const result = await mutation.mutationFn({
        first_name: '  andré  ',
        city: 'são paulo',
        birth_date: '2000-02-29',
        instagram: ' ',
        phone: '(11) 91234-5678',
    });
    // vazio vira null; telefone em E.164 (sem "+", Brasil)
    expect(mockPatch).toHaveBeenCalledTimes(1);
    expect(mockPatch).toHaveBeenCalledWith('/student-1/profile-data', {
        first_name: 'andré',
        city: 'são paulo',
        birth_date: '2000-02-29',
        instagram: null,
        phone: '+5511912345678',
    });
    // o que o servidor devolveu (nome com maiúscula); o que ele não devolveu (telefone) vale como enviado
    expect(result.saved).toEqual({
        first_name: 'André',
        city: 'São Paulo',
        birth_date: '2000-02-29',
        instagram: null,
        phone: '+5511912345678',
    });
    mockUser = { uid: 'student-2' };
    await mutation.onSuccess(result);
    // GET em voo cancelado antes de gravar no cache (não volta depois com o valor antigo)
    expect(mockCancel).toHaveBeenCalledWith({ queryKey: ['account-profile', 'student-1'] });
    expect(mockCancel.mock.invocationCallOrder[0]).toBeLessThan(mockCache.mock.invocationCallOrder[0]);
    expect(mockCache.mock.calls[0][0]).toEqual(['account-profile', 'student-1']);
    expect(mockCache.mock.calls[0][1]({ first_name: 'Anterior', state: 'estado já salvo' })).toMatchObject({
        first_name: 'André',
        state: 'estado já salvo',
        profile_updated_at: 'today',
    });
});

test('conflitos não são absorvidos', async () => {
    const mutation = useSaveProfile() as any;
    const conflict = { response: { status: 409, data: { code: 'username_taken', message: 'Indisponível' } } };
    mockPatch.mockRejectedValue(conflict);
    await expect(mutation.mutationFn({ username: 'ana' })).rejects.toBe(conflict);
});

test('foto envia multipart e atualiza cache e token após salvar', async () => {
    const mutation = useSaveProfilePhoto() as any;
    mockPut.mockResolvedValue({ data: { photoURL: 'photo-new' } });
    const result = await mutation.mutationFn(new Blob(['photo'], { type: 'image/jpeg' }) as File);
    expect(mockPut.mock.calls[0][0]).toBe('/student-1/profile');
    expect(mockPut.mock.calls[0][1].get('profileImage').type).toBe('image/jpeg');
    await mutation.onSuccess(result);
    expect(mockCancel.mock.invocationCallOrder[0]).toBeLessThan(mockCache.mock.invocationCallOrder[0]);
    expect(mockCache.mock.calls[0][1]({ photoURL: 'old' })).toMatchObject({ photoURL: 'photo-new' });
    expect(mockReload).toHaveBeenCalledTimes(1);
    expect(mockToken).toHaveBeenCalledWith(true);
});

test('foto impersonada não atualiza token de outra conta', async () => {
    const mutation = useSaveProfilePhoto() as any;
    mockAuth.currentUser.uid = 'admin-real';
    await mutation.onSuccess({ uid: 'student-1', photoURL: 'photo-new' });
    expect(mockReload).not.toHaveBeenCalled();
    expect(mockToken).not.toHaveBeenCalled();
});
