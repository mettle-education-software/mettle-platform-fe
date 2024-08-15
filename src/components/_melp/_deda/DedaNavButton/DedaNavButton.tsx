import styled from '@emotion/styled';
import { Button } from 'antd';
import { SMALL_VIEWPORT } from 'libs';

export const DedaNavButton = styled(Button)`
    border: none;
    height: 4rem;
    display: flex;
    align-items: center;
    padding: 0;
    font-size: 18px;

    &.active {
        color: var(--secondary);
    }

    @media (max-width: ${SMALL_VIEWPORT}px) {
        min-height: 100%;
        font-size: 0.7rem;
        color: var(--primary) !important;
        border-radius: 0 !important;
        flex: 1;
        flex-basis: 33.33%;
        padding: 0 0.5rem;
        background: #eae8e2;

        display: flex;
        justify-content: center;
        align-items: center;

        &:not(:last-child) {
            border-right: 1px solid #eae8e2;
        }

        &.active {
            color: var(--primary) !important;
            background: #3c362f26 !important;
            font-weight: 700;
        }
    }
`;
