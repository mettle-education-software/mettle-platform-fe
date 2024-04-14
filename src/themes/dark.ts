import { ThemeConfig } from 'antd';

export const darkTheme: ThemeConfig = {
    token: {
        colorSuccess: '#63ba39',
        fontSize: 16,
        boxShadow: '0 2px 8px 0 #00000026;',
        boxShadowSecondary: '0 2px 8px 0 #00000026;',
        wireframe: false,
        // colorBgBase: '#3c362f',
        // colorPrimary: '#f2d5b1',
        // colorInfo: '#f2d5b1',
        fontFamily: '"europa", sans-serif',
    },
    components: {
        Typography: {
            algorithm: true,
            titleMarginBottom: 0,
        },
        Input: {
            borderRadius: 16,
        },
        Button: {
            algorithm: true,
            borderRadius: 6,
            colorPrimaryBg: '#B89261',
        },
    },
};
