'use client';

import styled from '@emotion/styled';
import { VideoType } from 'interfaces';
import Link from 'next/link';
import { CSSProperties } from 'react';

const VideoWrapper = styled(Link)`
    align-self: stretch;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
`;

const Thumbnail = styled.div`
    align-self: stretch;
    border-radius: var(--border-radius-small);
    display: flex;
    justify-content: flex-start;
    height: 11.5rem;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.875rem;
    padding: 1.125rem;
`;

const Day = styled.div`
    display: flex;
    padding: 0 0.75rem;
    align-items: center;
    align-self: flex-end;
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

function Video({ text, link, day }: VideoType) {
    const videoThumbUrl = `http://img.youtube.com/vi/${link.split('=')[1]}/hqdefault.jpg`;
    const thumbnailStyle: CSSProperties = {
        background: `url(${videoThumbUrl}) lightgray 50% / auto no-repeat`,
    };

    return (
        <VideoWrapper href={link} target="_blank">
            <Thumbnail style={thumbnailStyle}>
                <Day>Day {day}</Day>
            </Thumbnail>
            <Text>{text}</Text>
        </VideoWrapper>
    );
}

export default Video;
