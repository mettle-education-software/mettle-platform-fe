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

/** URL de mídia aceita no <audio>: só http(s) absoluta, normalizada pelo URL(); senão null. */
export const mediaUrl = (raw?: string | null) => {
    try {
        const url = new URL(raw ?? '');
        return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
    } catch {
        return null;
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

/** Texto da região aria-live para cada evento do <audio>; o `pause` que vem junto do fim não anuncia. */
export const playbackAnnouncement = (event: 'play' | 'pause' | 'ended', title: string, ended = false) => {
    if (event === 'play') return `Tocando: ${title}`;
    if (event === 'ended') return `Fim do episódio: ${title}`;
    return ended ? null : `Pausado: ${title}`;
};

// Cor do card de podcast (estilo Spotify): só hex #rrggbb validado; senão o marrom escuro da Mettle.
export const DEFAULT_PODCAST_COLOR = '#3c362f';
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

const luminance = (hex: string) => {
    const [r, g, b] = channels(hex).map((value) => {
        const c = value / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** Contraste WCAG entre o texto branco e a cor. */
export const contrastWithWhite = (hex: string) => 1.05 / (luminance(hex) + 0.05);

/**
 * Fundo do card: cor do programa validada e, se clara demais, escurecida (mistura com preto)
 * até o texto branco ter contraste ≥ 4.5:1. Sempre devolve um hex nosso, seguro para style inline.
 */
export const podcastCardColor = (raw?: string | null) => {
    const base = raw && HEX_COLOR.test(raw) ? raw.toLowerCase() : DEFAULT_PODCAST_COLOR;
    for (let shade = 0; shade <= 1; shade += 0.05) {
        const hex = `#${channels(base)
            .map((value) =>
                Math.round(value * (1 - shade))
                    .toString(16)
                    .padStart(2, '0'),
            )
            .join('')}`;
        if (contrastWithWhite(hex) >= 4.5) return hex;
    }
    return '#000000';
};

/** Um episódio toca por vez: quem começa a tocar pausa o anterior. */
export const createPlaybackCoordinator = () => {
    let active: { id: string; pause: () => void } | null = null;
    return {
        claim(id: string, pause: () => void) {
            if (active && active.id !== id) active.pause();
            active = { id, pause };
        },
        release(id: string) {
            if (active?.id === id) active = null;
        },
    };
};

export const podcastPlayback = createPlaybackCoordinator();

// Estado do player num reducer único: `error` é terminal e `started` só zera fora de erro,
// em qualquer ordem de eventos (onError, rejeição do play(), metadados, play/pause).
export type PlaybackStatus = 'idle' | 'loading' | 'ready' | 'error';
export type PlaybackState = { status: PlaybackStatus; started: boolean; playing: boolean };
export type PlaybackAction =
    | { type: 'PLAY_REQUEST' }
    | { type: 'METADATA' }
    | { type: 'PLAYING' }
    | { type: 'PAUSE' }
    | { type: 'ENDED' }
    | { type: 'MEDIA_ERROR' }
    | { type: 'PLAY_REJECTED'; kind: 'fatal' | 'blocked'; hasMetadata: boolean };

export const initialPlayback = (hasSource: boolean): PlaybackState => ({
    status: hasSource ? 'idle' : 'error',
    started: false,
    playing: false,
});

/** Só formato/fonte inválidos (NotSupportedError) são fatais; bloqueio e interrupção não. */
export const playRejectionKind = (error: unknown): 'fatal' | 'blocked' =>
    (error as { name?: string } | null)?.name === 'NotSupportedError' ? 'fatal' : 'blocked';

export const playbackReducer = (state: PlaybackState, action: PlaybackAction): PlaybackState => {
    if (state.status === 'error') return state.playing ? { ...state, playing: false } : state;
    switch (action.type) {
        case 'PLAY_REQUEST':
            return { ...state, started: true, status: state.status === 'idle' ? 'loading' : state.status };
        case 'METADATA':
            return { ...state, status: 'ready' };
        case 'PLAYING':
            return { ...state, started: true, playing: true };
        case 'PAUSE':
        case 'ENDED':
            return { ...state, playing: false };
        case 'MEDIA_ERROR':
            return { ...state, status: 'error', playing: false };
        case 'PLAY_REJECTED':
            if (action.kind === 'fatal') return { ...state, status: 'error', playing: false };
            // Bloqueio/interrupção: volta ao estado anterior ao clique e o play pode ser clicado de novo.
            return action.hasMetadata
                ? { ...state, status: 'ready', playing: false }
                : { ...state, status: 'idle', started: false, playing: false };
        default:
            return state;
    }
};
