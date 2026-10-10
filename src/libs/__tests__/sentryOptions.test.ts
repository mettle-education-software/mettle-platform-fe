import type { ErrorEvent } from '@sentry/nextjs';
import { beforeBreadcrumb, beforeSend, beforeSendSpan, sharedOptions } from '../sentryOptions';

const ev = (type: string, value: string): ErrorEvent => ({ type: undefined, exception: { values: [{ type, value }] } });

test('corta repetição do mesmo erro após 3 envios', () => {
    const sent = [1, 2, 3, 4, 5].map(() => beforeSend(ev('TypeError', 'x is undefined')));
    expect(sent.filter(Boolean)).toHaveLength(3);
    expect(beforeSend(ev('TypeError', 'outro erro'))).not.toBeNull();
});

test('ChunkLoadError vira uma issue só', () => {
    expect(beforeSend(ev('ChunkLoadError', 'Loading chunk 123 failed.'))?.fingerprint).toEqual(['chunk-load-error']);
});

test('sem PII, sem replay e sem transações fora de produção', () => {
    expect(sharedOptions.sendDefaultPii).toBe(false);
    expect(sharedOptions.tracesSampleRate).toBe(0);
    expect('replaysSessionSampleRate' in sharedOptions).toBe(false);
});

test('trilhas de pedidos sem a consulta (busca por e-mail no Admin)', () => {
    const crumb = beforeBreadcrumb({
        category: 'xhr',
        data: { url: 'https://api.x/admin/accounts?q=ana%40x.test&page=1' },
    });
    expect(crumb.data?.url).toBe('https://api.x/admin/accounts');
    expect(beforeBreadcrumb({ category: 'ui.click', message: 'button' }).message).toBe('button');
});

test('trechos amostrados sem a consulta', () => {
    const span = beforeSendSpan({
        span_id: '1',
        trace_id: '2',
        start_timestamp: 0,
        description: 'GET https://api.x/admin/accounts?q=ana%40x.test',
        data: { url: 'https://api.x/admin/accounts?q=ana%40x.test', 'http.query': '?q=ana%40x.test' },
    } as never);
    expect(span.description).toBe('GET https://api.x/admin/accounts');
    expect(span.data).toEqual({ url: 'https://api.x/admin/accounts' });
});
