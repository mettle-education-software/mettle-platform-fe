import {
    contentfulImage,
    contrastOverWhite,
    desktopWidths,
    HEADER_GRADIENT,
    HEADER_VERTICAL,
    headerSources,
    HOME_HEADER_TOP_OPACITY,
    HOME_MOBILE_CROPS,
    pickHeaderImage,
    QUOTE_SHADE_OPACITY,
    shadeAt,
    TEXT_SHADE_CORE,
    textCornerRadius,
    textShadeCss,
    textShadeRect,
    TITLE_SHADE_OPACITY,
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

describe('esfumados presos ao texto', () => {
    it('retângulo = texto + folga proporcional e fixa; CSS closest-side com núcleo plano', () => {
        expect(textShadeRect({ left: 100, top: 50, width: 200, height: 40 })).toEqual({
            left: 100 - (224 + 280),
            top: 50 - (24 + 200),
            width: 200 + 2 * (224 + 280),
            height: 40 + 2 * (24 + 200),
        });
        expect(textShadeCss(0.85)).toBe(
            `radial-gradient(closest-side, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.85) ${TEXT_SHADE_CORE}%, rgba(0, 0, 0, 0.748) 70%, rgba(0, 0, 0, 0.501) 80%, rgba(0, 0, 0, 0.246) 90%, rgba(0, 0, 0, 0) 100%)`,
        );
    });

    // Títulos de "London" (~140 px) a títulos longos em 1 ou 2 linhas ("The Bilingual Brain",
    // "Morning, Night, Neither": até ~800 px) e citações de 180–420 px por 88–240 px — o que aparece
    // entre 861 e 2560 px de tela.
    it('o texto inteiro fica no núcleo de opacidade cheia, para qualquer tamanho', () => {
        for (let w = 100; w <= 800; w += 20)
            for (let h = 40; h <= 240; h += 8) expect(textCornerRadius(w, h)).toBeLessThanOrEqual(TEXT_SHADE_CORE);
    });
});

const GOLD = '#b89261';
const WHITE = '#ffffff';

describe('contraste ≥ 4.5:1 sobre imagem branca (pior caso: topo do gradiente, 0,15)', () => {
    it('título dourado (home e página do DEDA) e ← dourado', () => {
        expect(contrastOverWhite(GOLD, TITLE_SHADE_OPACITY)).toBeGreaterThanOrEqual(4.5);
    });

    it('chip "Current DEDA" (branco, no mesmo esfumado do título)', () => {
        expect(contrastOverWhite(WHITE, TITLE_SHADE_OPACITY)).toBeGreaterThanOrEqual(4.5);
    });

    it('citação (branco)', () => {
        expect(contrastOverWhite(WHITE, QUOTE_SHADE_OPACITY)).toBeGreaterThanOrEqual(4.5);
    });

    it('as opacidades são as mínimas (0,05 a menos já falha)', () => {
        expect(contrastOverWhite(GOLD, TITLE_SHADE_OPACITY - 0.05)).toBeLessThan(4.5);
        expect(contrastOverWhite(WHITE, QUOTE_SHADE_OPACITY - 0.05)).toBeLessThan(4.5);
    });

    it('abas inativas (branco, sem esfumado) na faixa das abas, y 74–100% da altura', () => {
        for (let y = 74; y <= 100; y += 1)
            expect(contrastOverWhite(WHITE, 0, shadeAt(HEADER_VERTICAL, y))).toBeGreaterThanOrEqual(4.5);
    });
});

describe('cabeçalho da home: imagem própria e recorte do celular', () => {
    const home = { url: `${asset}-home`, width: 3840 };
    const header = { url: asset, width: 2172 };
    const card = { url: `${asset}-card`, width: 1170 };

    it('ordem: dedaHomeHeaderImage → dedaHeaderImage → dedaFeaturedImage', () => {
        expect(pickHeaderImage([home, header, card])).toBe(0);
        expect(pickHeaderImage([null, header, card])).toBe(1);
        expect(pickHeaderImage([null, null, card])).toBe(2);
        expect(pickHeaderImage([{ url: 'https://example.com/x.jpg' }, undefined, card])).toBe(2);
    });

    it('celular: recorte central 800×240 (430/800/1290w), nunca as larguras do desktop', () => {
        const sources = headerSources(home.url, home.width, HOME_MOBILE_CROPS);
        expect(sources?.mobile).toBe(
            [
                `${home.url}?w=430&h=129&fit=fill&f=center&fm=webp&q=70 430w`,
                `${home.url}?w=800&h=240&fit=fill&f=center&fm=webp&q=70 800w`,
                `${home.url}?w=1290&h=387&fit=fill&f=center&fm=webp&q=70 1290w`,
            ].join(', '),
        );
        expect(sources?.mobile).not.toMatch(/w=(1920|2560|3840)/);
    });

    it('desktop igual ao dos demais (até a largura real) e página do DEDA com o recorte de sempre', () => {
        expect(headerSources(home.url, home.width, HOME_MOBILE_CROPS)?.desktop).toBe(
            headerSources(home.url, home.width)?.desktop,
        );
        expect(headerSources(header.url, header.width)?.mobile).toContain('w=800&h=440&fit=fill&f=center');
    });
});
