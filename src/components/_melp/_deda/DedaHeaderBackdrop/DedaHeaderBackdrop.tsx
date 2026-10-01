'use client';

import styled from '@emotion/styled';
import { SMALL_VIEWPORT } from 'libs/constants';
import { headerSources, MOBILE_MAX_WIDTH, pickHeaderImage, shadeGradient } from 'libs/dedaHeader';
import React, { useState } from 'react';

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

// Por cima da imagem: o gradiente vertical da página é a camada de CIMA e termina exatamente no
// #2b2b2b do fundo abaixo (a imagem se dilui na página, sem linha). O escurecimento opcional fica
// por baixo dele e só a partir do tablet.
const Shade = styled.div`
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: var(--deda-header-gradient);

    // Escurecimento lateral só onde o cabeçalho tem texto (acima de 860 px).
    @media (min-width: ${SMALL_VIEWPORT + 1}px) {
        background: var(--deda-header-gradient), var(--deda-header-shade, linear-gradient(transparent, transparent));
    }
`;

/**
 * Fundo do cabeçalho do DEDA: <picture> com direção de arte (recorte no celular, larguras no desktop)
 * e o gradiente da página por cima. O pai precisa de `position` (relative/sticky) e o conteúdo,
 * de `position: relative` para ficar acima.
 */
type HeaderImage = { url: string; width?: number | null };

export const DedaHeaderBackdrop = ({
    images,
    gradient,
    shade,
}: {
    /** Candidatas em ordem de preferência (dedaHeaderImage, dedaFeaturedImage). */
    images: (HeaderImage | null | undefined)[];
    gradient: string;
    shade?: [number, number][];
}) => {
    // Primeira candidata válida; se a imagem falhar ao carregar, passa para a próxima válida.
    const [failed, setFailed] = useState<string[]>([]);
    const candidates = images.map((image) => (image && !failed.includes(image.url) ? image : null));
    const index = pickHeaderImage(candidates);
    const image = index >= 0 ? candidates[index] : null;
    const sources = image ? headerSources(image.url, image.width) : null;
    return (
        <>
            {sources && (
                <Layer aria-hidden data-deda-backdrop>
                    <picture key={image?.url}>
                        <source media={`(max-width: ${MOBILE_MAX_WIDTH}px)`} srcSet={sources.mobile} sizes="100vw" />
                        {/* sem media: a ordem do <picture> já deixa o celular na fonte de cima */}
                        <source srcSet={sources.desktop} sizes={DESKTOP_SIZES} />
                        {/* eslint-disable-next-line @next/next/no-img-element -- <picture> com direção de arte */}
                        <img
                            src={sources.fallback}
                            alt=""
                            decoding="async"
                            fetchPriority="high"
                            onError={() => image && setFailed((list) => [...list, image.url])}
                        />
                    </picture>
                </Layer>
            )}
            <Shade
                aria-hidden
                data-deda-backdrop
                style={
                    {
                        '--deda-header-gradient': gradient,
                        ...(shade ? { '--deda-header-shade': shadeGradient(shade) } : {}),
                    } as React.CSSProperties
                }
            />
        </>
    );
};
