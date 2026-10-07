'use client';

import { css, Global } from '@emotion/react';
import { useQuery } from '@tanstack/react-query';
import { auth } from 'config/firebase';
import {
    deltaPp,
    LEITURA_URL,
    LeituraIndex,
    markOf,
    pct,
    Student,
    Take,
    TakeDetail,
    uniqueWords,
    Week,
} from 'libs/leitura';
import React, { useState } from 'react';
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
                    )}{' '}
                </React.Fragment>
            );
        })}
    </p>
);

const Nums: React.FC<{ label: string; t: Take }> = ({ label, t }) => (
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
                <strong>{pct(t.clarity)}</strong>
                <small>claras</small>
            </div>
            <div>
                <strong>{pct(t.coverage)}</strong>
                <small>do texto</small>
            </div>
        </div>
    </div>
);

const Chips: React.FC<{ words: string[] }> = ({ words }) => (
    <ul className="chips">
        {words.map((w) => (
            <li key={w}>{w}</li>
        ))}
    </ul>
);

const WeekCard: React.FC<{ wk: Week }> = ({ wk }) => {
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
                <Nums label="Primeira" t={wk.first} />
                {wk.last ? <Nums label="Última" t={wk.last} /> : <p className="mut">Só uma gravação com leitura.</p>}
            </div>
            {c && (
                <p className="delta">
                    Precisão, primeira → última: <strong>{deltaPp(c.accuracyDelta)}</strong>{' '}
                    <small>· {c.commonWords} palavras lidas nas duas</small>
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

const StudentRow: React.FC<{ s: Student; open: boolean }> = ({ s, open }) => (
    <details className="st" open={open}>
        <summary>
            <h2>{s.firstName}</h2>
            <small>
                {s.weeks.length} {s.weeks.length === 1 ? 'semana' : 'semanas'}
            </small>
        </summary>
        {s.persistent.length > 0 && (
            <>
                <p className="lab">Voltam a aparecer em semanas diferentes</p>
                <Chips words={s.persistent.map(([w]) => w)} />
            </>
        )}
        {s.weeks.map((wk) => (
            <WeekCard key={wk.detail} wk={wk} />
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
