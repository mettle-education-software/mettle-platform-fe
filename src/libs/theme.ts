// Tema da plataforma nova (claro / escuro / automático): regras puras, testadas em libs/__tests__/theme.test.ts.
// A preferência é por aparelho (localStorage) e entra antes da primeira pintura pelo script de THEME_BOOT_SCRIPT,
// que põe data-theme="light|dark" no <html>. Só as variáveis --r-* (plataforma nova) leem esse atributo: a
// plataforma atual não muda nenhum pixel.

export type ThemePref = 'auto' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_KEY = 'mettleTheme';
export const THEME_PREFS: readonly ThemePref[] = ['light', 'dark', 'auto'];

/** Qualquer valor fora da lista (ou nada) vale "auto": segue o sistema. */
export const parseThemePref = (value: unknown): ThemePref => (value === 'light' || value === 'dark' ? value : 'auto');

export const resolveTheme = (pref: ThemePref, systemDark: boolean): ResolvedTheme =>
    pref === 'auto' ? (systemDark ? 'dark' : 'light') : pref;

export const readThemePref = (): ThemePref => {
    try {
        return parseThemePref(window.localStorage.getItem(THEME_KEY));
    } catch {
        return 'auto';
    }
};

export const saveThemePref = (pref: ThemePref) => {
    try {
        if (pref === 'auto') window.localStorage.removeItem(THEME_KEY);
        else window.localStorage.setItem(THEME_KEY, pref);
    } catch {
        // modo privado / armazenamento bloqueado: vale só nesta visita
    }
};

export const systemPrefersDark = () => {
    try {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
        return true;
    }
};

/** Põe o tema resolvido no <html> (o mesmo que o script do <head> faz antes da primeira pintura). */
export const applyTheme = (pref: ThemePref) => {
    const resolved = resolveTheme(pref, systemPrefersDark());
    document.documentElement.setAttribute('data-theme', resolved);
    return resolved;
};

/** Script inline do <head>: mesma regra de resolveTheme, antes da primeira pintura (sem piscar). */
export const THEME_BOOT_SCRIPT = `(function(){try{var p=localStorage.getItem('${THEME_KEY}');var d=p==='dark'||(p!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.setAttribute('data-theme',d?'dark':'light')}catch(e){document.documentElement.setAttribute('data-theme','dark')}})();`;
