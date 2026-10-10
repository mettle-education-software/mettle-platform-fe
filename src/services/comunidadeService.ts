// Chamadas da Comunidade ao Worker mettle-comunidade, sempre com o ID token do Firebase da conta logada.
import { auth } from 'config/firebase';
import { COMUNIDADE_URL, type CMessage } from 'libs/comunidade';
import { guardWrite } from 'libs/viewOnly';

export class CError extends Error {
    status: number;
    constructor(status: number, code: string) {
        super(code);
        this.status = status;
    }
}

export async function cfetch<T>(sub: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
    const { json, ...rest } = init;
    guardWrite(rest.method ?? (json !== undefined ? 'POST' : 'GET'), sub);
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch(COMUNIDADE_URL + sub, {
        ...rest,
        ...(json !== undefined ? { method: rest.method ?? 'POST', body: JSON.stringify(json) } : {}),
        headers: {
            Authorization: `Bearer ${token}`,
            ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
            ...(rest.headers ?? {}),
        },
        cache: 'no-store',
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new CError(res.status, data?.error ?? String(res.status));
    return data as T;
}

export const cpost = <T = { ok: true }>(sub: string, json: unknown) => cfetch<T>(sub, { json });

/** Arquivo cru (sem multipart): o tipo vai no Content-Type e o texto/resposta no X-Meta. */
export const cupload = (file: Blob, meta: { text?: string; replyTo?: number | null; mentions?: string[] }) =>
    cfetch<{ message: CMessage }>('/messages', {
        method: 'POST',
        body: file,
        headers: { 'Content-Type': file.type.split(';')[0], 'X-Meta': encodeURIComponent(JSON.stringify(meta)) },
    });
