import axios from 'axios';
import { lookup as dnsLookup } from 'node:dns/promises';
import { BlockList, isIP } from 'node:net';

// Endereços que o servidor nunca deve buscar (SSRF): loopback, redes privadas,
// link-local (inclui metadados da nuvem 169.254.169.254), CGNAT, multicast e reservados.
const blocked = new BlockList();
[
    ['0.0.0.0', 8],
    ['10.0.0.0', 8],
    ['100.64.0.0', 10],
    ['127.0.0.0', 8],
    ['169.254.0.0', 16],
    ['172.16.0.0', 12],
    ['192.0.0.0', 24],
    ['192.168.0.0', 16],
    ['198.18.0.0', 15],
    ['224.0.0.0', 4],
    ['240.0.0.0', 4],
].forEach(([net, prefix]) => blocked.addSubnet(net as string, prefix as number, 'ipv4'));
[
    ['::', 128],
    ['::1', 128],
    ['64:ff9b::', 96],
    ['fc00::', 7],
    ['fe80::', 10],
    ['ff00::', 8],
].forEach(([net, prefix]) => blocked.addSubnet(net as string, prefix as number, 'ipv6'));
// IPv4 mapeado (::ffff:a.b.c.d) já é comparado com as sub-redes IPv4 pelo BlockList.

export const MAX_BYTES = 2 * 1024 * 1024;
export const TIMEOUT_MS = 8000;
export const MAX_REDIRECTS = 3;

export class UnsafeUrlError extends Error {}

// O axios embrulha erros do lookup/redirect em AxiosError (com `cause`).
export const isUnsafeUrlError = (error: unknown) =>
    error instanceof UnsafeUrlError || (error as { cause?: unknown })?.cause instanceof UnsafeUrlError;

export const isBlockedAddress = (address: string) => {
    const family = isIP(address);
    if (!family) return true;
    return blocked.check(address, family === 4 ? 'ipv4' : 'ipv6');
};

const assertSafeTarget = (protocol: string, hostname: string) => {
    if (protocol !== 'https:') throw new UnsafeUrlError('Only https URLs are allowed');
    const host = hostname.replace(/^\[|\]$/g, '');
    // IP literal não passa pelo lookup do DNS: checar aqui.
    if (isIP(host) && isBlockedAddress(host)) throw new UnsafeUrlError('Blocked address');
};

export const parsePublicUrl = (raw: string) => {
    let url: URL;
    try {
        url = new URL(raw);
    } catch {
        throw new UnsafeUrlError('Invalid url');
    }
    assertSafeTarget(url.protocol, url.hostname);
    return url;
};

// Validado na própria conexão (inclusive em cada redirect), o que também fecha DNS rebinding.
export const safeLookup = async (hostname: string) => {
    const addresses = await dnsLookup(hostname, { all: true });
    if (!addresses.length || addresses.some(({ address }) => isBlockedAddress(address))) {
        throw new UnsafeUrlError('Blocked address');
    }
    return addresses;
};

type LookupCallback = (err: Error | null, address?: unknown, family?: number) => void;
const axiosLookup = (hostname: string, options: { all?: boolean }, cb: LookupCallback) => {
    safeLookup(hostname).then(
        (addresses) => (options?.all ? cb(null, addresses) : cb(null, addresses[0].address, addresses[0].family)),
        (error) => cb(error),
    );
};

export const beforeRedirect = (options: { protocol?: string; hostname?: string }) => {
    assertSafeTarget(options.protocol ?? '', options.hostname ?? '');
};

/** Busca HTML público com proteção contra SSRF, timeout e limite de tamanho. */
export const fetchPublicHtml = async (raw: string) => {
    const url = parsePublicUrl(raw);
    const response = await axios.get<string>(url.toString(), {
        responseType: 'text',
        validateStatus: null,
        timeout: TIMEOUT_MS,
        maxRedirects: MAX_REDIRECTS,
        maxContentLength: MAX_BYTES,
        lookup: axiosLookup as never,
        beforeRedirect,
        headers: { Accept: 'text/html,application/xhtml+xml' },
    });
    const contentType = String(response.headers['content-type'] ?? '');
    const isHtml = /text\/html|application\/xhtml\+xml/i.test(contentType);
    return { response, isHtml, finalUrl: response.request?.res?.responseUrl ?? url.toString() };
};
