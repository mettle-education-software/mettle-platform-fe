'use client';

import { useGetCurrentDeda } from 'hooks/melp/deda';
import { useDedaHeaderImage, useDedaHomeHeaderImage, useFeaturedDedaData } from 'hooks/queries/dedaQueries';
import { dedaPath } from 'libs/cleanUrls';
import { lampToday, recentDedaIds, todaysDedaId, weekDayLabel } from 'libs/dedaClock';
import { contentfulImage, pickHeaderImage } from 'libs/dedaHeader';
import { IMERSO_PRODUCT, IMERSO_RENEW_URL } from 'libs/productAccess';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AccessCtaBlock, useMelpContext, useProductAccess } from 'providers';
import React, { useMemo } from 'react';
import { ICON } from 'themes/newDesign';
import { NewDedasGrid } from './NewDedasGrid';
import { NoProgram, SummaryError, SuspendedNotice } from './NewImersoDash';
import { NewPage } from './NewPage';

/**
 * Lista de DEDAs (/imerso/deda) na plataforma nova: cabeçalho enxuto do DEDA atual (faixa, título, semana/dia,
 * "Open DEDA") e as grades "Most recent / Next / All". Mesmas regras da página atual: bloqueio por suspensão ou
 * programa recém-começado, mesma escolha de imagem (arte da home → cabeçalho → card), mesmos destinos.
 * Leitura: a mesma página trancada (com programa, a lista dele; sem programa, o DEDA da semana na rotação e o
 * catálogo publicado), e todo clique leva à renovação.
 */
export const NewDedaList: React.FC = () => {
    const router = useRouter();
    const { melpSummary, isTodaysDedaCompleted, isMelpSummaryError, retryMelpSummary, noMelpProgram } =
        useMelpContext();
    const readOnly = useProductAccess().access(IMERSO_PRODUCT).state === 'expired';
    const renew = readOnly ? IMERSO_RENEW_URL : undefined;
    // sem programa não há DEDA "de hoje": o destaque é o da semana na rotação (o mesmo para todos)
    const rotation = useGetCurrentDeda(readOnly && noMelpProgram).data?.id;

    const blockedDEDAs =
        useMemo(() => ['MELP_SUSPENDED'].includes(melpSummary?.melp_status), [melpSummary]) ||
        melpSummary?.days_since_melp_start < 2;

    // DEDA em destaque: o de hoje (libs/dedaClock), lido do resumo a cada vez (a aba aberta de domingo vira na segunda);
    // relógio novo com a semana ainda sem DEDA publicado: o último publicado
    const todays = noMelpProgram ? rotation : todaysDedaId(melpSummary);
    const selectedDeda = todays ?? recentDedaIds(melpSummary, 1)[0];
    const lampDay = lampToday(melpSummary);

    const featured = useFeaturedDedaData(selectedDeda).data?.dedaContentCollection.items[0];
    const headerImage = useDedaHeaderImage(selectedDeda);
    const homeHeaderImage = useDedaHomeHeaderImage(selectedDeda);
    const candidates = [homeHeaderImage, headerImage, featured?.dedaFeaturedImage];
    const picked = pickHeaderImage(candidates);
    const art = picked >= 0 ? contentfulImage(candidates[picked]?.url, { w: 1600, fm: 'webp', q: 65 }) : null;

    const handleSelectedDeda = (dedaSlug: string) => router.push(dedaPath(dedaSlug));

    // sem resumo (falha), sem programa (fora da Leitura) ou suspenso: o aviso no lugar das grades (nada de esqueleto
    // eterno nem lista trancada sem motivo)
    if (isMelpSummaryError || (noMelpProgram && !readOnly) || melpSummary?.melp_status === 'MELP_SUSPENDED')
        return (
            <NewPage className="wide">
                {isMelpSummaryError ? (
                    <SummaryError onRetry={retryMelpSummary} />
                ) : noMelpProgram ? (
                    <NoProgram />
                ) : (
                    <SuspendedNotice />
                )}
            </NewPage>
        );

    return (
        <NewPage className="wide">
            {readOnly && <AccessCtaBlock target={{ product: IMERSO_PRODUCT }} />}
            {!blockedDEDAs && featured && (
                <section className="cur" aria-label="Current DEDA">
                    <div className="art" aria-hidden>
                        {/* eslint-disable-next-line @next/next/no-img-element -- imagem do Contentful */}
                        {art && <img src={art} alt="" />}
                        <span />
                    </div>
                    <div className="over">
                        <div>
                            <p className="eyebrow">
                                {noMelpProgram ? (
                                    'This week’s DEDA'
                                ) : !todays ? (
                                    'New DEDA on the way'
                                ) : lampDay ? (
                                    <>
                                        <span className="wd">Current DEDA · </span>
                                        {weekDayLabel(lampDay.week, lampDay.day)}
                                        {isTodaysDedaCompleted && <em> · Completed today</em>}
                                    </>
                                ) : (
                                    'Current DEDA'
                                )}
                            </p>
                            <h1>{featured.dedaTitle}</h1>
                        </div>
                        {renew ? (
                            <a className="btn gold" href={renew} aria-label={`Renew to open ${featured.dedaTitle}`}>
                                Renew <ArrowRight {...ICON} size={18} className="arrow" aria-hidden />
                            </a>
                        ) : (
                            <Link className="btn gold" href={dedaPath(featured.dedaSlug)}>
                                Open DEDA <ArrowRight {...ICON} size={18} className="arrow" aria-hidden />
                            </Link>
                        )}
                    </div>
                </section>
            )}
            {!noMelpProgram && (
                <>
                    <NewDedasGrid
                        blockedDEDAs={blockedDEDAs}
                        type="lastDedas"
                        skipCurrent={!blockedDEDAs && !!featured && featured.dedaId === todays}
                        onSelectedDeda={handleSelectedDeda}
                        renew={renew}
                    />
                    <NewDedasGrid
                        blockedDEDAs={blockedDEDAs}
                        type="nextDedas"
                        onSelectedDeda={handleSelectedDeda}
                        renew={renew}
                    />
                </>
            )}
            <NewDedasGrid
                blockedDEDAs={blockedDEDAs}
                type="allDedas"
                onSelectedDeda={handleSelectedDeda}
                renew={renew}
            />
        </NewPage>
    );
};

export default NewDedaList;
