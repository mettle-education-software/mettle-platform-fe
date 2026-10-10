'use client';

import { css, Global } from '@emotion/react';
import { auth } from 'config/firebase';
import { useRestoreAccount, useTrash } from 'hooks/useAdmin';
import { brInstantDay, isTrashOwner, serverProblem, studentPath, trashName } from 'libs/adminAccess';
import Link from 'next/link';
import React from 'react';

const styles = css`
    .lx ol.rows {
        margin: 0;
        padding: 0;
        list-style: none;
    }
    .lx .row {
        grid-template-columns: minmax(0, 1fr) auto;
    }
    .lx .row a {
        color: var(--r-text);
        text-decoration: none;
    }
    .lx .row a:hover b {
        color: var(--r-gold-hi);
    }
    .lx .row .field {
        display: flex;
        align-items: center;
        gap: 16px;
        font-size: 13px;
        color: var(--r-muted);
        font-variant-numeric: tabular-nums;
    }
    .lx .msg.err {
        color: var(--r-error);
    }
    @media (max-width: 700px) {
        .lx .row {
            grid-template-columns: minmax(0, 1fr);
        }
        .lx .row .field {
            justify-content: space-between;
        }
    }
`;

/** Filtro Lixeira do Contas (só o dono): contas excluídas, a exclusão definitiva mais próxima primeiro, e a restauração. */
export const TrashList: React.FC = () => {
    const trash = useTrash(isTrashOwner(auth.currentUser?.uid));
    const restore = useRestoreAccount();

    return (
        <div className="lx">
            <Global styles={styles} />
            {trash.isLoading ? (
                <p className="hint" role="status">
                    Carregando…
                </p>
            ) : trash.isError ? (
                <p className="hint" role="status">
                    Lixeira indisponível no momento.{' '}
                    <button type="button" className="btn line" onClick={() => trash.refetch()}>
                        Tentar de novo
                    </button>
                </p>
            ) : !trash.data?.length ? (
                <p className="hint">Lixeira vazia.</p>
            ) : (
                <ol className="rows">
                    {trash.data.map((entry) => {
                        const busy = restore.isPending && restore.variables === entry.userUid;
                        return (
                            <li className="row" key={entry.userUid}>
                                <span className="lab">
                                    <Link href={studentPath(entry.userUid)}>
                                        <b>{trashName(entry)}</b>
                                        {entry.email && <span>{entry.email}</span>}
                                    </Link>
                                </span>
                                <span className="field">
                                    <span>Exclusão definitiva em {brInstantDay(entry.purgeAfter)}</span>
                                    <button
                                        type="button"
                                        className="btn line"
                                        disabled={restore.isPending}
                                        onClick={() => restore.mutate(entry.userUid)}
                                    >
                                        {busy ? 'Restaurando…' : 'Restaurar'}
                                    </button>
                                </span>
                            </li>
                        );
                    })}
                </ol>
            )}
            {restore.isError && (
                <p className="msg err" role="alert">
                    {serverProblem(restore.error)}
                </p>
            )}
        </div>
    );
};

export default TrashList;
