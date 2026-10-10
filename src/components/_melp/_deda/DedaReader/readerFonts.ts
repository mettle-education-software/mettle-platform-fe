import localFont from 'next/font/local';

// Fontes do repositório (src/fonts; ver themes/font.ts): mesmos arquivos, pesos e display de antes.

/** Interface da página nova: uma família só, leve (300–500; 600 em raros destaques). Manrope. */
export const uiFont = localFont({
    src: [
        { path: '../../../../fonts/manrope-latin.woff2', weight: '300', style: 'normal' },
        { path: '../../../../fonts/manrope-latin.woff2', weight: '400', style: 'normal' },
        { path: '../../../../fonts/manrope-latin.woff2', weight: '500', style: 'normal' },
        { path: '../../../../fonts/manrope-latin.woff2', weight: '600', style: 'normal' },
    ],
    display: 'swap',
});

/** Leitura (texto dos passos, Introduction, Glossary): tem itálico de verdade, que a Introduction usa em parágrafos inteiros. Figtree. */
export const readFont = localFont({
    src: [
        { path: '../../../../fonts/figtree-latin.woff2', weight: '400', style: 'normal' },
        { path: '../../../../fonts/figtree-latin.woff2', weight: '500', style: 'normal' },
        { path: '../../../../fonts/figtree-latin.woff2', weight: '600', style: 'normal' },
        { path: '../../../../fonts/figtree-latin-italic.woff2', weight: '400', style: 'italic' },
        { path: '../../../../fonts/figtree-latin-italic.woff2', weight: '500', style: 'italic' },
        { path: '../../../../fonts/figtree-latin-italic.woff2', weight: '600', style: 'italic' },
    ],
    display: 'swap',
});
