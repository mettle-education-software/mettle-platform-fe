import {
    contentfulImage,
    desktopWidths,
    headerSources,
    QUOTE_SHADE,
    shadeAt,
    shadeGradient,
    HEADER_GRADIENT,
    HOME_HEADER_TOP_OPACITY,
    pickHeaderImage,
    quoteContrastOverWhite,
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

describe('escurecimento da citação (página do DEDA)', () => {
    it('nada até 50% da largura; sobe suave até 0,5 em 66% e fica assim', () => {
        for (let at = 0; at <= 50; at += 1) expect(shadeAt(QUOTE_SHADE, at)).toBe(0);
        expect(shadeAt(QUOTE_SHADE, 58)).toBeCloseTo(0.25);
        for (let at = 66; at <= 100; at += 1) expect(shadeAt(QUOTE_SHADE, at)).toBe(0.5);
    });

    it('é o mínimo: com 0,45 a citação ficaria abaixo de 4.5:1', () => {
        expect(QUOTE_SHADE[2][1]).toBe(0.5);
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
    it('topo leve (constante, 0,15), 0,35 em 55% e fim exatamente no #2b2b2b do fundo', () => {
        expect(HOME_HEADER_TOP_OPACITY).toBe(0.15);
        expect(HEADER_GRADIENT).toBe(
            'linear-gradient(180deg, rgba(43, 43, 43, 0.15) 0%, rgba(43, 43, 43, 0.35) 55%, #2b2b2b 100%)',
        );
    });
});

describe('contraste da citação: gradiente vertical + sombra horizontal sobre imagem branca', () => {
    // Faixa medida da citação (1280–1920 px): x 69–100% da largura; y 39–83% da altura a partir de baixo.
    const band = (yFrom: number, yTo: number) => {
        let worst = Infinity;
        for (let x = 69; x <= 100; x += 1)
            for (let y = yFrom; y <= yTo; y += 1) worst = Math.min(worst, quoteContrastOverWhite(x, y));
        return worst;
    };

    it('área inteira da citação ≥ 4.5:1 sobre imagem branca', () => {
        expect(band(39, 83)).toBeGreaterThanOrEqual(4.5);
    });
});
