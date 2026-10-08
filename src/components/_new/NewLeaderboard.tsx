'use client';

import { css, Global } from '@emotion/react';
import { useQuery } from '@tanstack/react-query';
import { auth } from 'config/firebase';
import {
    breakdown,
    isPaused,
    LbSnapshot,
    LEADERBOARD_URL,
    Level,
    LEVEL_NAME,
    Params,
    rankAll,
    Ranked,
    runDays,
    sameParams,
    TENURE_BANDS,
    weightedOverallByWeek,
} from 'libs/leaderboard';
import React, { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { NewPage } from './NewPage';
import { PageHead } from './PageHead';
import { RunChip } from './RunGold';

/*
 * Leaderboard do Imerso (só o dono). Ranking da noite + "por quê" de cada aluno + controles que recalculam tudo no
 * navegador a partir dos dias de cada aluno (nada é salvo) + o Livro de Regras. Somente leitura.
 */

const get = async (): Promise<LbSnapshot> => {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch(LEADERBOARD_URL, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    if (!res.ok) throw new Error(String(res.status));
    return res.json();
};

const pct = (x: number | null, d = 0) => (x === null ? '—' : `${(x * 100).toFixed(d).replace('.', ',')}%`);
const dec = (x: number, d = 2) => x.toFixed(d).replace('.', ',');

const KNOBS: { key: keyof Params; label: string; hint: string; max: number }[] = [
    { key: 'wO', label: 'Overall ponderado', hint: 'peso de Ō', max: 1 },
    { key: 'wG', label: 'Gravação', hint: 'peso de Ḡ', max: 1 },
    { key: 'wC', label: 'DEDA Run', hint: 'peso de Ĉ', max: 1 },
    { key: 'fatigue', label: 'Desgaste', hint: '× ln(1 + dias ÷ 28)', max: 1 },
    { key: 'tenure', label: 'Tempo de casa', hint: '× ln(semana) ÷ ln(104)', max: 1 },
    { key: 'level', label: 'Expoente do nível', hint: '0,5 = raiz quadrada', max: 1.5 },
];

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
    .lb .knobs {
        margin: 0 0 24px;
        padding: 20px 22px 8px;
        border: 1px solid var(--r-line);
        border-radius: var(--r-radius);
    }
    .lb .knobs ul {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 4px 28px;
        margin: 0;
        padding: 0;
        list-style: none;
    }
    .lb .knobs li label {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 8px;
        font-size: 13.5px;
        color: var(--r-muted);
    }
    .lb .knobs li label b {
        font-weight: 500;
        font-variant-numeric: tabular-nums;
        color: var(--r-text);
    }
    .lb .knobs li small {
        margin-left: 6px;
        font-size: 12px;
        color: var(--r-faint);
    }
    .lb .knobs .foot {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 8px 16px;
        margin: 8px 0 0;
        font-size: 13px;
        color: var(--r-muted);
    }
    .lb input[type='range'] {
        width: 100%;
        height: 36px;
        margin: 0;
        background: transparent;
        accent-color: var(--r-gold);
        cursor: pointer;
        -webkit-appearance: none;
        appearance: none;
    }
    .lb input[type='range']::-webkit-slider-runnable-track {
        height: 2px;
        background: var(--r-track, var(--r-line-strong));
    }
    .lb input[type='range']::-moz-range-track {
        height: 2px;
        background: var(--r-track, var(--r-line-strong));
    }
    .lb input[type='range']::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 18px;
        height: 18px;
        margin-top: -8px;
        border: 0;
        border-radius: 50%;
        background: var(--r-gold);
    }
    .lb input[type='range']::-moz-range-thumb {
        width: 18px;
        height: 18px;
        border: 0;
        border-radius: 50%;
        background: var(--r-gold);
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

    @media (max-width: 900px) {
        .lb .knobs ul {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }
    }
    @media (max-width: 720px) {
        .lb .lbbar .btn.tog {
            margin-left: 0;
        }
        .lb .knobs ul {
            grid-template-columns: minmax(0, 1fr);
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
        <svg viewBox="0 0 100 56" preserveAspectRatio="none" role="img" aria-label="Overall ponderado por semana">
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

const Why: React.FC<{ r: Ranked; snap: LbSnapshot; p: Params }> = ({ r, snap, p }) => {
    const b = breakdown(r.c, p, snap.fullWeek);
    const pts = useMemo(() => weightedOverallByWeek(snap, r.st, p), [snap, r.st, p]);
    const value = (k: string, v: number | null) =>
        v === null ? 'sem gravador' : k === 'C' ? `${dec(v, 3)} · ${runDays(r.st)} dias` : pct(v, 1);
    return (
        <div className="why">
            <div>
                <ul>
                    {b.parts.map((x) => (
                        <li key={x.key}>
                            <span>
                                {x.label} · {value(x.key, x.v)}
                            </span>
                            <span>{x.v === null ? 'peso redistribuído' : `peso ${pct(x.eff)}`}</span>
                            <b>{x.points === null ? '—' : dec(x.points, 0)}</b>
                        </li>
                    ))}
                    <li>
                        <span>Tempo de casa · semana {r.st.week}</span>
                        <span>× {dec(b.factor, 3)} (já nos pontos)</span>
                        <b />
                    </li>
                    <li className="tot">
                        <span>Score</span>
                        <span />
                        <b>{r.score}</b>
                    </li>
                </ul>
                <p className="note">
                    {LEVEL_NAME[r.st.level]} · {r.st.overall.length} dias no programa
                    {r.c.G === null ? ' · gravador ainda não liberado para este aluno' : ''}
                    {r.st.status === 'DEDA_PAUSED' ? ' · DEDA pausado' : ''}
                </p>
            </div>
            <figure style={{ margin: 0 }}>
                <figcaption>
                    Overall ponderado ao longo do programa · hoje <b>{pct(r.c.O, 1)}</b>
                </figcaption>
                <Spark pts={pts} />
            </figure>
        </div>
    );
};

const Ranking: React.FC<{ snap: LbSnapshot }> = ({ snap }) => {
    const [p, setP] = useState<Params>(snap.defaults);
    const [band, setBand] = useState<string>('all');
    const [level, setLevel] = useState<'all' | Level>('all');
    const [open, setOpen] = useState<string | null>(null);
    const [knobs, setKnobs] = useState(false);
    const [paused, setPaused] = useState(false);
    // pausados fora (padrão): a posição é recalculada só entre os que estão no programa; a fórmula não muda
    const rows = useMemo(
        () => rankAll(paused ? snap : { ...snap, students: snap.students.filter((s) => !isPaused(s)) }, p),
        [snap, p, paused],
    );
    const test = TENURE_BANDS.find((b) => b.key === band)?.test ?? (() => true);
    const shown = rows.filter((r) => test(r.st.week) && (level === 'all' || r.st.level === level));
    const tuned = !sameParams(p, snap.defaults);

    return (
        <>
            <div className="lbbar">
                <div className="seg sm" role="tablist" aria-label="Tempo de casa">
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
                <button
                    type="button"
                    className={`btn ${tuned ? 'gold' : 'line'}`}
                    aria-expanded={knobs}
                    onClick={() => setKnobs((k) => !k)}
                >
                    {tuned ? 'Pesos ajustados' : 'Ajustar pesos'}
                </button>
            </div>

            {knobs && (
                <div className="knobs">
                    <ul>
                        {KNOBS.map((k) => (
                            <li key={k.key}>
                                <label htmlFor={`k-${k.key}`}>
                                    <span>
                                        {k.label} <small>{k.hint}</small>
                                    </span>
                                    <b>{dec(p[k.key])}</b>
                                </label>
                                <input
                                    id={`k-${k.key}`}
                                    type="range"
                                    min={0}
                                    max={k.max}
                                    step={0.05}
                                    value={p[k.key]}
                                    onChange={(e) => setP({ ...p, [k.key]: Number(e.target.value) })}
                                />
                            </li>
                        ))}
                    </ul>
                    <p className="foot">
                        <span>O ranking recalcula aqui, na hora. Nada é salvo.</span>
                        <button
                            type="button"
                            className="btn ghost"
                            disabled={!tuned}
                            onClick={() => setP(snap.defaults)}
                        >
                            Restaurar padrão
                        </button>
                    </p>
                </div>
            )}

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
                                            current={runDays(r.st)}
                                            counted={(r.st.dedaToday ?? 0) >= 80 - 1e-9}
                                            label=""
                                        />
                                    </span>
                                    <span className="num">
                                        <i>Overall</i>
                                        {pct(r.c.O)}
                                    </span>
                                    <span className="num">
                                        <i>Gravação</i>
                                        {pct(r.c.G)}
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
                                <span className="sc">{r.score}</span>
                            </button>
                            {isOpen && <Why r={r} snap={snap} p={p} />}
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
    return (
        <NewPage className="lb">
            <Global styles={styles} />
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
            {snap && !snap.empty && tab === 'rank' && <Ranking snap={snap} />}
            {snap && tab === 'rules' && (
                <article className="rules">
                    <ReactMarkdown>{snap.rulebook ?? ''}</ReactMarkdown>
                </article>
            )}
        </NewPage>
    );
};

export default NewLeaderboard;
