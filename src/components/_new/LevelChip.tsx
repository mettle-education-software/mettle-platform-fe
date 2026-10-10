'use client';

import styled from '@emotion/styled';
import React from 'react';
import { DedaDifficulties, type DedaDifficulty } from '../../interfaces/melp';

/** Estados do programa antes do início (o nível só existe para quem começou). */
const NOT_STARTED = ['MELP_BEGIN', 'CAN_START_DEDA', 'DEDA_STARTED_NOT_BEGUN', 'WEEK_ZERO'];

/** Nome do nível do programa (Flow, Boost, Turbo) para quem já começou; antes do início ou sem nível, null. */
export const programLevelName = (
    s?: { melp_status?: string | null; deda_difficulty?: DedaDifficulty | null } | null,
) => {
    if (!s?.melp_status || NOT_STARTED.includes(s.melp_status) || !s.deda_difficulty) return null;
    return DedaDifficulties[s.deda_difficulty] ?? null;
};

const Chip = styled.span`
    display: inline-flex;
    align-items: center;
    flex: none;
    min-height: 20px;
    padding: 0 8px;
    border: 1px solid var(--r-line-strong, var(--r-line));
    border-radius: 999px;
    font-size: 11.5px;
    font-weight: 500;
    letter-spacing: 0.02em;
    line-height: 1;
    color: var(--r-muted);
    white-space: nowrap;
    vertical-align: middle;
    text-transform: none;
`;

/**
 * Nível do programa: o mesmo selo calmo em todo lugar (Configurações, LAMP, menu, Contas). Os nomes são em inglês, como
 * no programa (Flow, Boost, Turbo); sem nome, nada.
 */
export const LevelChip: React.FC<{ name?: string | null; className?: string }> = ({ name, className }) =>
    name ? (
        <Chip className={['lvl', className].filter(Boolean).join(' ')} title="Program level">
            {name}
        </Chip>
    ) : null;
