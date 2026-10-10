'use client';

import { contentfulImage } from 'libs/dedaHeader';
import { Check, Lock } from 'lucide-react';
import React from 'react';
import { ICON } from 'themes/newDesign';

export type DedaCardState = 'current' | 'done' | 'locked' | 'open';

interface Props {
    title?: string;
    imgUrl?: string;
    week?: string;
    categories?: string[] | null;
    state?: DedaCardState;
    onClick?: () => void;
    /** Intenção de abrir (mouse em cima, foco, toque): adianta a rota. */
    onIntent?: () => void;
    isLoading?: boolean;
    /** Leitura: o card fica trancado (cadeado) e o clique leva à renovação */
    renew?: string;
}

/**
 * Card leve de DEDA: imagem 4:3, semana, título, estado claro (atual = anel dourado e "Current"; feito = ✓;
 * bloqueado = imagem apagada e cadeado, sem clique; Leitura = cadeado e o clique leva à renovação). Mesmas regras de
 * clique do DedaCard atual.
 */
export const NewDedaCard: React.FC<Props> = ({
    title,
    imgUrl,
    week,
    categories,
    state = 'open',
    onClick,
    onIntent,
    isLoading,
    renew,
}) => {
    if (isLoading)
        return (
            <div className="dc skel" aria-hidden>
                <span className="img" />
                <b />
            </div>
        );
    const locked = state === 'locked' || !!renew;
    const src = contentfulImage(imgUrl, { w: 560, h: 420, fit: 'fill', fm: 'webp', q: 70 }) ?? imgUrl;
    const inner = (
        <>
            <span className="img">
                {/* eslint-disable-next-line @next/next/no-img-element -- imagem do Contentful */}
                {src && <img src={src} alt="" loading="lazy" />}
                {locked && <Lock {...ICON} size={28} strokeWidth={1.25} className="lock" aria-hidden />}
            </span>
            <span className="meta">
                {week && <small>{week}</small>}
                {!renew && state === 'current' && <em>Current</em>}
                {!renew && state === 'done' && <Check {...ICON} size={14} aria-hidden />}
            </span>
            <b>{title}</b>
            {!!categories?.length && <span className="cats">{categories.join(' · ')}</span>}
        </>
    );
    // Leitura: vê o catálogo trancado; o clique é a renovação (nunca uma página em branco)
    if (renew)
        return (
            <a
                className="dc locked"
                href={renew}
                aria-label={`Renew to open ${title ?? 'DEDA'}${week ? `, ${week}` : ''}`}
            >
                {inner}
            </a>
        );
    return (
        <button
            type="button"
            className={`dc ${state}`}
            disabled={locked}
            onClick={() => !locked && onClick?.()}
            onPointerEnter={() => !locked && onIntent?.()}
            onFocus={() => !locked && onIntent?.()}
            aria-label={`${title ?? 'DEDA'}${week ? `, ${week}` : ''}${locked ? ', locked' : state === 'current' ? ', current' : ''}`}
        >
            {inner}
        </button>
    );
};
