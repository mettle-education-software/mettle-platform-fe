'use client';

import { CourseCardData, useCourseCards } from 'components/molecules/MettleCoursesList/MettleCoursesList';
import { useFeaturedDedaData } from 'hooks/queries/dedaQueries';
import { dedaPath } from 'libs/cleanUrls';
import { isCalendarClock, lampToday, todaysDedaId, weekDayLabel } from 'libs/dedaClock';
import { contentfulImage } from 'libs/dedaHeader';
import { EBOOK, EBOOK_PATH, EBOOK_PRODUCT, EBOOK_SALES_URL, ebookOpen } from 'libs/ebook';
import { MASTERCLASS_COURSE, MASTERCLASS_SALES_URL } from 'libs/masterclass';
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

/** Leitura de um curso (o "expired" do front): card trancado, que leva à renovação. O IMERSO em leitura abre (só ver). */
const renewing = (card: CourseCardData) => card.isExpired && card.key !== 'imerso';
const locked = (card: CourseCardData) => card.isLocked || renewing(card);

/**
 * Home da plataforma nova: cumprimento, citação e os cards dos programas/cursos (IMERSO + consulta de cursos), com o
 * mesmo acesso da lista atual (useCourseCards). O card inteiro é a ação: um clique. Trancado (sem acesso ou leitura):
 * leva à venda ou à renovação.
 */
export const NewHome: React.FC = () => {
    const { user } = useAppContext();
    const { access } = useProductAccess();
    const { cards, loading, error } = useCourseCards();
    const imersoState = access(IMERSO_PRODUCT).state;
    const imersoOpen = imersoState === 'active' || imersoState === 'grace';
    const ebookState = access(EBOOK_PRODUCT).state;
    const ebook = ebookOpen(ebookState);

    const renderCard = (card: CourseCardData) => {
        const renew = renewing(card);
        const href = renew ? (card.key === MASTERCLASS_COURSE ? MASTERCLASS_SALES_URL : card.cta.renewUrl) : card.href;
        const body = (
            <>
                <span className="img">
                    {/* eslint-disable-next-line @next/next/no-img-element -- capa do curso */}
                    <img src={card.imgUrl} alt="" loading="lazy" />
                    {locked(card) && <Lock {...ICON} size={16} className="lock" aria-hidden />}
                </span>
                <span className="meta">
                    <small>{card.type}</small>
                </span>
                <b>{card.title}</b>
                {href && (
                    <span className="act">
                        {renew ? 'Renovar' : card.isLocked ? 'Desbloquear' : 'Acessar'}
                        <ArrowRight {...ICON} size={16} aria-hidden />
                    </span>
                )}
            </>
        );
        const className = `cc${locked(card) ? ' locked' : ''}`;
        // curso trancado sem página de venda: só o card, sem ação
        if (!href)
            return (
                <div key={card.key} className={`${className} still`}>
                    {body}
                </div>
            );
        return (
            <Link key={card.key} className={className} href={href}>
                {body}
            </Link>
        );
    };

    // e-book: aberto lê aqui; leitura ou sem acesso, trancado, para a venda (o order bump da Masterclass)
    const ebookCard = (
        <Link className={`cc${ebook ? '' : ' locked'}`} href={ebook ? EBOOK_PATH : EBOOK_SALES_URL}>
            <span className="img">
                {/* eslint-disable-next-line @next/next/no-img-element -- o livro de pé na mesa (public/img), escolhido pelo André; o livro no centro do recorte */}
                <img src="/img/ebook-card-livro.webp" alt="" loading="lazy" style={{ objectPosition: '52% 50%' }} />
                {!ebook && <Lock {...ICON} size={16} className="lock" aria-hidden />}
            </span>
            <span className="meta">
                <small>E-book</small>
            </span>
            <b>{EBOOK.title}</b>
            <span className="act">
                {ebook ? 'Ler' : ebookState === 'expired' ? 'Renovar' : 'Desbloquear'}
                <ArrowRight {...ICON} size={16} aria-hidden />
            </span>
        </Link>
    );

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
                                {cards.filter((card) => !locked(card)).map(renderCard)}
                                {ebook && ebookCard}
                                {cards.filter(locked).map(renderCard)}
                                {!ebook && ebookCard}
                            </>
                        )}
                    </div>
                )}
            </section>
        </NewPage>
    );
};

export default NewHome;
