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

export const lightTheme: ThemeConfig = {
    token: {
        colorPrimary: '#b89261',
        colorInfo: '#b89261',
        colorSuccess: '#63ba39',
        fontSize: 16,
        borderRadius: 1,
        boxShadow: '0 2px 8px 0 #00000026;',
        boxShadowSecondary: '0 2px 8px 0 #00000026;',
        wireframe: false,
        colorBgBase: '#ffffff',
        colorPrimaryActive: '#3c362f',
        fontFamily: roboto.style.fontFamily,
    },
    components: {
        Menu: {
            colorBgContainer: 'var(--C2)',
            padding: 0,
            paddingContentHorizontal: 0,
            paddingContentVertical: 0,
        },
    },
};
