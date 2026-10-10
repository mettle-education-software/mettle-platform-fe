'use client';

import type { ProgramEvent } from 'interfaces/melp';
import { programHistory } from 'libs/programHistory';
import React from 'react';

/**
 * Histórico do programa no perfil do aluno (Configurações → IMERSO): título e lista (início, pausas de–até, resets,
 * LAMP retomada, pausas/resets a mais, reset de fábrica), sem texto explicativo. Sem linhas, não aparece.
 */
export const ProgramHistory: React.FC<{
    events?: ProgramEvent[] | null;
    remainingResets?: number | null;
}> = ({ events, remainingResets }) => {
    const rows = programHistory(events, remainingResets);
    if (!rows.length) return null;
    return (
        <section className="history">
            <h3>Histórico do programa</h3>
            <ol className="rows">
                {rows.map((r) => (
                    <li className="row" key={r.key}>
                        <span className="lab">
                            <b>{r.label}</b>
                        </span>
                        <span className="field">{r.when}</span>
                    </li>
                ))}
            </ol>
        </section>
    );
};

export default ProgramHistory;
