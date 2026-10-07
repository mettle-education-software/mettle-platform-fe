// Chamadas do Mettle Chat ao Worker mettle-events (libs/chat), sempre com o ID token do Firebase da conta logada.
import { auth } from 'config/firebase';
import { CHAT_URL, type ChatMessage } from 'libs/chat';

export async function chatFetch<T>(sub: string, init: RequestInit = {}): Promise<T> {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch(CHAT_URL + sub, {
        ...init,
        headers: { Authorization: `Bearer ${token}`, ...(init.headers ?? {}) },
        cache: 'no-store',
    });
    if (!res.ok) throw new Error(String(res.status));
    return res.status === 204 ? (undefined as T) : res.json();
}

export const sendChat = (text: string, file?: File | Blob | null, fileName?: string, replyTo?: number | null) => {
    if (!file)
        return chatFetch<{ message: ChatMessage }>('/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, replyTo: replyTo ?? undefined }),
        });
    const fd = new FormData();
    if (text) fd.set('text', text);
    if (replyTo) fd.set('replyTo', String(replyTo));
    fd.set('file', file, fileName ?? (file as File).name ?? 'file');
    return chatFetch<{ message: ChatMessage }>('/messages', { method: 'POST', body: fd });
};

export const sendSticker = (sticker: string, replyTo?: number | null) =>
    chatFetch<{ message: ChatMessage }>('/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sticker, replyTo: replyTo ?? undefined }),
    });

export const reactChat = (id: number, emoji: string | null) =>
    chatFetch<{ reaction: string | null }>('/react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, emoji }),
    });

export type StickerPack = { id: string; name: string; stickers: { id: string; url: string }[] };
export const getStickers = () => chatFetch<{ packs: StickerPack[] }>('/stickers');

/** Bytes do áudio de uma mensagem (pelo Worker: o Chatwoot não manda CORS). */
export async function chatAudio(id: number): Promise<ArrayBuffer> {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch(`${CHAT_URL}/media?id=${id}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(String(res.status));
    return res.arrayBuffer();
}
