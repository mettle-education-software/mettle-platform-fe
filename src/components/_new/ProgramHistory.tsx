'use client';

import type { ProgramEvent } from 'interfaces/melp';
import { programHistory } from 'libs/programHistory';
import React from 'react';

/**
 * Histórico do programa: título e lista (início, pausas de–até, resets, LAMP retomada), sem texto explicativo.
 * Mesmo componente no perfil do aluno (Configurações → IMERSO) e em /admin/historico. Sem linhas, não aparece.
 */
export const ProgramHistory: React.FC<{
    events?: ProgramEvent[] | null;
    remainingResets?: number | null;
    /** false onde a página já tem esse título (/admin/historico) */
    heading?: boolean;
}> = ({ events, remainingResets, heading = true }) => {
    const rows = programHistory(events, remainingResets);
    if (!rows.length) return null;
    return (
        <section className="history" aria-label={heading ? undefined : 'Histórico do programa'}>
            {heading && <h3>Histórico do programa</h3>}
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
