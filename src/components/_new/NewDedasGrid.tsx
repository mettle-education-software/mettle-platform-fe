'use client';

import { useDedasGrid } from 'components/_melp/_deda/DedasGrid/DedasGrid';
import { DedaItem } from 'interfaces';
import { dedaPath } from 'libs/cleanUrls';
import { useRouter } from 'next/navigation';
import React from 'react';
import { DedaCardState, NewDedaCard } from './NewDedaCard';

interface Props {
    type: 'lastDedas' | 'nextDedas' | 'allDedas';
    onSelectedDeda: (dedaSlug: string) => void;
    customTitle?: string;
    blockedDEDAs?: boolean;
    /** À direita do título (ex.: "Explore all DEDAs"). */
    aside?: React.ReactNode;
}

const TITLES: Record<Props['type'], string> = { lastDedas: 'Most recent', nextDedas: 'Next', allDedas: 'All' };

/**
 * Grade de DEDAs da plataforma nova: os mesmos DEDAs, na mesma ordem e com os mesmos bloqueios da grade atual
 * (useDedasGrid), em cards leves; 4 por linha no computador, 2 no celular.
 */
export const NewDedasGrid: React.FC<Props> = ({ type, onSelectedDeda, customTitle, blockedDEDAs, aside }) => {
    // passar o mouse/focar num card adianta a rota do DEDA (produção): o clique abre sem esperar o servidor
    const router = useRouter();
    const grid = useDedasGrid(type, blockedDEDAs);
    const { unlockedDEDAs, currentDeda, currentWeek } = grid;

    // Mesmas condições de título da grade atual.
    const visible =
        type === 'allDedas' || (type === 'lastDedas' ? unlockedDEDAs.length > 0 : grid.showNext) || !!customTitle;
    // "Next DEDAs" nunca aparece só como esqueleto (antes do início ele nem existe)
    if (!visible && (!grid.showSkeleton || type === 'nextDedas')) return null;

    // "feito" só vale para DEDAs liberados que não são o atual, nas grades de passado e de todos; nos próximos, liberado é só "aberto"
    const stateOf = (dedaId: string): DedaCardState =>
        !unlockedDEDAs.includes(dedaId)
            ? 'locked'
            : dedaId === currentDeda
              ? 'current'
              : type === 'nextDedas'
                ? 'open'
                : 'done';

    const items: { deda: DedaItem; week?: string }[] =
        type === 'lastDedas'
            ? grid.lastDedas.map((deda, index) => ({ deda, week: `Week ${(currentWeek as number) - index}` }))
            : type === 'nextDedas'
              ? grid.showNext
                  ? (grid.nextDedas ?? []).map((deda, index) => ({
                        deda,
                        week: `Week ${(currentWeek as number) + index + 1}`,
                    }))
                  : []
              : (grid.allDedas ?? []).map((deda) => ({ deda }));

    return (
        <section aria-label={customTitle ?? `${TITLES[type]} DEDAs`}>
            <div className="sh">
                <h2>
                    {customTitle ?? TITLES[type]}
                    {!customTitle && <span>DEDAs</span>}
                </h2>
                {aside}
            </div>
            <div className="grid">
                {grid.showSkeleton
                    ? [0, 1, 2, 3].map((i) => <NewDedaCard key={i} isLoading />)
                    : items.map(({ deda, week }) => (
                          <NewDedaCard
                              key={deda.dedaSlug}
                              title={deda.dedaTitle}
                              imgUrl={deda.dedaFeaturedImage?.url}
                              week={week}
                              categories={deda.dedaCategories}
                              state={stateOf(deda.dedaId)}
                              onClick={() => onSelectedDeda(deda.dedaSlug)}
                              onIntent={() => router.prefetch(dedaPath(deda.dedaSlug))}
                          />
                      ))}
            </div>
        </section>
    );
};
