'use client';

import React from 'react';

/**
 * Cabeçalho das páginas com abas (LAMP, Configurações): título à esquerda e, a partir de 1024 px, as abas na MESMA linha,
 * à direita e centradas no bloco do título (sobe o conteúdo ~90 px). Abaixo disso, as abas ficam sob o título, na largura
 * toda. Título longo nunca encosta nas abas: quebra a linha. A ordem do DOM (título, abas, conteúdo) é a do foco.
 * `tabs` é o próprio controle segmentado (`<div className="seg" role="tablist">`).
 */
export const PageHead: React.FC<{
    eyebrow?: string;
    title: string;
    subtitle?: React.ReactNode;
    tabs?: React.ReactNode;
}> = ({ eyebrow, title, subtitle, tabs }) => (
    <header className="ph phead">
        <div className="phead-id">
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            <h1>{title}</h1>
            {subtitle && <p className="ctx">{subtitle}</p>}
        </div>
        {tabs}
    </header>
);
