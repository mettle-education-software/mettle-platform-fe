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

/**
 * Capa como `background-image` inline (style do React, nunca interpolada no CSS do Emotion):
 * só http(s), normalizada pelo URL() (aspas, espaços, <, > e quebras de linha saem codificados).
 */
export const coverBackground = (raw?: string | null) => {
    try {
        const url = new URL(raw ?? '');
        if (url.protocol !== 'https:' && url.protocol !== 'http:') return undefined;
        return `url("${url.href.replace(/["\\]/g, encodeURIComponent)}")`;
    } catch {
        return undefined;
    }
};

const INTERACTIVE_TAGS = new Set(['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'A', 'AUDIO', 'VIDEO']);
const INTERACTIVE_ROLES = new Set([
    'slider',
    'button',
    'link',
    'menuitem',
    'option',
    'radio',
    'checkbox',
    'switch',
    'tab',
    'textbox',
    'spinbutton',
    'combobox',
]);

type KeyTarget = { tagName: string; getAttribute(name: string): string | null; isContentEditable?: boolean };

/** Atalho do player para a tecla, ou null; nunca rouba teclas de um controle interativo focado. */
export const playerKeyAction = (key: string, target: KeyTarget): 'toggle' | 'back' | 'forward' | null => {
    const role = target.getAttribute('role');
    if (INTERACTIVE_TAGS.has(target.tagName) || (role && INTERACTIVE_ROLES.has(role)) || target.isContentEditable) {
        return null;
    }
    if (key === ' ') return 'toggle';
    if (key === 'ArrowLeft') return 'back';
    if (key === 'ArrowRight') return 'forward';
    return null;
};

// Velocidades: 1× a 3× em passos de 0,25; um botão só, que cicla.
export const PLAYBACK_RATES = [1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3];
const RATE_KEY = 'mettle:podcast-rate';

export const nextRate = (rate: number) => PLAYBACK_RATES[(PLAYBACK_RATES.indexOf(rate) + 1) % PLAYBACK_RATES.length];

export const loadRate = (storage = defaultStorage()) => {
    try {
        const value = Number(storage?.getItem(RATE_KEY));
        return PLAYBACK_RATES.includes(value) ? value : 1;
    } catch {
        return 1;
    }
};

export const saveRate = (rate: number, storage = defaultStorage()) => {
    try {
        storage?.setItem(RATE_KEY, String(rate));
    } catch {
        // sem persistência: vale só nesta sessão
    }
};

// Numeração no começo do título ("99. ", "#093 ", "E232 ", "Episode 98 ", "Ep. 12 - "). Número sem
// marcador nem pontuação ("10 Things…") fica. Rede de segurança: os dados também são limpos.
const EPISODE_NUMBER = /^\s*(?:(?:episode\s*|ep\.?\s*|e(?=\d)|#\s*)\d+\s*[.:)\-–—|]?\s*|\d+\s*[.:)\-–—|]\s*)/i;

export const cleanEpisodeTitle = (title: string) => title.replace(EPISODE_NUMBER, '').trim() || title.trim();
