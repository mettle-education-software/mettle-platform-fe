import {
    baseMimeType,
    brasiliaDate,
    computeIndicators,
    dailyLimitHit,
    DedaRecording,
    elapsedMs,
    formatDelta,
    formatDuration,
    formatRecordedOn,
    initialRecorderState,
    isDailyLimit,
    isSignedStorageUrl,
    listMicrophones,
    markDailyLimit,
    MAX_RECORDING_MS,
    pickMicrophone,
    pickMyReading,
    pickRecordingFormat,
    recorderReducer,
    RecorderAction,
    recordingsOrDisabled,
    spokenDuration,
} from '../dedaRecording';
import { flushQueue, QueuedRecording, QueueStore, queueKey } from '../recordingQueue';

describe('pickRecordingFormat', () => {
    it('prefere MP4/AAC quando o navegador grava os dois', () => {
        expect(pickRecordingFormat(() => true)).toEqual({
            mimeType: 'audio/mp4;codecs=mp4a.40.2',
            audioBitsPerSecond: 48000,
        });
    });
    it('cai para WebM/Opus a 32 kbps (Chrome antigo, Firefox)', () => {
        const f = pickRecordingFormat((t) => t.startsWith('audio/webm'));
        expect(f).toEqual({ mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 32000 });
    });
    it('Ogg/Opus por último', () => {
        expect(pickRecordingFormat((t) => t === 'audio/ogg;codecs=opus')?.mimeType).toBe('audio/ogg;codecs=opus');
    });
    it('null sem suporte, inclusive quando isTypeSupported lança', () => {
        expect(pickRecordingFormat(() => false)).toBeNull();
        expect(
            pickRecordingFormat(() => {
                throw new Error('x');
            }),
        ).toBeNull();
    });
    it('baseMimeType tira os parâmetros', () => {
        expect(baseMimeType('audio/webm;codecs=opus')).toBe('audio/webm');
        expect(baseMimeType('audio/mp4')).toBe('audio/mp4');
    });
});

describe('recorderReducer', () => {
    const play = (...actions: RecorderAction[]) => actions.reduce(recorderReducer, initialRecorderState);

    it('desconta as pausas do tempo', () => {
        const s = play(
            { type: 'start', now: 0 },
            { type: 'pause', now: 10_000 },
            { type: 'resume', now: 60_000 },
            { type: 'stop', now: 65_000 },
        );
        expect(s.phase).toBe('review');
        expect(s.accumulatedMs).toBe(15_000);
        expect(s.problem).toBeNull();
    });
    it('conta o tempo correndo enquanto grava', () => {
        const s = play({ type: 'start', now: 1000 });
        expect(elapsedMs(s, 4000)).toBe(3000);
        const p = recorderReducer(s, { type: 'pause', now: 4000 });
        expect(elapsedMs(p, 99_999)).toBe(3000);
    });
    it('pausa por interrupção marca o aviso; continuar limpa', () => {
        const s = play({ type: 'start', now: 0 }, { type: 'pause', now: 6000, interrupted: true });
        expect(s.problem).toBe('interrupted');
        expect(recorderReducer(s, { type: 'resume', now: 7000 }).problem).toBeNull();
    });
    it('menos de 5 s não envia', () => {
        const s = play({ type: 'start', now: 0 }, { type: 'stop', now: 3000 });
        expect(s.problem).toBe('tooShort');
        expect(recorderReducer(s, { type: 'upload' }).phase).toBe('review');
    });
    it('teto de 20 minutos', () => {
        const s = play({ type: 'start', now: 0 }, { type: 'stop', now: MAX_RECORDING_MS + 5000, limit: true });
        expect(s.accumulatedMs).toBe(MAX_RECORDING_MS);
        expect(s.problem).toBe('limit');
        expect(recorderReducer(s, { type: 'upload' }).phase).toBe('uploading');
    });
    it('envio: salvo, ou guardado no aparelho e reenviado', () => {
        const uploading = play({ type: 'start', now: 0 }, { type: 'stop', now: 10_000 }, { type: 'upload' });
        expect(uploading.phase).toBe('uploading');
        expect(recorderReducer(uploading, { type: 'saved' }).phase).toBe('saved');
        const queued = recorderReducer(uploading, { type: 'queued', problem: 'offline' });
        expect(queued).toMatchObject({ phase: 'queued', problem: 'offline' });
        expect(recorderReducer(queued, { type: 'upload' }).phase).toBe('uploading');
    });
    it('ignora ações fora de ordem (clique duplo, evento atrasado)', () => {
        expect(recorderReducer(initialRecorderState, { type: 'stop', now: 1 })).toBe(initialRecorderState);
        expect(recorderReducer(initialRecorderState, { type: 'pause', now: 1 })).toBe(initialRecorderState);
        const rec = play({ type: 'start', now: 0 });
        expect(recorderReducer(rec, { type: 'start', now: 5 })).toBe(rec);
        expect(recorderReducer(rec, { type: 'problem', problem: 'denied' })).toBe(rec);
    });
    it('erro de microfone fica no estado pronto e some ao gravar', () => {
        const s = play({ type: 'problem', problem: 'denied' });
        expect(s).toMatchObject({ phase: 'ready', problem: 'denied' });
        expect(recorderReducer(s, { type: 'start', now: 0 }).problem).toBeNull();
    });
    it('fone desconectado: para e guarda o que gravou', () => {
        const s = play({ type: 'start', now: 0 }, { type: 'stop', now: 30_000, interrupted: true });
        expect(s).toMatchObject({ phase: 'review', problem: 'interrupted', accumulatedMs: 30_000 });
    });
    it('gravação guardada no aparelho volta como não enviada', () => {
        const s = play({ type: 'restore', durationMs: 372_000 });
        expect(s).toMatchObject({ phase: 'queued', accumulatedMs: 372_000 });
        expect(recorderReducer(s, { type: 'upload' }).phase).toBe('uploading');
    });
    it('regravar volta ao início', () => {
        const s = play({ type: 'start', now: 0 }, { type: 'stop', now: 9000 }, { type: 'reset' });
        expect(s).toEqual(initialRecorderState);
    });
});

describe('datas e durações', () => {
    it('data em Brasília, não em UTC', () => {
        expect(brasiliaDate(new Date('2026-10-02T02:30:00Z'))).toBe('2026-10-01');
        expect(brasiliaDate(new Date('2026-10-02T03:30:00Z'))).toBe('2026-10-02');
    });
    it('rótulo do dia', () => {
        expect(formatRecordedOn('2026-09-30')).toBe('Wednesday, Sep 30');
        expect(formatRecordedOn('2026-10-04')).toBe('Sunday, Oct 4');
        expect(formatRecordedOn('<img>')).toBe('');
    });
    it('durações', () => {
        expect(formatDuration(372_000)).toBe('6:12');
        expect(formatDuration(3_723_000)).toBe('1:02:03');
        expect(formatDuration(NaN)).toBe('0:00');
        expect(spokenDuration(372_000)).toBe('6 minutes and 12 seconds');
        expect(spokenDuration(60_000)).toBe('1 minute');
        expect(spokenDuration(0)).toBe('0 seconds');
        expect(formatDelta(-68_000)).toBe('−1:08');
        expect(formatDelta(42_000)).toBe('+0:42');
        expect(formatDelta(300)).toBe('0:00');
    });
});

describe('isSignedStorageUrl', () => {
    it('aceita só https no Google Cloud Storage', () => {
        expect(isSignedStorageUrl('https://storage.googleapis.com/b/rec/a.webm?X-Goog-Signature=1')).toBe(true);
        expect(isSignedStorageUrl('https://bucket.storage.googleapis.com/a')).toBe(true);
        expect(isSignedStorageUrl('http://storage.googleapis.com/a')).toBe(false);
        expect(isSignedStorageUrl('https://storage.googleapis.com.evil.com/a')).toBe(false);
        expect(isSignedStorageUrl('https://evil.com/storage.googleapis.com')).toBe(false);
        expect(isSignedStorageUrl('javascript:alert(1)')).toBe(false);
        expect(isSignedStorageUrl('data:audio/webm;base64,AAAA')).toBe(false);
        expect(isSignedStorageUrl(undefined)).toBe(false);
    });
});

const rec = (weekDay: string, durationMs: number, recordedOn = '2026-09-28', status: 'ready' | 'hidden' = 'ready') =>
    ({
        id: weekDay + recordedOn,
        dedaId: 'DEDA34',
        week: 'week12',
        weekDay,
        recordedOn,
        durationMs,
        mimeType: 'audio/mp4',
        status,
    }) as DedaRecording;

describe('computeIndicators', () => {
    it('0 dias gravados', () => {
        const i = computeIndicators([]);
        expect(i.days).toEqual([null, null, null, null, null, null, null]);
        expect(i).toMatchObject({ recordedDays: 0, first: null, last: null, deltaMs: null, totalMs: 0 });
    });
    it('1 dia gravado: sem variação', () => {
        const i = computeIndicators([rec('day3', 372_000)]);
        expect(i.recordedDays).toBe(1);
        expect(i.first?.weekDay).toBe('day3');
        expect(i.last).toBeNull();
        expect(i.deltaMs).toBeNull();
        expect(i.totalMs).toBe(372_000);
    });
    it('7 dias gravados', () => {
        const all = [430, 420, 410, 400, 390, 380, 362].map((s, n) => rec(`day${n + 1}`, s * 1000));
        const i = computeIndicators(all);
        expect(i.recordedDays).toBe(7);
        expect(i.first?.weekDay).toBe('day1');
        expect(i.last?.weekDay).toBe('day7');
        expect(i.deltaMs).toBe(-68_000);
        expect(i.totalMs).toBe(2_792_000);
    });
    it('ignora apagadas e, após reset, fica com a mais recente do mesmo dia', () => {
        const i = computeIndicators([
            rec('day1', 100_000, '2026-08-03'),
            rec('day1', 200_000, '2026-09-28'),
            rec('day2', 300_000, '2026-09-29', 'hidden'),
        ]);
        expect(i.days[0]?.durationMs).toBe(200_000);
        expect(i.days[1]).toBeNull();
        expect(i.recordedDays).toBe(1);
    });
});

describe('pickMyReading', () => {
    const list = [rec('day1', 1, '2026-09-28'), rec('day3', 2, '2026-09-30')];
    it('DEDA da semana: só a de hoje', () => {
        expect(pickMyReading(list, '2026-09-30', true)?.weekDay).toBe('day3');
        expect(pickMyReading(list, '2026-10-01', true)).toBeNull();
    });
    it('DEDA antigo: a mais recente', () => {
        expect(pickMyReading(list, '2026-12-01', false)?.recordedOn).toBe('2026-09-30');
    });
});

describe('flushQueue', () => {
    const memoryStore = (items: QueuedRecording[]): QueueStore & { items: Map<string, QueuedRecording> } => {
        const map = new Map(items.map((i) => [i.key, i]));
        return {
            items: map,
            all: async () => [...map.values()],
            put: async (i) => void map.set(i.key, i),
            delete: async (k) => void map.delete(k),
        };
    };
    const item = (userUid: string, recordedOn: string): QueuedRecording => ({
        key: queueKey(userUid, 'DEDA34', recordedOn),
        userUid,
        dedaId: 'DEDA34',
        recordedOn,
        durationMs: 60_000,
        mimeType: 'audio/webm',
        blob: {} as Blob,
        createdAt: 0,
    });

    it('apaga só depois que o servidor confirma', async () => {
        const store = memoryStore([item('u1', '2026-10-01'), item('u1', '2026-10-02')]);
        const sent = await flushQueue(store, 'u1', '2026-10-02', async (i) => {
            if (i.recordedOn === '2026-10-01') throw new Error('rede');
        });
        expect(sent).toEqual(['u1|DEDA34|2026-10-02']);
        expect([...store.items.keys()]).toEqual(['u1|DEDA34|2026-10-01']);
    });
    it('não envia gravação de outra conta nem mais velha que 7 dias', async () => {
        const store = memoryStore([item('u2', '2026-10-02'), item('u1', '2026-09-20')]);
        const send = jest.fn();
        expect(await flushQueue(store, 'u1', '2026-10-02', send)).toEqual([]);
        expect(send).not.toHaveBeenCalled();
        expect(store.items.size).toBe(2);
    });
});

describe('limite diário de envios (429 RATE_LIMITED)', () => {
    const limited = { response: { status: 429, data: { code: 'RATE_LIMITED' } } };

    it('reconhece o 429 e o código; outros erros não', () => {
        expect(isDailyLimit(limited)).toBe(true);
        expect(isDailyLimit({ response: { status: 429 } })).toBe(true);
        expect(isDailyLimit({ response: { status: 403, data: { code: 'RATE_LIMITED' } } })).toBe(true);
        expect(isDailyLimit({ response: { status: 500 } })).toBe(false);
        expect(isDailyLimit(new Error('rede'))).toBe(false);
    });

    it('máquina de estados: o envio recusado pelo limite fica "guardado" com o problema próprio', () => {
        let state = recorderReducer(initialRecorderState, { type: 'start', now: 0 });
        state = recorderReducer(state, { type: 'stop', now: 9_000 });
        state = recorderReducer(state, { type: 'upload' });
        state = recorderReducer(state, { type: 'queued', problem: 'daily' });
        expect(state).toMatchObject({ phase: 'queued', problem: 'daily', accumulatedMs: 9_000 });
        // na visita seguinte do mesmo dia, a gravação guardada volta já com o aviso do limite (sem "Upload")
        const restored = recorderReducer(initialRecorderState, {
            type: 'restore',
            durationMs: 9_000,
            problem: 'daily',
        });
        expect(restored).toMatchObject({ phase: 'queued', problem: 'daily' });
        expect(recorderReducer(initialRecorderState, { type: 'restore', durationMs: 9_000 }).problem).toBeNull();
    });

    it('marca o dia (Brasília) no aparelho: no mesmo dia não reenvia; no dia seguinte, sim', () => {
        const g = globalThis as unknown as { window?: unknown };
        const store = new Map<string, string>();
        g.window = {
            localStorage: {
                getItem: (k: string) => store.get(k) ?? null,
                setItem: (k: string, v: string) => store.set(k, v),
            },
        };
        expect(dailyLimitHit('2026-10-05')).toBe(false);
        markDailyLimit('2026-10-05');
        expect(dailyLimitHit('2026-10-05')).toBe(true);
        expect(dailyLimitHit('2026-10-06')).toBe(false);
        delete g.window; // sem armazenamento: nunca trava, nunca lança
        expect(dailyLimitHit('2026-10-05')).toBe(false);
        expect(() => markDailyLimit('2026-10-05')).not.toThrow();
    });

    it('fila: ao bater no limite, para a rodada — não martela o servidor com os outros itens', async () => {
        const items = ['2026-10-03', '2026-10-04', '2026-10-05'].map(
            (recordedOn): QueuedRecording => ({
                key: queueKey('u1', 'DEDA34', recordedOn),
                userUid: 'u1',
                dedaId: 'DEDA34',
                recordedOn,
                durationMs: 60_000,
                mimeType: 'audio/webm',
                blob: {} as Blob,
                createdAt: 0,
            }),
        );
        const map = new Map(items.map((i) => [i.key, i]));
        const store: QueueStore = {
            all: async () => [...map.values()],
            put: async (i) => void map.set(i.key, i),
            delete: async (k) => void map.delete(k),
        };
        const send = jest.fn(async (i: QueuedRecording) => {
            if (i.recordedOn !== '2026-10-03') throw limited;
        });
        const sent = await flushQueue(store, 'u1', '2026-10-05', send, isDailyLimit);
        expect(sent).toEqual(['u1|DEDA34|2026-10-03']);
        expect(send).toHaveBeenCalledTimes(2); // o terceiro nem é tentado
        expect(map.size).toBe(2); // nada se perde: continuam no aparelho
    });
});

describe('escolha do microfone (computador)', () => {
    const mic = (deviceId: string, label: string) => ({ deviceId, label, kind: 'audioinput' });
    const builtIn = mic('a1', 'MacBook Pro Microphone (Built-in)');
    const iphone = mic('b2', 'iPhone de André Microphone');
    const usb = mic('c3', 'Yeti Stereo Microphone');

    it('lista só entradas reais e com nome (antes da permissão não há nomes)', () => {
        expect(listMicrophones([mic('default', 'Default - x'), mic('communications', 'y'), builtIn, usb])).toEqual([
            builtIn,
            usb,
        ]);
        expect(listMicrophones([mic('', ''), mic('z9', '')])).toEqual([]);
        expect(listMicrophones([{ deviceId: 'v1', label: 'FaceTime HD Camera', kind: 'videoinput' }])).toEqual([]);
    });

    it('usa a escolha guardada enquanto o aparelho existe; se sumiu, volta ao padrão sem erro', () => {
        expect(pickMicrophone([builtIn, usb], 'c3')).toBe('c3');
        expect(pickMicrophone([builtIn], 'c3')).toBeNull();
        expect(pickMicrophone([iphone, builtIn], 'b2')).toBe('b2'); // escolheu o iPhone de propósito: respeita
    });

    it('sem escolha: padrão do sistema; se o padrão é o iPhone (Continuity) e há alternativa, o embutido', () => {
        expect(pickMicrophone([builtIn, usb], null)).toBeNull();
        // Chrome: a entrada "default" diz quem é o padrão
        expect(pickMicrophone([mic('default', 'Default - iPhone de André Microphone'), usb, builtIn, iphone])).toBe(
            'a1',
        );
        expect(pickMicrophone([mic('default', 'Default - Yeti Stereo Microphone'), usb, builtIn, iphone])).toBeNull();
        // Safari/Firefox: o primeiro da lista é o padrão
        expect(pickMicrophone([iphone, usb])).toBe('c3');
        expect(pickMicrophone([iphone])).toBeNull(); // sem alternativa: o que houver
        expect(pickMicrophone([mic('', '')])).toBeNull(); // antes da permissão: nada a decidir
    });
});

describe('recordingsOrDisabled', () => {
    it('404 (conta fora da lista ou rota não publicada) vira gravador desligado', () => {
        expect(recordingsOrDisabled({ response: { status: 404, data: { code: 'RECORDING_DISABLED' } } })).toEqual({
            enabled: false,
            consent: { accepted: false, version: null },
            recordings: [],
        });
    });
    it('outros erros seguem como erro (e o gravador também não aparece)', () => {
        const err = { response: { status: 500 } };
        expect(() => recordingsOrDisabled(err)).toThrow();
        expect(() => recordingsOrDisabled(new Error('rede'))).toThrow('rede');
    });
});
