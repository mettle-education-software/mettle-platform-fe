import { youTubeThumbnail, youTubeThumbnailFallback } from '../youtube';

describe('capa do YouTube', () => {
    const id = '58if0plnhJY';
    const hd = youTubeThumbnail(id);
    const hq = youTubeThumbnail(id, 'hqdefault');

    it('tenta a HD primeiro', () => {
        expect(hd).toBe('https://img.youtube.com/vi/58if0plnhJY/maxresdefault.jpg');
    });

    it('troca para hqdefault no placeholder 120×90 ou em erro', () => {
        expect(youTubeThumbnailFallback(id, hd, 120)).toBe(hq);
        expect(youTubeThumbnailFallback(id, hd, null)).toBe(hq);
    });

    it('mantém a HD real e não entra em laço no hqdefault', () => {
        expect(youTubeThumbnailFallback(id, hd, 1280)).toBeNull();
        expect(youTubeThumbnailFallback(id, hq, null)).toBeNull();
        expect(youTubeThumbnailFallback(id, hq, 120)).toBeNull();
    });
});
