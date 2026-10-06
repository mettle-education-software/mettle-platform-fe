'use client';

import styled from '@emotion/styled';
import { useQuery } from '@tanstack/react-query';
import { useDedasGrid } from 'components/_melp/_deda/DedasGrid/DedasGrid';
import { useGeneralWeeklyDevelopment, useGetHpecsModules, useGetWeeklyPerformance } from 'hooks';
import { dedaPath, hpecLessonPath } from 'libs/cleanUrls';
import { contentfulImage } from 'libs/dedaHeader';
import { hpecTrail, opensLabel, readWatched } from 'libs/hpecTrail';
import { vimeoIdOf, vimeoOembedUrl, vumbnailUrl } from 'libs/newDesign';
import { ArrowRight, Play } from 'lucide-react';
import Link from 'next/link';
import { useAppContext, useMelpContext } from 'providers';
import React, { useMemo, useState } from 'react';
import { ICON } from 'themes/newDesign';
import { NewHpecTrail } from './NewHpecTrail';

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
        grid-template-columns: repeat(auto-fit, minmax(330px, 1fr));
        gap: 20px 28px;
    }
    /* texto centrado na altura da imagem: linhas elásticas em volta de selo, título e ação */
    .now .cc.today {
        grid-template-columns: 168px minmax(0, 1fr);
        grid-template-rows: 1fr auto auto auto 1fr;
        max-width: none;
    }
    .now .cc.today .img {
        grid-row: 1 / 6;
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
    .kpis {
        display: grid;
        grid-template-columns: repeat(2, minmax(150px, max-content)) 1fr;
        align-items: center;
        gap: 0 64px;
        padding: 20px 0;
        border-top: 1px solid var(--r-line);
        border-bottom: 1px solid var(--r-line);
        color: var(--r-text);
        text-decoration: none;
    }
    .kpi {
        min-width: 0;
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

    /* ---------- DEDAs recentes: uma fila fina ---------- */
    .recent {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px 24px;
        margin: 0;
        padding: 0;
        list-style: none;
    }
    .recent a {
        display: grid;
        grid-template-columns: 72px minmax(0, 1fr);
        align-items: center;
        gap: 0 14px;
        min-height: 54px;
        color: var(--r-text);
        text-decoration: none;
    }
    .recent .img {
        display: block;
        aspect-ratio: 4 / 3;
        border-radius: 8px;
        overflow: hidden;
        background: var(--r-surf);
    }
    .recent img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    .recent small {
        display: block;
        font-size: var(--r-label-size);
        font-weight: 500;
        letter-spacing: var(--r-label-track);
        text-transform: uppercase;
        color: var(--r-muted);
    }
    .recent b {
        display: block;
        margin-top: 2px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 14.5px;
        font-weight: 500;
    }
    .recent a:hover b {
        color: var(--r-gold-hi);
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
            grid-template-columns: 120px minmax(0, 1fr);
        }
        .now .cc.today b {
            font-size: 15.5px;
        }
        .kpis {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 0 24px;
            padding: 16px 0 12px;
        }
        .kpi .v {
            font-size: 28px;
        }
        .kpi .v small {
            font-size: 13px;
        }
        .kpis .go {
            justify-self: start;
            grid-column: 1 / -1;
            margin-top: 10px;
        }
        .recent {
            grid-template-columns: minmax(0, 1fr);
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

/* ---------- Agora ---------- */

/** DEDA de hoje: o atual (último liberado), da mesma consulta da grade de recentes; um clique abre. */
export const NowDeda: React.FC = () => {
    const { isTodaysDedaCompleted } = useMelpContext();
    const grid = useDedasGrid('lastDedas');
    const deda = grid.lastDedas[0];
    if (!deda) return grid.showSkeleton ? <Skel /> : null;
    const thumb = contentfulImage(deda.dedaFeaturedImage?.url, { w: 336, h: 210, fit: 'fill', fm: 'webp', q: 70 });
    return (
        <Link className="cc today" href={dedaPath(deda.dedaSlug)} aria-label={`Today’s DEDA: ${deda.dedaTitle}`}>
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
                Open DEDA <ArrowRight {...ICON} size={16} aria-hidden />
            </span>
        </Link>
    );
};

type Trail = ReturnType<typeof hpecTrail>;

/** Aula do HPEC para agora: a primeira liberada não vista; tudo visto = a próxima a liberar (com a data). */
const NowHpec: React.FC<{ trail?: Trail; error?: boolean }> = ({ trail, error }) => {
    if (error) return null;
    if (!trail) return <Skel />;
    const { here, next } = trail;
    if (here)
        return (
            <Link
                className="cc today"
                href={`${hpecLessonPath(here.lesson.id)}?play`}
                aria-label={`Watch HPEC: ${here.lesson.title}`}
            >
                <span className="img">
                    <Thumb embedUrl={here.lesson.embedUrl} />
                </span>
                <span className="meta">
                    <small>HPEC · Module {here.module.order}</small>
                </span>
                <b>{here.lesson.title}</b>
                <span className="act">
                    <Play {...ICON} size={13} className="play" aria-hidden /> Watch
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
        <Link className="cc today" href={hpecLessonPath(first.id)}>
            <span className="img">
                <Thumb embedUrl={first.embedUrl} />
            </span>
            <span className="meta">
                <small>HPEC</small>
                <em>Complete</em>
            </span>
            <b>{first.title}</b>
            <span className="act">
                Watch again <ArrowRight {...ICON} size={16} aria-hidden />
            </span>
        </Link>
    );
};

/** Percurso do HPEC (mesma liberação de useGetHpecsModules) + aulas vistas neste aparelho. */
export const useTrail = () => {
    const { melpSummary } = useMelpContext();
    const { unlockedModules, lockedModules, loading, error } = useGetHpecsModules();
    // página só no navegador (next/dynamic sem SSR): o que já foi visto é lido já no primeiro quadro
    const [watched] = useState<ReadonlySet<string>>(readWatched);
    const ready = !!melpSummary && !loading && !error;
    const trail = useMemo(
        () => (ready ? hpecTrail(unlockedModules, lockedModules, watched) : undefined),
        [ready, unlockedModules, lockedModules, watched],
    );
    return {
        trail,
        loading: !error && (loading || !melpSummary),
        error: !!error,
    };
};

export const NowRow: React.FC<{ withDeda: boolean; trail?: Trail; error?: boolean }> = ({ withDeda, trail, error }) => (
    <section aria-label="Now" className="now">
        {withDeda && <NowDeda />}
        <NowHpec trail={trail} error={error} />
    </section>
);

/* ---------- KPIs ---------- */

const Kpi: React.FC<{ value?: string; unit: string; label: string }> = ({ value, unit, label }) => (
    <span className="kpi">
        <span className="v">
            {value ?? '—'}
            {value !== undefined && <small>{unit}</small>}
        </span>
        <span className="k">{label}</span>
    </span>
);

/**
 * Dois números da LAMP, das mesmas consultas da página da LAMP (mesmas chaves do react-query), no mesmo formato
 * dela: progresso desta semana (gráfico "Weekly progress": porcentagem 0–100, eixo em `toFixed(0)%`) e dias com
 * DEDA registrado nesta semana (gráfico "Daily"). O "Overall" ficou de fora: a LAMP o mostra com duas casas
 * ("0.03%"), o que lido sozinho parece defeito. A faixa inteira abre a LAMP.
 */
export const Kpis: React.FC = () => {
    const { user } = useAppContext();
    const { melpSummary } = useMelpContext();
    const week = melpSummary?.current_deda_week;
    const { weeklyDevelopmentData } = useGeneralWeeklyDevelopment(user?.uid);
    const { graphsData } = useGetWeeklyPerformance('dedaTime', week ? `week${week}` : undefined);

    const weekIndex = weeklyDevelopmentData?.[0]?.indexOf(`W${week}`) ?? -1;
    const weekValue = weekIndex >= 0 ? weeklyDevelopmentData?.[1]?.[weekIndex] : undefined;
    const thisWeek = typeof weekValue === 'number' && Number.isFinite(weekValue) ? weekValue.toFixed(0) : undefined;
    const days = graphsData?.dedaDaily
        ? String(graphsData.dedaDaily.filter((d) => d.dedaTime > 0 || d.readingTime > 0).length)
        : undefined;

    return (
        <Link href="/imerso/lamp" className="kpis" aria-label="Your numbers — open LAMP">
            <Kpi value={thisWeek} unit="%" label="This week" />
            <Kpi value={days} unit="/7" label="DEDA days" />
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

/** Os DEDAs anteriores ao de hoje (mesma consulta da grade "Most recent"), numa fila fina. */
export const RecentDedas: React.FC<{ title?: string; aside?: React.ReactNode; skipCurrent?: boolean }> = ({
    title = 'Recent DEDAs',
    aside,
    skipCurrent = true,
}) => {
    const grid = useDedasGrid('lastDedas');
    const week = grid.currentWeek as number;
    const items = grid.lastDedas
        .map((deda, index) => ({ deda, week: week - index }))
        .filter((x) => !!x.deda)
        .slice(skipCurrent ? 1 : 0);
    if (!items.length && !grid.showSkeleton) return aside ? <div className="sh">{aside}</div> : null;
    return (
        <section aria-label={title}>
            <div className="sh">
                <h2>{title}</h2>
                {aside}
            </div>
            <ul className="recent">
                {items.map(({ deda, week: w }) => {
                    const src = contentfulImage(deda.dedaFeaturedImage?.url, {
                        w: 144,
                        h: 108,
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
                                    <small>Week {w}</small>
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
