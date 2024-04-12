'use client';

import styled from '@emotion/styled';
import Deda from 'components/molecules/deda';
import { withAuthentication } from 'libs';
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
    display: flex;
    padding: 1.75rem 2.625rem;
    justify-content: space-between;
    align-items: center;
    flex: 1 0 0;
    align-self: stretch;
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
    justify-content: space-between;
    row-gap: 0.75rem;
`;

function Page() {
    return (
        <>
            <HeaderFrame style={{ backgroundImage: '' }}></HeaderFrame>
            <ContentFrame>
                <ContentRow>
                    <RowTitle>Most recents DEDAs</RowTitle>
                    <DEDAList>
                        <Deda
                            title="New York City"
                            subTitle={['Tecnology', 'News', 'Financials']}
                            src=""
                            summary="Week 10"
                            status="Completed"
                        />
                        <Deda
                            title="New York City"
                            subTitle={['Tecnology', 'News', 'Financials']}
                            src=""
                            summary="Week 10"
                            status="Completed"
                        />
                        <Deda
                            title="New York City"
                            subTitle={['Tecnology', 'News', 'Financials']}
                            src=""
                            summary="Week 10"
                            status="Incomplete"
                        />
                        <Deda
                            title="New York City"
                            subTitle={['Tecnology', 'News', 'Financials']}
                            src=""
                            summary="Week 10"
                            status=""
                        />
                    </DEDAList>
                </ContentRow>
                <ContentRow>
                    <RowTitle>Most recents DEDAs</RowTitle>
                    <DEDAList>
                        <Deda
                            title="New York City"
                            subTitle={['Tecnology', 'News', 'Financials']}
                            src=""
                            summary="Week 10"
                            status="Completed"
                        />
                        <Deda
                            title="New York City"
                            subTitle={['Tecnology', 'News', 'Financials']}
                            src=""
                            summary="Week 10"
                            status="Completed"
                        />
                        <Deda
                            title="New York City"
                            subTitle={['Tecnology', 'News', 'Financials']}
                            src=""
                            summary="Week 10"
                            status="Incomplete"
                        />
                        <Deda
                            title="New York City"
                            subTitle={['Tecnology', 'News', 'Financials']}
                            src=""
                            summary="Week 10"
                            status=""
                        />
                    </DEDAList>
                </ContentRow>
            </ContentFrame>
        </>
    );
}

export default withAuthentication(Page);
