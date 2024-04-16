import styled from '@emotion/styled';
import { Image } from 'antd';
import { DedaType } from 'interfaces';
import Link from 'next/link';
import { CSSProperties } from 'react';
import { largeAndBigger } from 'styles/media.constants';

const Deda = styled.div`
    display: flex;
    flex-direction: column;
    background-repeat: no-repeat;
    background-size: cover;
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
    span:last-of-type {
        font-weight: normal;
    }
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

function handleDisabled(event: any) {
    var element = event.target as HTMLElement;
    if (element.closest('a')?.classList.contains('disabled')) {
        event.preventDefault();
    }
}

function Molecule({ id, title, subTitle, src, week, status, locked, current }: DedaType) {
    const dedaStyle: CSSProperties = {
        background: `linear-gradient(180deg, rgba(0, 0, 0, 0.00) 0%, #2B2B2B 83.45%), url(${src}) lightgray 50% / cover no-repeat`,
    };

    const currentDedaStyle: CSSProperties = {
        color: 'var(--brown-light)',
    };

    const statusStyle: CSSProperties = {
        backgroundColor: getBackGroundColor(status!),
    };

    return (
        <Link href={`/course/deda/${id}`} onClick={(e) => handleDisabled(e)} className={locked ? 'disabled' : ''}>
            <Deda style={dedaStyle}>
                <Frame>
                    <InnerFrame>
                        <TitleWrapper>
                            <Summary>
                                {current && <span>Current DEDA</span>}
                                {!current && (
                                    <>
                                        <span>Week </span>
                                        <span>{('00' + week).slice(-3)}</span>
                                    </>
                                )}
                            </Summary>
                            {/* {status && <Status style={statusStyle}>{status}</Status>} */}
                        </TitleWrapper>
                        {locked && <Image src="/lock.svg" alt="locked" preview={false} />}
                        <BottomWrapper>
                            <Title style={current ? currentDedaStyle : {}}>{title}</Title>
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
        </Link>
    );
}

export default Molecule;
