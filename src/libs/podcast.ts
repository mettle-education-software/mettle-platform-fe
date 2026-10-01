// Player de podcast do LinKnowledge: formatação de tempo e posição salva por episódio.

/** 75 → "1:15"; 3725 → "1:02:05"; inválido → "0:00". */
export const formatTime = (seconds: number) => {
    const total = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = String(total % 60).padStart(2, '0');
    return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
};

type PositionStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const positionKey = (episodeKey: string) => `mettle:podcast-position:${episodeKey}`;

// localStorage pode não existir ou lançar (aba anônima, SSR, cota): a posição é só conveniência.
const defaultStorage = (): PositionStorage | null => {
    try {
        return typeof window === 'undefined' ? null : window.localStorage;
    } catch {
        return null;
    }
};

export const loadPosition = (episodeKey: string, storage = defaultStorage()) => {
    try {
        const value = Number(storage?.getItem(positionKey(episodeKey)));
        return Number.isFinite(value) && value > 0 ? value : 0;
    } catch {
        return 0;
    }
};

/** Salva a posição; perto do fim (ou no começo) apaga, para o episódio recomeçar do zero. */
export const savePosition = (episodeKey: string, seconds: number, duration: number, storage = defaultStorage()) => {
    try {
        if (!storage) return;
        if (seconds < 5 || (duration > 0 && seconds >= duration - 5)) storage.removeItem(positionKey(episodeKey));
        else storage.setItem(positionKey(episodeKey), String(Math.floor(seconds)));
    } catch {
        // sem persistência: segue tocando
    }
};

/** URL segura dentro de `url("...")` no CSS (aspas, barra invertida e quebras de linha). */
export const cssUrl = (url: string) => `url("${url.replace(/["\\\n\r]/g, (c) => encodeURIComponent(c))}")`;
