import styled from '@emotion/styled';
import { Tabs } from 'antd';
import { MAX_CONTENT_WIDTH } from 'libs';

export const TabNav = styled(Tabs)<{ sticky?: boolean; withoutBottomBorder?: boolean }>`
    width: 100% !important;
    max-width: ${MAX_CONTENT_WIDTH}px !important;

    ${({ sticky }) =>
        sticky
            ? `
            .ant-tabs-nav {
                background: #2b2b2b;
                position: sticky;
                top: 0;
                z-index: 4;
            }`
            : ''}
    .ant-tabs-tab {
        border: none !important;
        background: transparent !important;
    }

    .ant-tabs-tab-active {
        color: var(--secondary) !important;
        background: #3c362f !important;
        border-bottom: 1px solid var(--secondary) !important;
        border-radius: 0.5rem 0.5rem 0 0;
    }

    .ant-tabs-tab-active .ant-tabs-tab-btn {
        padding: 0 1rem;
    }

    ${({ withoutBottomBorder }) =>
        withoutBottomBorder
            ? `
            .ant-tabs-nav::before {
                border-bottom: none;
            }`
            : ''}
`;
