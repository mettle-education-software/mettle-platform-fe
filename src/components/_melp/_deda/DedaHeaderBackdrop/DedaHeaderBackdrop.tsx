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
    textShadeRect,
    textShadeStyle,
} from 'libs/dedaHeader';
import React, { RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react';

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

// Camada de cima: o gradiente vertical da página, que termina exatamente no #2b2b2b do fundo abaixo
// (a imagem se dilui na página, sem linha). Os esfumados do texto ficam por baixo dele.
const Shade = styled.div`
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: var(--deda-header-gradient);
`;

const TextShades = styled.div`
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
`;

type Rect = { left: number; top: number; width: number; height: number };
export type TextShade = { target: RefObject<HTMLElement | null>; opacity: number };

/** Mede os textos (relativo ao cabeçalho) e acompanha mudanças de tamanho, fonte e conteúdo. */
const useTextShadeRects = (shades: TextShade[] | undefined, anchor: RefObject<HTMLElement | null>) => {
    const [rects, setRects] = useState<(Rect | null)[]>([]);
    const shadesRef = useRef(shades);
    shadesRef.current = shades;

    const measure = () => {
        const header = anchor.current?.parentElement;
        if (!header) return;
        const box = header.getBoundingClientRect();
        const next = (shadesRef.current ?? []).map(({ target }) => {
            const el = target.current;
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return textShadeRect({ left: r.left - box.left, top: r.top - box.top, width: r.width, height: r.height });
        });
        setRects((previous) => (JSON.stringify(previous) === JSON.stringify(next) ? previous : next));
    };

    // A cada render (o texto pode aparecer/mudar, ex. troca de layout desktop/celular).
    useLayoutEffect(measure);

    useEffect(() => {
        const header = anchor.current?.parentElement;
        if (!header || typeof ResizeObserver === 'undefined') return;
        const observer = new ResizeObserver(() => measure());
        observer.observe(header);
        (shadesRef.current ?? []).forEach(({ target }) => target.current && observer.observe(target.current));
        return () => observer.disconnect();
    });

    return rects;
};

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
    textShades,
}: {
    /** Candidatas em ordem de preferência; `null` = não existe, `undefined` = ainda carregando. */
    images: (HeaderImage | null | undefined)[];
    /** recortes do celular (padrão: os da página do DEDA; a home passa os dela, mais baixos) */
    mobileCrops?: MobileCrops;
    gradient: string;
    /** esfumados presos aos textos (título/chip, citação); só existem onde o texto está montado */
    textShades?: TextShade[];
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
    const anchorRef = useRef<HTMLDivElement>(null);
    const rects = useTextShadeRects(textShades, anchorRef);
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
            <TextShades aria-hidden data-deda-backdrop>
                {rects.map(
                    (rect, i) =>
                        rect &&
                        textShades?.[i] && (
                            <div
                                key={i}
                                style={{
                                    position: 'absolute',
                                    ...rect,
                                    ...textShadeStyle(textShades[i].opacity),
                                }}
                            />
                        ),
                )}
            </TextShades>
            <Shade
                ref={anchorRef}
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
