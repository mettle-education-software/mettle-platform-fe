'use client';

import styled from '@emotion/styled';
import { useQuery } from '@tanstack/react-query';
import { useDedasGrid } from 'components/_melp/_deda/DedasGrid/DedasGrid';
import { useGetHpecsModules, useOverallProgress } from 'hooks';
import { useDedaRun } from 'hooks/melp/lampDays';
import { useHpecProgress } from 'hooks/useHpecProgress';
import { statisticsColors } from 'libs';
import { dedaPath, hpecLessonPath } from 'libs/cleanUrls';
import { contentfulImage } from 'libs/dedaHeader';
import { hpecTrail, opensLabel } from 'libs/hpecTrail';
import { vimeoIdOf, vimeoOembedUrl, vumbnailUrl } from 'libs/newDesign';
import { IMERSO_PRODUCT } from 'libs/productAccess';
import { ArrowRight, Play } from 'lucide-react';
import Link from 'next/link';
import { AccessCtaBlock, useAppContext, useMelpContext, useProductAccess } from 'providers';
import React, { useMemo, useState } from 'react';
import { ICON } from 'themes/newDesign';
import { DailyGoal } from './DailyGoal';
import { NewHpecTrail } from './NewHpecTrail';
import { RunChip } from './RunGold';

/* Estilos só desta página (as classes comuns de components/_new/ui ficam como estão). */
export const Dash = styled.div`
    /* anel de foco explícito nos links desta página (um estilo global de links vence o :focus-visible geral) */
    a:focus-visible {
        outline: 2px solid var(--r-gold-hi);
        outline-offset: 2px;
    }

    .ph h1 {
        font-size: 22px;
    }

    /* ---------- Agora: DEDA de hoje + aula do HPEC ---------- */
    .now {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(440px, 1fr));
        gap: 20px 28px;
    }
    /* texto centrado na altura da imagem: linhas elásticas em volta de selo, título e ação */
    /* as duas imagens do mesmo tamanho, em 16:9 inteiro (a miniatura do Vimeo traz o logo com margem própria) */
    .now .cc.today {
        grid-template-columns: 224px minmax(0, 1fr);
        grid-template-rows: 1fr auto auto auto 1fr;
        max-width: none;
    }
    .now .cc.today .img {
        grid-row: 1 / 6;
        aspect-ratio: 16 / 9;
    }
    .now .cc.today .meta {
        grid-area: 2 / 2;
    }
    .now .cc.today b {
        grid-area: 3 / 2;
    }
    .now .cc.today .act {
        grid-area: 4 / 2;
    }
    .now .cc.today b {
        font-size: 17px;
    }
    .now .cc.today .act svg.play {
        width: 13px;
        height: 13px;
        fill: currentColor;
    }
    .now .cc.wait {
        cursor: default;
    }
    .now .cc.wait .act {
        color: var(--r-muted);
    }
    .now .cc.wait img {
        opacity: 0.55;
        filter: saturate(0.6);
    }

    /* ---------- KPIs: a faixa inteira leva à LAMP ---------- */
    /* uma linha de base para tudo: os rótulos (OVERALL, THIS WEEK, as frentes) e a Run assentam embaixo */
    .kpis {
        display: grid;
        grid-template-columns: max-content max-content max-content minmax(424px, 1fr) auto;
        align-items: end;
        gap: 16px 48px;
        padding: 20px 0;
        border-top: 1px solid var(--r-line);
        border-bottom: 1px solid var(--r-line);
        color: var(--r-text);
        text-decoration: none;
    }
    .kpis.nowk {
        grid-template-columns: max-content max-content minmax(424px, 1fr) auto;
    }
    .kpi {
        min-width: 0;
    }
    /* classes genéricas (.row da página, .bar da casca) não vazam para a faixa */
    .kpis .cats .row {
        padding: 0;
        border-bottom: 0;
    }
    .kpis .cats .bar {
        display: block;
        padding: 0;
        border-bottom: 0;
    }
    .kpi.wk .k {
        margin-top: 4px;
    }
    .kpi .v {
        display: block;
        font-size: 34px;
        font-weight: 300;
        line-height: 1.1;
        letter-spacing: -0.01em;
    }
    .kpi .v small {
        margin-left: 2px;
        font-size: 15px;
        font-weight: 400;
        letter-spacing: 0;
        color: var(--r-muted);
    }
    .kpi .k {
        display: block;
        margin-top: 6px;
        font-size: var(--r-label-size);
        font-weight: 500;
        letter-spacing: var(--r-label-track);
        text-transform: uppercase;
        color: var(--r-muted);
    }
    /* as quatro frentes da LAMP: rótulo e valor numa linha, barra fina com a cor da LAMP embaixo */
    .cats {
        display: grid;
        grid-template-columns: repeat(4, minmax(88px, 1fr));
        gap: 12px 24px;
        margin: 0;
        padding: 0;
        list-style: none;
    }
    .cats li {
        min-width: 0;
    }
    .cats .row {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 10px;
        white-space: nowrap;
        font-size: 13px;
        letter-spacing: 0.01em;
        color: var(--r-muted);
    }
    .cats .row b {
        font-variant-numeric: tabular-nums;
        font-weight: 500;
        color: var(--r-text);
    }
    .cats .bar {
        display: block;
        height: 2px;
        margin-top: 8px;
        border-radius: 1px;
        background: var(--r-track);
        overflow: hidden;
    }
    .cats .bar i {
        display: block;
        height: 100%;
        min-width: 2px;
        border-radius: inherit;
    }
    /* telas médias: Run, Overall, semana e o link numa linha; as quatro frentes embaixo, na largura toda */
    @media (max-width: 1279px) and (min-width: 861px) {
        .kpis {
            grid-template-columns: max-content max-content max-content minmax(0, 1fr);
        }
        .kpis.nowk {
            grid-template-columns: max-content max-content minmax(0, 1fr);
        }
        .kpis .cats {
            grid-column: 1 / -1;
            grid-row: 2;
        }
    }
    .kpis .go {
        justify-self: end;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 13.5px;
        letter-spacing: 0.01em;
        color: var(--r-gold-hi);
    }
    .kpis .go svg {
        transition: transform var(--r-ease);
    }
    .kpis:hover .go svg {
        transform: translateX(2px);
    }

    /* ---------- DEDAs recentes: cards grandes 16:9, sempre UMA fila cheia (quantos cabem na largura) ---------- */
    .rd {
        container-type: inline-size;
    }
    .recent {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 20px;
        margin: 0;
        padding: 0;
        list-style: none;
    }
    .recent li:nth-child(n + 5) {
        display: none;
    }
    @container (min-width: 1200px) {
        .recent {
            grid-template-columns: repeat(5, minmax(0, 1fr));
        }
        .recent li:nth-child(5) {
            display: block;
        }
    }
    @container (max-width: 780px) {
        .recent {
            grid-template-columns: repeat(3, minmax(0, 1fr));
        }
        .recent li:nth-child(n + 4) {
            display: none;
        }
    }
    .recent a {
        display: block;
        color: var(--r-text);
        text-decoration: none;
    }
    .recent .img {
        display: block;
        aspect-ratio: 16 / 9;
        border-radius: var(--r-radius);
        overflow: hidden;
        background: var(--r-surf);
    }
    .recent img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 400ms ease;
    }
    .recent a:hover img {
        transform: scale(1.03);
    }
    .recent small {
        display: block;
        margin-top: 12px;
        font-size: var(--r-label-size);
        font-weight: 500;
        letter-spacing: var(--r-label-track);
        text-transform: uppercase;
        color: var(--r-muted);
    }
    .recent b {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        margin-top: 3px;
        overflow: hidden;
        line-height: 1.3;
        font-size: 15.5px;
        font-weight: 500;
    }
    .recent a:hover b {
        color: var(--r-gold-hi);
    }

    /* telas largas: a imagem do "Agora" acompanha a coluna maior */
    @media (min-width: 1600px) {
        .now .cc.today {
            grid-template-columns: 288px minmax(0, 1fr);
        }
        .now .cc.today b {
            font-size: 18px;
        }
    }
    @media (max-width: 860px) {
        .hp .sh {
            flex-wrap: wrap;
        }
        .hp .sh > div {
            flex: 1 1 100%;
        }
        .ph h1 {
            font-size: 20px;
        }
        .now {
            grid-template-columns: minmax(0, 1fr);
        }
        .now .cc.today {
            grid-template-columns: 144px minmax(0, 1fr);
        }
        .now .cc.today b {
            font-size: 15.5px;
        }
        .kpis,
        .kpis.nowk {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 16px;
            padding: 18px 0 12px;
        }
        .cats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px 24px;
        }
        .kpi .v {
            font-size: 28px;
        }
        .kpi .v small {
            font-size: 13px;
        }
        .kpis .go {
            justify-self: start;
        }
        .kpis .cats,
        .kpis .go {
            grid-column: 1 / -1;
        }
        /* celular: cards grandes numa fila que rola de lado (todos os cinco) */
        .recent {
            display: flex;
            gap: 14px;
            margin: 0 -20px;
            padding: 0 20px 6px;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            scroll-padding-inline: 20px;
            scrollbar-width: none;
        }
        .recent::-webkit-scrollbar {
            display: none;
        }
        .recent li:nth-child(n) {
            display: block;
            flex: 0 0 74%;
            scroll-snap-align: start;
        }
    }
`;

/** Miniatura do Vimeo (oEmbed; vumbnail se o oEmbed não der; sem imagem, o fundo neutro do card). */
const Thumb: React.FC<{ embedUrl: string }> = ({ embedUrl }) => {
    const id = vimeoIdOf(embedUrl);
    const [failed, setFailed] = useState(false);
    const { data: oembed, isPending } = useQuery({
        queryKey: ['vimeo-oembed', id],
        queryFn: () =>
            fetch(vimeoOembedUrl(id as string))
                .then((r) => (r.ok ? r.json() : null))
                .then((j: { thumbnail_url?: string } | null) => j?.thumbnail_url ?? null)
                .catch(() => null),
        enabled: !!id,
        staleTime: Infinity,
        gcTime: Infinity,
        retry: false,
    });
    if (!id || isPending || failed) return null;
    return (
        // eslint-disable-next-line @next/next/no-img-element -- miniatura do Vimeo
        <img src={oembed || vumbnailUrl(id)} alt="" loading="lazy" onError={() => setFailed(true)} />
    );
};

const Skel: React.FC = () => (
    <div className="cc today skel" aria-hidden>
        <span className="img" />
    </div>
);

/* ---------- estados sem painel (falha, suspenso) ---------- */

/** O resumo do IMERSO não veio (5xx, rede): uma linha calma e "Try again" — nunca esqueleto eterno. */
export const SummaryError: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
    <div className="notice" role="alert">
        <div>
            <b>We couldn’t load your IMERSO</b>
        </div>
        <button type="button" className="btn line" onClick={onRetry}>
            Try again
        </button>
    </div>
);

/** MELP_SUSPENDED: o aviso e a saída (Suporte). */
export const SuspendedNotice: React.FC = () => (
    <div className="notice" role="status">
        <div>
            <b>Your IMERSO access is suspended</b>
        </div>
        <Link className="btn line" href="/suporte" data-access-allow>
            Contact support
        </Link>
    </div>
);

/**
 * Conta sem programa do IMERSO (o resumo respondeu 404: Leitura que nunca começou, login restaurado): em Leitura, o
 * convite de renovação; senão, uma linha calma com o Suporte. Nunca carregando (PF2-01).
 */
export const NoProgram: React.FC = () => {
    const readOnly = useProductAccess().access(IMERSO_PRODUCT).state === 'expired';
    if (readOnly) return <AccessCtaBlock target={{ product: IMERSO_PRODUCT }} />;
    return (
        <div className="notice" role="status">
            <div>
                <b>Your IMERSO program hasn’t started yet</b>
            </div>
            <Link className="btn line" href="/suporte" data-access-allow>
                Contact support
            </Link>
        </div>
    );
};

/* ---------- Agora ---------- */

/** DEDA de hoje: o atual (último liberado), da mesma consulta da grade de recentes; um clique abre (em Leitura, renova). */
export const NowDeda: React.FC<{ renew?: string }> = ({ renew }) => {
    const { isTodaysDedaCompleted } = useMelpContext();
    const grid = useDedasGrid('lastDedas');
    // o de hoje (libs/dedaClock): no relógio novo, antes de a rotação da semana sair não há "de hoje" — nada aparece
    const deda = grid.lastDedas.find((item) => item?.dedaId === grid.currentDeda);
    if (!deda) return grid.showSkeleton ? <Skel /> : null;
    const thumb = contentfulImage(deda.dedaFeaturedImage?.url, { w: 448, h: 252, fit: 'fill', fm: 'webp', q: 70 });
    return (
        <Link
            className="cc today"
            href={renew ?? dedaPath(deda.dedaSlug)}
            aria-label={renew ? `Renew to open today’s DEDA: ${deda.dedaTitle}` : `Today’s DEDA: ${deda.dedaTitle}`}
        >
            <span className="img">
                {/* eslint-disable-next-line @next/next/no-img-element -- imagem do Contentful */}
                {thumb && <img src={thumb} alt="" />}
            </span>
            <span className="meta">
                <small>Today’s DEDA</small>
                {isTodaysDedaCompleted && <em>Done today</em>}
            </span>
            <b>{deda.dedaTitle}</b>
            <span className="act">
                {renew ? 'Renew' : 'Open DEDA'} <ArrowRight {...ICON} size={16} aria-hidden />
            </span>
        </Link>
    );
};

type Trail = ReturnType<typeof hpecTrail>;

/** Aula do HPEC para agora: a primeira liberada não vista; tudo visto = a próxima a liberar (com a data). */
const NowHpec: React.FC<{ trail?: Trail; error?: boolean; renew?: string }> = ({ trail, error, renew }) => {
    if (error) return null;
    if (!trail) return <Skel />;
    const { here, next } = trail;
    if (here)
        return (
            <Link
                className="cc today"
                href={renew ?? `${hpecLessonPath(here.lesson.id)}?play`}
                aria-label={renew ? `Renew to watch HPEC: ${here.lesson.title}` : `Watch HPEC: ${here.lesson.title}`}
            >
                <span className="img">
                    <Thumb embedUrl={here.lesson.embedUrl} />
                </span>
                <span className="meta">
                    <small>HPEC · Module {here.module.order}</small>
                </span>
                <b>{here.lesson.title}</b>
                <span className="act">
                    {renew ? (
                        <>
                            Renew <ArrowRight {...ICON} size={16} aria-hidden />
                        </>
                    ) : (
                        <>
                            <Play {...ICON} size={13} className="play" aria-hidden /> Watch
                        </>
                    )}
                </span>
            </Link>
        );
    if (next)
        return (
            <div className="cc today wait">
                <span className="img">
                    <Thumb embedUrl={next.lesson.embedUrl} />
                </span>
                <span className="meta">
                    <small>HPEC · Module {next.module.order}</small>
                </span>
                <b>{next.lesson.title}</b>
                <span className="act">{opensLabel(next.module.unlockDate)}</span>
            </div>
        );
    if (!trail.total) return null;
    // tudo liberado e visto: rever a partir do começo
    const first = trail.modules[0].lessons[0];
    return (
        <Link
            className="cc today"
            href={renew ?? hpecLessonPath(first.id)}
            aria-label={renew ? `Renew to watch HPEC again: ${first.title}` : `Watch HPEC again: ${first.title}`}
        >
            <span className="img">
                <Thumb embedUrl={first.embedUrl} />
            </span>
            <span className="meta">
                <small>HPEC</small>
                <em>Complete</em>
            </span>
            <b>{first.title}</b>
            <span className="act">
                {renew ? 'Renew' : 'Watch again'} <ArrowRight {...ICON} size={16} aria-hidden />
            </span>
        </Link>
    );
};

/** Percurso do HPEC (mesma liberação de useGetHpecsModules) + aulas vistas neste aparelho. */
export const useTrail = () => {
    const { melpSummary } = useMelpContext();
    const { unlockedModules, lockedModules, loading, error } = useGetHpecsModules();
    // aulas concluídas de verdade (Worker, todos os aparelhos); sem elas, vale só a regra por módulo
    const { done } = useHpecProgress();
    // null = conta sem programa: pronto (sem aula liberada), nunca carregando
    const ready = melpSummary !== undefined && !loading && !error;
    const trail = useMemo(
        () => (ready ? hpecTrail(unlockedModules, lockedModules, new Set(Object.keys(done))) : undefined),
        [ready, unlockedModules, lockedModules, done],
    );
    return {
        trail,
        loading: !error && (loading || melpSummary === undefined),
        error: !!error,
    };
};

/** "Agora": o DEDA de hoje e a aula do HPEC; em Leitura (`renew`), as duas levam à renovação (PF2-07). */
export const NowRow: React.FC<{ withDeda: boolean; trail?: Trail; error?: boolean; renew?: string }> = ({
    withDeda,
    trail,
    error,
    renew,
}) => (
    <section aria-label="Now" className="now">
        {withDeda && <NowDeda renew={renew} />}
        <NowHpec trail={trail} error={error} renew={renew} />
    </section>
);

/* ---------- KPIs ---------- */

/**
 * O "Overall" da LAMP: o total e as quatro frentes (DEDA, Active, Passive, Review), da mesma consulta da página da
 * LAMP (useOverallProgress, mesma chave) e no mesmo formato dela (total com duas casas; frentes arredondadas; Review
 * só quando existe). A faixa inteira abre a LAMP.
 */
export const Kpis: React.FC = () => {
    const { user } = useAppContext();
    const { overallData } = useOverallProgress(user?.uid);
    const by = overallData?.byActivity;
    const cats: [string, number | null | undefined, string][] = [
        ['DEDA', by?.deda, statisticsColors.DEDA],
        ['Active', by?.active, statisticsColors.Active],
        ['Passive', by?.passive, statisticsColors.Passive],
        ...(by && by.review !== null && by.review !== undefined
            ? ([['Review', by.review, statisticsColors.Review]] as [string, number, string][])
            : []),
    ];
    const total = overallData?.overallPerformance;
    // DEDA Run (o KPI principal), sempre ao lado do Overall: mesma leitura da aba Input, 2 semanas e cresce se precisar
    const run = useDedaRun(2);
    return (
        <Link
            href="/imerso/lamp"
            className={run.running ? 'kpis' : 'kpis nowk'}
            aria-label="DEDA Run and overall progress — open LAMP"
        >
            <span className="kpi run">
                {/* Run ainda carregando (ou com o histórico incompleto): nada de número menor que o real */}
                {(!run.loading || run.current > 0) && (
                    <RunChip current={run.current} counted={run.todayCounted} large />
                )}
            </span>
            <span className="kpi">
                <span className="v">
                    {typeof total === 'number' ? total.toFixed(2) : '—'}
                    {typeof total === 'number' && <small>%</small>}
                </span>
                <span className="k">Overall</span>
            </span>
            {/* "This week" só com a LAMP contando: pausada ou concluída não tem semana em curso (PF-07) */}
            {run.running && (
                <span className="kpi wk">
                    <DailyGoal days={run.newestFirst} week={run.currentWeek} today={run.today} compact />
                    <span className="k">This week</span>
                </span>
            )}
            <ul className="cats">
                {cats.map(([name, value, color]) => (
                    <li key={name}>
                        <span className="row">
                            {name}
                            <b>{typeof value === 'number' ? `${Math.round(value)}%` : '—'}</b>
                        </span>
                        <span className="bar" aria-hidden>
                            <i style={{ width: `${Math.min(100, Math.max(0, value ?? 0))}%`, background: color }} />
                        </span>
                    </li>
                ))}
            </ul>
            <span className="go">
                LAMP <ArrowRight {...ICON} size={16} aria-hidden />
            </span>
        </Link>
    );
};

/* ---------- HPEC ---------- */

export const HpecSection: React.FC<{ trail?: Trail; loading: boolean; error: boolean }> = ({
    trail,
    loading,
    error,
}) => {
    const title = (
        <>
            HPEC
            {!!trail?.moduleNumber && (
                <span>
                    Module {trail.moduleNumber} of {trail.moduleCount}
                </span>
            )}
        </>
    );
    return (
        <section aria-label="HPEC" aria-busy={loading || undefined} className="hp">
            {trail && trail.total > 0 && !error ? (
                <NewHpecTrail modules={trail.modules} title={title} />
            ) : (
                <>
                    <div className="sh">
                        <h2>{title}</h2>
                    </div>
                    {error ? (
                        <p className="hint">Couldn’t load the HPEC lessons. Please try again later.</p>
                    ) : loading || !trail ? (
                        <div className="hrow" aria-hidden>
                            <div className="hc skel">
                                <span className="img" />
                            </div>
                        </div>
                    ) : (
                        <p className="hint">No HPEC lessons yet.</p>
                    )}
                </>
            )}
        </section>
    );
};

/* ---------- DEDAs recentes ---------- */

/** Os DEDAs anteriores ao de hoje, em cards grandes: uma fila cheia no computador, fila que rola no celular. */
export const RecentDedas: React.FC<{ title?: string; aside?: React.ReactNode; skipCurrent?: boolean }> = ({
    title = 'Recent DEDAs',
    aside,
    skipCurrent = true,
}) => {
    // os DEDAs vêm da lista completa (a mesma consulta de "Explore all DEDAs", em cache entre as páginas); a ordem é a
    // de liberação (melp summary), do mais recente para trás
    const grid = useDedasGrid('allDedas');
    const byId = new Map((grid.allDedas ?? []).map((deda) => [deda.dedaId, deda]));
    const items = grid.recentIds
        .map((id, index) => ({ deda: byId.get(id), week: grid.weekOf(id, index) }))
        .filter((x, index) => !(skipCurrent && index === 0 && x.deda?.dedaId === grid.currentDeda))
        .filter((x): x is { deda: NonNullable<typeof x.deda>; week: number | undefined } => !!x.deda)
        .slice(0, 5);
    if (!items.length && !grid.showSkeleton) return aside ? <div className="sh">{aside}</div> : null;
    return (
        <section aria-label={title} className="rd">
            <div className="sh">
                <h2>{title}</h2>
                {aside}
            </div>
            <ul className="recent">
                {items.map(({ deda, week: w }) => {
                    const src = contentfulImage(deda.dedaFeaturedImage?.url, {
                        w: 640,
                        h: 360,
                        fit: 'fill',
                        fm: 'webp',
                        q: 70,
                    });
                    return (
                        <li key={deda.dedaSlug}>
                            <Link href={dedaPath(deda.dedaSlug)}>
                                <span className="img">
                                    {/* eslint-disable-next-line @next/next/no-img-element -- imagem do Contentful */}
                                    {src && <img src={src} alt="" loading="lazy" />}
                                </span>
                                <span>
                                    {!!w && <small>Week {w}</small>}
                                    <b>{deda.dedaTitle}</b>
                                </span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
};
