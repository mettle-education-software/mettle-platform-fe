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
    isLoading?: boolean;
}

/**
 * Card leve de DEDA: imagem 4:3, semana, título, estado claro (atual = anel dourado e "Current"; feito = ✓;
 * bloqueado = imagem apagada e cadeado, sem clique). Mesmas regras de clique do DedaCard atual.
 */
export const NewDedaCard: React.FC<Props> = ({
    title,
    imgUrl,
    week,
    categories,
    state = 'open',
    onClick,
    isLoading,
}) => {
    if (isLoading)
        return (
            <div className="dc skel" aria-hidden>
                <span className="img" />
                <b />
            </div>
        );
    const locked = state === 'locked';
    const src = contentfulImage(imgUrl, { w: 560, h: 420, fit: 'fill', fm: 'webp', q: 70 }) ?? imgUrl;
    return (
        <button
            type="button"
            className={`dc ${state}`}
            disabled={locked}
            onClick={() => !locked && onClick?.()}
            aria-label={`${title ?? 'DEDA'}${week ? `, ${week}` : ''}${locked ? ', locked' : state === 'current' ? ', current' : ''}`}
        >
            <span className="img">
                {/* eslint-disable-next-line @next/next/no-img-element -- imagem do Contentful */}
                {src && <img src={src} alt="" loading="lazy" />}
                {locked && <Lock {...ICON} size={28} strokeWidth={1.25} className="lock" aria-hidden />}
            </span>
            <span className="meta">
                {week && <small>{week}</small>}
                {state === 'current' && <em>Current</em>}
                {state === 'done' && <Check {...ICON} size={14} aria-hidden />}
            </span>
            <b>{title}</b>
            {!!categories?.length && <span className="cats">{categories.join(' · ')}</span>}
        </button>
    );
};
