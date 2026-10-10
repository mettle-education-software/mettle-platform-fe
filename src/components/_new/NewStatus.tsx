'use client';

import { Global, keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import { Logo } from 'components/atoms/Logo/Logo';
import { useLogoTheme } from 'hooks/useTheme';
import React from 'react';
import { platformTokens, UI_FONT_CLASS, UI_FONT_VAR, ui } from 'themes/newDesign';

/** Símbolo da Mettle no tema em vigor. */
const Mark: React.FC = () => <Logo theme={useLogoTheme()} mark />;

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
    /* mais de uma ação: lado a lado (quebram para baixo no celular) */
    .row {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 10px;
        margin-top: 14px;
    }
    .row .btn {
        margin-top: 0;
    }
`;

/** Carregando (plataforma nova): só o símbolo, respirando. */
export const NewLoading: React.FC = () => (
    <Box className={UI_FONT_CLASS} style={UI_FONT_VAR} role="status" aria-label="Carregando">
        <Global styles={platformTokens} />
        <span className="mark breathe" aria-hidden>
            <Mark />
        </span>
    </Box>
);

const appear = keyframes`
    from { opacity: 0; }
    to { opacity: 1; }
`;

/** Carregando dentro da casca: só a área de conteúdo; invisível nos primeiros 300 ms (carregamento rápido não pisca). */
const ContentBox = styled.div`
    display: grid;
    place-items: center;
    min-height: 60vh;
    animation: ${appear} 200ms ease 300ms both;

    .mark {
        width: 36px;
        animation: ${breathe} 1.8s ease-in-out 300ms infinite;
    }
    .mark svg {
        display: block;
        width: 100%;
        height: auto;
    }
    @media (prefers-reduced-motion: reduce) {
        &,
        .mark {
            animation: none;
            opacity: 0.6;
        }
    }
`;

export const NewContentLoading: React.FC = () => (
    <ContentBox role="status" aria-label="Carregando">
        <span className="mark" aria-hidden>
            <Mark />
        </span>
    </ContentBox>
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
            <Mark />
        </span>
        <h1>{title}</h1>
        <p>{text}</p>
        {detail && <p className="detail">{detail}</p>}
        {action}
    </Box>
);

export default NewStatus;
