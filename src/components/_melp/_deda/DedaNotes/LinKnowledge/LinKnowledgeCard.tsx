'use client';

import styled from '@emotion/styled';
import { Typography } from 'antd';
import React, { useEffect, useRef } from 'react';

// Card do dia: dourado da marca (--secondary) com texto #2b2b2b (o fundo do LinKnowledge), contraste 4,94:1.
const TODAY_TEXT = '#2b2b2b';

const Card = styled.button<{ today?: boolean }>`
    all: unset;
    display: flex;
    flex-direction: column;
    width: 16rem;
    flex-shrink: 0;
    border-radius: 6px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.05);
    color: #ffffff;
    cursor: pointer;

    &:hover,
    &:focus-visible {
        background: rgba(255, 255, 255, 0.1);
    }

    &:focus-visible {
        outline: 2px solid var(--secondary);
    }
`;

const CardImage = styled.div`
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    display: flex;
    align-items: center;
    justify-content: center;

    img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
`;

const CardText = styled.div<{ today?: boolean }>`
    padding: 0.75rem 1rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    flex: 1;
    ${({ today }) => today && `background: var(--secondary);`}
`;

const MetaRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
`;

const TodayPill = styled.span`
    flex-shrink: 0;
    padding: 1px 8px;
    border-radius: 999px;
    background: ${TODAY_TEXT};
    color: var(--secondary);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    line-height: 16px;
`;

// Título sempre com a altura de 3 linhas: todos os cards (artigos e vídeos) ficam com a mesma altura.
const CardTitle = styled.span<{ today?: boolean }>`
    color: ${({ today }) => (today ? TODAY_TEXT : '#ffffff')};
    font-size: 16px;
    font-weight: 600;
    line-height: 1.4;
    min-height: calc(3 * 1.4em);
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
`;

/** Linha do carrossel com os cards (mesma largura e espaçamento para artigos e vídeos). */
export const LinKnowledgeCardsRow = styled.div`
    display: flex;
    gap: 1rem;
    padding-bottom: 1rem;
`;

/** Card do carrossel do LinKnowledge (artigos do Mettle Editor e vídeos): imagem 16:9, meta e título. */
export const LinKnowledgeCard = ({
    meta,
    title,
    image,
    overlay,
    today = false,
    onClick,
}: {
    meta: string;
    title: string;
    image?: React.ReactNode;
    overlay?: React.ReactNode;
    /** Card do dia do aluno: texto escuro sobre dourado, etiqueta "TODAY" e rolagem até ele ao abrir. */
    today?: boolean;
    onClick(): void;
}) => {
    const ref = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const card = ref.current;
        const scroller = card?.closest<HTMLElement>('[data-carousel]');
        if (!card || !scroller || !today) return;
        const cardBox = card.getBoundingClientRect();
        const scrollerBox = scroller.getBoundingClientRect();
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        scroller.scrollTo({
            left: scroller.scrollLeft + cardBox.left - scrollerBox.left - (scrollerBox.width - cardBox.width) / 2,
            behavior: reduce ? 'auto' : 'smooth',
        });
    }, [today]);

    return (
        <Card
            ref={ref}
            type="button"
            aria-label={`${meta}: ${title}${today ? ' (today)' : ''}`}
            aria-current={today ? 'date' : undefined}
            onClick={onClick}
        >
            {image && (
                <CardImage>
                    {image}
                    {overlay}
                </CardImage>
            )}
            <CardText today={today}>
                <MetaRow>
                    <Typography.Text style={{ color: today ? TODAY_TEXT : 'var(--secondary)', fontSize: 12 }}>
                        {meta}
                    </Typography.Text>
                    {today && <TodayPill aria-hidden>TODAY</TodayPill>}
                </MetaRow>
                <CardTitle today={today}>{title}</CardTitle>
            </CardText>
        </Card>
    );
};
