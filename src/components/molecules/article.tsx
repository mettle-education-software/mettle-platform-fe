'use client';

import styled from '@emotion/styled';
import { ArticleType } from 'interfaces';
import Link from 'next/link';
import { CSSProperties } from 'react';

const ArticleWrapper = styled(Link)`
    border-radius: var(--border-radius-small);
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
    align-self: stretch;
`;

const Thumbnail = styled.div`
    display: flex;
    justify-content: flex-start;
    height: 11.5rem;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.875rem;
`;
const Day = styled.div`
    display: flex;
    padding: 0 0.75rem;
    align-items: center;
    background-color: var(--brown-main);
    justify-content: center;
    border-radius: 6.25rem;
    font-weight: var(--font-weight-bold);
`;
const Text = styled.div`
    display: flex;
    align-items: flex-start;
    color: var(--grey-light);
    text-wrap: wrap;
`;

function Article({ text, link, image, day }: ArticleType) {
    const thumbnailStyle: CSSProperties = {
        background: `url(${image !== '' ? image : '/mettle-logo.svg'}) lightgray 50% / contain no-repeat`,
    };
    return (
        <ArticleWrapper href={link} target="_blank">
            <Thumbnail style={thumbnailStyle}>
                <Day>Day {day}</Day>
            </Thumbnail>
            <Text>{text}</Text>
        </ArticleWrapper>
    );
}

export default Article;
