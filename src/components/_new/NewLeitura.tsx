'use client';

import { css, Global } from '@emotion/react';
import { useQuery } from '@tanstack/react-query';
import { auth } from 'config/firebase';
import { isSignedStorageUrl } from 'libs/dedaRecording';
import {
    deltaPp,
    LEITURA_URL,
    LeituraIndex,
    markOf,
    pct,
    SeriesPoint,
    Student,
    Take,
    TakeDetail,
    uniqueWords,
    Week,
    weekPoint,
    withSep,
} from 'libs/leitura';
import React, { useState } from 'react';
import { adminService } from 'services';
import { AdminNav } from './AdminNav';
import { NewPage } from './NewPage';
import { PageHead } from './PageHead';

/*
 * Leitura do DEDA (piloto interno, só o dono): alunos → semanas → primeira x última gravação da semana, texto marcado
 * e lista de prática. Somente leitura; nada aqui fala com o backend da Plataforma. Os números vêm de um reconhecedor
 * de fala: o aviso de "inteligibilidade, não pronúncia" fica sempre visível.
 */

const get = async <T,>(path = ''): Promise<T> => {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch(LEITURA_URL + path, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    if (!res.ok) throw new Error(String(res.status));
    return res.json();
};

const styles = css`
    .lei .st {
        padding: 20px 0;
        border-top: 1px solid var(--r-line);
    }
    .lei .st > summary {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 4px 16px;
        flex-wrap: wrap;
        cursor: pointer;
        list-style: none;
    }
    .lei .st > summary::-webkit-details-marker {
        display: none;
    }
    .lei h2 {
        margin: 0;
        font-size: 19px;
        font-weight: 400;
    }
    .lei small,
    .lei .mut {
        color: var(--r-muted);
        font-size: 13px;
        font-variant-numeric: tabular-nums;
    }
    .lei .wk {
        margin: 18px 0 0;
        padding: 16px 20px;
        border: 1px solid var(--r-line);
        border-radius: var(--r-radius);
        background: var(--r-surf);
    }
    .lei .wk h3 {
        margin: 0 0 12px;
        font-size: 15px;
        font-weight: 500;
    }
    .lei .wk h3 span {
        margin-left: 8px;
        font-size: var(--r-label-size);
        letter-spacing: var(--r-label-track);
        color: var(--r-muted);
        font-weight: 400;
    }
    .lei .takes {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 12px 24px;
    }
    .lei .take b {
        display: block;
        margin-bottom: 4px;
        font-size: var(--r-label-size);
        letter-spacing: var(--r-label-track);
        text-transform: uppercase;
        color: var(--r-muted);
        font-weight: 500;
    }
    .lei .nums {
        display: flex;
        gap: 18px;
        flex-wrap: wrap;
    }
    .lei .nums div {
        display: flex;
        flex-direction: column;
    }
    .lei .nums strong {
        font-size: 22px;
        font-weight: 300;
        font-variant-numeric: tabular-nums;
    }
    .lei .delta {
        margin: 14px 0 0;
        font-size: 14px;
    }
    .lei .delta strong {
        font-weight: 500;
        color: var(--r-gold-hi);
    }
    .lei .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin: 8px 0 0;
        padding: 0;
        list-style: none;
    }
    .lei .chips li {
        padding: 2px 10px;
        border: 1px solid var(--r-line-strong);
        border-radius: 999px;
        font-size: 13px;
    }
    .lei .lab {
        margin: 14px 0 0;
        font-size: 13px;
        color: var(--r-muted);
    }
    .lei .linkbtn {
        margin-top: 14px;
        padding: 0;
        border: 0;
        background: none;
        color: var(--r-gold-hi);
        font: inherit;
        font-size: 14px;
        cursor: pointer;
    }
    .lei .text {
        margin: 6px 0 0;
        font-family: var(--r-read-font), var(--r-ui-font), serif;
        font-size: 16px;
        line-height: 2;
    }
    .lei .text .sub {
        color: var(--r-danger);
        text-decoration: underline wavy;
        text-underline-offset: 4px;
    }
    .lei .text .unclear {
        border-bottom: 1px dashed var(--r-gold-hi);
    }
    .lei .text .del {
        color: var(--r-faint);
        text-decoration: line-through;
    }
    .lei .text .skip,
    .lei .text .h {
        color: var(--r-faint);
    }
    /* cores do gráfico (validadas: dataviz validate_palette, claro e escuro); o marcador também difere (● x ■) */
    .lei {
        --lei-acc: #4a8fe0;
        --lei-pace: #b97d27;
    }
    html[data-theme='light'] .lei {
        --lei-acc: #2a78d6;
        --lei-pace: #b06a10;
    }
    .lei .warn {
        display: inline-block;
        margin: 8px 0 0;
        padding: 3px 10px;
        border: 1px solid var(--r-danger);
        border-radius: 999px;
        color: var(--r-danger);
        font-size: 13px;
    }
    .lei .play {
        margin-top: 6px;
        padding: 0;
        border: 0;
        background: none;
        color: var(--r-gold-hi);
        font: inherit;
        font-size: 13px;
        cursor: pointer;
    }
    .lei audio {
        display: block;
        width: 100%;
        max-width: 320px;
        height: 36px;
        margin-top: 6px;
    }
    .lei .trend {
        margin: 12px 0 4px;
    }
    .lei .trend .keys {
        display: flex;
        flex-wrap: wrap;
        gap: 4px 16px;
        font-size: 13px;
        color: var(--r-muted);
    }
    .lei .trend .keys i {
        display: inline-block;
        width: 10px;
        height: 10px;
        margin-right: 6px;
        vertical-align: -1px;
    }
    .lei .trend svg {
        display: block;
        width: 100%;
        max-width: 640px;
        height: auto;
        overflow: visible;
    }
    .lei .trend svg text {
        fill: var(--r-muted);
        font-size: 11px;
        font-variant-numeric: tabular-nums;
    }
    .lei .trend table {
        border-collapse: collapse;
        font-size: 13px;
        font-variant-numeric: tabular-nums;
    }
    .lei .trend td,
    .lei .trend th {
        padding: 4px 12px 4px 0;
        border-bottom: 1px solid var(--r-line);
        text-align: left;
        font-weight: 400;
    }
    .lei .trend summary {
        cursor: pointer;
        color: var(--r-muted);
        font-size: 13px;
    }
    .lei .legend {
        display: flex;
        flex-wrap: wrap;
        gap: 4px 16px;
        margin: 0 0 24px;
        font-size: 13px;
        color: var(--r-muted);
    }
    .lei .legend .text {
        margin: 0;
        font-size: 13px;
        line-height: 1.5;
    }
`;

const tip = (st: string, heard: string | null, hard?: boolean) =>
    hard
        ? 'Difícil para o reconhecedor até na narração nativa: fora da nota'
        : st === 'sub'
          ? `Ouvido: ${heard ?? ''}`
          : st === 'unclear'
            ? 'Certa, mas pouco clara para o reconhecedor'
            : st === 'del'
              ? 'Omitida'
              : st === 'skip'
                ? 'Trecho pulado'
                : undefined;

const Marked: React.FC<{ d: TakeDetail }> = ({ d }) => (
    <p className="text">
        {d.words.map((w) => {
            const cls = markOf(w);
            return (
                <React.Fragment key={w.i}>
                    {cls ? (
                        <span className={cls} title={tip(w.st, w.heard, w.hard)}>
                            {w.w}
                        </span>
                    ) : (
                        w.w
                    )}
                    {withSep(w).slice(w.w.length)}
                </React.Fragment>
            );
        })}
    </p>
);

/**
 * Áudio da gravação, sob demanda: endereço de 5 min da rota da equipe (admin-service, só METTLE_ADMIN), que registra
 * cada reprodução no log de acesso. Nada é guardado aqui.
 */
const Listen: React.FC<{ uid: string; id: string }> = ({ uid, id }) => {
    const [state, setState] = useState<'idle' | 'loading' | 'error' | string>('idle');
    const load = async () => {
        setState('loading');
        try {
            const { data } = await adminService.post<undefined, { url: string }>(
                `/v2/users/${encodeURIComponent(uid)}/deda-recordings/${encodeURIComponent(id)}/play-url`,
            );
            setState(isSignedStorageUrl(data?.url) ? data.url : 'error');
        } catch {
            setState('error');
        }
    };
    if (state.startsWith('https://')) return <audio controls autoPlay preload="none" src={state} />;
    if (state === 'error') return <p className="mut">Áudio indisponível.</p>;
    return (
        <button type="button" className="play" onClick={load} disabled={state === 'loading'}>
            {state === 'loading' ? 'Abrindo…' : 'Ouvir'}
        </button>
    );
};

const Nums: React.FC<{ label: string; t: Take; uid: string }> = ({ label, t, uid }) => (
    <div className="take">
        <b>
            {label} · {t.recordedOn} ({t.weekDay}) · {Math.round(t.audioSec)} s
        </b>
        <div className="nums">
            <div>
                <strong>{pct(t.accuracy)}</strong>
                <small>precisão</small>
            </div>
            <div>
                <strong>{pct(t.paceRatio)}</strong>
                <small>do ritmo nativo</small>
            </div>
            <div>
                <strong>{pct(t.clarity)}</strong>
                <small>claras</small>
            </div>
            <div>
                <strong>{pct(t.coverage)}</strong>
                <small>do texto</small>
            </div>
        </div>
        <Listen uid={uid} id={t.id} />
    </div>
);

const Chips: React.FC<{ words: string[] }> = ({ words }) => (
    <ul className="chips">
        {words.map((w) => (
            <li key={w}>{w}</li>
        ))}
    </ul>
);

const WeekCard: React.FC<{ wk: Week; uid: string }> = ({ wk, uid }) => {
    const [open, setOpen] = useState(false);
    const detail = useQuery({
        queryKey: ['leitura', wk.detail],
        enabled: open,
        staleTime: 5 * 60_000,
        queryFn: () => get<{ first: TakeDetail; last: TakeDetail | null }>('/' + wk.detail),
    });
    const c = wk.compare;
    const practice = c ? uniqueWords(c.practice) : [];
    return (
        <section className="wk">
            <h3>
                {wk.dedaId}
                <span>{wk.week.replace('week', 'W')}</span>
            </h3>
            <div className="takes">
                <Nums label="Primeira" t={wk.first} uid={uid} />
                {wk.last ? (
                    <Nums label="Última" t={wk.last} uid={uid} />
                ) : (
                    <p className="mut">Só uma gravação com leitura.</p>
                )}
            </div>
            {c && (
                <p className="delta">
                    Primeira → última: precisão <strong>{deltaPp(c.accuracyDelta)}</strong> · ritmo{' '}
                    <strong>{deltaPp(c.paceDelta)}</strong> <small>· {c.commonWords} palavras lidas nas duas</small>
                </p>
            )}
            {c?.paceUpAccuracyDown && (
                <p className="warn" role="note">
                    Alerta: mais rápido, mas menos preciso — não é progresso
                </p>
            )}
            {practice.length > 0 && (
                <>
                    <p className="lab">Para praticar (erradas ou pouco claras nas duas)</p>
                    <Chips words={practice} />
                </>
            )}
            {c && c.becameClear.length > 0 && (
                <>
                    <p className="lab">Ficaram claras</p>
                    <Chips words={uniqueWords(c.becameClear.map((w) => ({ w })))} />
                </>
            )}
            <button type="button" className="linkbtn" aria-expanded={open} onClick={() => setOpen(!open)}>
                {open ? 'Fechar texto marcado' : 'Ver texto marcado'}
            </button>
            {open && detail.isLoading && <p className="mut">Carregando…</p>}
            {open && detail.isError && <p className="mut">Não foi possível carregar.</p>}
            {open && detail.data && (
                <>
                    <p className="lab">Primeira</p>
                    <Marked d={detail.data.first} />
                    {detail.data.last && (
                        <>
                            <p className="lab">Última</p>
                            <Marked d={detail.data.last} />
                        </>
                    )}
                </>
            )}
        </section>
    );
};

/**
 * Ritmo relativo (÷ nativo) e precisão por semana, num eixo só (os dois em %), com a última gravação de cada semana.
 * Linha fina, marcadores distintos (● precisão, ■ ritmo), rótulo direto no último ponto, dica ao passar o mouse e tabela.
 */
const Trend: React.FC<{ series: SeriesPoint[] }> = ({ series }) => {
    const pts = series.map((p) => ({ ...p, ...weekPoint(p) }));
    if (!pts.some((p) => p.pace != null || p.acc != null)) return null;
    const W = 560;
    const H = 150;
    const L = 36;
    const R = 64;
    const T = 10;
    const B = 22;
    const top = Math.max(1, ...pts.map((p) => p.pace ?? 0)) * 1.05;
    const x = (i: number) => (pts.length === 1 ? L + (W - L - R) / 2 : L + (i * (W - L - R)) / (pts.length - 1));
    const y = (v: number) => T + (1 - v / top) * (H - T - B);
    const line = (k: 'pace' | 'acc') =>
        pts
            .map((p, i) => (p[k] == null ? null : `${x(i)},${y(p[k] as number)}`))
            .filter(Boolean)
            .join(' ');
    const lastOf = (k: 'pace' | 'acc') => [...pts.keys()].reverse().find((i) => pts[i][k] != null);
    const label = (p: (typeof pts)[number]) =>
        `${p.dedaId} ${p.week.replace('week', 'W')}: precisão ${pct(p.acc)}, ritmo ${pct(p.pace)} do nativo`;
    return (
        <div className="trend">
            <div className="keys" aria-hidden>
                <span>
                    <i style={{ background: 'var(--lei-acc)', borderRadius: '50%' }} />
                    precisão
                </span>
                <span>
                    <i style={{ background: 'var(--lei-pace)' }} />
                    ritmo ÷ nativo
                </span>
            </div>
            <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Precisão e ritmo relativo por semana">
                {[0.5, 1].map((g) => (
                    <g key={g}>
                        <line x1={L} x2={W - R} y1={y(g)} y2={y(g)} stroke="var(--r-line)" />
                        <text x={L - 6} y={y(g) + 4} textAnchor="end">
                            {g * 100}%
                        </text>
                    </g>
                ))}
                <line x1={L} x2={W - R} y1={y(0)} y2={y(0)} stroke="var(--r-line-strong)" />
                {pts.map((p, i) => (
                    <text key={p.week + p.dedaId} x={x(i)} y={H - 6} textAnchor="middle">
                        {p.week.replace('week', 'W')}
                    </text>
                ))}
                <polyline points={line('acc')} fill="none" stroke="var(--lei-acc)" strokeWidth={2} />
                <polyline points={line('pace')} fill="none" stroke="var(--lei-pace)" strokeWidth={2} />
                {pts.map((p, i) => (
                    <g key={'m' + i}>
                        <title>{label(p)}</title>
                        <rect x={x(i) - 12} y={T} width={24} height={H - T - B} fill="transparent" />
                        {p.acc != null && (
                            <circle
                                cx={x(i)}
                                cy={y(p.acc)}
                                r={4.5}
                                fill="var(--lei-acc)"
                                stroke="var(--r-surf)"
                                strokeWidth={2}
                            />
                        )}
                        {p.pace != null && (
                            <rect
                                x={x(i) - 4.5}
                                y={y(p.pace) - 4.5}
                                width={9}
                                height={9}
                                rx={1.5}
                                fill="var(--lei-pace)"
                                stroke="var(--r-surf)"
                                strokeWidth={2}
                            />
                        )}
                    </g>
                ))}
                {(['acc', 'pace'] as const).map((k) => {
                    const i = lastOf(k);
                    return i == null ? null : (
                        <text key={k} x={x(i) + 10} y={y(pts[i][k] as number) + 4}>
                            {pct(pts[i][k])}
                        </text>
                    );
                })}
            </svg>
            <details>
                <summary>Ver tabela</summary>
                <table>
                    <thead>
                        <tr>
                            <th>Semana</th>
                            <th>Precisão</th>
                            <th>Ritmo ÷ nativo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pts.map((p) => (
                            <tr key={p.week + p.dedaId}>
                                <td>
                                    {p.dedaId} {p.week.replace('week', 'W')}
                                </td>
                                <td>{pct(p.acc)}</td>
                                <td>{pct(p.pace)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </details>
        </div>
    );
};

const StudentRow: React.FC<{ s: Student; open: boolean }> = ({ s, open }) => (
    <details className="st" open={open}>
        <summary>
            <h2>{s.firstName}</h2>
            <small>
                {s.weeks.length} {s.weeks.length === 1 ? 'semana' : 'semanas'}
            </small>
        </summary>
        {s.series && <Trend series={s.series} />}
        {s.persistent.length > 0 && (
            <>
                <p className="lab">Voltam a aparecer em semanas diferentes</p>
                <Chips words={s.persistent.map(([w]) => w)} />
            </>
        )}
        {s.weeks.map((wk) => (
            <WeekCard key={wk.detail} wk={wk} uid={s.uid} />
        ))}
    </details>
);

const NewLeitura: React.FC = () => {
    const q = useQuery({ queryKey: ['leitura'], staleTime: 60_000, retry: 1, queryFn: () => get<LeituraIndex>() });
    const idx = q.data;
    const when = idx?.generatedAt
        ? new Date(idx.generatedAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
        : null;
    return (
        <NewPage className="narrow lei">
            <Global styles={styles} />
            <AdminNav />
            <PageHead
                eyebrow="Interno · só você vê"
                title="Leitura do DEDA"
                subtitle={when ? `Atualizado em ${when} · ${idx?.model?.join(', ')}` : undefined}
            />
            <div className="notice">
                <div>
                    <b>Inteligibilidade, não pronúncia</b>
                    <p>
                        {idx?.caveat ??
                            'O reconhecedor pode “consertar” uma palavra mal pronunciada quando o contexto a torna previsível. Use como sinal, não como nota.'}
                    </p>
                    <p>
                        {idx?.paceCaveat ??
                            'Ritmo é relativo à narração de cada DEDA; algumas narrações originais são lentas. Mais rápido com menos precisão é alerta, não progresso.'}
                    </p>
                </div>
            </div>
            <p className="legend">
                <span className="text">
                    <span className="sub">trocada</span>
                </span>
                <span className="text">
                    <span className="unclear">pouco clara</span>
                </span>
                <span className="text">
                    <span className="del">omitida</span>
                </span>
                <span className="text">
                    <span className="h">difícil até na narração (fora da nota)</span>
                </span>
            </p>
            {q.isLoading && <p className="mut">Carregando…</p>}
            {q.isError && <p className="mut">Não foi possível carregar a análise.</p>}
            {idx && !idx.students.length && <p className="mut">Ainda não há semanas com duas gravações analisadas.</p>}
            {idx?.students.map((s, i) => <StudentRow key={s.uid} s={s} open={i === 0} />)}
        </NewPage>
    );
};

export default NewLeitura;
