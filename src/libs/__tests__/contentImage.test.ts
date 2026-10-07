import { contentfulOriginal, isContentImageUrl } from '../contentImage';
import { safeNoteImageUrl } from '../contextNotes';
import { contentfulImage } from '../dedaHeader';

const MIRROR =
    'https://mettle-content-mirror.mettle.workers.dev/ctfimg/pjob7ut4tut3/id/0123456789abcdef0123456789abcdef/p.jpg';

describe('contentImage', () => {
    it('aceita Contentful e espelho /ctfimg/; recusa o resto', () => {
        expect(isContentImageUrl(new URL('https://images.ctfassets.net/s/a.jpg'))).toBe(true);
        expect(isContentImageUrl(new URL(MIRROR))).toBe(true);
        expect(isContentImageUrl(new URL('https://mettle-content-mirror.mettle.workers.dev/media/a.mp3'))).toBe(false);
        expect(isContentImageUrl(new URL('http://mettle-content-mirror.mettle.workers.dev/ctfimg/a.jpg'))).toBe(false);
        expect(isContentImageUrl(new URL('https://evil.example/ctfimg/a.jpg'))).toBe(false);
    });
    it('dedaHeader e notas aceitam a url do espelho', () => {
        expect(contentfulImage(MIRROR, { w: 448, fm: 'webp' })).toBe(`${MIRROR}?w=448&fm=webp`);
        expect(safeNoteImageUrl(MIRROR)).toBe(MIRROR);
    });
    it('fallback: espelho (direto ou via next/image) → mesma imagem no Contentful', () => {
        const original =
            'https://images.ctfassets.net/pjob7ut4tut3/id/0123456789abcdef0123456789abcdef/p.jpg?w=448&fm=webp';
        expect(contentfulOriginal(`${MIRROR}?w=448&fm=webp`)).toBe(original);
        expect(
            contentfulOriginal(
                `https://plataforma.mettle.com.br/_next/image?url=${encodeURIComponent(`${MIRROR}?w=448&fm=webp`)}&w=640&q=75`,
            ),
        ).toBe(original);
        expect(contentfulOriginal('https://images.ctfassets.net/s/a.jpg')).toBeNull();
        expect(contentfulOriginal('/img/x.webp')).toBeNull();
    });
});
