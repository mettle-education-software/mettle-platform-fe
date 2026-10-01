'use client';

import styled from '@emotion/styled';
import { Typography } from 'antd';
import React from 'react';

const Card = styled.button`
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

const CardText = styled.div`
    padding: 0.75rem 1rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
`;

// Título sempre com a altura de 3 linhas: todos os cards (artigos e vídeos) ficam com a mesma altura.
const CardTitle = styled.span`
    color: #ffffff;
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
    onClick,
}: {
    meta: string;
    title: string;
    image?: React.ReactNode;
    overlay?: React.ReactNode;
    onClick(): void;
}) => (
    <Card type="button" aria-label={`${meta}: ${title}`} onClick={onClick}>
        {image && (
            <CardImage>
                {image}
                {overlay}
            </CardImage>
        )}
        <CardText>
            <Typography.Text style={{ color: 'var(--secondary)', fontSize: 12 }}>{meta}</Typography.Text>
            <CardTitle>{title}</CardTitle>
        </CardText>
    </Card>
);
