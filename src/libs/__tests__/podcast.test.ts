import { cssUrl, formatTime, loadPosition, savePosition } from '../podcast';

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

describe('cssUrl', () => {
    it('mantém URLs normais e escapa aspas/quebras', () => {
        expect(cssUrl('https://x.com/a%20b.jpg')).toBe('url("https://x.com/a%20b.jpg")');
        expect(cssUrl('https://x.com/a".jpg')).toBe('url("https://x.com/a%22.jpg")');
        expect(cssUrl('https://x.com/a\n.jpg')).toBe('url("https://x.com/a%0A.jpg")');
    });
});
