import { contentfulImage, DESKTOP_SHADE, headerSources, MOBILE_SHADE, shadeAt, shadeGradient } from '../dedaHeader';
import { contrastWithWhite } from '../podcast';

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
        expect(sources?.desktop).toBe([1280, 1920, 2560].map((w) => `${asset}?w=${w}&fm=webp&q=75 ${w}w`).join(', '));
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

// Texto branco sobre a pior imagem (branca) com escurecimento `alpha`: fundo = 255 × (1 − alpha).
const whiteOverWhiteImage = (alpha: number) => {
    const v = Math.round(255 * (1 - alpha))
        .toString(16)
        .padStart(2, '0');
    return contrastWithWhite(`#${v}${v}${v}`);
};

describe('escurecimento horizontal', () => {
    it('gera o gradiente pedido (stops do André + reforço sob a citação)', () => {
        expect(shadeGradient(DESKTOP_SHADE)).toBe(
            'linear-gradient(90deg, rgba(0, 0, 0, 0.55) 0%, rgba(0, 0, 0, 0) 32%, rgba(0, 0, 0, 0) 55%, rgba(0, 0, 0, 0.6) 66%, rgba(0, 0, 0, 0.72) 100%)',
        );
    });

    it('citação (69–100% da largura em 1280–1920 px): contraste ≥ 4.5:1 sobre imagem branca', () => {
        for (let at = 66; at <= 100; at += 1)
            expect(whiteOverWhiteImage(shadeAt(DESKTOP_SHADE, at))).toBeGreaterThanOrEqual(4.5);
    });

    it('celular: o ← (0–18% da largura) com contraste ≥ 4.5:1', () => {
        for (let at = 0; at <= 18; at += 1)
            expect(whiteOverWhiteImage(shadeAt(MOBILE_SHADE, at))).toBeGreaterThanOrEqual(4.5);
    });
});
