/** @jest-environment node */
// Impersonação: TODO cliente da API recusa gravar antes de sair do aparelho, inclusive os de endereço completo (hub de
// eventos: login e vídeo, que o servidor não tem como barrar); ler continua.
jest.mock('config/firebase', () => ({ auth: { authStateReady: async () => undefined, currentUser: null } }), {
    virtual: true,
});
jest.mock('libs/productAccess', () => ({ ACCESS_DENIED_EVENT: 'x', IMERSO_PRODUCT: 'p', IMERSO_SALES_URL: 'u' }), {
    virtual: true,
});
jest.mock('libs/viewOnly', () => jest.requireActual('../viewOnly'), { virtual: true });
jest.mock('interfaces', () => ({}), { virtual: true });
const mockFlagAdminMfa = jest.fn();
jest.mock(
    'libs/authentication/mfa',
    () => ({ ADMIN_MFA_CODE: 'MFA_REQUIRED', flagAdminMfa: () => mockFlagAdminMfa() }),
    { virtual: true },
);

const ApiClient = jest.requireActual('../../services/ApiClient').default;
const { setViewOnly } = jest.requireActual('../viewOnly');

test('hub de eventos na impersonação: o POST não sai; o GET sai', async () => {
    const client = new ApiClient('https://events.example/webhooks/plataforma');
    const adapter = jest.fn(async (config: unknown) => ({
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
    }));
    client.client.defaults.adapter = adapter;
    setViewOnly(true);
    await expect(client.post('/user-logged-in', { email_address: 'a@x.test' })).rejects.toMatchObject({
        code: 'IMPERSONATION_READ_ONLY',
    });
    await expect(client.get('/x')).resolves.toMatchObject({ status: 200 });
    expect(adapter).toHaveBeenCalledTimes(1);
    setViewOnly(false);
    await expect(client.post('/user-logged-in', {})).resolves.toMatchObject({ status: 200 });
    expect(adapter).toHaveBeenCalledTimes(2);
});

test('Admin sem o segundo fator (403 MFA_REQUIRED): o aviso do Admin é avisado; outra recusa, não', async () => {
    const client = new ApiClient('https://api.example/admin');
    const refuse = (code: string) =>
        Object.assign(new Error('403'), { isAxiosError: true, response: { status: 403, data: { code } } });
    client.client.defaults.adapter = jest
        .fn()
        .mockRejectedValueOnce(refuse('MFA_REQUIRED'))
        .mockRejectedValueOnce(refuse('NO_ACCESS'));
    // a recusa original segue para quem pediu (a tela mostra o erro dela); só o aviso é ligado
    await expect(client.get('/accounts')).rejects.toMatchObject({
        response: { status: 403, data: { code: 'MFA_REQUIRED' } },
    });
    expect(mockFlagAdminMfa).toHaveBeenCalledTimes(1);
    await expect(client.get('/accounts')).rejects.toMatchObject({ response: { data: { code: 'NO_ACCESS' } } });
    expect(mockFlagAdminMfa).toHaveBeenCalledTimes(1);
});

test('cliente do melp (guardião de acesso + aviso do Admin): a recusa MFA_REQUIRED chega inteira e liga o aviso', async () => {
    mockFlagAdminMfa.mockClear();
    const client = new ApiClient('melp');
    client.client.defaults.adapter = jest.fn().mockRejectedValueOnce(
        Object.assign(new Error('403'), {
            isAxiosError: true,
            response: { status: 403, data: { code: 'MFA_REQUIRED' } },
        }),
    );
    await expect(client.get('/x')).rejects.toMatchObject({ response: { status: 403, data: { code: 'MFA_REQUIRED' } } });
    expect(mockFlagAdminMfa).toHaveBeenCalledTimes(1);
});
