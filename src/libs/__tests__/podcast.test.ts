import {
    cleanEpisodeTitle,
    coverBackground,
    formatTime,
    loadPosition,
    loadRate,
    mediaUrl,
    nextRate,
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
