'use client';

import styled from '@emotion/styled';
import { Col, Flex, Row, Typography } from 'antd';
import { DedaCard } from 'components';
import { useMelpSummary } from 'hooks';
import { useAllDedasList, useLastDedas, useNextDedas } from 'hooks/queries/dedasLists';
import { DedaItem } from 'interfaces';
import { MAX_CONTENT_WIDTH } from 'libs';
import { dedaLampWeek, isCalendarClock, lampRunning, recentDedaIds, todaysDedaId } from 'libs/dedaClock';
import { useAppContext } from 'providers';
import React from 'react';

interface DedasGridProps {
    type: 'lastDedas' | 'nextDedas' | 'allDedas';
    onSelectedDeda: (dedaSlug: string) => void;
    customTitle?: string;
    blockedDEDAs?: boolean;
}

const Title = styled(Typography.Title)`
    color: white !important;
    font-weight: 500 !important;
`;

/**
 * Dados das grades de DEDAs (mais recentes, próximos, todos): quais DEDAs, em que ordem, qual está bloqueado e a
 * semana de cada um. Regras intocadas; a grade atual e a grade da plataforma nova (components/_new) leem daqui.
 */
export const useDedasGrid = (type: DedasGridProps['type'], blockedDEDAs?: boolean) => {
    const { user } = useAppContext();

    const { data: melpSummary, isLoading } = useMelpSummary(user?.uid as string);

    const currentWeek = melpSummary?.current_deda_week;

    const unlockedDEDAs = !!melpSummary?.unlocked_dedas && !blockedDEDAs ? melpSummary?.unlocked_dedas : [];

    // DEDA de hoje e recentes pelo relógio (libs/dedaClock): no relógio novo, deda_today e as exibições datadas; no
    // legado, o fim de unlocked_dedas, como antes
    const currentDeda = blockedDEDAs ? undefined : (todaysDedaId(melpSummary) ?? undefined);

    /** Todos os DEDAs já exibidos, do mais recente para trás, sem repetir. */
    const recentIds = blockedDEDAs ? [] : recentDedaIds(melpSummary, Infinity);
    const lastDedas = recentIds.slice(0, 4);

    const calendarClock = isCalendarClock(melpSummary);
    /** Semana do DEDA na LAMP para "Week n" (`index`: posição a partir do mais recente, só no legado); sem semana = sem rótulo. */
    const weekOf = (dedaId: string, index: number) =>
        calendarClock ? (dedaLampWeek(melpSummary, dedaId) ?? undefined) : (currentWeek as number) - index;
    /** Semana dos próximos DEDAs: no relógio novo só com a LAMP contando (DEDA exibido em pausa não tem semana na LAMP). */
    const nextWeekOf = (index: number) =>
        !calendarClock || lampRunning(melpSummary) ? (currentWeek as number) + index + 1 : undefined;

    let nextDedas: string[] = [];

    if (currentDeda) {
        const currentDedaNumber = parseInt(currentDeda.replace(/\D/g, ''));
        for (let i = 1; i <= 4; i++) {
            nextDedas.push(`DEDA${currentDedaNumber + i}`);
        }
    }

    const lastDedasResult = useLastDedas(lastDedas);
    const sortedLastDedasResult: DedaItem[] = [];

    lastDedasResult.data?.dedaContentCollection.items.forEach((deda) => {
        const indexOfLastDedas = lastDedas.indexOf(deda.dedaId);
        sortedLastDedasResult[indexOfLastDedas] = deda;
    });

    const nextDedasResult = useNextDedas(nextDedas);

    const nextDedasItems = nextDedasResult.data?.dedaContentCollection.items?.slice()?.sort((a, b) => {
        return Number(a.dedaId.replace(/\D/g, '')) - Number(b.dedaId.replace(/\D/g, ''));
    });

    const allDedasResult = useAllDedasList(type !== 'allDedas');
    const sortedAllDedasResult: DedaItem[] = allDedasResult
        ? (allDedasResult.data?.dedaContentCollection?.items
              ?.slice()
              ?.sort((a, b) => {
                  return Number(a.dedaId.replace(/\D/g, '')) - Number(b.dedaId.replace(/\D/g, ''));
              })
              ?.sort((a, b) => {
                  if (unlockedDEDAs.includes(a.dedaId) && !unlockedDEDAs.includes(b.dedaId)) return -1;
                  if (!unlockedDEDAs.includes(a.dedaId) && unlockedDEDAs.includes(b.dedaId)) return 1;
                  return 0;
              }) as DedaItem[])
        : [];

    const showSkeleton = isLoading || lastDedasResult.loading || nextDedasResult.loading || allDedasResult.loading;

    return {
        melpSummary,
        showSkeleton,
        currentWeek,
        unlockedDEDAs,
        currentDeda,
        lastDedas: sortedLastDedasResult,
        nextDedas: nextDedasItems,
        allDedas: sortedAllDedasResult,
        recentIds,
        weekOf,
        nextWeekOf,
        /**
         * "Next DEDAs" só com DEDAs liberados e programa em curso. Antes do início não: a rotação é litúrgica (o aluno
         * entra onde o círculo estiver na segunda), e a ordem do catálogo mostraria DEDAs que ele não vai fazer.
         */
        showNext:
            unlockedDEDAs.length > 0 &&
            !['DEDA_FINISHED', 'MELP_BEGIN', 'CAN_START_DEDA', 'DEDA_STARTED_NOT_BEGUN'].includes(
                melpSummary?.melp_status as string,
            ) &&
            // legado pausado: na volta o aluno entra onde a rotação estiver, não no DEDA seguinte ao dele (PF-18)
            (calendarClock || melpSummary?.melp_status !== 'DEDA_PAUSED'),
    };
};

export const DedasGrid: React.FC<DedasGridProps> = ({ type, onSelectedDeda, customTitle, blockedDEDAs }) => {
    const {
        melpSummary,
        showSkeleton,
        unlockedDEDAs,
        lastDedas: sortedLastDedasResult,
        nextDedas: nextDedasItems,
        allDedas: sortedAllDedasResult,
        weekOf,
        nextWeekOf,
    } = useDedasGrid(type, blockedDEDAs);
    const weekText = (week?: number) => (week ? `Week ${week}` : undefined);

    const titles: { [key in DedasGridProps['type']]: React.ReactNode } = {
        lastDedas: unlockedDEDAs.length > 0 && (
            <Title level={4}>
                <strong>Most recent</strong> DEDAs
            </Title>
        ),
        nextDedas:
            unlockedDEDAs.length > 0 && melpSummary?.melp_status !== 'DEDA_FINISHED' ? (
                <Title level={4}>
                    <strong>Next</strong> DEDAs
                </Title>
            ) : null,
        allDedas: (
            <Title level={4}>
                <strong>All</strong> DEDAs
            </Title>
        ),
    };

    return (
        <Flex style={{ maxWidth: MAX_CONTENT_WIDTH, width: '100%' }} vertical gap="2.25rem">
            <div>
                <div style={{ width: '100%', marginBottom: '1rem' }}>
                    {customTitle ? <Title level={4}>{customTitle}</Title> : titles[type]}
                </div>

                <Row
                    gutter={[
                        {
                            xs: 16,
                            sm: 24,
                            md: 32,
                            lg: 54,
                            xl: 24,
                        },
                        {
                            xs: 16,
                            sm: 24,
                            md: 32,
                            lg: 54,
                            xl: 24,
                        },
                    ]}
                    justify={type === 'lastDedas' && sortedLastDedasResult.length < 4 ? 'start' : 'space-between'}
                >
                    {showSkeleton && (
                        <>
                            <Col xs={12} md={6}>
                                <DedaCard isLoading />
                            </Col>
                            <Col xs={12} md={6}>
                                <DedaCard isLoading />
                            </Col>
                            <Col xs={12} md={6}>
                                <DedaCard isLoading />
                            </Col>
                            <Col xs={12} md={6}>
                                <DedaCard isLoading />
                            </Col>
                        </>
                    )}
                    {type === 'lastDedas' &&
                        sortedLastDedasResult.map((deda, index) => (
                            <Col xs={12} md={6} key={deda.dedaSlug}>
                                <DedaCard
                                    dedaId={deda.dedaId}
                                    imgUrl={deda.dedaFeaturedImage.url}
                                    title={deda.dedaTitle}
                                    week={weekText(weekOf(deda.dedaId, index))}
                                    onClick={() => {
                                        onSelectedDeda(deda.dedaSlug);
                                    }}
                                    categories={deda.dedaCategories}
                                    blocked={!unlockedDEDAs?.includes(deda.dedaId)}
                                />
                            </Col>
                        ))}
                    {type === 'nextDedas' &&
                        melpSummary?.melp_status !== 'DEDA_FINISHED' &&
                        nextDedasItems?.map((deda, index) => (
                            <Col xs={12} md={6} key={deda.dedaSlug}>
                                <DedaCard
                                    dedaId={deda.dedaId}
                                    imgUrl={deda.dedaFeaturedImage.url}
                                    title={deda.dedaTitle}
                                    week={weekText(nextWeekOf(index))}
                                    onClick={() => {
                                        onSelectedDeda(deda.dedaSlug);
                                    }}
                                    categories={deda.dedaCategories}
                                    blocked={!unlockedDEDAs?.includes(deda.dedaId)}
                                />
                            </Col>
                        ))}
                    {type === 'allDedas' &&
                        sortedAllDedasResult?.map((deda) => (
                            <Col xs={12} md={6} key={deda.dedaSlug}>
                                <DedaCard
                                    dedaId={deda.dedaId}
                                    imgUrl={deda.dedaFeaturedImage.url}
                                    title={deda.dedaTitle}
                                    onClick={() => {
                                        onSelectedDeda(deda.dedaSlug);
                                    }}
                                    categories={deda.dedaCategories}
                                    blocked={!unlockedDEDAs?.includes(deda.dedaId)}
                                />
                            </Col>
                        ))}
                </Row>
            </div>
        </Flex>
    );
};
