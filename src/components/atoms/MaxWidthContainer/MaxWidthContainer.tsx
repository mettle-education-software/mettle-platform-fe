'use client';

import styled from '@emotion/styled';
import { MAX_CONTENT_WIDTH, SMALL_VIEWPORT } from 'libs';

export const MaxWidthContainer = styled.div`
    width: 100%;
    max-width: calc(${MAX_CONTENT_WIDTH}px + 2rem);
    padding: 0 2rem;
`;
