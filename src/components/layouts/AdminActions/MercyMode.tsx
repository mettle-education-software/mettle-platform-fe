'use client';

import { useResetRecordingAttempts } from 'hooks/melp/dedaRecording';
import React, { useEffect, useState } from 'react';

/** Só o dono vê o botão (decisão de André, 7-Out-2026). Não é segredo: o servidor exige METTLE_ADMIN. */
export const MERCY_MODE_UIDS: readonly string[] = ['RBgG61nNKdgHUKCkxhR4vhaBLGU2'];

/**
 * Mercy Mode: o aluno gastou as 3 tentativas do dia e chamou o suporte; o administrador libera novas tentativas hoje.
 * Confirmação na própria linha (nada de caixa sobre o painel).
 */
export const MercyMode: React.FC<{ studentUid?: string; studentLabel?: string }> = ({ studentUid, studentLabel }) => {
    const reset = useResetRecordingAttempts();
    const [confirming, setConfirming] = useState(false);

    // Outro aluno escolhido: começa do zero (sem confirmação nem resultado do anterior).
    useEffect(() => {
        setConfirming(false);
        reset.reset();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [studentUid]);

    if (!studentUid) return null;

    return (
        <>
            <div className="sh">
                <h2 id="admin-mercy">Gravações</h2>
            </div>
            {confirming ? (
                <div className="ctl" role="group" aria-labelledby="admin-mercy">
                    <p style={{ flex: '1 1 200px', minWidth: 0, margin: 0 }}>
                        Liberar novas tentativas de gravação hoje{studentLabel ? ` para ${studentLabel}` : ''}?
                    </p>
                    <button
                        type="button"
                        className="btn ghost"
                        disabled={reset.isPending}
                        onClick={() => setConfirming(false)}
                        autoFocus
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        className="btn gold"
                        disabled={reset.isPending}
                        onClick={() => reset.mutate(studentUid, { onSettled: () => setConfirming(false) })}
                    >
                        {reset.isPending ? 'Liberando…' : 'Liberar'}
                    </button>
                </div>
            ) : (
                <div className="ctl">
                    <button
                        type="button"
                        className="btn line"
                        onClick={() => setConfirming(true)}
                        aria-describedby="admin-mercy-status"
                    >
                        Liberar novas tentativas de gravação hoje
                    </button>
                    <span className="hint" id="admin-mercy-status" role="status">
                        {reset.isSuccess
                            ? `Liberado: ${reset.data.attempts.left} tentativas hoje (usadas antes: ${reset.data.reset.usedBefore}).`
                            : reset.isError
                              ? 'Não foi possível liberar agora. Tente de novo.'
                              : ''}
                    </span>
                </div>
            )}
        </>
    );
};
