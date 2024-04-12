import styled from '@emotion/styled';
import { Image } from 'antd';
import { CSSProperties } from 'react';
import { largeAndBigger } from 'styles/media.constants';

const Deda = styled.div`
    display: flex;
    flex-direction: column;
    border: 1px solid;
    border-color: var(--white);
    border-radius: var(--border-radius);
    width: 10rem;
    height: 13.125rem;
    ${largeAndBigger} {
        width: 16.75rem;
        height: 22.5rem;
    }
`;

const Frame = styled.div`
    display: flex;
    padding: 0.75rem;
    justify-content: space-between;
    align-items: center;
    flex: 1 0 0;
    align-self: stretch;
    ${largeAndBigger} {
        padding: 1.375rem;
    }
`;

const InnerFrame = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    flex: 1 0 0;
    align-self: stretch;
`;

const TitleWrapper = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    align-self: stretch;
`;

const BottomWrapper = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: flex-start;
    gap: 0.625rem;
    align-self: stretch;
`;

const Summary = styled.div`
    border-radius: 6.25rem;
    background-color: var(--grey-light);
    line-height: 1.25rem;
    padding: 0 0.5rem;
    text-align: center;
    font-size: 0.45rem;
    font-weight: var(--h1-font-weight);
    ${largeAndBigger} {
        font-size: 0.875rem;
    }
`;

const Status = styled.div`
    border-radius: 6.25rem;
    line-height: 1.25rem;
    padding: 0 0.5rem;
    text-align: center;
    font-size: 0.45rem;
    ${largeAndBigger} {
        font-size: 0.875rem;
    }
`;

const Title = styled.div`
    color: var(--grey-light);
    font-size: 1.125rem;
    font-weight: var(--h3-font-weight);
    ${largeAndBigger} {
        font-size: var(--h3-font-size);
    }
`;

const SubTitle = styled.div`
    color: var(--grey-dark);
    display: flex;
    flex-direction: row;
    gap: 0.25rem;
    align-items: center;
    font-size: 0.6rem;
    ${largeAndBigger} {
        align-items: self-end;
        gap: 0.5rem;
        font-size: 1rem;
    }
`;

type DedaType = {
    title: string;
    subTitle: Array<string>;
    src: string;
    summary: string;
    status?: string;
    locked?: boolean;
};

function getBackGroundColor(status?: string): string {
    switch (status?.toLowerCase()) {
        case 'completed': {
            return 'var(--green-light)';
        }
        case 'incomplete': {
            return 'var(--yellow-light)';
        }
        default: {
            return '';
        }
    }
}

function Molecule({ title, subTitle, src, summary, status }: DedaType) {
    const dedaStyle: CSSProperties = {
        backgroundImage: src,
    };

    const statusStyle: CSSProperties = {
        backgroundColor: getBackGroundColor(status!),
    };

    return (
        <Deda style={dedaStyle}>
            <Frame>
                <InnerFrame>
                    <TitleWrapper>
                        <Summary>{summary}</Summary>
                        {status && <Status style={statusStyle}>{status}</Status>}
                    </TitleWrapper>
                    <BottomWrapper>
                        <Title>{title}</Title>
                        <SubTitle>
                            {subTitle.map((item, i, { length }) => (
                                <>
                                    <div>{item}</div>
                                    {!(length - 1 === i) && <Image src="./ellipse-2.svg" />}
                                </>
                            ))}
                        </SubTitle>
                    </BottomWrapper>
                </InnerFrame>
            </Frame>
        </Deda>
    );
}

export default Molecule;
