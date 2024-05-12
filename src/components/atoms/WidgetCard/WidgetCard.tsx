import styled from '@emotion/styled';
import { Card } from 'antd';

export const WidgetCard = styled(Card)`
    border: none;
    background: rgba(242, 240, 238, 0.05);
    height: 100%;

    .ant-card-head {
        background: #3c362f;
        border-bottom: 1px solid var(--secondary);
        color: #fff;
    }

    //.ant-card-body {
    //    background: rgba(242, 240, 238, 0.05);
    //}
`;
