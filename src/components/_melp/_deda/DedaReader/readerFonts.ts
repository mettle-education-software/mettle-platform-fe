import { Figtree, Manrope } from 'next/font/google';

/** Interface da página nova: uma família só, leve (300–500; 600 em raros destaques). */
export const uiFont = Manrope({ subsets: ['latin'], weight: ['300', '400', '500', '600'] });

/** Leitura (texto dos passos, Introduction, Glossary): tem itálico de verdade, que a Introduction usa em parágrafos inteiros. */
export const readFont = Figtree({ subsets: ['latin'], weight: ['400', '500', '600'], style: ['normal', 'italic'] });
