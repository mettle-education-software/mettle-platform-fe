// Fila de gravações no aparelho (IndexedDB). Uma gravação só sai daqui depois que o servidor confirma.
// ponytail: o reenvio roda com a página do DEDA aberta (montagem + evento "online"); o Safari não tem envio em segundo plano.

export interface QueuedRecording {
    /** userUid|dedaId|recordedOn — salvar de novo no mesmo dia substitui (premissa P1). */
    key: string;
    userUid: string;
    dedaId: string;
    recordedOn: string;
    durationMs: number;
    mimeType: string;
    blob: Blob;
    createdAt: number;
}

export interface QueueStore {
    all(): Promise<QueuedRecording[]>;
    put(item: QueuedRecording): Promise<void>;
    delete(key: string): Promise<void>;
}

export const queueKey = (userUid: string, dedaId: string, recordedOn: string) => `${userUid}|${dedaId}|${recordedOn}`;

/** O servidor aceita envio atrasado em até 7 dias (seção 6.6); mais velho que isso não adianta tentar. */
const MAX_AGE_DAYS = 7;

const daysBetween = (from: string, to: string) => (Date.parse(to) - Date.parse(from)) / 86_400_000;

/**
 * Tenta enviar tudo o que é do aluno logado. Apaga do aparelho só o que o servidor confirmou.
 * Itens de outra conta (computador compartilhado) ficam intocados. Devolve as chaves enviadas.
 */
export const flushQueue = async (
    store: QueueStore,
    userUid: string,
    today: string,
    send: (item: QueuedRecording) => Promise<unknown>,
    /** Erro que encerra a rodada (limite diário do servidor): os demais itens nem são tentados. */
    stopOn?: (error: unknown) => boolean,
) => {
    const sent: string[] = [];
    for (const item of await store.all()) {
        if (item.userUid !== userUid) continue;
        if (daysBetween(item.recordedOn, today) > MAX_AGE_DAYS) continue; // fica guardado; o aluno ainda ouve no aparelho
        try {
            await send(item);
            await store.delete(item.key);
            sent.push(item.key);
        } catch (error) {
            // continua na fila; próxima tentativa quando a internet voltar ou a página abrir de novo
            if (stopOn?.(error)) break;
        }
    }
    return sent;
};

// ---------- IndexedDB ----------

const DB_NAME = 'mettle-deda-recordings';
const STORE = 'queue';

const openDb = () =>
    new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'key' });
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

const run = async <T>(mode: IDBTransactionMode, op: (store: IDBObjectStore) => IDBRequest) => {
    const db = await openDb();
    try {
        return await new Promise<T>((resolve, reject) => {
            const request = op(db.transaction(STORE, mode).objectStore(STORE));
            request.onsuccess = () => resolve(request.result as T);
            request.onerror = () => reject(request.error);
        });
    } finally {
        db.close();
    }
};

export const idbQueue: QueueStore = {
    all: () => run<QueuedRecording[]>('readonly', (s) => s.getAll()),
    put: (item) => run<void>('readwrite', (s) => s.put(item)),
    delete: (key) => run<void>('readwrite', (s) => s.delete(key)),
};
