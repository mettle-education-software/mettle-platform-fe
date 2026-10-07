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

/** Chat de suporte (Chatwoot): segue o tema escolhido só na plataforma nova; para os demais é sempre claro, como antes. */
export const chatwootScheme = (newDesign: boolean, resolved: ResolvedTheme): ResolvedTheme =>
    newDesign ? resolved : 'light';

/**
 * Marca do aparelho: a última conta logada aqui usa a plataforma nova. A casca nova só monta depois do login
 * (~1 s no recarregar); até lá o <html> ficava sem fundo (branco). Com a marca, o script do <head> põe a classe
 * NEW_DESIGN_BOOT_CLASS e o fundo do tema entra na primeira pintura (styles/globals.css). Sem a marca, nada muda.
 */
export const NEW_DESIGN_HINT_KEY = 'mettleNewDesign';
export const NEW_DESIGN_BOOT_CLASS = 'nd-boot';

export const rememberNewDesign = (on: boolean) => {
    try {
        if (on) window.localStorage.setItem(NEW_DESIGN_HINT_KEY, '1');
        else window.localStorage.removeItem(NEW_DESIGN_HINT_KEY);
        document.documentElement.classList.toggle(NEW_DESIGN_BOOT_CLASS, on);
    } catch {
        // armazenamento bloqueado: só perde o fundo antecipado
    }
};

/** Script inline do <head>: mesma regra de resolveTheme, antes da primeira pintura (sem piscar). */
export const THEME_BOOT_SCRIPT = `(function(){var h=document.documentElement;try{var p=localStorage.getItem('${THEME_KEY}');var d=p==='dark'||(p!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);h.setAttribute('data-theme',d?'dark':'light');if(localStorage.getItem('${NEW_DESIGN_HINT_KEY}')==='1')h.classList.add('${NEW_DESIGN_BOOT_CLASS}')}catch(e){h.setAttribute('data-theme','dark')}})();`;
