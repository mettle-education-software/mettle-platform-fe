'use client';

import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider, Spin, ThemeConfig } from 'antd';
import { PWABanner } from 'components';
import Script from 'next/script';
import { AppProvider, NotificationsProvider, useAppContext } from 'providers';
import { MelpProvider } from 'providers/MelpProvider';
import React from 'react';
import { darkTheme, lightTheme } from 'themes';
import '../styles/globals.css';

const App = ({ children }: { children: React.ReactNode }) => {
    const { theme, isAppLoading } = useAppContext();

    const themeConfig: ThemeConfig | undefined = theme === 'light' ? lightTheme : darkTheme;

    return (
        <ConfigProvider theme={themeConfig}>
            <body>
                <Script id="clarity-script" strategy="afterInteractive">
                    {`
            (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "${process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID}");
          `}
                </Script>
                <AntdRegistry>
                    <main data-theme={theme}>
                        <Spin spinning={isAppLoading}>
                            <PWABanner>{children}</PWABanner>
                        </Spin>
                    </main>
                </AntdRegistry>
            </body>
        </ConfigProvider>
    );
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="pt" suppressHydrationWarning={true}>
            <head>
                <title>Plataforma Mettle</title>
                <link rel="manifest" href="/manifest.json" />
                <meta name="theme-color" content="#3b3630" />
                <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
                <link rel="icon" href="/favicon.ico" />
                <meta name="description" content="Mettle Backoffice Admin" />
                <meta property="og:title" content="Mettle" />
                <meta property="og:image" content="/mettle.png" />
                <link rel="apple-touch-icon" href="/mettle.png" />
                <script async src="https://w.soundcloud.com/player/api.js" type="text/javascript" />
                <script
                    async
                    src="https://cdn.jsdelivr.net/npm/@tsparticles/confetti@3.0.3/tsparticles.confetti.bundle.min.js"
                />
            </head>
            <AppProvider>
                <MelpProvider>
                    <NotificationsProvider>
                        <App>{children}</App>
                    </NotificationsProvider>
                </MelpProvider>
            </AppProvider>
        </html>
    );
}
