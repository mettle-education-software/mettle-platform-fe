import localFont from 'next/font/local';

// Fontes do repositório (src/fonts): o build não baixa nada do Google (a busca do next/font/google falhou builds em
// 10-Out-2026). Os arquivos são os mesmos que a produção servia (Google Fonts, subconjunto latin, fonte variável; OFL).
// ponytail: só o latin (o português inteiro); letra de outro alfabeto cai na fonte reserva. Pôr o latin-ext se precisar.
export const font = localFont({
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
});
