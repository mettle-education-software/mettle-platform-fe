'use client';

import { CourseCardData, useCourseCards } from 'components/molecules/MettleCoursesList/MettleCoursesList';
import { useFeaturedDedaData } from 'hooks/queries/dedaQueries';
import { dedaPath } from 'libs/cleanUrls';
import { isCalendarClock, lampToday, todaysDedaId, weekDayLabel } from 'libs/dedaClock';
import { contentfulImage } from 'libs/dedaHeader';
import { EBOOK, EBOOK_PATH, EBOOK_PRODUCT, ebookOpen } from 'libs/ebook';
import { firstName } from 'libs/newDesign';
import { IMERSO_PRODUCT } from 'libs/productAccess';
import { ArrowRight, Lock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppContext, useMelpContext, useProductAccess } from 'providers';
import React from 'react';
import { ICON } from 'themes/newDesign';
import { NewPage } from './NewPage';

/** DEDA de hoje em um clique: só com o DEDA em andamento e o IMERSO ativo (mesmo destino da home do IMERSO). */
const TodayDeda: React.FC = () => {
    const router = useRouter();
    const { melpSummary, isTodaysDedaCompleted } = useMelpContext();
    // relógio novo: o DEDA não para (pausa, espera da segunda) — aparece com o de hoje publicado; legado: só em andamento
    const currentId = todaysDedaId(melpSummary);
    const shown = isCalendarClock(melpSummary)
        ? !!melpSummary?.deda_calendar_day
        : melpSummary?.melp_status === 'DEDA_STARTED';
    const featured = useFeaturedDedaData(shown && currentId ? currentId : undefined);
    const lampDay = lampToday(melpSummary);
    const deda = featured.data?.dedaContentCollection.items[0];
    if (!deda) return null;
    const thumb = contentfulImage(deda.dedaFeaturedImage?.url, { w: 320, h: 200, fit: 'fill', fm: 'webp', q: 70 });
    return (
        <section aria-label="Today’s DEDA">
            <div className="sh">
                <h2>Today’s DEDA</h2>
            </div>
            <button type="button" className="cc today" onClick={() => router.push(dedaPath(deda.dedaSlug))}>
                <span className="img">
                    {/* eslint-disable-next-line @next/next/no-img-element -- imagem do Contentful */}
                    {thumb && <img src={thumb} alt="" />}
                </span>
                <span className="meta">
                    {lampDay && <small>{weekDayLabel(lampDay.week, lampDay.day)}</small>}
                    {isTodaysDedaCompleted && <em>Done today</em>}
                </span>
                <b>{deda.dedaTitle}</b>
                <span className="act">
                    Open DEDA <ArrowRight {...ICON} size={16} aria-hidden />
                </span>
            </button>
        </section>
    );
};

/**
 * Home da plataforma nova: cumprimento, citação e os cards dos programas/cursos (IMERSO + consulta de cursos),
 * com o mesmo acesso, destinos e estados da lista atual (useCourseCards). O card inteiro é a ação: um clique.
 */
export const NewHome: React.FC = () => {
    const { user } = useAppContext();
    const { access } = useProductAccess();
    const { cards, loading, error, openCta } = useCourseCards();
    const imersoState = access(IMERSO_PRODUCT).state;
    const imersoOpen = imersoState === 'active' || imersoState === 'grace';
    const ebook = ebookOpen(access(EBOOK_PRODUCT).state);

    const renderCard = (card: CourseCardData) => {
        const body = (
            <>
                <span className="img">
                    {/* eslint-disable-next-line @next/next/no-img-element -- capa do curso */}
                    <img src={card.imgUrl} alt="" loading="lazy" />
                    {card.isLocked && <Lock {...ICON} size={16} className="lock" aria-hidden />}
                </span>
                <span className="meta">
                    <small>{card.isExpired ? 'Acesso expirado' : card.type}</small>
                </span>
                <b>{card.title}</b>
                {(card.isExpired || card.href) && (
                    <span className="act">
                        {card.isExpired ? 'Renovar acesso' : card.isLocked ? 'Desbloquear' : 'Acessar'}
                        <ArrowRight {...ICON} size={16} aria-hidden />
                    </span>
                )}
            </>
        );
        const className = `cc${card.isLocked ? ' locked' : ''}`;
        if (card.isExpired)
            return (
                <button key={card.key} type="button" className={className} onClick={() => openCta(card.cta)}>
                    {body}
                </button>
            );
        // curso trancado sem página de venda: só o card, sem ação
        if (!card.href)
            return (
                <div key={card.key} className={`${className} still`}>
                    {body}
                </div>
            );
        return (
            <Link key={card.key} className={className} href={card.href}>
                {body}
            </Link>
        );
    };

    return (
        <NewPage className="home">
            <header className="ph">
                <h1>Olá, {firstName(user?.name)}</h1>
                <p className="quote">
                    “Não ambiciones senão um único direito: o de cumprires o teu dever.”
                    <cite>São Josemaria Escrivá — Sulco, 413</cite>
                </p>
            </header>

            {imersoOpen && <TodayDeda />}

            <section aria-label="Programas e cursos">
                <div className="sh">
                    <h2>Programas e cursos</h2>
                </div>
                {error ? (
                    <p className="hint">Não foi possível carregar os cursos.</p>
                ) : (
                    <div className="cards">
                        {loading ? (
                            [0, 1, 2].map((i) => (
                                <div key={i} className="dc skel" aria-hidden>
                                    <span className="img" style={{ aspectRatio: '16 / 10' }} />
                                    <b />
                                </div>
                            ))
                        ) : (
                            <>
                                {/* os produtos do aluno primeiro (e-book incluído); os trancados (convite) depois */}
                                {cards.filter((card) => !card.isLocked).map(renderCard)}
                                {ebook && (
                                    <Link className="cc" href={EBOOK_PATH}>
                                        <span className="img">
                                            {/* eslint-disable-next-line @next/next/no-img-element -- o livro de pé na mesa (public/img), escolhido pelo André; o livro no centro do recorte */}
                                            <img
                                                src="/img/ebook-card-livro.webp"
                                                alt=""
                                                loading="lazy"
                                                style={{ objectPosition: '52% 50%' }}
                                            />
                                        </span>
                                        <span className="meta">
                                            <small>E-book</small>
                                        </span>
                                        <b>{EBOOK.title}</b>
                                        <span className="act">
                                            Ler <ArrowRight {...ICON} size={16} aria-hidden />
                                        </span>
                                    </Link>
                                )}
                                {cards.filter((card) => card.isLocked).map(renderCard)}
                            </>
                        )}
                    </div>
                )}
            </section>
        </NewPage>
    );
};

export default NewHome;
