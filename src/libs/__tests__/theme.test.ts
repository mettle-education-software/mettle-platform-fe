import { DARK, LIGHT } from '../../themes/palette';
import { isShellRoute, lessonIdFromPath } from '../newDesign';
import { parseThemePref, readThemePref, resolveTheme, saveThemePref, THEME_BOOT_SCRIPT, THEME_KEY } from '../theme';

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
    ['--r-faint', '--r-bg', 3], // só detalhes grandes/secundários (texto auxiliar)
    ['--r-gold-hi', '--r-bg', 4.5],
    ['--r-gold-hi', '--r-bg2', 4.5],
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
