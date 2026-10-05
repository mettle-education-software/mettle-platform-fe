'use client';

import { Global, keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import { Logo } from 'components/atoms/Logo/Logo';
import React from 'react';
import { platformTokens, UI_FONT_CLASS, UI_FONT_VAR, ui } from 'themes/newDesign';

const breathe = keyframes`
    0%, 100% { opacity: 0.35; }
    50% { opacity: 0.9; }
`;

const Box = styled.div`
    ${ui};
    display: grid;
    place-items: center;
    align-content: center;
    gap: 10px;
    min-height: 100vh;
    min-height: 100dvh;
    padding: 24px;
    text-align: center;
    background: var(--r-bg);

    .mark {
        width: 44px;
        margin-bottom: 14px;
    }
    .mark svg {
        display: block;
        width: 100%;
        height: auto;
    }
    .mark.breathe {
        animation: ${breathe} 1.8s ease-in-out infinite;
    }
    h1 {
        font-size: 24px;
    }
    p {
        max-width: 36em;
        font-size: 14.5px;
        line-height: 1.5;
        color: var(--r-muted);
    }
    p.detail {
        font-size: 12.5px;
        color: var(--r-faint);
        overflow-wrap: anywhere;
    }
    .btn {
        margin-top: 14px;
    }
`;

/** Carregando (plataforma nova): só o símbolo, respirando. */
export const NewLoading: React.FC = () => (
    <Box className={UI_FONT_CLASS} style={UI_FONT_VAR} role="status" aria-label="Carregando">
        <Global styles={platformTokens} />
        <span className="mark breathe" aria-hidden>
            <Logo theme="light" mark />
        </span>
    </Box>
);

/** Erro / não encontrado (plataforma nova): curto — símbolo, título, uma linha, uma ação. */
export const NewStatus: React.FC<{
    title: string;
    text: string;
    detail?: string;
    action: React.ReactNode;
}> = ({ title, text, detail, action }) => (
    <Box className={UI_FONT_CLASS} style={UI_FONT_VAR}>
        <Global styles={platformTokens} />
        <span className="mark" aria-hidden>
            <Logo theme="light" mark />
        </span>
        <h1>{title}</h1>
        <p>{text}</p>
        {detail && <p className="detail">{detail}</p>}
        {action}
    </Box>
);

export default NewStatus;
