import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import {
    baseMimeType,
    brasiliaDate,
    CONSENT_VERSION,
    DedaRecording,
    DedaRecordingsResponse,
    isSignedStorageUrl,
    recordingsOrDisabled,
} from 'libs/dedaRecording';
import { flushQueue, idbQueue, QueuedRecording } from 'libs/recordingQueue';
import { useAppContext } from 'providers';
import { useCallback, useEffect } from 'react';
import { melpService } from 'services';

/**
 * Chave de liberação do front. Desligada por padrão: sem DEDA_RECORDER=on no ambiente, nada do gravador
 * aparece e nenhuma rota nova é chamada. Ligada, quem decide por conta é o servidor: o GET da lista é a única
 * consulta; conta fora de DEDA_RECORDING_ENABLED_UIDS recebe 404 e nada mais é chamado — seção 9.3 do plano.
 */
export const RECORDER_FLAG_ON = process.env.DEDA_RECORDER === 'on';

const base = (userUid: string) => `/deda/recordings/${encodeURIComponent(userUid)}`;

/** Lista as gravações do aluno no DEDA, o consentimento e se o recurso está ligado para ele. */
export const useDedaRecordings = (dedaId: string) => {
    const { user } = useAppContext();
    const uid = user?.uid;
    // Navegar "como o aluno" (administrador) nunca mostra gravações: a equipe ouve pelo backoffice, com registro.
    const allowed = RECORDER_FLAG_ON && !!uid && !user?.impersonating;
    const query = useQuery({
        queryKey: ['deda-recordings', uid, dedaId],
        queryFn: () =>
            melpService
                .get<DedaRecordingsResponse>(`${base(uid as string)}?dedaId=${encodeURIComponent(dedaId)}`)
                .then(({ data }) => data)
                .catch(recordingsOrDisabled),
        enabled: allowed,
        retry: false,
        // Desligado para a conta: guarda a resposta e não pergunta de novo nesta sessão.
        staleTime: (q) => (q.state.data?.enabled === false ? Infinity : 60_000),
    });
    return { ...query, active: allowed && query.data?.enabled === true, uid };
};

export const useAcceptRecordingConsent = () => {
    const queryClient = useQueryClient();
    const { user } = useAppContext();
    return useMutation({
        mutationFn: () => melpService.put(`${base(user?.uid as string)}/consent`, { version: CONSENT_VERSION }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deda-recordings', user?.uid] }),
    });
};

/** "Remover": o servidor só oculta a gravação (o áudio e a ficha ficam guardados); some da lista e do player. */
export const useHideRecording = () => {
    const queryClient = useQueryClient();
    const { user } = useAppContext();
    return useMutation({
        mutationFn: (recordingId: string) =>
            melpService.delete(`${base(user?.uid as string)}/${encodeURIComponent(recordingId)}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deda-recordings', user?.uid] }),
    });
};

interface UploadUrlResponse {
    uploadId: string;
    uploadUrl: string;
    /** Cabeçalhos que a assinatura exige (Content-Type, x-goog-content-length-range). */
    headers?: Record<string, string>;
}

/**
 * Envia uma gravação: pede o endereço assinado, manda o arquivo direto ao depósito e confirma.
 * O PUT ao depósito usa axios puro, sem o token da Plataforma; só segue se o endereço for do Google Cloud Storage.
 */
export const sendRecording = async (item: QueuedRecording, onProgress?: (fraction: number) => void) => {
    const meta = {
        dedaId: item.dedaId,
        recordedOn: item.recordedOn,
        durationMs: Math.round(item.durationMs),
        mimeType: item.mimeType,
        sizeBytes: item.blob.size,
        source: 'web',
        clientInfo: typeof navigator === 'undefined' ? undefined : navigator.userAgent.slice(0, 200),
    };
    const { data } = await melpService.post<typeof meta, UploadUrlResponse>(`${base(item.userUid)}/upload-url`, meta);
    if (!data || typeof data.uploadId !== 'string' || !isSignedStorageUrl(data.uploadUrl)) {
        throw new Error('invalid upload-url');
    }
    const headers: Record<string, string> = { 'Content-Type': baseMimeType(item.mimeType) };
    for (const [name, value] of Object.entries(data.headers ?? {})) {
        // Só cabeçalhos simples e do próprio protocolo de envio; nada de Authorization/Cookie vindo da resposta.
        if (/^(content-type|x-goog-[a-z0-9-]+)$/i.test(name) && typeof value === 'string') headers[name] = value;
    }
    await axios.put(data.uploadUrl, item.blob, {
        headers,
        onUploadProgress: (e) => e.total && onProgress?.(e.loaded / e.total),
    });
    // O corpo da confirmação é só o uploadId (o servidor recusa campos extras).
    const confirmed = await melpService.post<object, { recording: DedaRecording }>(`${base(item.userUid)}/confirm`, {
        uploadId: data.uploadId,
    });
    return confirmed.data.recording;
};

/** Por que o envio falhou, para a mensagem certa. */
export const uploadProblem = (error: unknown): 'offline' | 'expired' | 'upload' => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'offline';
    const err = error as AxiosError<{ code?: string }>;
    if (err?.response?.status === 403 && err.response.data?.code === 'ACCESS_EXPIRED') return 'expired';
    if (err?.isAxiosError && !err.response) return 'offline';
    return 'upload';
};

/** Reenvia o que ficou no aparelho: ao abrir o DEDA e quando a internet volta. */
export const useFlushRecordingQueue = (active: boolean, uid?: string) => {
    const queryClient = useQueryClient();
    const flush = useCallback(async () => {
        if (!active || !uid || typeof indexedDB === 'undefined') return;
        const sent = await flushQueue(idbQueue, uid, brasiliaDate(new Date()), (item) => sendRecording(item)).catch(
            () => [],
        );
        if (sent.length) queryClient.invalidateQueries({ queryKey: ['deda-recordings', uid] });
    }, [active, uid, queryClient]);

    useEffect(() => {
        flush();
        window.addEventListener('online', flush);
        return () => window.removeEventListener('online', flush);
    }, [flush]);
};

/** Endereço de reprodução (vale 5 min). Recusa qualquer endereço que não seja do depósito. */
export const useRecordingPlayUrl = (recordingId?: string | null) => {
    const { user } = useAppContext();
    return useQuery({
        queryKey: ['deda-recording-play-url', user?.uid, recordingId],
        queryFn: async () => {
            const { data } = await melpService.get<{ url: string }>(
                `${base(user?.uid as string)}/${encodeURIComponent(recordingId as string)}/play-url`,
            );
            if (!isSignedStorageUrl(data?.url)) throw new Error('invalid play-url');
            return data.url;
        },
        enabled: RECORDER_FLAG_ON && !!user?.uid && !!recordingId,
        staleTime: 4 * 60_000,
        gcTime: 4 * 60_000,
        retry: 1,
    });
};

/** A gravação de hoje deste DEDA que ainda está no aparelho (sem internet), se houver. */
export const useQueuedRecording = (uid: string | undefined, dedaId: string, recordedOn: string, active: boolean) =>
    useQuery({
        queryKey: ['deda-recording-queued', uid, dedaId, recordedOn],
        queryFn: async () =>
            (await idbQueue.all()).find(
                (i) => i.userUid === uid && i.dedaId === dedaId && i.recordedOn === recordedOn,
            ) ?? null,
        enabled: active && !!uid && typeof indexedDB !== 'undefined',
        staleTime: 0,
    });
