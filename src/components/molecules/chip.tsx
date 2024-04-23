import Icon from '@ant-design/icons';
import styled from '@emotion/styled';
import { ChipType } from 'interfaces';
import { CSSProperties } from 'react';

const Frame = styled.div`
    display: flex;
    border-radius: 6.25rem;
    gap: 0.5rem;
    line-height: 1.25rem;
    padding: 0.25rem 0.625rem;
    text-align: center;
`;

function Chip({ text, color, background, border, icon, active }: ChipType) {
    if (active === undefined) {
        active = false;
    }

    background = active ? background : '';
    border = active ? '' : border;

    const frameStyle: CSSProperties = {
        color: color,
        background: background,
        border: border,
    };

    return (
        <Frame style={frameStyle}>
            {icon && <Icon component={icon} />}
            {text}
        </Frame>
    );
}

export default Chip;
