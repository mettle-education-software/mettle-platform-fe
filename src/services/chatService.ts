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

export const sendChat = (text: string, file?: File | Blob | null, fileName?: string) => {
    if (!file)
        return chatFetch<{ message: ChatMessage }>('/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
        });
    const fd = new FormData();
    if (text) fd.set('text', text);
    fd.set('file', file, fileName ?? (file as File).name ?? 'file');
    return chatFetch<{ message: ChatMessage }>('/messages', { method: 'POST', body: fd });
};
