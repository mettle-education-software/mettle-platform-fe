'use client';

import styled from '@emotion/styled';
import { SMALL_VIEWPORT } from 'libs/constants';
import { headerSources, MOBILE_MAX_WIDTH } from 'libs/dedaHeader';
import React from 'react';

// Acima de 860 px há o menu lateral (200 px): o cabeçalho é mais estreito que a tela.
const DESKTOP_SIZES = `(max-width: ${SMALL_VIEWPORT}px) 100vw, calc(100vw - 200px)`;

const Layer = styled.div`
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;

    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center;
    }
`;

// Celular: sombra extra de 60% para o branco sobre qualquer imagem ficar ≥ 4.5:1.
const Shade = styled.div`
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: var(--deda-header-gradient);

    @media (max-width: ${MOBILE_MAX_WIDTH}px) {
        background: linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), var(--deda-header-gradient);
    }
`;

/**
 * Fundo do cabeçalho do DEDA: <picture> com direção de arte (recorte no celular, larguras no desktop)
 * e o gradiente da página por cima. O pai precisa de `position` (relative/sticky) e o conteúdo,
 * de `position: relative` para ficar acima.
 */
export const DedaHeaderBackdrop = ({ imageUrl, gradient }: { imageUrl?: string | null; gradient: string }) => {
    const sources = headerSources(imageUrl);
    return (
        <>
            {sources && (
                <Layer aria-hidden data-deda-backdrop>
                    <picture>
                        <source media={`(max-width: ${MOBILE_MAX_WIDTH}px)`} srcSet={sources.mobile} sizes="100vw" />
                        <source
                            media={`(min-width: ${MOBILE_MAX_WIDTH + 1}px)`}
                            srcSet={sources.desktop}
                            sizes={DESKTOP_SIZES}
                        />
                        {/* eslint-disable-next-line @next/next/no-img-element -- <picture> com direção de arte */}
                        <img src={sources.fallback} alt="" decoding="async" fetchPriority="high" />
                    </picture>
                </Layer>
            )}
            <Shade
                aria-hidden
                data-deda-backdrop
                style={{ '--deda-header-gradient': gradient } as React.CSSProperties}
            />
        </>
    );
};
