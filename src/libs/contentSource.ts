// Fonte do conteúdo: espelho mettle-content-mirror primeiro, Contentful (GRAPHQL_FALLBACK_URI) se o espelho falhar.
// Sem GRAPHQL_FALLBACK_URI (CONTENT_MIRROR = false no next.config) é um fetch comum, como antes do espelho.
// Falha do espelho = rede, tempo esgotado, HTTP não-2xx ou corpo que não é JSON GraphQL; essas contam para o
// disjuntor. Erro GraphQL com 200 só cai no Contentful se for "o espelho não sabe responder" (ver mirrorCannotAnswer);
// esse não conta para o disjuntor (o espelho está de pé). Se o Contentful também falhar, a resposta/erro dele segue
// para quem chamou, como era antes: uma tentativa em cada lado, nunca laço; e o disjuntor não abre (ou fecha na hora),
// para nunca prender o site num Contentful fora (ex.: 402 da cota).
import * as Sentry from '@sentry/nextjs';

export const MIRROR_TIMEOUT_MS = 7000; // o espelho responde em < 1 s; 7 s cobre instância fria + KV lento sem prender a página
export const BREAKER_FAILURES = 2; // falhas seguidas do espelho para abrir o disjuntor
export const BREAKER_OPEN_MS = 60_000; // aberto: tudo direto no Contentful; depois, uma nova chance ao espelho

export type MirrorFailure = 'network' | 'timeout' | 'http' | 'invalid' | 'unsupported';

// Erros que o espelho devolve com 200 e que no Contentful não seriam erro: campo/filtro que o retrato não tem
// (modelo mudou depois do retrato), recurso não implementado, limites próprios do espelho. Todos os erros do
// espelho trazem extensions.contentful.mirror = true e vêm com data: null (a consulta inteira falha).
const CANNOT_ANSWER = /^(Cannot query field|Unknown filter field|Unsupported value)|not supported by mirror/;

export const mirrorCannotAnswer = (body: any) =>
    body?.data == null &&
    Array.isArray(body?.errors) &&
    body.errors.some(
        (e: any) =>
            e?.extensions?.contentful?.mirror === true &&
            (CANNOT_ANSWER.test(e.message ?? '') || e.extensions.contentful.code === 'QUERY_TOO_COMPLEX'),
    );

/** Motivo para trocar de fonte, ou null se a resposta do espelho serve. body = JSON lido (undefined se não era JSON). */
export const mirrorFailure = (status: number, body: unknown): MirrorFailure | null => {
    if (status < 200 || status > 299) return 'http';
    if (!body || typeof body !== 'object' || !('data' in body || 'errors' in body)) return 'invalid';
    return mirrorCannotAnswer(body) ? 'unsupported' : null;
};

type Options = {
    mirror?: string;
    fallback?: string;
    fetchImpl?: typeof fetch;
    now?: () => number;
    onOpen?: (reason: MirrorFailure, status?: number) => void;
};

export const makeContentFetch = ({
    mirror,
    fallback,
    fetchImpl = (...args) => fetch(...args),
    now = Date.now,
    onOpen = () => {},
}: Options): typeof fetch => {
    let failures = 0;
    let openUntil = 0;

    const failed = (reason: MirrorFailure, status?: number) => {
        if (++failures < BREAKER_FAILURES || now() < openUntil) return;
        openUntil = now() + BREAKER_OPEN_MS;
        onOpen(reason, status);
    };

    // Chamada única ao Contentful; o resultado (ok = 2xx) decide o disjuntor e a resposta/erro segue para quem chamou.
    const viaFallback = async (init: RequestInit | undefined, done: (ok: boolean) => void) => {
        let res: Response;
        try {
            res = await fetchImpl(fallback!, init);
        } catch (e) {
            done(false);
            throw e;
        }
        done(res.ok);
        return res;
    };

    return async (input, init) => {
        if (!fallback || !mirror || String(input) !== mirror) return fetchImpl(input, init);
        // Aberto, mas o Contentful também falhou (ex.: 402 da cota): fecha já, a próxima consulta volta ao espelho.
        if (now() < openUntil)
            return viaFallback(init, (ok) => {
                if (!ok) openUntil = failures = 0;
            });

        const caller = init?.signal;
        const ctrl = new AbortController();
        const abort = () => ctrl.abort();
        caller?.addEventListener('abort', abort);
        const timer = setTimeout(abort, MIRROR_TIMEOUT_MS);
        let reason: MirrorFailure;
        let status: number | undefined;
        try {
            const res = await fetchImpl(mirror, { ...init, signal: ctrl.signal });
            status = res.status;
            const text = await res.text();
            let body: unknown;
            try {
                body = JSON.parse(text);
            } catch {}
            const why = mirrorFailure(res.status, body);
            if (!why) {
                failures = 0;
                return new Response(text, { status: res.status, statusText: res.statusText, headers: res.headers });
            }
            reason = why;
        } catch (e) {
            if (caller?.aborted) throw e; // quem chamou desistiu: não é falha do espelho
            reason = ctrl.signal.aborted ? 'timeout' : 'network';
        } finally {
            clearTimeout(timer);
            caller?.removeEventListener('abort', abort);
        }
        // Só abre o disjuntor se o Contentful de fato responde: abrir para um Contentful fora prenderia o site nele.
        return viaFallback(init, (ok) => {
            if (reason === 'unsupported') failures = 0;
            else if (ok) failed(reason, status);
        });
    };
};

// Uma instância por aba (navegador) ou por isolado (middleware): o disjuntor fica em memória.
export const contentFetch = makeContentFetch({
    mirror: process.env.GRAPHQL_URI,
    fallback: process.env.GRAPHQL_FALLBACK_URI,
    onOpen: (reason, status) =>
        Sentry.captureMessage('Espelho de conteúdo falhou: consultas indo ao Contentful', {
            level: 'warning',
            tags: { content_source: 'fallback', reason, status: status ?? 'none' },
        }),
});
