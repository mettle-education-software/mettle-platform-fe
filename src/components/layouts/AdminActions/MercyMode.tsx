'use client';

import { Button, Flex } from 'antd';
import { useResetRecordingAttempts } from 'hooks/melp/dedaRecording';
import React, { useEffect, useState } from 'react';

/** Só o dono vê o botão (decisão de André, 7-Out-2026). Não é segredo: o servidor exige METTLE_ADMIN. */
export const MERCY_MODE_UIDS: readonly string[] = ['RBgG61nNKdgHUKCkxhR4vhaBLGU2'];

/**
 * Mercy Mode: o aluno gastou as 3 tentativas do dia e chamou o suporte; o administrador devolve as de hoje.
 * Confirmação na própria linha (nada de caixa sobre o modal).
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
            <p className="eyebrow" id="admin-mercy" style={{ marginTop: 20 }}>
                Mercy Mode
            </p>
            {confirming ? (
                <Flex gap={8} align="center" wrap role="group" aria-labelledby="admin-mercy">
                    <p style={{ flex: '1 1 200px', minWidth: 0, margin: 0 }}>
                        Devolver as tentativas de gravação de hoje
                        {studentLabel ? ` a ${studentLabel}` : ''}?
                    </p>
                    <Button onClick={() => setConfirming(false)} autoFocus>
                        Cancelar
                    </Button>
                    <Button
                        type="primary"
                        loading={reset.isPending}
                        onClick={() => reset.mutate(studentUid, { onSettled: () => setConfirming(false) })}
                    >
                        Devolver
                    </Button>
                </Flex>
            ) : (
                <Flex gap={8} align="center" wrap>
                    <Button onClick={() => setConfirming(true)} aria-describedby="admin-mercy-status">
                        Mercy Mode · reset today’s recording attempts
                    </Button>
                    <span className="hint" id="admin-mercy-status" role="status">
                        {reset.isSuccess
                            ? `Feito: ${reset.data.attempts.left} tentativas de novo hoje (usadas antes: ${reset.data.reset.usedBefore}).`
                            : reset.isError
                              ? 'Não foi possível devolver agora. Tente de novo.'
                              : ''}
                    </span>
                </Flex>
            )}
        </>
    );
};
