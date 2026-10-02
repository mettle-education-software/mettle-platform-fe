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
    settleHeaderImages,
    shadeAt,
    startHeaderImageWait,
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
    it('overlay desde o topo (constante, 0,45), mais forte para baixo, termina exatamente no #2b2b2b do fundo', () => {
        expect(HOME_HEADER_TOP_OPACITY).toBe(0.45);
        expect(HEADER_GRADIENT).toBe(
            'linear-gradient(180deg, rgba(43, 43, 43, 0.45) 0%, rgba(43, 43, 43, 0.6) 40%, rgba(43, 43, 43, 0.85) 80%, #2b2b2b 100%)',
        );
    });
});

const WHITE = '#ffffff';

describe('overlay sobre a imagem inteira, sempre (padrão do Pedro; sem sombra localizada atrás do texto)', () => {
    it('cobre a imagem toda desde o topo e só aumenta para baixo', () => {
        expect(HOME_HEADER_TOP_OPACITY).toBeGreaterThanOrEqual(0.4);
        for (let y = 1; y <= 100; y += 1)
            expect(shadeAt(HEADER_VERTICAL, y)).toBeGreaterThanOrEqual(shadeAt(HEADER_VERTICAL, y - 1));
    });

    it('abas inativas (branco) na faixa das abas, y 74–100% da altura', () => {
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
