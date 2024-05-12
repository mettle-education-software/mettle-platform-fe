import styled from '@emotion/styled';
import { Tabs } from 'antd';
import { MAX_CONTENT_WIDTH } from 'libs';

export const TabNav = styled(Tabs)`
    width: 100% !important;
    max-width: ${MAX_CONTENT_WIDTH}px !important;

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
`;
