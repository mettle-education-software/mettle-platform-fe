import localFont from 'next/font/local';
import { fontStack } from './fontStack';

// Fontes do repositório (src/fonts): o build não baixa nada do Google (a busca do next/font/google falhou builds em
// 10-Out-2026). São os mesmos arquivos que a produção servia (Google Fonts, fontes variáveis; licença OFL em
// src/fonts/OFL.txt), com os mesmos pesos, estilos e display. Ficam o latin e o latin-ext; letra de outro alfabeto
// (cirílico, grego, vietnamita) cai na reserva.

const jost = localFont({
    src: [
        { path: '../fonts/jost-latin.woff2', weight: '100', style: 'normal' },
        { path: '../fonts/jost-latin.woff2', weight: '200', style: 'normal' },
        { path: '../fonts/jost-latin.woff2', weight: '300', style: 'normal' },
        { path: '../fonts/jost-latin.woff2', weight: '400', style: 'normal' },
        { path: '../fonts/jost-latin.woff2', weight: '500', style: 'normal' },
        { path: '../fonts/jost-latin.woff2', weight: '600', style: 'normal' },
        { path: '../fonts/jost-latin.woff2', weight: '700', style: 'normal' },
        { path: '../fonts/jost-latin.woff2', weight: '800', style: 'normal' },
        { path: '../fonts/jost-latin.woff2', weight: '900', style: 'normal' },
    ],
    display: 'swap',
    adjustFontFallback: false,
    variable: '--font-jost',
    declarations: [
        {
            prop: 'unicode-range',
            value: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
        },
    ],
});

const jostExt = localFont({
    src: [
        { path: '../fonts/jost-latin-ext.woff2', weight: '100', style: 'normal' },
        { path: '../fonts/jost-latin-ext.woff2', weight: '200', style: 'normal' },
        { path: '../fonts/jost-latin-ext.woff2', weight: '300', style: 'normal' },
        { path: '../fonts/jost-latin-ext.woff2', weight: '400', style: 'normal' },
        { path: '../fonts/jost-latin-ext.woff2', weight: '500', style: 'normal' },
        { path: '../fonts/jost-latin-ext.woff2', weight: '600', style: 'normal' },
        { path: '../fonts/jost-latin-ext.woff2', weight: '700', style: 'normal' },
        { path: '../fonts/jost-latin-ext.woff2', weight: '800', style: 'normal' },
        { path: '../fonts/jost-latin-ext.woff2', weight: '900', style: 'normal' },
    ],
    display: 'swap',
    preload: false,
    adjustFontFallback: false,
    variable: '--font-jost-ext',
    declarations: [
        {
            prop: 'unicode-range',
            value: 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF',
        },
    ],
});

export const font = fontStack(jost, jostExt, 'font-jost', 'Jost Fallback');
