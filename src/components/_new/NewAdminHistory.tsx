'use client';

import { css, Global } from '@emotion/react';
import { Input } from 'antd';
import { useGetMettleUsers, useMelpSummary } from 'hooks';
import type { MelpStatus } from 'interfaces/melp';
import { programHistory } from 'libs/programHistory';
import React, { useMemo, useState } from 'react';
import { NewPage } from './NewPage';
import { PageHead } from './PageHead';
import { ProgramHistory } from './ProgramHistory';

// /admin/historico (só o dono): o Histórico do programa de cada aluno do Imerso. A lista vem uma vez (segmento Imerso,
// contas ativas) e é filtrada aqui; o histórico vem do mesmo resumo do aluno (GET /melp/v2/:uid/summary, token de
// admin), como o "acessar como aluno" já faz — só para o aluno escolhido.

const STATUS: Record<MelpStatus, string> = {
    MELP_BEGIN: 'Antes do início',
    CAN_START_DEDA: 'Pode começar',
    DEDA_STARTED_NOT_BEGUN: 'Aguardando a segunda',
    DEDA_STARTED: 'Em andamento',
    DEDA_PAUSED: 'Pausado',
    DEDA_FINISHED: 'Concluído',
    MELP_SUSPENDED: 'Suspenso',
    WEEK_ZERO: 'Semana zero',
};

const styles = css`
    .ah {
        display: grid;
        grid-template-columns: 300px minmax(0, 1fr);
        gap: 28px;
        align-items: start;
    }
    .ah .who {
        display: grid;
        gap: 10px;
        position: sticky;
        top: 16px;
    }
    .ah .who ul {
        max-height: 60vh;
        overflow: auto;
        margin: 0;
        padding: 0;
        list-style: none;
        border-top: 1px solid var(--r-line);
    }
    .ah .who button {
        display: grid;
        width: 100%;
        min-height: 44px;
        padding: 8px 10px;
        border: 0;
        border-bottom: 1px solid var(--r-line);
        background: none;
        color: var(--r-text);
        font: inherit;
        text-align: left;
        cursor: pointer;
    }
    .ah .who button small {
        color: var(--r-muted);
        font-size: 12.5px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .ah .who button[aria-pressed='true'] {
        background: var(--r-hover);
        box-shadow: inset 2px 0 0 var(--r-gold-hi);
    }
    .ah .one h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 500;
    }
    .ah .one .ctx {
        margin: 4px 0 0;
        color: var(--r-muted);
        font-size: 14px;
    }
    .ah .one .history {
        margin-top: 20px;
    }
    .ah .mut {
        color: var(--r-muted);
    }
    .ah .retry {
        min-height: 44px;
        padding: 0 4px;
        border: 0;
        background: none;
        color: var(--r-gold-hi);
        font: inherit;
        text-decoration: underline;
        cursor: pointer;
    }
    @media (max-width: 860px) {
        .ah {
            grid-template-columns: minmax(0, 1fr);
        }
        .ah .who {
            position: static;
        }
        .ah .who ul {
            max-height: 40vh;
        }
    }
`;

type Pick = { uid: string; name: string };

const Student: React.FC<{ who: Pick }> = ({ who }) => {
    const q = useMelpSummary(who.uid);
    const s = q.data;
    return (
        <div className="one">
            <h2>{who.name}</h2>
            {q.isLoading && <p className="mut">Carregando…</p>}
            {q.isError &&
                ((q.error as { response?: { status?: number } } | null)?.response?.status === 404 ? (
                    <p className="mut">Sem programa Imerso.</p>
                ) : (
                    <p className="mut">
                        Não foi possível carregar o histórico.{' '}
                        <button type="button" className="retry" onClick={() => q.refetch()}>
                            Tentar de novo
                        </button>
                    </p>
                ))}
            {s && (
                <>
                    <p className="ctx">
                        {STATUS[s.melp_status] ?? s.melp_status}
                        {s.current_deda_week > 0 ? ` · semana ${s.current_deda_week} da LAMP` : ''} · pausas restantes{' '}
                        {s.remaining_pauses} · resets restantes {s.remaining_resets}
                    </p>
                    {programHistory(s.program_events, s.remaining_resets).length ? (
                        <ProgramHistory
                            events={s.program_events}
                            remainingResets={s.remaining_resets}
                            heading={false}
                        />
                    ) : (
                        <p className="mut">Sem eventos.</p>
                    )}
                </>
            )}
        </div>
    );
};

export const NewAdminHistory: React.FC = () => {
    const users = useGetMettleUsers({ accountStatusIn: 'ACTIVE', segment: 'imerso' });
    const [term, setTerm] = useState('');
    const [who, setWho] = useState<Pick | null>(null);
    const list = useMemo(() => {
        const t = term.trim().toLocaleLowerCase('pt-BR');
        return (users.data?.data ?? [])
            .map((u) => ({
                uid: u.user_uid,
                name: `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email,
                email: u.email,
            }))
            .filter((u) => !t || `${u.name} ${u.email}`.toLocaleLowerCase('pt-BR').includes(t))
            .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    }, [users.data, term]);

    return (
        <NewPage>
            <Global styles={styles} />
            <PageHead
                eyebrow="Interno · só você vê"
                title="Histórico do programa"
                subtitle={users.data ? `${users.data.data.length} alunos do Imerso` : undefined}
            />
            <div className="ah">
                <div className="who">
                    <Input
                        allowClear
                        placeholder="Buscar aluno"
                        aria-label="Buscar aluno"
                        value={term}
                        onChange={(e) => setTerm(e.target.value)}
                    />
                    {users.isLoading && <p className="mut">Carregando…</p>}
                    {users.isError && <p className="mut">Não foi possível carregar a lista.</p>}
                    <ul>
                        {list.map((u) => (
                            <li key={u.uid}>
                                <button
                                    type="button"
                                    aria-pressed={who?.uid === u.uid}
                                    onClick={() => setWho({ uid: u.uid, name: u.name })}
                                >
                                    <span>{u.name}</span>
                                    <small>{u.email}</small>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
                {who ? <Student key={who.uid} who={who} /> : <p className="mut">Escolha um aluno.</p>}
            </div>
        </NewPage>
    );
};

export default NewAdminHistory;
