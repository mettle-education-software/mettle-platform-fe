import { ThemeConfig } from 'antd';
import { Roboto, Lato } from 'next/font/google';

const roboto = Roboto({
    subsets: ['latin'],
    display: 'swap',
    weight: ['100', '300', '400', '500', '700', '900'],
});

const lato = Lato({
    subsets: ['latin'],
    display: 'swap',
    weight: ['100', '300', '400', '700', '900'],
});

export const darkTheme: ThemeConfig = {
    token: {
        colorSuccess: '#63ba39',
        fontSize: 16,
        borderRadius: 1,
        boxShadow: '0 2px 8px 0 #00000026;',
        boxShadowSecondary: '0 2px 8px 0 #00000026;',
        wireframe: false,
        colorBgBase: '#3c362f',
        colorPrimary: '#f2d5b1',
        colorInfo: '#f2d5b1',
        fontFamily: roboto.style.fontFamily,
    },
};
