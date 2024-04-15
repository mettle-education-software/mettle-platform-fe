'use client';

import styled from '@emotion/styled';
import Deda from 'components/molecules/deda';
import { useGetDedas, useGetUser } from 'hooks';
import { DedaType } from 'interfaces';
import { withAuthentication } from 'libs';
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
    height: 15.375rem;
    padding: 1.75rem 2.625rem;
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

    if (!userData || isLoading || !dedasData) {
        return null;
    }

    const { data } = dedasData;
    if (!data) {
        return null;
    }

    const { dedaContentCollection: collection } = data;
    const dedas = collection!.items.map(
        (item: { dedaId: any; dedaTitle: any; dedaFeaturedImage: { url: any } }, index: any) => ({
            id: item.dedaId,
            title: item.dedaTitle,
            subTitle: [''],
            src: item.dedaFeaturedImage.url,
            summary: `Week ${index}`,
        }),
    ) as [DedaType];

    const { currentTime } = userData;
    const currentDeda = dedas.find((deda: { title: string }) => deda.title === currentTime.currentDedaName);

    const recentDedas = getMostRecentDedas(dedas, currentDeda!);
    const upcomingDedas = getUpcomingDedas(dedas, currentDeda!);

    const headerStyle: CSSProperties = {
        background: `linear-gradient(180deg, rgba(0, 0, 0, 0.00) 0%, #2B2B2B 100%), url(${currentDeda?.src}) lightgray 50% / cover no-repeat`,
    };

    return (
        <>
            <HeaderFrame style={headerStyle}></HeaderFrame>
            <ContentFrame>
                <ContentRow>
                    <RowTitle>Most recents DEDAs</RowTitle>
                    <DEDAList>
                        {recentDedas!.map((item, index) => (
                            <Deda
                                key={`${item.id}-${index}`}
                                id={item.id}
                                title={item.title}
                                subTitle={item.subTitle}
                                src={item.src}
                                summary={index == 0 ? 'Current DEDA' : item.summary}
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
                                summary={item.summary}
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
                                summary={item.summary}
                            />
                        ))}
                    </DEDAList>
                </ContentRow>
            </ContentFrame>
        </>
    );
}

export default withAuthentication(Page);
