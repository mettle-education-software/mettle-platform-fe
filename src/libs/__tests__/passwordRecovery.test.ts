import { validateRecoveryLink } from '../passwordRecovery';

const httpError = (status: number) => Object.assign(new Error(`HTTP ${status}`), { response: { status } });

const fakeClient = (postResult: () => Promise<{ data: unknown }>) => {
    const calls: { method: string; endpoint: string; arg: unknown }[] = [];
    return {
        calls,
        post: async (endpoint: string, data?: unknown) => {
            calls.push({ method: 'POST', endpoint, arg: data });
            return postResult();
        },
        get: async (endpoint: string, options?: unknown) => {
            calls.push({ method: 'GET', endpoint, arg: options });
            return { data: { isValid: true } };
        },
    } as never as {
        calls: { method: string; endpoint: string; arg: unknown }[];
        post<D, R>(e: string, d?: D): Promise<{ data: R }>;
        get<T>(e: string, o?: { params?: Record<string, string> }): Promise<{ data: T }>;
    };
};

describe('validateRecoveryLink', () => {
    it('sends token and userUid in the POST body, never in the URL', async () => {
        const client = fakeClient(async () => ({ data: { isValid: true } }));
        await expect(validateRecoveryLink(client, 'tok', 'uid')).resolves.toBe(true);
        expect(client.calls).toEqual([
            { method: 'POST', endpoint: '/passwords/v2/forgot/validate', arg: { token: 'tok', userUid: 'uid' } },
        ]);
    });

    it('returns false when the backend says invalid', async () => {
        const client = fakeClient(async () => ({ data: { isValid: false } }));
        await expect(validateRecoveryLink(client, 'tok', 'uid')).resolves.toBe(false);
    });

    it('falls back to the legacy GET while the POST route is not deployed (404/405)', async () => {
        for (const status of [404, 405]) {
            const client = fakeClient(async () => Promise.reject(httpError(status)));
            await expect(validateRecoveryLink(client, 'tok', 'uid')).resolves.toBe(true);
            expect(client.calls.map((c) => c.method)).toEqual(['POST', 'GET']);
            expect(client.calls[1].arg).toEqual({ params: { token: 'tok', userUid: 'uid' } });
        }
    });

    it('does not fall back on other errors', async () => {
        const client = fakeClient(async () => Promise.reject(httpError(500)));
        await expect(validateRecoveryLink(client, 'tok', 'uid')).rejects.toThrow('HTTP 500');
        expect(client.calls.map((c) => c.method)).toEqual(['POST']);
    });

    it('does not call the API without token or userUid', async () => {
        const client = fakeClient(async () => ({ data: { isValid: true } }));
        await expect(validateRecoveryLink(client, undefined, 'uid')).resolves.toBe(false);
        await expect(validateRecoveryLink(client, 'tok', undefined)).resolves.toBe(false);
        expect(client.calls).toEqual([]);
    });
});
