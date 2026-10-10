// Opções comuns do Sentry (navegador, servidor e edge). O plano é o gratuito (Developer: 5 mil erros/mês) e não
// pode estourar: amostragem baixa, sem replay/profiling, ruído conhecido descartado e repetição cortada na origem.
import type { Breadcrumb, ErrorEvent, EventHint } from '@sentry/nextjs';

const environment = process.env.VERCEL_ENV || 'development';

/** O mesmo erro (tipo + mensagem) vai no máximo MAX_REPEATS vezes por aba/instância; o resto é descartado. */
const MAX_REPEATS = 3;
const seen = new Map<string, number>();

export const beforeSend = (event: ErrorEvent, _hint?: EventHint): ErrorEvent | null => {
    const ex = event.exception?.values?.[0];
    if (ex?.type === 'ChunkLoadError' || /Loading chunk [\w-]+ failed/.test(ex?.value ?? '')) {
        event.fingerprint = ['chunk-load-error']; // deploy novo com aba antiga aberta: uma issue só
    }
    const key = `${ex?.type ?? ''}|${ex?.value ?? event.message ?? ''}`;
    const count = (seen.get(key) ?? 0) + 1;
    seen.set(key, count);
    return count > MAX_REPEATS ? null : event;
};

/** Pedidos (xhr/fetch) nas trilhas sem a consulta: a busca do Admin leva nome ou e-mail no endereço. */
export const beforeBreadcrumb = (crumb: Breadcrumb): Breadcrumb => {
    if ((crumb.category === 'xhr' || crumb.category === 'fetch') && typeof crumb.data?.url === 'string')
        crumb.data.url = crumb.data.url.split('?')[0];
    return crumb;
};

export const sharedOptions = {
    dsn: process.env.SENTRY_DSN,
    environment,
    // Só produção amostra transações (5%); prévias e local, nenhuma.
    tracesSampleRate: environment === 'production' ? 0.05 : 0,
    sendDefaultPii: false,
    ignoreErrors: [
        'ResizeObserver loop',
        'Non-Error promise rejection captured',
        'AbortError',
        'The operation was aborted',
        'Failed to fetch',
        'Load failed',
        'NetworkError when attempting to fetch resource',
    ],
    denyUrls: [/^chrome(-extension)?:\/\//i, /^moz-extension:\/\//i, /^safari(-web)?-extension:\/\//i],
    beforeSend,
    beforeBreadcrumb,
    debug: false,
};
