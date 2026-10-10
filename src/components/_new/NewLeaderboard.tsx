'use client';

import { css, Global } from '@emotion/react';
import { useQuery } from '@tanstack/react-query';
import { auth } from 'config/firebase';
import {
    isCurrentSnapshot,
    isPaused,
    LbSnapshot,
    LEADERBOARD_URL,
    Level,
    LEVEL_NAME,
    order,
    overallAvg,
    Ranked,
    recAvg,
    TENURE_BANDS,
    tenureWeekOf,
    weeklyOverall,
} from 'libs/leaderboard';
import React, { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { AdminNav } from './AdminNav';
import { NewPage } from './NewPage';
import { PageHead } from './PageHead';
import { RunChip } from './RunGold';

/*
 * Leaderboard do Imerso (só o dono). Ranking da noite + "por quê" de cada aluno + o Livro de Regras. Somente leitura:
 * Score, posição e componentes vêm prontos do lote; as regras moram no código e no Livro (André, 09-Out-2026), nunca
 * em controles da página.
 */

const get = async (): Promise<LbSnapshot> => {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch(LEADERBOARD_URL, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    if (!res.ok) throw new Error(String(res.status));
    return res.json();
};

const pct = (x: number | null, d = 0) => (x === null ? '—' : `${(x * 100).toFixed(d).replace('.', ',')}%`);
const dec = (x: number, d = 2) => x.toFixed(d).replace('.', ',');

const styles = css`
    .lb .lbbar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 12px 20px;
        margin: 0 0 20px;
    }
    .lb .lbbar .seg {
        margin: 0;
    }
    .lb .seg.sm button {
        min-height: 34px;
        padding: 0 14px;
        font-size: 13.5px;
    }
    .lb .lbbar .btn.tog {
        margin-left: auto;
    }

    /* ---------- tabela ---------- */
    .lb .tbl {
        border-top: 1px solid var(--r-line);
    }
    .lb .r {
        display: grid;
        grid-template-columns: 2.5rem minmax(0, 1fr) 3.5rem 4rem 5.5rem 4.5rem 5rem 6rem 3.5rem 3.5rem 4.5rem;
        align-items: center;
        gap: 0 12px;
        width: 100%;
        min-height: 56px;
        padding: 8px 4px;
        border: 0;
        border-bottom: 1px solid var(--r-line);
        background: none;
        color: var(--r-text);
        font: inherit;
        font-size: 14.5px;
        text-align: left;
        cursor: pointer;
    }
    .lb button.r:hover {
        background: var(--r-hover);
    }
    .lb .r.h {
        min-height: 40px;
        cursor: default;
        font-size: var(--r-label-size);
        letter-spacing: var(--r-label-track);
        text-transform: uppercase;
        color: var(--r-muted);
    }
    .lb .r .mt {
        display: contents;
    }
    .lb .r .num,
    .lb .r .rk {
        font-variant-numeric: tabular-nums;
        text-align: right;
    }
    .lb .r .rk {
        color: var(--r-muted);
    }
    .lb .r .nm {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .lb .r .sc {
        font-size: 17px;
        font-weight: 500;
        text-align: right;
        font-variant-numeric: tabular-nums;
    }
    .lb .r.h span {
        white-space: nowrap;
    }
    .lb .r.h .sc {
        font-size: inherit;
        font-weight: inherit;
    }
    .lb .r .lv,
    .lb .r .wk {
        color: var(--r-muted);
    }
    .lb .r i {
        display: none;
        font-style: normal;
    }
    .lb .r[aria-expanded='true'] {
        border-bottom-color: transparent;
    }

    /* ---------- por quê ---------- */
    .lb .why {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        gap: 16px 40px;
        padding: 6px 4px 24px 3.4rem;
        border-bottom: 1px solid var(--r-line);
    }
    .lb .why ul {
        margin: 0;
        padding: 0;
        list-style: none;
    }
    .lb .why li {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto auto;
        gap: 16px;
        padding: 6px 0;
        font-size: 14px;
        font-variant-numeric: tabular-nums;
    }
    .lb .why li span {
        color: var(--r-muted);
    }
    .lb .why li b {
        min-width: 4.5em;
        font-weight: 500;
        text-align: right;
    }
    .lb .why li.tot {
        margin-top: 4px;
        border-top: 1px solid var(--r-line);
    }
    .lb .why .note {
        margin: 6px 0 0;
        font-size: 12.5px;
        color: var(--r-faint);
    }
    .lb .why svg {
        display: block;
        width: 100%;
        height: 56px;
        overflow: visible;
    }
    .lb .why figcaption {
        margin: 0 0 8px;
        font-size: 13px;
        color: var(--r-muted);
    }
    .lb .why figcaption b {
        font-weight: 500;
        color: var(--r-text);
    }

    /* ---------- regras ---------- */
    .lb .rules {
        max-width: 72ch;
        font-size: 15.5px;
        line-height: 1.65;
    }
    .lb .rules h1 {
        display: none;
    }
    .lb .rules h2 {
        margin: 40px 0 10px;
        font-size: 20px;
        font-weight: 400;
    }
    .lb .rules h3 {
        margin: 28px 0 6px;
        font-size: 16px;
        font-weight: 500;
    }
    .lb .rules p,
    .lb .rules ul,
    .lb .rules ol {
        margin: 0 0 12px;
    }
    .lb .rules li {
        margin: 4px 0;
    }
    .lb .rules em {
        color: var(--r-muted);
    }
    .lb .rules strong {
        font-weight: 500;
    }
    .lb .rules pre {
        margin: 10px 0 14px;
        padding: 12px 16px;
        overflow-x: auto;
        border: 1px solid var(--r-line);
        border-radius: 10px;
        background: var(--r-surf);
        font-size: 13.5px;
        line-height: 1.5;
        white-space: pre-wrap;
    }
    .lb .rules code {
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 0.92em;
    }
    .lb .rules hr {
        margin: 32px 0 12px;
        border: 0;
        border-top: 1px solid var(--r-line);
    }

    @media (max-width: 720px) {
        .lb .lbbar .btn.tog {
            margin-left: 0;
        }
        .lb .r.h {
            display: none;
        }
        .lb .r {
            grid-template-columns: 1.8rem minmax(0, 1fr) auto;
            grid-template-areas: 'rk nm sc' '. mt sc';
            gap: 2px 10px;
            padding: 10px 2px;
        }
        .lb .r .rk {
            grid-area: rk;
            text-align: left;
        }
        .lb .r .nm {
            grid-area: nm;
        }
        .lb .r .sc {
            grid-area: sc;
        }
        .lb .r .mt {
            grid-area: mt;
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 2px 12px;
            font-size: 12.5px;
            color: var(--r-muted);
        }
        .lb .r .mt > span {
            text-align: left;
        }
        .lb .r i {
            display: inline;
            margin-right: 3px;
            color: var(--r-faint);
        }
        .lb .r .mt .rg-chip {
            zoom: 0.7;
        }
        .lb .why {
            grid-template-columns: minmax(0, 1fr);
            padding: 4px 2px 20px;
        }
        .lb .why li {
            grid-template-columns: minmax(0, 1fr) auto;
            gap: 0 16px;
        }
        .lb .why li > span:nth-of-type(2) {
            grid-row: 2;
            font-size: 12.5px;
            color: var(--r-faint);
        }
        .lb .why li b {
            grid-column: 2;
            grid-row: 1 / span 2;
            align-self: center;
        }
        .lb .seg.sm {
            display: flex;
            width: 100%;
        }
        .lb .seg.sm button {
            flex: 1 1 auto;
            padding: 0 8px;
        }
    }
`;

const Spark: React.FC<{ pts: number[] }> = ({ pts }) => {
    if (pts.length < 2) return null;
    // faixa de pelo menos 20 pontos percentuais: oscilação pequena não vira montanha
    const mid = (Math.min(...pts) + Math.max(...pts)) / 2;
    const half = Math.max((Math.max(...pts) - Math.min(...pts)) / 2, 0.1);
    const lo = Math.max(0, Math.min(mid - half, 1 - 2 * half));
    const span = 2 * half;
    const d = pts
        .map((v, i) => `${((i / (pts.length - 1)) * 100).toFixed(2)},${(52 - ((v - lo) / span) * 48).toFixed(2)}`)
        .join(' ');
    return (
        <svg viewBox="0 0 100 56" preserveAspectRatio="none" role="img" aria-label="Overall médio por semana">
            <polyline
                points={d}
                fill="none"
                stroke="var(--r-gold)"
                strokeWidth={1.5}
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    );
};

const Why: React.FC<{ r: Ranked; snap: LbSnapshot }> = ({ r, snap }) => {
    const c = r.st.comp;
    const pts = useMemo(() => weeklyOverall(r.st), [r.st]);
    const H = snap.H ?? 1092;
    const rec = recAvg(r.st);
    return (
        <div className="why">
            <div>
                <ul>
                    <li>
                        <span>
                            Overall · {dec(c.O, 1)} de {c.window} dias ({pct(overallAvg(r.st))})
                        </span>
                        <span />
                        <b>{dec(c.pO, 0)}</b>
                    </li>
                    <li>
                        <span>
                            Gravação ·{' '}
                            {c.pR === null ? 'sem gravador' : `${dec(c.R ?? 0, 1)} de ${c.recDays} dias (${pct(rec)})`}
                        </span>
                        <span>{c.pR === null ? 'peso redistribuído' : ''}</span>
                        <b>{c.pR === null ? '—' : dec(c.pR, 0)}</b>
                    </li>
                    <li>
                        <span>DEDA Run · {c.Run} dias</span>
                        <span />
                        <b>{dec(c.pRun, 0)}</b>
                    </li>
                    <li>
                        <span>
                            Pausas e resets · {dec((r.st.pausedDays ?? 0) / 7, 1)} sem. pausadas ·{' '}
                            {r.st.resetsArchived ?? 0} reset{(r.st.resetsArchived ?? 0) === 1 ? '' : 's'}
                        </span>
                        <span>× {dec(c.F, 3)}</span>
                        <b />
                    </li>
                    <li className="tot">
                        <span>Score</span>
                        <span />
                        <b>{r.st.score}</b>
                    </li>
                </ul>
                <p className="note">
                    {LEVEL_NAME[r.st.level]} · {c.daysDone} dias feitos de {H}
                    {r.st.status === 'DEDA_PAUSED' ? ' · DEDA pausado' : ''}
                </p>
            </div>
            <figure style={{ margin: 0 }}>
                <figcaption>
                    Overall médio por semana · janela <b>{pct(overallAvg(r.st))}</b>
                </figcaption>
                <Spark pts={pts} />
            </figure>
        </div>
    );
};

const Ranking: React.FC<{ snap: LbSnapshot }> = ({ snap }) => {
    const [band, setBand] = useState<string>('all');
    const [level, setLevel] = useState<'all' | Level>('all');
    const [open, setOpen] = useState<string | null>(null);
    const [paused, setPaused] = useState(false);
    // pausados fora (padrão): a posição é a ordem do lote só entre os que estão no programa; o Score não muda
    const rows = useMemo(
        () => order(paused ? snap.students : snap.students.filter((s) => !isPaused(s))),
        [snap, paused],
    );
    const test = TENURE_BANDS.find((b) => b.key === band)?.test ?? (() => true);
    const shown = rows.filter((r) => test(tenureWeekOf(r.st)) && (level === 'all' || r.st.level === level));

    return (
        <>
            <div className="lbbar">
                <div className="seg sm" role="tablist" aria-label="Tempo de programa">
                    {TENURE_BANDS.map((b) => (
                        <button
                            key={b.key}
                            type="button"
                            role="tab"
                            aria-selected={band === b.key}
                            onClick={() => setBand(b.key)}
                        >
                            {b.label}
                        </button>
                    ))}
                </div>
                <div className="seg sm" role="tablist" aria-label="Nível">
                    {(['all', 'EASY', 'MEDIUM', 'HARD'] as const).map((l) => (
                        <button
                            key={l}
                            type="button"
                            role="tab"
                            aria-selected={level === l}
                            onClick={() => setLevel(l)}
                        >
                            {l === 'all' ? 'Todos' : LEVEL_NAME[l]}
                        </button>
                    ))}
                </div>
                <button
                    type="button"
                    className={`btn ${paused ? 'gold' : 'line'} tog`}
                    aria-pressed={paused}
                    onClick={() => setPaused((x) => !x)}
                >
                    Incluir pausados
                </button>
            </div>

            <div className="tbl" role="table" aria-label="Leaderboard">
                <div className="r h" role="row">
                    <span className="rk">#</span>
                    <span>Aluno</span>
                    <span className="mt">
                        <span className="num">Sem.</span>
                        <span>Nível</span>
                        <span>DEDA Run</span>
                        <span className="num">Overall</span>
                        <span className="num">Gravação</span>
                        <span className="num">Pausado há</span>
                        <span className="num">Pausas</span>
                        <span className="num">Resets</span>
                    </span>
                    <span className="sc">Score</span>
                </div>
                {shown.map((r) => {
                    const isOpen = open === r.st.id;
                    return (
                        <React.Fragment key={r.st.id}>
                            <button
                                type="button"
                                className="r"
                                role="row"
                                aria-expanded={isOpen}
                                onClick={() => setOpen(isOpen ? null : r.st.id)}
                            >
                                <span className="rk">{r.rank}</span>
                                <span className="nm">{r.st.name}</span>
                                <span className="mt">
                                    <span className="num wk">
                                        <i>Sem.</i>
                                        {r.st.week}
                                    </span>
                                    <span className="lv">{LEVEL_NAME[r.st.level]}</span>
                                    <span>
                                        <RunChip
                                            current={r.st.comp.Run}
                                            counted={(r.st.dedaToday ?? 0) >= 80 - 1e-9}
                                            label=""
                                        />
                                    </span>
                                    <span className="num">
                                        <i>Overall</i>
                                        {pct(overallAvg(r.st))}
                                    </span>
                                    <span className="num">
                                        <i>Gravação</i>
                                        {pct(recAvg(r.st))}
                                    </span>
                                    <span className="num">
                                        <i>Pausado há</i>
                                        {r.st.pausedWeeks == null ? '—' : `${r.st.pausedWeeks} sem.`}
                                    </span>
                                    <span className="num">
                                        <i>Pausas</i>
                                        {r.st.pausesUsed ?? '—'}
                                    </span>
                                    <span className="num">
                                        <i>Resets</i>
                                        {r.st.resetsUsed ?? '—'}
                                    </span>
                                </span>
                                <span className="sc">{r.st.score}</span>
                            </button>
                            {isOpen && <Why r={r} snap={snap} />}
                        </React.Fragment>
                    );
                })}
            </div>
            {!shown.length && <p className="mut">Ninguém neste filtro.</p>}
        </>
    );
};

const NewLeaderboard: React.FC = () => {
    const q = useQuery({ queryKey: ['leaderboard'], staleTime: 5 * 60_000, retry: 1, queryFn: get });
    const [tab, setTab] = useState<'rank' | 'rules'>('rank');
    const snap = q.data;
    const when = snap?.generatedAt
        ? new Date(snap.generatedAt).toLocaleString('pt-BR', {
              timeZone: 'America/Sao_Paulo',
              dateStyle: 'short',
              timeStyle: 'short',
          })
        : null;
    const current = !!snap && !snap.empty && isCurrentSnapshot(snap);
    return (
        <NewPage className="lb">
            <Global styles={styles} />
            <AdminNav />
            <PageHead
                eyebrow="Interno · só você vê"
                title="Leaderboard"
                subtitle={when ? `Atualizado em ${when} · ${snap?.students.length} alunos do Imerso` : undefined}
                tabs={
                    <div className="seg" role="tablist">
                        <button type="button" role="tab" aria-selected={tab === 'rank'} onClick={() => setTab('rank')}>
                            Ranking
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={tab === 'rules'}
                            onClick={() => setTab('rules')}
                        >
                            Regras
                        </button>
                    </div>
                }
            />
            {q.isLoading && <p className="mut">Carregando…</p>}
            {q.isError && <p className="mut">Não foi possível carregar o Leaderboard.</p>}
            {snap?.empty && <p className="mut">O primeiro retrato sai na próxima noite.</p>}
            {snap && !snap.empty && !current && tab === 'rank' && (
                <p className="mut">O retrato com as regras atuais sai na próxima noite.</p>
            )}
            {current && tab === 'rank' && <Ranking snap={snap} />}
            {snap && tab === 'rules' && !current && (
                <p className="mut">O Livro de Regras atual sai com o próximo retrato.</p>
            )}
            {current && tab === 'rules' && (
                <article className="rules">
                    <ReactMarkdown>{snap.rulebook ?? ''}</ReactMarkdown>
                </article>
            )}
        </NewPage>
    );
};

export default NewLeaderboard;
