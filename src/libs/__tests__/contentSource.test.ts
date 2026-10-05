/** @jest-environment node */
import { BREAKER_OPEN_MS, makeContentFetch, mirrorFailure } from '../contentSource';

jest.mock('@sentry/nextjs', () => ({ captureMessage: jest.fn() }));

const M = 'https://mirror/content/v1/spaces/x?access_token=t';
const C = 'https://contentful/content/v1/spaces/x?access_token=t';
const ok = () => new Response(JSON.stringify({ data: { a: 1 } }), { status: 200 });

const setup = (mirror: () => Promise<Response>) => {
    let t = 0;
    const calls: string[] = [];
    const opens: string[] = [];
    const f = makeContentFetch({
        mirror: M,
        fallback: C,
        now: () => t,
        onOpen: (reason) => opens.push(reason),
        fetchImpl: async (input) => {
            calls.push(input === M ? 'mirror' : 'contentful');
            return input === M ? mirror() : ok();
        },
    });
    return { f, calls, opens, advance: (ms: number) => (t += ms) };
};

describe('mirrorFailure', () => {
    it('aceita resposta GraphQL normal e erro GraphQL comum', () => {
        expect(mirrorFailure(200, { data: { x: 1 } })).toBeNull();
        expect(mirrorFailure(200, { data: null, errors: [{ message: 'Syntax Error', extensions: {} }] })).toBeNull();
    });
    it('troca de fonte em HTTP ruim, corpo inválido e "espelho não sabe responder"', () => {
        expect(mirrorFailure(503, { errors: [] })).toBe('http');
        expect(mirrorFailure(404, undefined)).toBe('http');
        expect(mirrorFailure(200, undefined)).toBe('invalid');
        expect(mirrorFailure(200, { foo: 1 })).toBe('invalid');
        const err = (message: string, code = 'BAD_REQUEST') => ({
            data: null,
            errors: [{ message, extensions: { contentful: { code, mirror: true } } }],
        });
        expect(mirrorFailure(200, err('Cannot query field "novo" on type "DedaContent"'))).toBe('unsupported');
        expect(mirrorFailure(200, err('Filter on link field a_b not supported by mirror'))).toBe('unsupported');
        expect(mirrorFailure(200, err('Query too deep', 'QUERY_TOO_COMPLEX'))).toBe('unsupported');
        expect(mirrorFailure(200, err('Only queries are supported'))).toBeNull();
    });
});

describe('makeContentFetch', () => {
    it('espelho ok: nunca chama o Contentful', async () => {
        const { f, calls } = setup(async () => ok());
        expect(await (await f(M)).json()).toEqual({ data: { a: 1 } });
        await f(M);
        expect(calls).toEqual(['mirror', 'mirror']);
    });

    it('espelho fora: cai no Contentful, abre o disjuntor uma vez, volta depois do intervalo', async () => {
        let up = false;
        const { f, calls, opens, advance } = setup(async () => (up ? ok() : new Response('down', { status: 503 })));
        await f(M);
        await f(M);
        await f(M); // disjuntor aberto: direto
        expect(calls).toEqual(['mirror', 'contentful', 'mirror', 'contentful', 'contentful']);
        expect(opens).toEqual(['http']);
        advance(BREAKER_OPEN_MS + 1);
        await f(M); // nova chance, espelho ainda fora: reabre na hora
        expect(opens).toEqual(['http', 'http']);
        advance(BREAKER_OPEN_MS + 1);
        up = true;
        calls.length = 0;
        await f(M);
        await f(M);
        expect(calls).toEqual(['mirror', 'mirror']);
    });

    it('rede caída e Contentful com erro: uma tentativa de cada, devolve o erro do Contentful', async () => {
        const calls: string[] = [];
        const f = makeContentFetch({
            mirror: M,
            fallback: C,
            fetchImpl: async (input) => {
                calls.push(String(input));
                if (input === M) throw new TypeError('Failed to fetch');
                return new Response('{"errors":[]}', { status: 402 });
            },
        });
        expect((await f(M)).status).toBe(402);
        expect(calls).toEqual([M, C]);
    });

    it('tempo esgotado conta como falha', async () => {
        jest.useFakeTimers();
        const opens: string[] = [];
        const f = makeContentFetch({
            mirror: M,
            fallback: C,
            onOpen: (r) => opens.push(r),
            fetchImpl: (input, init) =>
                input === M
                    ? new Promise((_, bad) => init!.signal!.addEventListener('abort', () => bad(new Error('aborted'))))
                    : Promise.resolve(ok()),
        });
        for (let i = 0; i < 2; i++) {
            const p = f(M);
            await jest.advanceTimersByTimeAsync(8000);
            expect((await p).status).toBe(200);
        }
        expect(opens).toEqual(['timeout']);
        jest.useRealTimers();
    });

    it('middleware: o init (método, corpo, next.revalidate) vai igual ao Contentful', async () => {
        const inits: any[] = [];
        const f = makeContentFetch({
            mirror: M,
            fallback: C,
            fetchImpl: async (input, init) => {
                inits.push(init);
                if (input === M) throw new TypeError('fetch failed');
                return ok();
            },
        });
        const init = { method: 'POST', body: '{"query":"{a}"}', next: { revalidate: 3600 } } as RequestInit;
        expect(await (await f(M, init)).json()).toEqual({ data: { a: 1 } });
        expect(inits[1]).toBe(init);
        expect(inits[0]).toMatchObject({ method: 'POST', body: init.body, next: { revalidate: 3600 } });
    });

    it('sem fallback configurado (CONTENT_MIRROR = false): fetch comum', async () => {
        const calls: string[] = [];
        const f = makeContentFetch({ mirror: C, fetchImpl: async (i) => (calls.push(String(i)), ok()) });
        await f(C);
        expect(calls).toEqual([C]);
    });
});
