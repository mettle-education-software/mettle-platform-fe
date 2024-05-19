import { ThemeConfig } from 'antd';

export const darkTheme: ThemeConfig = {
    token: {
        colorSuccess: '#63ba39',
        fontSize: 16,
        boxShadow: '0 2px 8px 0 #00000026;',
        boxShadowSecondary: '0 2px 8px 0 #00000026;',
        wireframe: false,
        // colorBgBase: '#3c362f',
        colorPrimary: '#B89261',
        // colorInfo: '#f2d5b1',
        fontFamily: '"europa", sans-serif',
    },
    components: {
        Collapse: {
            contentPadding: 0,
        },
        Progress: {
            circleTextColor: '#FFFFFF',
        },
        Typography: {
            algorithm: true,
            titleMarginBottom: 0,
            titleMarginTop: 0,
            colorPrimary: '#FFFFFF',
            colorTextSecondary: 'var(--secondary)',
            // fontSize: 'calc(20px + 1vw)' as unknown as number,
        },
        Input: {
            borderRadius: 8,
        },
        DatePicker: {
            borderRadius: 8,
        },
        Button: {
            algorithm: true,
            borderRadius: 8,
            colorPrimaryBg: '#B89261',
            paddingContentHorizontal: 36,
        },
        Tabs: {
            cardBg: 'transparent',
            inkBarColor: 'var(--secondary)',
            itemActiveColor: 'var(--secondary)',
            itemColor: 'white',
        },
        Steps: {
            colorBorderBg: '#FFF',
            colorText: '#FFF',
        },
    },
};
