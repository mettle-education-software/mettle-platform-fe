'use client';

import { useDedaHeaderImage, useDedaHomeHeaderImage, useFeaturedDedaData } from 'hooks/queries/dedaQueries';
import { getWeekDay } from 'libs';
import { dedaPath } from 'libs/cleanUrls';
import { contentfulImage, pickHeaderImage } from 'libs/dedaHeader';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMelpContext } from 'providers';
import React, { useEffect, useMemo, useState } from 'react';
import { ICON } from 'themes/newDesign';
import { NewDedasGrid } from './NewDedasGrid';
import { NewPage } from './NewPage';

/**
 * Lista de DEDAs (/imerso/deda) na plataforma nova: cabeçalho enxuto do DEDA atual (faixa, título, semana/dia,
 * "Open DEDA") e as grades "Most recent / Next / All". Mesmas regras da página atual: bloqueio por suspensão ou
 * programa recém-começado, mesma escolha de imagem (arte da home → cabeçalho → card), mesmos destinos.
 */
export const NewDedaList: React.FC = () => {
    const router = useRouter();
    const { melpSummary, isTodaysDedaCompleted } = useMelpContext();

    const blockedDEDAs =
        useMemo(() => ['MELP_SUSPENDED'].includes(melpSummary?.melp_status), [melpSummary]) ||
        melpSummary?.days_since_melp_start < 2;

    const [selectedDeda, setSelectedDeda] = useState<string>();
    const unlockedDEDAs = useMemo(() => melpSummary?.unlocked_dedas ?? [], [melpSummary]);
    useEffect(() => {
        if (!selectedDeda) setSelectedDeda(unlockedDEDAs[unlockedDEDAs.length - 1]);
    }, [melpSummary, unlockedDEDAs, selectedDeda]);

    const featured = useFeaturedDedaData(selectedDeda).data?.dedaContentCollection.items[0];
    const headerImage = useDedaHeaderImage(selectedDeda);
    const homeHeaderImage = useDedaHomeHeaderImage(selectedDeda);
    const candidates = [homeHeaderImage, headerImage, featured?.dedaFeaturedImage];
    const picked = pickHeaderImage(candidates);
    const art = picked >= 0 ? contentfulImage(candidates[picked]?.url, { w: 1600, fm: 'webp', q: 65 }) : null;

    const handleSelectedDeda = (dedaSlug: string) => router.push(dedaPath(dedaSlug));

    return (
        <NewPage className="wide">
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
                                <span className="wd">Current DEDA · </span>Week {melpSummary?.current_deda_week} · Day{' '}
                                {getWeekDay()}
                                {isTodaysDedaCompleted && <em> · Completed today</em>}
                            </p>
                            <h1>{featured.dedaTitle}</h1>
                        </div>
                        <Link className="btn gold" href={dedaPath(featured.dedaSlug)}>
                            Open DEDA <ArrowRight {...ICON} size={18} className="arrow" aria-hidden />
                        </Link>
                    </div>
                </section>
            )}
            <NewDedasGrid blockedDEDAs={blockedDEDAs} type="lastDedas" onSelectedDeda={handleSelectedDeda} />
            <NewDedasGrid blockedDEDAs={blockedDEDAs} type="nextDedas" onSelectedDeda={handleSelectedDeda} />
            <NewDedasGrid blockedDEDAs={blockedDEDAs} type="allDedas" onSelectedDeda={handleSelectedDeda} />
        </NewPage>
    );
};

export default NewDedaList;
