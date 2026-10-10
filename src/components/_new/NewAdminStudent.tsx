'use client';

import { css, Global } from '@emotion/react';
import { Select } from 'antd';
import { auth } from 'config/firebase';
import {
    useAdminAccounts,
    useAdminHistory,
    useFactoryReset,
    useImpersonateStudent,
    useProgramAllowances,
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
import { adminPanelPath, type AccountRow, programLabel } from 'libs/adminPanel';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { MERCY_MODE_UIDS, MercyMode } from '../layouts/AdminActions/MercyMode';

const styles = css`
    .as .as-head {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 12px 16px;
        margin: 0 0 32px;
    }
    .as .as-id {
        flex: 1 1 200px;
        min-width: 0;
    }
    .as .as-act {
        margin-top: 16px;
    }
    .as section + section {
        margin-top: 36px;
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
    .as .prod .lab b {
        font-size: 15px;
        font-weight: 500;
    }
    /* selos: pílulas do tamanho do texto (vencem o "span em bloco" de .row .lab) */
    .as .row .lab .badges {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 6px;
    }
    .as .row .lab .badge {
        display: inline-block;
        margin: 0;
        padding: 2px 9px;
        border: 1px solid var(--r-gold);
        border-radius: 999px;
        background: var(--r-gold-tint);
        color: var(--r-text);
        font-size: 12px;
        white-space: nowrap;
    }
    .as .ctl .ant-select-selection-placeholder {
        color: var(--r-muted);
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
                        // produto sem acesso: escolher a origem já é conceder (Total)
                        onChange={(origin) => set({ origin, term: { kind: 'keep' }, state: draft.state ?? 'ativo' })}
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

type ConfirmMutation<T> = {
    mutate: (email: string) => void;
    reset: () => void;
    isPending: boolean;
    isError: boolean;
    isSuccess: boolean;
    error: unknown;
    data?: T;
};

/**
 * Ação do dono confirmada digitando o e-mail da conta (o servidor confere de novo): o botão abre o campo; a ação só liga
 * com o e-mail certo; enquanto grava, nada muda (sem pedido em dobro, sem perder o retorno).
 */
function EmailConfirm<T>({
    email,
    open: openLabel,
    action,
    pending,
    mutation,
    done,
}: {
    email?: string | null;
    open: string;
    action: string;
    pending: string;
    mutation: ConfirmMutation<T>;
    done: (data?: T) => React.ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const [typed, setTyped] = useState('');
    if (mutation.isSuccess)
        return (
            <p className="msg" role="status">
                {done(mutation.data)}
            </p>
        );
    if (!open)
        return (
            <button type="button" className="btn line danger" onClick={() => setOpen(true)}>
                {openLabel}
            </button>
        );
    const ok = emailMatches(typed, email);
    return (
        <form
            className="del"
            onSubmit={(event) => {
                event.preventDefault();
                if (ok && !mutation.isPending) mutation.mutate(typed.trim());
            }}
        >
            <input
                type="email"
                autoComplete="off"
                aria-label="Digite o e-mail da conta para confirmar"
                placeholder="Digite o e-mail da conta"
                value={typed}
                disabled={mutation.isPending}
                onChange={(event) => {
                    if (mutation.isPending) return;
                    mutation.reset();
                    setTyped(event.target.value);
                }}
            />
            <button type="submit" className="btn line danger" disabled={!ok || mutation.isPending}>
                {mutation.isPending ? pending : action}
            </button>
            <button
                type="button"
                className="btn ghost"
                disabled={mutation.isPending}
                onClick={() => {
                    if (mutation.isPending) return;
                    setOpen(false);
                    setTyped('');
                    mutation.reset();
                }}
            >
                Cancelar
            </button>
            {!email && <p className="msg">Conta sem e-mail conhecido: não dá para confirmar aqui.</p>}
            {mutation.isError && (
                <p className="msg err" role="alert">
                    {serverProblem(mutation.error)}
                </p>
            )}
        </form>
    );
}

/** Só o dono: a conta vai para a lixeira por 30 dias (sem login, oculta, restaurável). */
const DeleteAccount: React.FC<{ uid: string; email?: string | null }> = ({ uid, email }) => {
    const trash = useTrashAccount(uid);
    return (
        <EmailConfirm
            email={email}
            open="Excluir conta permanentemente"
            action="Excluir"
            pending="Excluindo…"
            mutation={trash}
            done={(data) => (
                <>
                    A conta vai para a lixeira por 30 dias (exclusão definitiva em {brInstantDay(data?.purgeAfter)}).{' '}
                    <Link href={adminPanelPath(null) + '?lixeira=1'}>Lixeira</Link>
                </>
            )}
        />
    );
};

/** Só o dono: o Programa Imerso volta ao primeiro acesso (a LAMP vai para o arquivo; nada é apagado). */
const FactoryReset: React.FC<{ uid: string; email?: string | null }> = ({ uid, email }) => {
    const reset = useFactoryReset(uid);
    return (
        <EmailConfirm
            email={email}
            open="Reset de fábrica"
            action="Resetar"
            pending="Resetando…"
            mutation={reset}
            done={() => 'O programa voltou ao primeiro acesso.'}
        />
    );
};

/** Pausas e resets a mais (+1, +2 ou +3 de cada), na hora; o que resta vem da resposta. */
const ProgramAllowances: React.FC<{ uid: string; program: AccountRow['program'] }> = ({ uid, program }) => {
    const add = useProgramAllowances(uid);
    const left = {
        addPauses: add.data?.remainingPauses ?? program?.remainingPauses ?? null,
        addResets: add.data?.remainingResets ?? program?.remainingResets ?? null,
    };
    const line = (label: string, field: 'addPauses' | 'addResets', one: string) => (
        <li className="row">
            <span className="lab">
                <b>{label}</b>
                <span>Restam {left[field] ?? '—'}</span>
            </span>
            <span className="field">
                <span className="tog" role="group" aria-label={`${label} a mais`}>
                    {[1, 2, 3].map((n) => (
                        <button
                            key={n}
                            type="button"
                            disabled={add.isPending}
                            aria-label={`Dar ${n} ${n === 1 ? one : label.toLowerCase()} a mais`}
                            onClick={() => add.mutate({ [field]: n })}
                        >
                            +{n}
                        </button>
                    ))}
                </span>
            </span>
        </li>
    );
    return (
        <>
            <ol className="rows">
                {line('Pausas', 'addPauses', 'pausa')}
                {line('Resets', 'addResets', 'reset')}
            </ol>
            {add.isError && (
                <p className="msg err" role="alert">
                    {serverProblem(add.error)}
                </p>
            )}
        </>
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
 * Uma conta no Painel de Contas (ao lado da lista): quem é, acessar como o aluno, o acesso por produto (Total/Leitura,
 * origem e prazo), o programa (pausas/resets a mais; reset de fábrica, só o dono), Mercy Mode (só o dono), o registro
 * de cada mudança, o histórico do programa (o retrato noturno, só o dono) e a exclusão (só o dono).
 */
export const StudentDetail: React.FC<{ uid: string; account?: AccountRow }> = ({ uid, account }) => {
    const access = useStudentAccess(uid);
    const history = useAdminHistory();
    const impersonate = useImpersonateStudent();
    const snapshot = history.data?.students.find((student) => student.uid === uid);
    const user = access.data?.user;
    // aberta fora da página atual da lista (Início, saída da impersonação): a linha (programa, pausas, resets) vem da
    // busca pelo e-mail
    const lookupEmail = account ? '' : (user?.email ?? '');
    const lookup = useAdminAccounts({ q: lookupEmail, sort: { key: 'name', dir: 'asc' }, page: 1 }, !!lookupEmail);
    const row = account ?? lookup.data?.rows.find((candidate) => candidate.uid === uid);
    const name = user?.name || row?.name || snapshot?.name || user?.email || row?.email || snapshot?.email || 'Conta';
    const email = user?.email || row?.email || snapshot?.email;
    const photo = user?.photoURL || row?.photoURL;
    const timeline = snapshot ? studentHistory(snapshot) : [];
    const realUid = auth.currentUser?.uid;
    const owner = isTrashOwner(realUid);
    const noLogin = user ? user.disabled !== false : row?.hasLogin === false;
    const program =
        row?.program ??
        (snapshot
            ? {
                  melpStatus: snapshot.status,
                  lampWeek: snapshot.lampWeek,
                  remainingPauses: snapshot.pausesLeft,
                  remainingResets: snapshot.resetsLeft,
              }
            : null);
    const notFound =
        (access.error as { response?: { data?: { code?: string } } } | null)?.response?.data?.code === 'USER_NOT_FOUND';

    return (
        <div className="as">
            <Global styles={styles} />
            <header className="as-head">
                <span className="av" aria-hidden>
                    {photo ? (
                        // eslint-disable-next-line @next/next/no-img-element -- foto do perfil (Firebase)
                        <img src={photo} alt="" />
                    ) : (
                        name[0]?.toUpperCase()
                    )}
                </span>
                <div className="as-id">
                    <h1>{name}</h1>
                    {email && <p>{email}</p>}
                    {noLogin && <p>{user?.disabled ? 'Login desligado' : 'Sem login'}</p>}
                </div>
                {!noLogin && !notFound && (
                    <button
                        type="button"
                        className="btn line"
                        disabled={impersonate.isPending}
                        onClick={() => impersonate.mutate(uid)}
                    >
                        Acessar como aluno
                    </button>
                )}
            </header>
            {impersonate.isError && (
                <p className="msg err" role="alert">
                    {serverProblem(impersonate.error)}
                </p>
            )}

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
                        {notFound ? 'Conta não encontrada.' : 'Acessos indisponíveis no momento.'}{' '}
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

            {program && (
                <section aria-labelledby="as-program">
                    <div className="sh">
                        <h2 id="as-program">
                            Programa <span>{programLabel(program)}</span>
                        </h2>
                    </div>
                    <ProgramAllowances uid={uid} program={program} />
                    {owner && (
                        <div className="as-act">
                            <FactoryReset uid={uid} email={email} />
                        </div>
                    )}
                </section>
            )}

            {!!realUid && MERCY_MODE_UIDS.includes(realUid) && (
                <section aria-label="Gravações">
                    <MercyMode studentUid={uid} studentLabel={name} />
                </section>
            )}

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

            {owner && !notFound && (
                <section aria-label="Excluir conta" className="as-act">
                    <DeleteAccount uid={uid} email={email} />
                </section>
            )}
        </div>
    );
};

export default StudentDetail;
