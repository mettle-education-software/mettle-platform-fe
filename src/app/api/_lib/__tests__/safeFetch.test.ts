/**
 * @jest-environment node
 */
import {
    beforeRedirect,
    fetchPublicHtml,
    isBlockedAddress,
    isUnsafeUrlError,
    parsePublicUrl,
    safeLookup,
} from '../safeFetch';
import { sanitizeHtml } from '../sanitizeHtml';

describe('safeFetch (SSRF)', () => {
    it('bloqueia endereços privados, loopback, link-local e mapeados', () => {
        [
            '127.0.0.1',
            '10.1.2.3',
            '172.16.0.1',
            '192.168.0.10',
            '169.254.169.254',
            '100.64.0.1',
            '0.0.0.0',
            '::1',
            '::ffff:127.0.0.1',
            'fd00::1',
            'fe80::1',
        ].forEach((ip) => expect(isBlockedAddress(ip)).toBe(true));
        ['8.8.8.8', '151.101.1.1', '2606:4700::1111'].forEach((ip) => expect(isBlockedAddress(ip)).toBe(false));
    });

    it('aceita só https e recusa IP literal privado', () => {
        expect(() => parsePublicUrl('http://example.com')).toThrow();
        expect(() => parsePublicUrl('file:///etc/passwd')).toThrow();
        expect(() => parsePublicUrl('https://127.0.0.1/')).toThrow();
        expect(() => parsePublicUrl('https://[::1]/')).toThrow();
        expect(() => parsePublicUrl('https://169.254.169.254/computeMetadata/v1/')).toThrow();
        expect(parsePublicUrl('https://example.com/a').hostname).toBe('example.com');
    });

    it('recusa nome que resolve para loopback', async () => {
        await expect(safeLookup('localhost')).rejects.toThrow('Blocked address');
    });

    it('recusa redirect para http ou para IP privado', () => {
        expect(() => beforeRedirect({ protocol: 'http:', hostname: 'example.com' })).toThrow();
        expect(() => beforeRedirect({ protocol: 'https:', hostname: '10.0.0.1' })).toThrow();
        expect(() => beforeRedirect({ protocol: 'https:', hostname: '[::1]' })).toThrow();
        expect(() => beforeRedirect({ protocol: 'https:', hostname: 'example.com' })).not.toThrow();
    });

    it('o lookup protegido é aplicado na conexão do axios', async () => {
        const error = await fetchPublicHtml('https://localhost:1/').catch((e) => e);
        expect(isUnsafeUrlError(error)).toBe(true);
    });
});

describe('sanitizeHtml (XSS)', () => {
    it('remove scripts, handlers, protocolos perigosos e tags fora da allowlist', () => {
        const html = sanitizeHtml(
            '<p onclick="x()" style="color:red">Olá <b>mundo</b></p>' +
                '<script>alert(1)</script><img src=x onerror=alert(1)>' +
                '<a href="javascript:alert(1)">a</a><a href=" java\tscript:alert(1)">b</a>' +
                '<a href="data:text/html,<script>alert(1)</script>">c</a>' +
                '<svg><script>alert(1)</script></svg><iframe src="https://evil"></iframe>' +
                '<custom-el><em>texto</em></custom-el><a href="https://example.com">ok</a>',
        );
        expect(html).not.toMatch(/script|onerror|onclick|javascript|data:|<svg|<iframe|<img|style=/i);
        expect(html).toContain('<p>Olá <b>mundo</b></p>');
        expect(html).toContain('<em>texto</em>');
        expect(html).toContain(
            '<a href="https://example.com" target="_blank" rel="noopener noreferrer nofollow">ok</a>',
        );
    });
});
