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
            <Typography.Text strong style={{ color: '#FFFFFF', fontSize: 16 }}>
                {title}
            </Typography.Text>
        </CardText>
    </Card>
);
