import { contrastWithWhite } from '../podcast';
import { contentfulImage, headerSources } from '../dedaHeader';

const asset = 'https://images.ctfassets.net/space/id/hash/photo-1520986606214';

describe('contentfulImage', () => {
    it('monta a Images API e descarta parâmetros antigos', () => {
        expect(contentfulImage(`${asset}?w=4000&fit=pad`, { w: 1280, fm: 'webp', q: 75 })).toBe(
            `${asset}?w=1280&fm=webp&q=75`,
        );
    });

    it('só https em images.ctfassets.net', () => {
        expect(contentfulImage('http://images.ctfassets.net/a.jpg', { w: 1 })).toBeNull();
        expect(contentfulImage('https://evil.example/a.jpg', { w: 1 })).toBeNull();
        expect(contentfulImage('javascript:alert(1)', { w: 1 })).toBeNull();
        expect(contentfulImage(undefined, { w: 1 })).toBeNull();
    });
});

describe('headerSources', () => {
    it('celular: recorte centralizado mais alto (800×440 no 2×); desktop: 1280/1920/2560', () => {
        const sources = headerSources(asset);
        expect(sources?.mobile).toBe(
            [
                `${asset}?w=430&h=236&fit=fill&f=center&fm=webp&q=70 430w`,
                `${asset}?w=800&h=440&fit=fill&f=center&fm=webp&q=70 800w`,
                `${asset}?w=1290&h=709&fit=fill&f=center&fm=webp&q=70 1290w`,
            ].join(', '),
        );
        expect(sources?.desktop).toBe(
            [1280, 1920, 2560].map((w) => `${asset}?w=${w}&fm=webp&q=75 ${w}w`).join(', '),
        );
        expect(sources?.mobile).not.toMatch(/w=(1920|2560)/);
    });

    it('URL fora do Contentful ou ausente → sem imagem (só gradiente)', () => {
        expect(headerSources('https://images.unsplash.com/photo')).toBeNull();
        expect(headerSources(null)).toBeNull();
    });

    it('URL com aspas/espaços sai codificada no srcset', () => {
        const sources = headerSources(`${asset}" onerror="x`) as { mobile: string };
        expect(sources.mobile.split(', ')[0].split(' ')[0]).not.toMatch(/["\s]/);
    });
});

describe('contraste no celular', () => {
    it('branco sobre a pior imagem (branca) com a sombra de 60% do celular ≥ 4.5:1', () => {
        // branco × (1 − 0,6) = #666666
        expect(contrastWithWhite('#666666')).toBeGreaterThanOrEqual(4.5);
    });
});
