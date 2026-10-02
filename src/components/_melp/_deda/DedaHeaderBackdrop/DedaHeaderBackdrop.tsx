'use client';

import styled from '@emotion/styled';
import { SMALL_VIEWPORT } from 'libs/constants';
import {
    headerSources,
    MOBILE_MAX_WIDTH,
    MobileCrops,
    pickHeaderImage,
    settleHeaderImages,
    startHeaderImageWait,
} from 'libs/dedaHeader';
import React, { useEffect, useState } from 'react';

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

// Overlay sobre a imagem inteira: termina exatamente no #2b2b2b do fundo abaixo (a imagem se dilui na
// página, sem linha).
const Shade = styled.div`
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: var(--deda-header-gradient);
`;

/**
 * Fundo do cabeçalho do DEDA: <picture> com direção de arte (recorte no celular, larguras no desktop)
 * e o gradiente da página por cima. O pai precisa de `position` (relative/sticky) e o conteúdo,
 * de `position: relative` para ficar acima.
 */
type HeaderImage = {
    url: string;
    width?: number | null;
    /** só para esta imagem (padrão: center) */ objectPosition?: string;
};

export const DedaHeaderBackdrop = ({
    images,
    mobileCrops,
    gradient,
}: {
    /** Candidatas em ordem de preferência; `null` = não existe, `undefined` = ainda carregando. */
    images: (HeaderImage | null | undefined)[];
    /** recortes do celular (padrão: os da página do DEDA; a home passa os dela, mais baixos) */
    mobileCrops?: MobileCrops;
    gradient: string;
}) => {
    // Primeira candidata válida; se a imagem falhar ao carregar, passa para a próxima válida.
    const [failed, setFailed] = useState<string[]>([]);
    // Mantém `undefined` (ainda carregando): o seletor espera por ela antes de usar uma de menor preferência.
    // Prazo de espera pelas consultas, contado do mount; depois dele vale a próxima imagem disponível.
    const [timedOut, setTimedOut] = useState(false);
    useEffect(() => startHeaderImageWait(() => setTimedOut(true)), []);
    const candidates = settleHeaderImages(
        images.map((image) => (image && failed.includes(image.url) ? null : image)),
        timedOut,
    );
    const index = pickHeaderImage(candidates);
    const image = index >= 0 ? candidates[index] : null;
    const sources = image ? headerSources(image.url, image.width, mobileCrops) : null;
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
                            style={image?.objectPosition ? { objectPosition: image.objectPosition } : undefined}
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
                    } as React.CSSProperties
                }
            />
        </>
    );
};
