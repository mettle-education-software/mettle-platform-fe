'use client';

import { useCourseCards } from 'components/molecules/MettleCoursesList/MettleCoursesList';
import { useFeaturedDedaData } from 'hooks/queries/dedaQueries';
import { getWeekDay } from 'libs';
import { dedaPath } from 'libs/cleanUrls';
import { contentfulImage } from 'libs/dedaHeader';
import { EBOOK, EBOOK_PATH, EBOOK_PRODUCT, ebookOpen } from 'libs/ebook';
import { firstName } from 'libs/newDesign';
import { IMERSO_PRODUCT } from 'libs/productAccess';
import { ArrowRight, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAppContext, useMelpContext, useProductAccess } from 'providers';
import React from 'react';
import { ICON } from 'themes/newDesign';
import { EbookCover } from './NewEbook';
import { NewPage } from './NewPage';

/** DEDA de hoje em um clique: só com o DEDA em andamento e o IMERSO ativo (mesmo destino da home do IMERSO). */
const TodayDeda: React.FC = () => {
    const router = useRouter();
    const { melpSummary, isTodaysDedaCompleted } = useMelpContext();
    const unlocked = melpSummary?.unlocked_dedas ?? [];
    const currentId = unlocked[unlocked.length - 1];
    const featured = useFeaturedDedaData(melpSummary?.melp_status === 'DEDA_STARTED' ? currentId : undefined);
    const deda = featured.data?.dedaContentCollection.items[0];
    if (!deda) return null;
    const thumb = contentfulImage(deda.dedaFeaturedImage?.url, { w: 320, h: 200, fit: 'fill', fm: 'webp', q: 70 });
    return (
        <section aria-label="DEDA de hoje">
            <div className="sh">
                <h2>DEDA de hoje</h2>
            </div>
            <button type="button" className="cc today" onClick={() => router.push(dedaPath(deda.dedaSlug))}>
                <span className="img">
                    {/* eslint-disable-next-line @next/next/no-img-element -- imagem do Contentful */}
                    {thumb && <img src={thumb} alt="" />}
                </span>
                <span className="meta">
                    <small>
                        Semana {melpSummary.current_deda_week} · Dia {getWeekDay()}
                    </small>
                    {isTodaysDedaCompleted && <em>Concluído hoje</em>}
                </span>
                <b>{deda.dedaTitle}</b>
                <span className="act">
                    Abrir DEDA <ArrowRight {...ICON} size={16} aria-hidden />
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
                        {loading
                            ? [0, 1, 2].map((i) => (
                                  <div key={i} className="dc skel" aria-hidden>
                                      <span className="img" style={{ aspectRatio: '16 / 10' }} />
                                      <b />
                                  </div>
                              ))
                            : cards.map((card) => {
                                  const body = (
                                      <>
                                          <span className="img">
                                              {/* eslint-disable-next-line @next/next/no-img-element -- capa do curso */}
                                              <img src={card.imgUrl} alt="" loading="lazy" />
                                              {card.isLocked && (
                                                  <Lock
                                                      {...ICON}
                                                      size={28}
                                                      strokeWidth={1.25}
                                                      className="lock"
                                                      aria-hidden
                                                  />
                                              )}
                                          </span>
                                          <span className="meta">
                                              <small>{card.isExpired ? 'Acesso expirado' : card.type}</small>
                                          </span>
                                          <b>{card.title}</b>
                                          <span className="act">
                                              {card.isExpired
                                                  ? 'Renovar acesso'
                                                  : card.isLocked
                                                    ? 'Desbloquear'
                                                    : 'Acessar'}
                                              <ArrowRight {...ICON} size={16} aria-hidden />
                                          </span>
                                      </>
                                  );
                                  const className = `cc${card.isLocked ? ' locked' : ''}`;
                                  return card.isExpired ? (
                                      <button
                                          key={card.key}
                                          type="button"
                                          className={className}
                                          onClick={() => openCta(card.cta)}
                                      >
                                          {body}
                                      </button>
                                  ) : (
                                      <a key={card.key} className={className} href={card.href}>
                                          {body}
                                      </a>
                                  );
                              })}
                        {!loading && ebook && (
                            <a className="cc" href={EBOOK_PATH}>
                                <span className="img" style={{ display: 'grid', placeItems: 'center' }}>
                                    <EbookCover width={96} />
                                </span>
                                <span className="meta">
                                    <small>E-book</small>
                                </span>
                                <b>{EBOOK.title}</b>
                                <span className="act">
                                    Ler <ArrowRight {...ICON} size={16} aria-hidden />
                                </span>
                            </a>
                        )}
                    </div>
                )}
            </section>
        </NewPage>
    );
};

export default NewHome;
