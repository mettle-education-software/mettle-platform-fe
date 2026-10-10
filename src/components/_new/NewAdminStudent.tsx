'use client';

import { css, Global } from '@emotion/react';
import { Select } from 'antd';
import { auth } from 'config/firebase';
import {
    useAdminHistory,
    useSaveStudentAccess,
    useStudentAccess,
    useStudentAccessEvents,
    useTrashAccount,
} from 'hooks/useAdmin';
import {
    AccessRow,
    accessBadges,
    accessBody,
    accessLabel,
    actorLabel,
    brInstantDay,
    canExtend,
    Draft,
    draftOf,
    emailMatches,
    eventWhen,
    grantOptions,
    isDirty,
    isTrashOwner,
    MONTHS,
    ORIGINS,
    PRODUCT_NAMES,
    serverProblem,
    termKind,
    termProblem,
} from 'libs/adminAccess';
import { studentHistory } from 'libs/adminHistory';
import { isLeituraOwner } from 'libs/leitura';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { NewPage } from './NewPage';

const styles = css`
    .as .as-head {
        display: flex;
        align-items: center;
        gap: 16px;
        margin: 0 0 36px;
    }
    .as .as-head .av {
        flex: none;
        display: grid;
        place-items: center;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        overflow: hidden;
        background: var(--r-surf);
        border: 1px solid var(--r-line);
        font-size: 20px;
        color: var(--r-muted);
    }
    .as .as-head .av img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    .as .as-head h1 {
        margin: 0;
        font-size: 22px;
        font-weight: 400;
        overflow-wrap: anywhere;
    }
    .as .as-head p {
        margin: 2px 0 0;
        font-size: 13.5px;
        color: var(--r-muted);
        overflow-wrap: anywhere;
    }
    .as .as-head .eyebrow a {
        color: inherit;
        text-decoration: none;
    }
    .as .prod .lab b {
        font-size: 15px;
        font-weight: 500;
    }
    .as .badges {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 6px;
    }
    .as .badge {
        padding: 2px 8px;
        border-radius: 999px;
        background: var(--r-gold-tint);
        color: var(--r-gold-hi);
        font-size: 12px;
        white-space: nowrap;
    }
    .as .ctl {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px 12px;
    }
    .as .tog {
        display: inline-flex;
        gap: 2px;
        padding: 3px;
        border: 1px solid var(--r-line);
        border-radius: 999px;
        background: var(--r-surf);
    }
    .as .tog button {
        min-height: 36px;
        padding: 0 14px;
        border: 0;
        border-radius: 999px;
        background: none;
        color: var(--r-muted);
        font: inherit;
        font-size: 13.5px;
        cursor: pointer;
    }
    .as .tog button[aria-pressed='true'] {
        background: var(--r-gold);
        color: var(--r-on-gold);
        font-weight: 500;
    }
    .as .ctl .ant-select {
        min-width: 150px;
    }
    .as .ctl input[type='date'] {
        min-height: 40px;
        padding: 0 10px;
        border: 1px solid var(--r-line);
        border-radius: 8px;
        background: var(--r-bg);
        color: var(--r-text);
        font: inherit;
        font-size: 14px;
        color-scheme: light dark;
    }
    .as .msg {
        margin: 8px 0 0;
        font-size: 13px;
        color: var(--r-muted);
    }
    .as .msg.err {
        color: var(--r-error);
    }
    .as ol.rows {
        margin: 0;
        padding: 0;
        list-style: none;
    }
    .as .btn.danger {
        border-color: var(--r-danger);
        color: var(--r-danger);
    }
    .as .del {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px 12px;
    }
    .as .del input {
        flex: 1 1 260px;
        min-height: 44px;
        padding: 0 14px;
        border: 1px solid var(--r-line-strong);
        border-radius: 999px;
        background: var(--r-bg);
        color: var(--r-text);
        font: inherit;
    }
    .as .log .lab b {
        flex-wrap: wrap;
    }
    .as .log .lab b small {
        font-size: 13px;
        color: var(--r-muted);
    }
    .as .log .field,
    .as .history .row .field {
        font-size: 13px;
        color: var(--r-muted);
        font-variant-numeric: tabular-nums;
    }
    @media (max-width: 700px) {
        .as .row {
            grid-template-columns: minmax(0, 1fr);
        }
    }
`;

/** Botões de meses (conceder ou estender): escolha do rascunho, gravada no Salvar. */
const Months: React.FC<{
    label: string;
    options: readonly number[];
    chosen: number | null;
    disabled?: boolean;
    onPick: (months: number) => void;
}> = ({ label, options, chosen, disabled, onPick }) => (
    <span className="tog" role="group" aria-label={label}>
        {options.map((months) => (
            <button
                key={months}
                type="button"
                disabled={disabled}
                aria-pressed={chosen === months}
                onClick={() => onPick(months)}
            >
                {options.length === 1 ? '1 mês' : `+${months}`}
            </button>
        ))}
    </span>
);

/** Um produto: Total/Leitura, origem e prazo (data, meses ou sem prazo); grava no Salvar. */
const ProductAccess: React.FC<{ uid: string; row: AccessRow }> = ({ uid, row }) => {
    const [draft, setDraft] = useState<Draft>(() => draftOf(row));
    // o rascunho recomeça da linha do servidor (fonte única): quando ela muda (outra pessoa, rotina) e depois de cada
    // gravação, já com a linha relida; o "Salvo." fica
    const [saves, setSaves] = useState(0);
    useEffect(() => setDraft(draftOf(row)), [row.updatedAt, saves]); // eslint-disable-line react-hooks/exhaustive-deps
    const save = useSaveStudentAccess(uid, row.product);
    // gravando: nada muda até a resposta (sem pedido em dobro, sem perder o retorno)
    const busy = save.isPending;
    const name = PRODUCT_NAMES[row.product];
    const kind = termKind(draft.origin);
    const problem = termProblem(draft, row);
    const body = accessBody(draft, row);
    const dirty = isDirty(draft, row);
    const sameOrigin = draft.origin === row.origin;
    // Cortesia do Imerso em curso: estender a partir do fim; senão, conceder a partir de hoje
    const extending = canExtend(row) && sameOrigin && (kind === 'date' || row.origin === 'cortesia');
    const chosen =
        (draft.term.kind === 'grant' || draft.term.kind === 'extend') && draft.term.months ? draft.term.months : null;
    const set = (patch: Partial<Draft>) => {
        if (busy) return;
        save.reset();
        setDraft((current) => ({ ...current, ...patch }));
    };

    return (
        <li className="row prod">
            <div className="lab">
                <b>{name}</b>
                {row.state === 'none' && <span>Sem acesso</span>}
                {accessBadges(row).length > 0 && (
                    <span className="badges">
                        {accessBadges(row).map((badge) => (
                            <span key={badge} className="badge">
                                {badge}
                            </span>
                        ))}
                    </span>
                )}
            </div>
            <div className="field">
                <div className="ctl">
                    <span className="tog" role="group" aria-label={`Acesso ao ${name}`}>
                        <button
                            type="button"
                            disabled={busy}
                            aria-pressed={draft.state === 'ativo'}
                            onClick={() => set({ state: 'ativo' })}
                        >
                            Total
                        </button>
                        <button
                            type="button"
                            disabled={busy}
                            aria-pressed={draft.state === 'leitura'}
                            onClick={() => set({ state: 'leitura' })}
                        >
                            Leitura
                        </button>
                    </span>
                    <Select
                        aria-label={`Origem do ${name}`}
                        value={draft.origin ?? undefined}
                        placeholder="Origem a confirmar"
                        disabled={busy}
                        options={ORIGINS}
                        popupMatchSelectWidth={false}
                        onChange={(origin) => set({ origin, term: { kind: 'keep' } })}
                    />
                    {kind === 'date' && (
                        <input
                            type="date"
                            disabled={busy}
                            aria-label={`Válido até (${name})`}
                            value={
                                draft.term.kind === 'date' ? draft.term.value : sameOrigin ? (row.validUntil ?? '') : ''
                            }
                            onChange={(event) => set({ term: { kind: 'date', value: event.target.value } })}
                        />
                    )}
                    {kind === 'months' && !extending && (
                        <Months
                            label={`Conceder cortesia (${name})`}
                            options={grantOptions(row.product)}
                            chosen={draft.term.kind === 'grant' ? chosen : null}
                            disabled={busy}
                            onPick={(months) => set({ state: 'ativo', term: { kind: 'grant', months } })}
                        />
                    )}
                    {extending && (
                        <Months
                            label={`Estender (${name})`}
                            options={MONTHS}
                            chosen={draft.term.kind === 'extend' ? chosen : null}
                            disabled={busy}
                            onPick={(months) => set({ state: 'ativo', term: { kind: 'extend', months } })}
                        />
                    )}
                    {kind === 'none' && <span className="hint">Sem prazo</span>}
                    <button
                        type="button"
                        className="btn gold"
                        disabled={!dirty || !body || save.isPending}
                        onClick={() => body && !busy && save.mutate(body, { onSuccess: () => setSaves((n) => n + 1) })}
                    >
                        {save.isPending ? 'Salvando…' : 'Salvar'}
                    </button>
                </div>
                {problem && <p className="msg">{problem}</p>}
                {save.isError && (
                    <p className="msg err" role="alert">
                        {serverProblem(save.error)}
                    </p>
                )}
                {save.isSuccess && (
                    <p className="msg" role="status">
                        {save.data?.claimsSynced === false
                            ? 'Salvo. O aluno vê a mudança depois da rotina diária.'
                            : 'Salvo.'}
                    </p>
                )}
            </div>
        </li>
    );
};

/** Só o dono: confirma digitando o e-mail; a conta vai para a lixeira por 30 dias (o servidor confere o dono de novo). */
const DeleteAccount: React.FC<{ uid: string; email?: string | null }> = ({ uid, email }) => {
    const [open, setOpen] = useState(false);
    const [typed, setTyped] = useState('');
    const trash = useTrashAccount(uid);
    if (trash.isSuccess)
        return (
            <p className="msg" role="status">
                A conta vai para a lixeira por 30 dias (exclusão definitiva em {brInstantDay(trash.data?.purgeAfter)}).{' '}
                <Link href="/admin/lixeira">Lixeira</Link>
            </p>
        );
    if (!open)
        return (
            <button type="button" className="btn line danger" onClick={() => setOpen(true)}>
                Excluir conta permanentemente
            </button>
        );
    const ok = emailMatches(typed, email);
    return (
        <form
            className="del"
            onSubmit={(event) => {
                event.preventDefault();
                if (ok && !trash.isPending) trash.mutate(typed.trim());
            }}
        >
            {/* excluindo: nada muda até a resposta (sem segundo pedido, sem perder o retorno) */}
            <input
                type="email"
                autoComplete="off"
                aria-label="Digite o e-mail da conta para confirmar"
                placeholder="Digite o e-mail da conta"
                value={typed}
                disabled={trash.isPending}
                onChange={(event) => {
                    if (trash.isPending) return;
                    trash.reset();
                    setTyped(event.target.value);
                }}
            />
            <button type="submit" className="btn line danger" disabled={!ok || trash.isPending}>
                {trash.isPending ? 'Excluindo…' : 'Excluir'}
            </button>
            <button
                type="button"
                className="btn ghost"
                disabled={trash.isPending}
                onClick={() => {
                    if (trash.isPending) return;
                    setOpen(false);
                    setTyped('');
                    trash.reset();
                }}
            >
                Cancelar
            </button>
            {!email && <p className="msg">Conta sem e-mail conhecido: não dá para confirmar aqui.</p>}
            {trash.isError && (
                <p className="msg err" role="alert">
                    {serverProblem(trash.error)}
                </p>
            )}
        </form>
    );
};

const AccessEvents: React.FC<{ uid: string }> = ({ uid }) => {
    const events = useStudentAccessEvents(uid);
    if (events.isLoading) return null;
    if (events.isError) return <p className="hint">Registro indisponível no momento.</p>;
    if (!events.data?.length) return <p className="hint">Sem mudanças registradas.</p>;
    return (
        <ol className="rows log">
            {events.data.map((event) => (
                <li className="row" key={event.id}>
                    <span className="lab">
                        <b>
                            {PRODUCT_NAMES[event.product] ?? event.product}
                            <small>
                                {accessLabel(event.before)} → {accessLabel(event.after)}
                            </small>
                        </b>
                    </span>
                    <span className="field">
                        {eventWhen(event.at)} · {actorLabel(event)}
                    </span>
                </li>
            ))}
        </ol>
    );
};

/**
 * Página do aluno no Admin (/admin/aluno/[uid]): quem é, o acesso por produto (Total/Leitura, origem e prazo), o
 * registro de cada mudança e o histórico do programa (o mesmo retrato de /admin/historico, só para o dono).
 */
export const NewAdminStudent: React.FC<{ uid: string }> = ({ uid }) => {
    const access = useStudentAccess(uid);
    const history = useAdminHistory();
    const snapshot = history.data?.students.find((student) => student.uid === uid);
    const user = access.data?.user;
    const name = user?.name || snapshot?.name || user?.email || snapshot?.email || 'Aluno';
    const email = user?.email || snapshot?.email;
    const timeline = snapshot ? studentHistory(snapshot) : [];
    const notFound =
        (access.error as { response?: { data?: { code?: string } } } | null)?.response?.data?.code === 'USER_NOT_FOUND';

    return (
        <NewPage className="narrow as">
            <Global styles={styles} />
            <header className="as-head">
                <span className="av" aria-hidden>
                    {user?.photoURL ? (
                        // eslint-disable-next-line @next/next/no-img-element -- foto do perfil (Firebase)
                        <img src={user.photoURL} alt="" />
                    ) : (
                        name[0]?.toUpperCase()
                    )}
                </span>
                <div>
                    <p className="eyebrow">
                        {/* o histórico do programa é só do dono */}
                        {isLeituraOwner(auth.currentUser?.uid) ? (
                            <Link href="/admin/historico">Histórico do programa</Link>
                        ) : (
                            'Admin'
                        )}
                    </p>
                    <h1>{name}</h1>
                    {email && <p>{email}</p>}
                    {user && user.disabled !== false && <p>{user.disabled ? 'Login desligado' : 'Sem login'}</p>}
                </div>
            </header>

            <section aria-labelledby="as-access">
                <div className="sh">
                    <h2 id="as-access">Acesso</h2>
                </div>
                {access.isLoading ? (
                    <p className="hint" role="status">
                        Carregando…
                    </p>
                ) : access.isError ? (
                    <p className="hint" role="status">
                        {notFound ? 'Aluno não encontrado.' : 'Acessos indisponíveis no momento.'}{' '}
                        {!notFound && (
                            <button type="button" className="btn line" onClick={() => access.refetch()}>
                                Tentar de novo
                            </button>
                        )}
                    </p>
                ) : (
                    <ol className="rows">
                        {(access.data?.data ?? []).map((row) => (
                            <ProductAccess key={row.product} uid={uid} row={row} />
                        ))}
                    </ol>
                )}
            </section>

            <section aria-labelledby="as-log">
                <div className="sh">
                    <h2 id="as-log">Registro</h2>
                </div>
                <AccessEvents uid={uid} />
            </section>

            {timeline.length > 0 && (
                <section aria-labelledby="as-history" className="history">
                    <div className="sh">
                        <h2 id="as-history">Histórico do programa</h2>
                    </div>
                    <ol className="rows">
                        {timeline.map((row) => (
                            <li className="row" key={row.key}>
                                <span className="lab">
                                    <b>{row.label}</b>
                                </span>
                                <span className="field">{row.when}</span>
                            </li>
                        ))}
                    </ol>
                </section>
            )}

            {isTrashOwner(auth.currentUser?.uid) && !notFound && (
                <section aria-label="Excluir conta">
                    <DeleteAccount uid={uid} email={email} />
                </section>
            )}
        </NewPage>
    );
};

export default NewAdminStudent;
