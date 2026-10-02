import {
    contentfulImage,
    contrastOverWhite,
    desktopWidths,
    HEADER_GRADIENT,
    HEADER_IMAGE_WAIT_MS,
    HEADER_VERTICAL,
    headerSources,
    HOME_ART_OBJECT_POSITION,
    HOME_HEADER_TOP_OPACITY,
    HOME_MOBILE_CROPS,
    pickHeaderImage,
    QUOTE_SHADE_OPACITY,
    settleHeaderImages,
    shadeAt,
    startHeaderImageWait,
    TEXT_SHADE_BLUR,
    TEXT_SHADE_PAD,
    textShadeStyle,
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
        expect(pickHeaderImage([null, null])).toBe(-1);
    });

    it('candidata anterior ainda carregando (undefined): espera em vez de usar a seguinte', () => {
        expect(pickHeaderImage([undefined, ok])).toBe(-1);
        expect(pickHeaderImage([undefined, undefined, ok])).toBe(-1);
        expect(pickHeaderImage([null, undefined, ok])).toBe(-1);
        // quando a preferida já chegou, não importa se as seguintes ainda carregam
        expect(pickHeaderImage([ok, undefined])).toBe(0);
        expect(pickHeaderImage([null, ok, undefined])).toBe(1);
        // tudo carregado
        expect(pickHeaderImage([null, null, ok])).toBe(2);
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

describe('sombra justa ao texto', () => {
    it('retângulo = texto + folga FIXA (não cresce com o texto); preto desfocado', () => {
        expect(textShadeRect({ left: 100, top: 50, width: 200, height: 40 })).toEqual({
            left: 100 - TEXT_SHADE_PAD,
            top: 50 - TEXT_SHADE_PAD,
            width: 200 + 2 * TEXT_SHADE_PAD,
            height: 40 + 2 * TEXT_SHADE_PAD,
        });
        expect(textShadeStyle(0.55)).toEqual({
            background: 'rgba(0, 0, 0, 0.55)',
            borderRadius: TEXT_SHADE_PAD,
            filter: `blur(${TEXT_SHADE_BLUR}px)`,
        });
    });

    // Regressão de 02-Out-2026: com a elipse proporcional, o título "The Bilingual Brain" (~440 px)
    // gerava uma sombra de ~1.700 px que apagava a imagem inteira. A sombra passa do texto só a folga.
    it('título longo não cobre o cabeçalho: a sombra passa do texto só a folga fixa', () => {
        for (const width of [140, 440, 800]) {
            const shade = textShadeRect({ left: 0, top: 0, width, height: 56 });
            expect(shade.width - width).toBe(2 * TEXT_SHADE_PAD);
        }
        expect(TEXT_SHADE_PAD).toBeLessThanOrEqual(96);
    });
});

const GOLD = '#b89261';
const WHITE = '#ffffff';

describe('contraste sobre imagem branca (pior caso: foto clara do card; topo do gradiente, 0,15)', () => {
    it('título dourado: texto grande, WCAG 3:1', () => {
        expect(contrastOverWhite(GOLD, TITLE_SHADE_OPACITY)).toBeGreaterThanOrEqual(3);
    });

    it('chip "Current DEDA" (na sombra do título) e citação, brancos: 4.5:1', () => {
        expect(contrastOverWhite(WHITE, TITLE_SHADE_OPACITY)).toBeGreaterThanOrEqual(4.5);
        expect(contrastOverWhite(WHITE, QUOTE_SHADE_OPACITY)).toBeGreaterThanOrEqual(4.5);
    });

    it('as opacidades são as mínimas (0,05 a menos já falha)', () => {
        expect(contrastOverWhite(GOLD, TITLE_SHADE_OPACITY - 0.05)).toBeLessThan(3);
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
        expect(pickHeaderImage([{ url: 'https://example.com/x.jpg' }, null, card])).toBe(2);
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

describe('arte da home: o topo do assunto fica visível (object-position vertical)', () => {
    // Faixa da altura da imagem (em %) que aparece num cabeçalho w×h com `object-fit: cover` (a largura
    // manda) e object-position vertical `y`%. `image` = [top, bottom] da parte da arte original que foi
    // servida (desktop: inteira; celular: recorte central 3,33:1 de uma 3:1 → 5–95%).
    const band = (w: number, h: number, ratio: number, y: number, image: [number, number] = [0, 100]) => {
        const visible = (h / w) * ratio; // fração da altura servida
        const top = (1 - visible) * (y / 100);
        const span = image[1] - image[0];
        return [image[0] + span * top, image[0] + span * (top + visible)];
    };
    const y = Number(HOME_ART_OBJECT_POSITION.split(' ')[1].replace('%', ''));
    const TOWER_TOPS = 38.3; // topo das torres na arte do London (% da altura); base da ponte em ~60%

    it.each([
        ['1280 px', 1080, 146],
        ['1920 px', 1720, 146],
        ['2560 px (menu aberto)', 2360, 146],
        ['2560 px (menu recolhido)', 2480, 146],
    ])('%s: topo das torres dentro da faixa visível', (_label, w, h) => {
        const [top, bottom] = band(w, h, 3, y);
        expect(top).toBeLessThan(TOWER_TOPS);
        expect(bottom).toBeGreaterThan(54); // torres e passarela superior inteiras
    });

    it('celular (390×58, recorte 800×240): ponte inteira', () => {
        const [top, bottom] = band(390, 58, 800 / 240, y, [5, 95]);
        expect(top).toBeLessThan(TOWER_TOPS);
        expect(bottom).toBeGreaterThan(60);
    });

    it('centrado (50%) cortaria o topo das torres em 2560 px', () => {
        expect(band(2360, 146, 3, 50)[0]).toBeGreaterThan(TOWER_TOPS);
    });
});

describe('consulta que nunca responde: prazo de espera do cabeçalho', () => {
    const card = { url: `${asset}-card`, width: 1170 };
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('antes do prazo espera; aos 3 s a candidata pendente vale como null e entra a próxima imagem', () => {
        let timedOut = false;
        startHeaderImageWait(() => {
            timedOut = true;
        });
        const pick = () => pickHeaderImage(settleHeaderImages([undefined, undefined, card], timedOut));

        jest.advanceTimersByTime(HEADER_IMAGE_WAIT_MS - 1);
        expect(pick()).toBe(-1);
        jest.advanceTimersByTime(1);
        expect(timedOut).toBe(true);
        expect(pick()).toBe(2);
    });

    it('cancelado no unmount, o prazo não dispara', () => {
        const onTimeout = jest.fn();
        const cancel = startHeaderImageWait(onTimeout);
        cancel();
        jest.advanceTimersByTime(HEADER_IMAGE_WAIT_MS * 2);
        expect(onTimeout).not.toHaveBeenCalled();
    });

    it('depois do prazo, uma candidata já carregada continua valendo', () => {
        const home = { url: `${asset}-home`, width: 2171 };
        expect(pickHeaderImage(settleHeaderImages([home, undefined, card], true))).toBe(0);
    });
});
