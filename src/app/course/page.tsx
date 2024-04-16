'use client';

import styled from '@emotion/styled';
import { Button } from 'antd';
import Deda from 'components/molecules/deda';
import { useDeviceSize, useGetDedas, useGetUser } from 'hooks';
import { DedaType } from 'interfaces';
import { withAuthentication } from 'libs';
import Link from 'next/link';
import { useAppContext } from 'providers';
import { CSSProperties } from 'react';
import { largeAndBigger } from 'styles/media.constants';

const ContentFrame = styled.div`
    align-items: flex-start;
    display: flex;
    padding: 1.375rem 1rem 2rem 1rem;
    flex-direction: column;
    flex: 1 0 0;
    gap: 2.25rem;
    ${largeAndBigger} {
        padding: 1.375rem 2.625rem;
    }
`;

const HeaderFrame = styled.div`
    align-items: center;
    align-self: stretch;
    display: flex;
    justify-content: space-between;
    flex: 1 0 0;
    height: 6.25rem;
    padding: 1.75rem 2.625rem;
    ${largeAndBigger} {
        height: 15.375rem;
    }
`;

const CurrentDedaChip = styled.div`
    display: flex;
    padding: 0.5rem 1rem;
    align-items: center;
    gap: 0.5rem;
    border-radius: 5rem;
    background: rgba(183, 144, 96, 0.3);
    backdrop-filter: blur(0.125rem);
    color: var(--white);
    overflow: hidden;
    leading-trim: both;
    text-edge: cap;
    text-overflow: ellipsis;
    font-size: 1.125rem;
    font-weight: var(--font-weight-bold);
    line-height: 130%;
`;

const HeaderTitle = styled.p`
    color: var(--brown-light);
    leading-trim: both;
    text-edge: cap;
    font-size: 3.25rem;
    font-weight: 700;
    line-height: 130%;
`;

const GoToDeda = styled(Link)`
    background: var(--vanila-dark);
    border-radius: 5.5rem;
    color: var(--white);
    padding: 0.625rem 2.25rem;
`;

const ContentRow = styled.div`
    align-self: stretch;
    display: flex;
    flex-direction: column;
    flex: 1 0 0;
    align-items: flex-start;
    gap: 0.75rem;
`;

const RowTitle = styled.div`
    color: var(--white);
    font-size: 1.375rem;
    ${largeAndBigger} {
        font-weight: var(--h3-font-weight);
        font-size: var(--h3-font-size);
    }
`;

const DEDAList = styled.div`
    align-items: flex-start;
    align-self: stretch;
    display: flex;
    display: inline-flex;
    flex-wrap: wrap;
    gap: 2.25rem;
    row-gap: 0.75rem;
    ${largeAndBigger} {
        column-gap: 10rem;
        row-gap: 2.25rem;
    }
`;

function getMostRecentDedas(dedas: [DedaType], currentDeda: DedaType): Array<DedaType> {
    const maxRecentDedas = 3;
    const currentDedaIndex = dedas.findIndex((deda) => deda.id === currentDeda.id);
    const startIndex = currentDedaIndex <= 2 ? 0 : currentDedaIndex - maxRecentDedas;
    const endIndex = currentDedaIndex + 1;
    const recent = dedas.slice(startIndex, endIndex).reverse();
    return recent;
}

function getUpcomingDedas(dedas: [DedaType], currentDeda: DedaType): Array<DedaType> {
    const currentDedaIndex = dedas.findIndex((deda) => deda.id === currentDeda.id);
    const nextFourDedas = currentDedaIndex + 5;
    const upcoming = dedas.slice(currentDedaIndex + 1, nextFourDedas);
    return upcoming;
}

function Page() {
    const { user } = useAppContext();
    const { isLoading, data: userData } = useGetUser(user?.uid);
    const dedasData = useGetDedas();
    const device = useDeviceSize();

    if (!userData || isLoading || !dedasData) {
        return null;
    }

    const { data } = dedasData;
    if (!data) {
        return null;
    }

    const { currentTime, unlockedDEDAs } = userData;

    const { dedaContentCollection: collection } = data;
    const dedas = collection!.items.map(
        (item: { dedaId: any; dedaTitle: any; dedaFeaturedImage: { url: any } }, index: any) => ({
            id: item.dedaId,
            title: item.dedaTitle,
            subTitle: [''],
            src: item.dedaFeaturedImage.url,
            week: index,
            locked: unlockedDEDAs.some((unlocked) => unlocked === item.dedaId),
        }),
    ) as [DedaType];

    const currentDeda = dedas.find((deda: { title: string }) => deda.title === currentTime.currentDedaName);

    const recentDedas = getMostRecentDedas(dedas, currentDeda!);
    const upcomingDedas = getUpcomingDedas(dedas, currentDeda!);

    const headerStyle: CSSProperties = {
        background: `linear-gradient(180deg, rgba(0, 0, 0, 0.00) 0%, #2B2B2B 100%), url(${currentDeda?.src}) lightgray 50% / cover no-repeat`,
    };

    return (
        <>
            <HeaderFrame style={headerStyle}>
                {device === 'desktop' && (
                    <>
                        <div>
                            <CurrentDedaChip>Current DEDA</CurrentDedaChip>
                            <HeaderTitle>{currentDeda?.title}</HeaderTitle>
                        </div>
                        <GoToDeda type="primary" href={`/course/deda/${currentDeda?.id}`}>
                            Go to DEDA
                        </GoToDeda>
                    </>
                )}
            </HeaderFrame>
            <ContentFrame>
                <ContentRow>
                    <RowTitle>Most recent DEDAs</RowTitle>
                    <DEDAList>
                        {recentDedas!.map((item, index) => (
                            <Deda
                                key={`${item.id}-${index}`}
                                id={item.id}
                                title={item.title}
                                subTitle={item.subTitle}
                                src={item.src}
                                week={index == 0 ? 'Current DEDA' : item.week}
                                locked={item.locked}
                                current={index == 0 ? true : false}
                            />
                        ))}
                    </DEDAList>
                </ContentRow>
                <ContentRow>
                    <RowTitle>Upcoming DEDAs</RowTitle>
                    <DEDAList>
                        {upcomingDedas!.map((item, index) => (
                            <Deda
                                key={`${item.id}-${index}`}
                                id={item.id}
                                title={item.title}
                                subTitle={item.subTitle}
                                src={item.src}
                                week={item.week}
                                locked={item.locked}
                                current={false}
                            />
                        ))}
                    </DEDAList>
                </ContentRow>
                <ContentRow>
                    <RowTitle>All DEDAs</RowTitle>
                    <DEDAList>
                        {dedas!.map((item, index) => (
                            <Deda
                                key={`${item.id}-${index}`}
                                id={item.id}
                                title={item.title}
                                subTitle={item.subTitle}
                                src={item.src}
                                week={item.week}
                                locked={item.locked}
                                current={false}
                            />
                        ))}
                    </DEDAList>
                </ContentRow>
            </ContentFrame>
        </>
    );
}

export default withAuthentication(Page);
