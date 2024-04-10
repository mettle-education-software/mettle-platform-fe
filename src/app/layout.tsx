'use client';

import { Spin, ConfigProvider, ThemeConfig } from 'antd';
import { AppProvider, NotificationsProvider, useAppContext } from 'providers';
import React from 'react';
import { darkTheme, lightTheme } from 'themes';
import '../styles/globals.css';

const App = ({ children }: { children: React.ReactNode }) => {
    const { theme, isAppLoading } = useAppContext();

    const themeConfig: ThemeConfig | undefined = theme === 'light' ? lightTheme : darkTheme;

    return (
        <ConfigProvider theme={themeConfig}>
            <body>
                <main data-theme={theme}>
                    <Spin spinning={isAppLoading}>{children}</Spin>
                </main>
            </body>
        </ConfigProvider>
    );
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="pt" suppressHydrationWarning={true}>
            <head>
                <title>Mettle Backoffice Admin</title>
                <meta name="viewport" content="initial-scale=1.0, width=device-width" />
                <link rel="icon" href="/favicon.ico" />
                <meta name="description" content="Mettle Backoffice Admin" />
                <meta property="og:title" content="Mettle" />
                <meta property="og:image" content="/mettle.png" />
                <link rel="apple-touch-icon" href="/mettle.png" />
            </head>
            <AppProvider>
                <NotificationsProvider>
                    <App>{children}</App>
                </NotificationsProvider>
            </AppProvider>
        </html>
    );
}
