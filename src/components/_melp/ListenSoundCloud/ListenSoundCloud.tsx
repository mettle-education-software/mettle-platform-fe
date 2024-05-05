import styled from '@emotion/styled';
import React, { IframeHTMLAttributes } from 'react';

const ListenSoundCloudLarge = styled.iframe`
    box-sizing: border-box;
    color: rgb(51, 51, 51);
    display: flex;
    font-family: 'Lucida Grande', 'Lucida Sans Unicode', 'Lucida Sans', Garuda, Verdana, Tahoma, sans-serif;
    font-size: 12px;
    font-stretch: normal;
    font-style: normal;
    font-variant-caps: normal;
    font-weight: 400;
    height: 10.3;
    line-height: 16.799999px;
    width: 100%;
    border: none;
    border-radius: 0.5rem;
`;

const ListenSoundCloudSmall = styled.iframe`
    box-sizing: border-box;
    color: rgb(51, 51, 51);
    display: flex;
    font-family: 'Lucida Grande', 'Lucida Sans Unicode', 'Lucida Sans', Garuda, Verdana, Tahoma, sans-serif;
    font-size: 12px;
    font-stretch: normal;
    font-style: normal;
    font-variant-caps: normal;
    font-weight: 400;
    height: 10.3;
    line-height: 16.799999px;
    width: 100%;
    border: none;
    border-radius: 0.5rem;
`;

export const ListenSoundCloud: React.FC<IframeHTMLAttributes<unknown> & { size?: string }> = ({
    size = 'large',
    ...props
}) => {
    if (size === 'large') {
        return <ListenSoundCloudLarge {...props} />;
    }
    return <ListenSoundCloudSmall {...props} />;
};
