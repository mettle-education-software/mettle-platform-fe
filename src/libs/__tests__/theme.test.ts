import { readFileSync } from 'fs';
import { join } from 'path';
import { DARK, LIGHT, LK_LIGHT } from '../../themes/palette';
import { isShellRoute, lessonIdFromPath } from '../newDesign';
import {
    chatwootScheme,
    parseThemePref,
    readThemePref,
    resolveTheme,
    saveThemePref,
    NEW_DESIGN_BOOT_CLASS,
    NEW_DESIGN_HINT_KEY,
    THEME_BOOT_SCRIPT,
    THEME_KEY,
} from '../theme';

// localStorage mínimo (os testes rodam com --testEnvironment node)
const store = new Map<string, string>();
const storage = {
    getItem: (k: string) => (store.has(k) ? (store.get(k) as string) : null),
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
};
(globalThis as unknown as { window: unknown }).window = { localStorage: storage };

describe('tema: preferência e resolução', () => {
    beforeEach(() => store.clear());

    it('Automático segue o sistema; Claro/Escuro valem sempre', () => {
        expect(resolveTheme('auto', true)).toBe('dark');
        expect(resolveTheme('auto', false)).toBe('light');
        expect(resolveTheme('light', true)).toBe('light');
        expect(resolveTheme('dark', false)).toBe('dark');
    });

    it('valor desconhecido ou ausente vale Automático (o padrão)', () => {
        expect(parseThemePref(null)).toBe('auto');
        expect(parseThemePref('sepia')).toBe('auto');
        expect(readThemePref()).toBe('auto');
    });

    it('grava e lê a preferência do aparelho; Automático apaga a chave', () => {
        saveThemePref('light');
        expect(store.get(THEME_KEY)).toBe('light');
        expect(readThemePref()).toBe('light');
        saveThemePref('auto');
        expect(store.has(THEME_KEY)).toBe(false);
        expect(readThemePref()).toBe('auto');
    });

    it('armazenamento bloqueado não quebra: Automático', () => {
        const w = (globalThis as unknown as { window: { localStorage: unknown } }).window;
        const saved = w.localStorage;
        w.localStorage = {
            getItem: () => {
                throw new Error('blocked');
            },
            setItem: () => {
                throw new Error('blocked');
            },
            removeItem: () => {
                throw new Error('blocked');
            },
        };
        expect(readThemePref()).toBe('auto');
        expect(() => saveThemePref('dark')).not.toThrow();
        w.localStorage = saved;
    });

    it('o script do <head> usa a mesma chave e a mesma regra', () => {
        expect(THEME_BOOT_SCRIPT).toContain(`localStorage.getItem('${THEME_KEY}')`);
        expect(THEME_BOOT_SCRIPT).toContain('prefers-color-scheme: dark');
    });

    it('o script do <head> põe a classe de fundo só nos aparelhos marcados pela plataforma nova', () => {
        const run = (hint: string | null) => {
            const classes = new Set<string>();
            const html = { setAttribute: () => undefined, classList: { add: (c: string) => classes.add(c) } };
            const ls = { getItem: (k: string) => (k === NEW_DESIGN_HINT_KEY ? hint : 'dark') };
            const mm = () => ({ matches: true });
            new Function('document', 'localStorage', 'window', THEME_BOOT_SCRIPT)({ documentElement: html }, ls, {
                matchMedia: mm,
            });
            return classes.has(NEW_DESIGN_BOOT_CLASS);
        };
        expect(run('1')).toBe(true);
        expect(run(null)).toBe(false);
    });

    it('o fundo antecipado (styles/globals.css) é o mesmo --r-bg da paleta', () => {
        const css = readFileSync(join(__dirname, '../../styles/globals.css'), 'utf8');
        expect(css).toContain(`html.${NEW_DESIGN_BOOT_CLASS} body {\n    background: ${DARK['--r-bg']};`);
        expect(css).toContain(
            `html.${NEW_DESIGN_BOOT_CLASS}[data-theme='light'] body {\n    background: ${LIGHT['--r-bg']};`,
        );
    });
});

// ---------- contraste (WCAG 2.x) ----------

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
const lum = (hex: string) => {
    const [r, g, b] = rgb(hex).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
    const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
    return (x + 0.05) / (y + 0.05);
};

/** Combinações de texto principais: [texto, fundo, mínimo AA]. */
const PAIRS: [keyof typeof DARK, keyof typeof DARK, number][] = [
    ['--r-text', '--r-bg', 4.5],
    ['--r-text', '--r-bg2', 4.5],
    ['--r-text', '--r-surf', 4.5],
    ['--r-text', '--r-sheet', 4.5],
    ['--r-text', '--r-sheet-head', 4.5],
    ['--r-muted', '--r-bg', 4.5],
    ['--r-muted', '--r-bg2', 4.5],
    ['--r-muted', '--r-sheet', 4.5],
    ['--r-faint', '--r-bg', 4.5], // texto auxiliar também passa em AA (auditoria de contraste de 6-Out-2026)
    ['--r-gold-hi', '--r-bg', 4.5],
    ['--r-gold-hi', '--r-bg2', 4.5],
    ['--r-gold-hi', '--r-surf', 4.5],
    ['--r-gold-hi', '--r-sheet', 4.5],
    ['--r-faint', '--r-bg2', 4.5],
    ['--r-faint', '--r-surf', 4.5],
    ['--r-on-gold', '--r-gold', 4.5],
    ['--r-error', '--r-bg', 4.5],
    ['--r-tip-text', '--r-tip-bg', 4.5],
];

describe.each([
    ['claro', LIGHT],
    ['escuro', DARK],
])('contraste AA no tema %s', (_name, palette) => {
    it.each(PAIRS)('%s sobre %s', (fg, bg, min) => {
        const ratio = contrast(palette[fg], palette[bg]);
        // eslint-disable-next-line no-console
        if (process.env.SHOW_CONTRAST) console.log(_name, fg, bg, ratio.toFixed(2));
        expect(ratio).toBeGreaterThanOrEqual(min);
    });
});

describe('chat de suporte', () => {
    it('segue o tema só na plataforma nova; nas demais contas é sempre claro', () => {
        expect(chatwootScheme(true, 'dark')).toBe('dark');
        expect(chatwootScheme(true, 'light')).toBe('light');
        expect(chatwootScheme(false, 'dark')).toBe('light');
    });
});

describe('LinKnowledge no tema claro (AA)', () => {
    it.each([
        ['título do painel', LK_LIGHT.text, LK_LIGHT.panel],
        ['título do card', LK_LIGHT.text, LK_LIGHT.card],
        ['título do card (hover)', LK_LIGHT.text, LK_LIGHT.cardHover],
        ['setas do carrossel', LK_LIGHT.arrow, LK_LIGHT.panel],
        ['"Day N · gênero"', LIGHT['--r-gold-hi'], LK_LIGHT.card],
        ['"Day N · gênero" (hover)', LIGHT['--r-gold-hi'], LK_LIGHT.cardHover],
        ['card do dia: título e meta', LK_LIGHT.todayText, LK_LIGHT.today],
    ])('%s', (_label, fg, bg) => {
        expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
    });
    it('a superfície é um tom acima do fundo da página e não é branca', () => {
        expect(LK_LIGHT.bg).not.toBe('#ffffff');
        expect(lum(LK_LIGHT.bg)).toBeLessThan(lum(LIGHT['--r-bg']));
        expect(lum(LK_LIGHT.card)).toBeGreaterThan(lum(LK_LIGHT.bg));
    });
});

describe('read-along: marca-texto amarelo com a palavra escura (AA)', () => {
    // fundo translúcido: compõe sobre o fundo da página antes de medir
    const over = (rgba: string, bg: string) => {
        const m = /rgba\((\d+), (\d+), (\d+), ([\d.]+)\)/.exec(rgba);
        if (!m) return rgba;
        const a = Number(m[4]);
        const b = rgb(bg).map((c) => c * 255);
        return `#${[1, 2, 3]
            .map((i, k) =>
                Math.round(Number(m[i]) * a + b[k] * (1 - a))
                    .toString(16)
                    .padStart(2, '0'),
            )
            .join('')}`;
    };
    it.each([
        ['escuro', DARK],
        ['claro', LIGHT],
    ])('tema %s', (_name, palette) => {
        const ratio = contrast(palette['--r-readalong-text'], over(palette['--r-readalong'], palette['--r-bg']));
        // eslint-disable-next-line no-console
        if (process.env.SHOW_CONTRAST) console.log('read-along', _name, ratio.toFixed(2));
        expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
});

describe('fluidez: casca persistente e troca de aula no lugar', () => {
    it('rotas da casca (as que usam AppLayout)', () => {
        ['/', '/imerso', '/imerso/deda/london', '/imerso/hpec/welcome', '/course/x/y', '/settings', '/guia'].forEach(
            (p) => expect(isShellRoute(p)).toBe(true),
        );
        ['/login', '/start', '/recuperar-senha', '/imersos', '/activate', null].forEach((p) =>
            expect(isShellRoute(p)).toBe(false),
        );
    });
    it('aula a partir do endereço', () => {
        expect(lessonIdFromPath('/imerso/hpec/flip-apps', 'welcome')).toBe('flip-apps');
        expect(lessonIdFromPath('/course/masterclass/aula-2', 'x')).toBe('aula-2');
        expect(lessonIdFromPath(null, 'welcome')).toBe('welcome');
    });
});
