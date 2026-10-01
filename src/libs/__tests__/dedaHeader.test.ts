import {
    contentfulImage,
    contrastOverWhite,
    desktopWidths,
    HEADER_GRADIENT,
    headerSources,
    HOME_HEADER_TOP_OPACITY,
    pickHeaderImage,
    QUOTE_SHADE,
    shadeAt,
    shadeGradient,
    TITLE_AND_QUOTE_SHADE,
    TITLE_SHADE,
} from '../dedaHeader';

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

describe('desktopWidths (até a largura real do asset)', () => {
    it('sem largura conhecida: 1280/1920/2560', () => {
        expect(desktopWidths(undefined)).toEqual([1280, 1920, 2560]);
    });

    it('nunca pede w maior que o asset; inclui a própria largura para DPR ≥ 2', () => {
        expect(desktopWidths(1170)).toEqual([1170]);
        expect(desktopWidths(1280)).toEqual([1280]);
        expect(desktopWidths(2400)).toEqual([1280, 1920, 2400]);
        expect(desktopWidths(3840)).toEqual([1280, 1920, 2560, 3840]);
        expect(desktopWidths(6000)).toEqual([1280, 1920, 2560, 3840, 4000]);
    });

    it('headerSources usa essas larguras no desktop', () => {
        expect(headerSources(asset, 2400)?.desktop).toBe(
            [1280, 1920, 2400].map((w) => `${asset}?w=${w}&fm=webp&q=75 ${w}w`).join(', '),
        );
    });
});

describe('escurecimentos laterais', () => {
    it('título: plano até 30% e some até 40%; citação: de 50% a 0,5 em 66%', () => {
        expect(shadeAt(TITLE_SHADE, 15)).toBe(0.8);
        expect(shadeAt(TITLE_SHADE, 40)).toBe(0);
        for (let at = 40; at <= 50; at += 1) expect(shadeAt(TITLE_AND_QUOTE_SHADE, at)).toBe(0);
        for (let at = 66; at <= 100; at += 1) expect(shadeAt(TITLE_AND_QUOTE_SHADE, at)).toBe(0.5);
        expect(shadeGradient(TITLE_SHADE)).toContain('rgba(0, 0, 0, 0.8) 30%');
    });
});

describe('pickHeaderImage (fallback do cabeçalho)', () => {
    const ok = { url: asset, width: 2400 };
    it('primeira candidata que headerSources aceita', () => {
        expect(pickHeaderImage([ok, { url: `${asset}-b` }])).toBe(0);
        expect(pickHeaderImage([null, ok])).toBe(1);
        expect(pickHeaderImage([{ url: 'https://images.unsplash.com/x' }, ok])).toBe(1);
        expect(pickHeaderImage([undefined, null])).toBe(-1);
    });
});

describe('gradiente vertical dos cabeçalhos', () => {
    it('topo leve (constante, 0,15), escurece desde 40% e termina exatamente no #2b2b2b do fundo', () => {
        expect(HOME_HEADER_TOP_OPACITY).toBe(0.15);
        expect(HEADER_GRADIENT).toBe(
            'linear-gradient(180deg, rgba(43, 43, 43, 0.15) 0%, rgba(43, 43, 43, 0.25) 40%, rgba(43, 43, 43, 0.75) 80%, #2b2b2b 100%)',
        );
    });
});

// Pior caso: imagem branca. Áreas medidas no harness (1280–1920 px), em % da largura / % da altura a partir do topo.
const worst = (text: string, shade: [number, number][], [x0, x1]: number[], [y0, y1]: number[]) => {
    let min = Infinity;
    for (let x = x0; x <= x1; x += 1)
        for (let y = y0; y <= y1; y += 1) min = Math.min(min, contrastOverWhite(text, shade, x, y));
    return min;
};
const GOLD = '#b89261';
const WHITE = '#ffffff';

describe('contraste ≥ 4.5:1 sobre imagem branca (camadas reais)', () => {
    it('citação (página do DEDA): branco em x 69–100%, y 17–61%', () => {
        expect(worst(WHITE, TITLE_AND_QUOTE_SHADE, [69, 100], [17, 61])).toBeGreaterThanOrEqual(4.5);
    });

    it('título dourado da home: x 3–30%, y 44–72%', () => {
        expect(worst(GOLD, TITLE_SHADE, [3, 30], [44, 72])).toBeGreaterThanOrEqual(4.5);
    });

    it('título dourado da página do DEDA: x 6–30%, y 26–45%', () => {
        expect(worst(GOLD, TITLE_AND_QUOTE_SHADE, [6, 30], [26, 45])).toBeGreaterThanOrEqual(4.5);
    });

    it('chip "Current DEDA" (branco) da home: x 3–20%, y 17–37%', () => {
        expect(worst(WHITE, TITLE_SHADE, [3, 20], [17, 37])).toBeGreaterThanOrEqual(4.5);
    });

    it('as opacidades são as mínimas (0,05 a menos já falha)', () => {
        const less = (stops: [number, number][], by: number) =>
            stops.map(([at, a]) => [at, a > 0 ? a - by : a] as [number, number]);
        expect(worst(GOLD, less(TITLE_SHADE, 0.05), [3, 30], [44, 72])).toBeLessThan(4.5);
        expect(worst(WHITE, less(QUOTE_SHADE, 0.05), [69, 100], [17, 61])).toBeLessThan(4.5);
    });
});
