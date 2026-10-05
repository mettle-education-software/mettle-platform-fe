'use client';

import { Global } from '@emotion/react';
import { ConfigProvider } from 'antd';
import { readFont, uiFont } from 'components/_melp/_deda/DedaReader/readerFonts';
import React from 'react';
import { newAntdTheme, UI_FONT_VAR } from 'themes/newDesign';
import { Page, popupStyles } from './ui';

/**
 * Envelope das páginas novas: fonte da interface (Manrope), fonte de leitura (Figtree, para citações) e o tema
 * antd escuro para os formulários e modais da página. Os tokens de cor vêm da casca (NewAppLayout).
 */
export const NewPage: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <ConfigProvider theme={newAntdTheme} modal={{ className: `ui-new-modal ${uiFont.className}` }}>
        <Global styles={popupStyles} />
        <Page
            className={`ui-new-page ${uiFont.className}${className ? ` ${className}` : ''}`}
            style={{ ...UI_FONT_VAR, '--r-read-font': readFont.style.fontFamily } as React.CSSProperties}
        >
            {children}
        </Page>
    </ConfigProvider>
);
