'use client';

import styled from '@emotion/styled';
import { useTheme } from 'hooks/useTheme';
import { THEME_PREFS, ThemePref } from 'libs/theme';
import { LucideIcon, Monitor, Moon, Sun } from 'lucide-react';
import React from 'react';

const LABELS: Record<ThemePref, string> = { light: 'Claro', dark: 'Escuro', auto: 'Automático' };
const ICONS: Record<ThemePref, LucideIcon> = {
    light: Sun,
    dark: Moon,
    auto: Monitor,
};

const Seg = styled.div`
    display: inline-flex;
    gap: 2px;
    padding: 2px;
    border: 1px solid var(--r-line);
    border-radius: 999px;

    button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        min-width: 30px;
        min-height: 30px;
        padding: 0 6px;
        border: 0;
        border-radius: 999px;
        background: none;
        color: var(--r-muted);
        font: inherit;
        font-size: 13px;
        cursor: pointer;
        transition:
            background-color var(--r-ease),
            color var(--r-ease);
    }
    button:hover {
        color: var(--r-text);
    }
    button[aria-checked='true'] {
        background: var(--r-hover);
        color: var(--r-gold-hi);
    }
    &.labels button {
        padding: 0 12px;
        min-height: 36px;
    }
`;

/**
 * Tema da plataforma nova: Claro / Escuro / Automático (segue o sistema). Preferência deste aparelho.
 * `labels`: com os nomes (Configurações); sem: só os ícones, discreto (menu).
 */
export const ThemeSwitch: React.FC<{ labels?: boolean; className?: string }> = ({ labels, className }) => {
    const { pref, setPref } = useTheme();
    return (
        <Seg role="radiogroup" aria-label="Tema" className={`${labels ? 'labels' : ''} ${className ?? ''}`}>
            {THEME_PREFS.map((value) => {
                const Icon = ICONS[value];
                return (
                    <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={pref === value}
                        aria-label={labels ? undefined : LABELS[value]}
                        title={LABELS[value]}
                        onClick={() => setPref(value)}
                    >
                        <Icon size={16} strokeWidth={1.5} aria-hidden />
                        {labels && LABELS[value]}
                    </button>
                );
            })}
        </Seg>
    );
};

/** Menu recolhido (trilho): um botão só, que passa para o próximo tema (o nome do tema atual no título). */
export const ThemeCycle: React.FC = () => {
    const { pref, setPref } = useTheme();
    const next = THEME_PREFS[(THEME_PREFS.indexOf(pref) + 1) % THEME_PREFS.length];
    const Icon = ICONS[pref];
    return (
        <button
            type="button"
            className="it"
            title={`Tema: ${LABELS[pref]}`}
            aria-label={`Tema: ${LABELS[pref]}. Mudar para ${LABELS[next]}`}
            onClick={() => setPref(next)}
        >
            <Icon size={20} strokeWidth={1.5} aria-hidden />
        </button>
    );
};
