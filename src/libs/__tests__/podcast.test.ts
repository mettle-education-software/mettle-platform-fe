import {
    applySeek,
    clampPosition,
    cleanEpisodeTitle,
    contrastWithWhite,
    createPlaybackCoordinator,
    DEFAULT_PODCAST_COLOR,
    podcastCardColor,
    coverBackground,
    formatTime,
    loadPosition,
    loadRate,
    mediaUrl,
    nextRate,
    initialPlayback,
    playbackAnnouncement,
    playbackReducer,
    PlaybackAction,
    playRejectionKind,
    playerKeyAction,
    savePosition,
    saveRate,
} from '../podcast';

const memoryStorage = () => {
    const data = new Map<string, string>();
    return {
        getItem: (key: string) => data.get(key) ?? null,
        setItem: (key: string, value: string) => void data.set(key, value),
        removeItem: (key: string) => void data.delete(key),
    };
};

describe('formatTime', () => {
    it('formata m:ss e h:mm:ss', () => {
        expect(formatTime(0)).toBe('0:00');
        expect(formatTime(75.9)).toBe('1:15');
        expect(formatTime(3725)).toBe('1:02:05');
    });

    it('valores inválidos viram 0:00', () => {
        expect(formatTime(NaN)).toBe('0:00');
        expect(formatTime(Infinity)).toBe('0:00');
        expect(formatTime(-3)).toBe('0:00');
    });
});

describe('posição por episódio', () => {
    it('salva e recupera por episódio', () => {
        const storage = memoryStorage();
        savePosition('ep-a', 120.7, 1800, storage);
        savePosition('ep-b', 30, 1800, storage);
        expect(loadPosition('ep-a', storage)).toBe(120);
        expect(loadPosition('ep-b', storage)).toBe(30);
        expect(loadPosition('ep-c', storage)).toBe(0);
    });

    it('perto do fim ou no começo apaga a posição', () => {
        const storage = memoryStorage();
        savePosition('ep', 600, 1800, storage);
        savePosition('ep', 1797, 1800, storage);
        expect(loadPosition('ep', storage)).toBe(0);
        savePosition('ep', 600, 1800, storage);
        savePosition('ep', 2, 1800, storage);
        expect(loadPosition('ep', storage)).toBe(0);
    });

    it('storage que lança ou ausente não quebra', () => {
        const broken = {
            getItem: () => {
                throw new Error('blocked');
            },
            setItem: () => {
                throw new Error('quota');
            },
            removeItem: () => {
                throw new Error('blocked');
            },
        };
        expect(() => savePosition('ep', 600, 1800, broken)).not.toThrow();
        expect(loadPosition('ep', broken)).toBe(0);
        expect(loadPosition('ep', null)).toBe(0);
        expect(() => savePosition('ep', 600, 1800, null)).not.toThrow();
    });
});

describe('coverBackground', () => {
    it('aceita só http(s) e mantém URLs normais', () => {
        expect(coverBackground('https://x.com/a%20b.jpg')).toBe('url("https://x.com/a%20b.jpg")');
        expect(coverBackground('javascript:alert(1)')).toBeUndefined();
        expect(coverBackground('data:image/png;base64,AAA')).toBeUndefined();
        expect(coverBackground('nao é url')).toBeUndefined();
        expect(coverBackground(null)).toBeUndefined();
    });

    it('não deixa a URL fechar o url() nem injetar markup', () => {
        const value = coverBackground(
            'https://x.com/a.jpg"); background: red; x:("</style><script>alert(1)</script>',
        ) as string;
        expect(value.startsWith('url("https://x.com/')).toBe(true);
        expect(value.slice(5, -2)).not.toMatch(/["<>\s\\]/);
        expect(value.endsWith('")')).toBe(true);
    });
});

describe('playerKeyAction', () => {
    const el = (tagName: string, role: string | null = null) => ({ tagName, getAttribute: () => role });

    it('no player (alvo não interativo): espaço e setas', () => {
        expect(playerKeyAction(' ', el('DIV'))).toBe('toggle');
        expect(playerKeyAction('ArrowLeft', el('DIV'))).toBe('back');
        expect(playerKeyAction('ArrowRight', el('SPAN'))).toBe('forward');
        expect(playerKeyAction('Enter', el('DIV'))).toBeNull();
    });

    it('ignora controles interativos focados', () => {
        ['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'A'].forEach((tag) => {
            expect(playerKeyAction('ArrowLeft', el(tag))).toBeNull();
            expect(playerKeyAction(' ', el(tag))).toBeNull();
        });
        expect(playerKeyAction('ArrowRight', el('DIV', 'slider'))).toBeNull();
        expect(playerKeyAction(' ', el('DIV', 'button'))).toBeNull();
        expect(playerKeyAction('ArrowLeft', { ...el('DIV'), isContentEditable: true })).toBeNull();
    });
});

describe('velocidade', () => {
    it('cicla de 1× a 3× em passos de 0,25 e volta a 1×', () => {
        expect(nextRate(1)).toBe(1.25);
        expect(nextRate(2.75)).toBe(3);
        expect(nextRate(3)).toBe(1);
        expect(nextRate(0.75)).toBe(1);
    });

    it('lembra a velocidade; valor fora da lista ou storage quebrado → 1×', () => {
        const storage = memoryStorage();
        expect(loadRate(storage)).toBe(1);
        saveRate(2.25, storage);
        expect(loadRate(storage)).toBe(2.25);
        storage.setItem('mettle:podcast-rate', '0.75');
        expect(loadRate(storage)).toBe(1);
        const broken = {
            getItem: () => {
                throw new Error('x');
            },
            setItem: () => {
                throw new Error('x');
            },
            removeItem: () => undefined,
        };
        expect(loadRate(broken)).toBe(1);
        expect(() => saveRate(2, broken)).not.toThrow();
    });
});

describe('cleanEpisodeTitle', () => {
    it.each([
        ['99. The Future of Cities', 'The Future of Cities'],
        ['210. London Calling', 'London Calling'],
        ['#093 Why We Sleep', 'Why We Sleep'],
        ['E232 The Thames', 'The Thames'],
        ['Episode 98 Big Ben', 'Big Ben'],
        ['Ep. 12 - The Tube', 'The Tube'],
        ['episode 7: Fog', 'Fog'],
    ])('%s → %s', (raw, clean) => expect(cleanEpisodeTitle(raw)).toBe(clean));

    it('mantém títulos sem numeração de episódio', () => {
        expect(cleanEpisodeTitle('10 Things About London')).toBe('10 Things About London');
        expect(cleanEpisodeTitle('Every Day Matters')).toBe('Every Day Matters');
        expect(cleanEpisodeTitle('Epic Stories')).toBe('Epic Stories');
        expect(cleanEpisodeTitle('42.')).toBe('42.');
    });
});

describe('mediaUrl', () => {
    it('aceita só http(s) absoluta e normaliza', () => {
        expect(mediaUrl('https://cdn.example.com/ep 1.mp3')).toBe('https://cdn.example.com/ep%201.mp3');
        expect(mediaUrl('http://example.com/a.mp3')).toBe('http://example.com/a.mp3');
    });

    it('recusa javascript:, data:, relativa e vazia', () => {
        expect(mediaUrl('javascript:alert(1)')).toBeNull();
        expect(mediaUrl('data:audio/mp3;base64,AAAA')).toBeNull();
        expect(mediaUrl('/audio/ep.mp3')).toBeNull();
        expect(mediaUrl('ep.mp3')).toBeNull();
        expect(mediaUrl('')).toBeNull();
        expect(mediaUrl(undefined)).toBeNull();
    });
});

describe('playbackAnnouncement', () => {
    it('anuncia play, pausa e fim', () => {
        expect(playbackAnnouncement('play', 'Big Ben')).toBe('Tocando: Big Ben');
        expect(playbackAnnouncement('pause', 'Big Ben')).toBe('Pausado: Big Ben');
        expect(playbackAnnouncement('ended', 'Big Ben')).toBe('Fim do episódio: Big Ben');
    });

    it('a pausa disparada pelo fim do episódio não anuncia "Pausado"', () => {
        expect(playbackAnnouncement('pause', 'Big Ben', true)).toBeNull();
    });
});

describe('podcastCardColor', () => {
    it('valida o hex; inválido ou ausente → cor padrão da Mettle', () => {
        expect(podcastCardColor('#1E3264')).toBe('#1e3264');
        expect(podcastCardColor('red')).toBe(DEFAULT_PODCAST_COLOR);
        expect(podcastCardColor('#fff')).toBe(DEFAULT_PODCAST_COLOR);
        expect(podcastCardColor('#1e3264; background:url(x)')).toBe(DEFAULT_PODCAST_COLOR);
        expect(podcastCardColor('url(javascript:alert(1))')).toBe(DEFAULT_PODCAST_COLOR);
        expect(podcastCardColor(undefined)).toBe(DEFAULT_PODCAST_COLOR);
    });

    it.each(['#ffffff', '#ffe600', '#1db954', '#e8115b', '#1e3264', '#b89261', '#000000'])(
        '%s: texto branco com contraste ≥ 4.5:1',
        (hex) => {
            const color = podcastCardColor(hex);
            expect(color).toMatch(/^#[0-9a-f]{6}$/);
            expect(contrastWithWhite(color)).toBeGreaterThanOrEqual(4.5);
        },
    );

    it('cor já escura fica como está', () => {
        expect(podcastCardColor('#1e3264')).toBe('#1e3264');
    });
});

describe('um episódio toca por vez', () => {
    it('tocar outro pausa o anterior; o mesmo não se pausa', () => {
        const coordinator = createPlaybackCoordinator();
        const pauseA = jest.fn();
        const pauseB = jest.fn();
        coordinator.claim('a', pauseA);
        coordinator.claim('a', pauseA);
        expect(pauseA).not.toHaveBeenCalled();
        coordinator.claim('b', pauseB);
        expect(pauseA).toHaveBeenCalledTimes(1);
        coordinator.release('b');
        coordinator.claim('a', pauseA);
        expect(pauseB).not.toHaveBeenCalled();
    });
});

describe('playbackReducer', () => {
    const err = (name: string) => Object.assign(new Error(name), { name });
    const run = (actions: PlaybackAction[], hasSource = true) =>
        actions.reduce(playbackReducer, initialPlayback(hasSource));
    const blocked = (hasMetadata: boolean): PlaybackAction => ({ type: 'PLAY_REJECTED', kind: 'blocked', hasMetadata });
    const fatal: PlaybackAction = { type: 'PLAY_REJECTED', kind: 'fatal', hasMetadata: false };

    it('classifica a rejeição do play()', () => {
        expect(playRejectionKind(err('NotSupportedError'))).toBe('fatal');
        expect(playRejectionKind(err('NotAllowedError'))).toBe('blocked');
        expect(playRejectionKind(err('AbortError'))).toBe('blocked');
        expect(playRejectionKind(undefined)).toBe('blocked');
    });

    it('fluxo normal: idle → loading → ready → tocando → pausado → fim', () => {
        expect(run([])).toEqual({ status: 'idle', started: false, playing: false });
        expect(run([{ type: 'PLAY_REQUEST' }])).toEqual({ status: 'loading', started: true, playing: false });
        expect(run([{ type: 'PLAY_REQUEST' }, { type: 'METADATA' }, { type: 'PLAYING' }])).toEqual({
            status: 'ready',
            started: true,
            playing: true,
        });
        expect(
            run([{ type: 'PLAY_REQUEST' }, { type: 'METADATA' }, { type: 'PLAYING' }, { type: 'PAUSE' }]).playing,
        ).toBe(false);
        expect(
            run([{ type: 'PLAY_REQUEST' }, { type: 'METADATA' }, { type: 'PLAYING' }, { type: 'ENDED' }]).playing,
        ).toBe(false);
    });

    it('rejeição não fatal não trava em loading', () => {
        expect(run([{ type: 'PLAY_REQUEST' }, blocked(false)])).toEqual({
            status: 'idle',
            started: false,
            playing: false,
        });
        expect(run([{ type: 'PLAY_REQUEST' }, { type: 'METADATA' }, blocked(true)])).toEqual({
            status: 'ready',
            started: true,
            playing: false,
        });
    });

    it('erro de mídia ANTES da rejeição: fica error e started não zera', () => {
        for (const hasMetadata of [true, false]) {
            const state = run([{ type: 'PLAY_REQUEST' }, { type: 'MEDIA_ERROR' }, blocked(hasMetadata)]);
            expect(state).toEqual({ status: 'error', started: true, playing: false });
        }
    });

    it('erro de mídia DEPOIS da rejeição: termina em error', () => {
        expect(run([{ type: 'PLAY_REQUEST' }, blocked(false), { type: 'MEDIA_ERROR' }]).status).toBe('error');
        expect(
            run([{ type: 'PLAY_REQUEST' }, { type: 'METADATA' }, blocked(true), { type: 'MEDIA_ERROR' }]).status,
        ).toBe('error');
    });

    it('error é terminal para qualquer evento seguinte', () => {
        const after = run([{ type: 'PLAY_REQUEST' }, fatal]);
        expect(after.status).toBe('error');
        (['PLAY_REQUEST', 'METADATA', 'PLAYING', 'PAUSE', 'ENDED'] as const).forEach((type) =>
            expect(playbackReducer(after, { type }).status).toBe('error'),
        );
        expect(playbackReducer(after, blocked(true)).status).toBe('error');
        expect(playbackReducer({ ...after, playing: true }, { type: 'PLAYING' }).playing).toBe(false);
    });

    it('sem URL válida começa em error', () => {
        expect(run([{ type: 'PLAY_REQUEST' }, { type: 'METADATA' }], false).status).toBe('error');
    });
});

describe('clampPosition', () => {
    it('limita a [0, duração] quando a duração é conhecida', () => {
        expect(clampPosition(-15, 600)).toBe(0);
        expect(clampPosition(630, 600)).toBe(600);
        expect(clampPosition(45, 600)).toBe(45);
    });

    it('sem duração conhecida, só impede negativo', () => {
        expect(clampPosition(30, 0)).toBe(30);
        expect(clampPosition(-5, 0)).toBe(0);
        expect(clampPosition(NaN, 600)).toBe(0);
    });
});

describe('applySeek', () => {
    it('sem metadados: só calcula a posição, não toca no <audio>', () => {
        const audio = { readyState: 0, duration: NaN, currentTime: 0 };
        expect(applySeek(audio, 30, 90)).toBe(30);
        expect(audio.currentTime).toBe(0);
        expect(applySeek(null, 120, 90)).toBe(90);
    });

    it('com metadados: move o <audio> e devolve a posição aplicada', () => {
        const audio = { readyState: 1, duration: 90, currentTime: 10 };
        expect(applySeek(audio, 40, 0)).toBe(40);
        expect(audio.currentTime).toBe(40);
        expect(applySeek(audio, 500, 90)).toBe(90);
        expect(applySeek(audio, -20, 90)).toBe(0);
    });
});
