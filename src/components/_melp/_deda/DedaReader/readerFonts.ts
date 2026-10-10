import localFont from 'next/font/local';
import { fontStack } from 'themes/fontStack';

// Fontes do repositório: ver themes/font.ts.

const manrope = localFont({
    src: [
        { path: '../../../../fonts/manrope-latin.woff2', weight: '300', style: 'normal' },
        { path: '../../../../fonts/manrope-latin.woff2', weight: '400', style: 'normal' },
        { path: '../../../../fonts/manrope-latin.woff2', weight: '500', style: 'normal' },
        { path: '../../../../fonts/manrope-latin.woff2', weight: '600', style: 'normal' },
    ],
    display: 'swap',
    adjustFontFallback: false,
    variable: '--font-manrope',
    declarations: [
        {
            prop: 'unicode-range',
            value: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
        },
    ],
});

const manropeExt = localFont({
    src: [
        { path: '../../../../fonts/manrope-latin-ext.woff2', weight: '300', style: 'normal' },
        { path: '../../../../fonts/manrope-latin-ext.woff2', weight: '400', style: 'normal' },
        { path: '../../../../fonts/manrope-latin-ext.woff2', weight: '500', style: 'normal' },
        { path: '../../../../fonts/manrope-latin-ext.woff2', weight: '600', style: 'normal' },
    ],
    display: 'swap',
    preload: false,
    adjustFontFallback: false,
    variable: '--font-manrope-ext',
    declarations: [
        {
            prop: 'unicode-range',
            value: 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF',
        },
    ],
});

const figtree = localFont({
    src: [
        { path: '../../../../fonts/figtree-latin.woff2', weight: '400', style: 'normal' },
        { path: '../../../../fonts/figtree-latin.woff2', weight: '500', style: 'normal' },
        { path: '../../../../fonts/figtree-latin.woff2', weight: '600', style: 'normal' },
        { path: '../../../../fonts/figtree-latin-italic.woff2', weight: '400', style: 'italic' },
        { path: '../../../../fonts/figtree-latin-italic.woff2', weight: '500', style: 'italic' },
        { path: '../../../../fonts/figtree-latin-italic.woff2', weight: '600', style: 'italic' },
    ],
    display: 'swap',
    adjustFontFallback: false,
    variable: '--font-figtree',
    declarations: [
        {
            prop: 'unicode-range',
            value: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
        },
    ],
});

const figtreeExt = localFont({
    src: [
        { path: '../../../../fonts/figtree-latin-ext.woff2', weight: '400', style: 'normal' },
        { path: '../../../../fonts/figtree-latin-ext.woff2', weight: '500', style: 'normal' },
        { path: '../../../../fonts/figtree-latin-ext.woff2', weight: '600', style: 'normal' },
        { path: '../../../../fonts/figtree-latin-ext-italic.woff2', weight: '400', style: 'italic' },
        { path: '../../../../fonts/figtree-latin-ext-italic.woff2', weight: '500', style: 'italic' },
        { path: '../../../../fonts/figtree-latin-ext-italic.woff2', weight: '600', style: 'italic' },
    ],
    display: 'swap',
    preload: false,
    adjustFontFallback: false,
    variable: '--font-figtree-ext',
    declarations: [
        {
            prop: 'unicode-range',
            value: 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF',
        },
    ],
});

/** Interface da página nova: uma família só, leve (300–500; 600 em raros destaques). Manrope. */
export const uiFont = fontStack(manrope, manropeExt, 'font-manrope', 'Manrope Fallback');

/** Leitura (texto dos passos, Introduction, Glossary): tem itálico de verdade, que a Introduction usa em parágrafos inteiros. Figtree. */
export const readFont = fontStack(figtree, figtreeExt, 'font-figtree', 'Figtree Fallback');
