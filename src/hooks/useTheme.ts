'use client';

import { applyTheme, readThemePref, ResolvedTheme, saveThemePref, ThemePref } from 'libs/theme';
import { useCallback, useEffect, useState } from 'react';
import { newAntdTheme, newAntdThemeLight } from 'themes/newDesign';

const EVENT = 'mettle-theme';

const currentResolved = (): ResolvedTheme =>
    typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'light'
        ? 'light'
        : 'dark';

/**
 * Tema da plataforma nova: preferência do aparelho (Claro / Escuro / Automático) e o tema em vigor. Todas as
 * instâncias (seletor do menu, Configurações, gráficos) andam juntas; "Automático" acompanha o sistema ao vivo.
 */
export const useTheme = () => {
    const [pref, setPrefState] = useState<ThemePref>(() => (typeof window === 'undefined' ? 'auto' : readThemePref()));
    const [resolved, setResolved] = useState<ResolvedTheme>(currentResolved);

    useEffect(() => {
        const sync = (event?: Event) => {
            const next = (event as CustomEvent<ThemePref> | undefined)?.detail ?? readThemePref();
            setPrefState(next);
            setResolved(applyTheme(next));
        };
        sync();
        const media = window.matchMedia?.('(prefers-color-scheme: dark)');
        const onSystem = () => sync();
        media?.addEventListener?.('change', onSystem);
        window.addEventListener(EVENT, sync);
        window.addEventListener('storage', onSystem);
        return () => {
            media?.removeEventListener?.('change', onSystem);
            window.removeEventListener(EVENT, sync);
            window.removeEventListener('storage', onSystem);
        };
    }, []);

    const setPref = useCallback((next: ThemePref) => {
        saveThemePref(next);
        window.dispatchEvent(new CustomEvent<ThemePref>(EVENT, { detail: next }));
    }, []);

    return { pref, setPref, resolved };
};

/** Tema antd das páginas novas no tema em vigor (claro ou escuro). */
export const useNewAntdTheme = () => (useTheme().resolved === 'light' ? newAntdThemeLight : newAntdTheme);

/** Logo da Plataforma no tema em vigor: a versão clara sobre o escuro, a escura sobre o claro. */
export const useLogoTheme = (): 'light' | 'dark' => (useTheme().resolved === 'light' ? 'dark' : 'light');
