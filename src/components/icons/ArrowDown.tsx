import { CaretDownOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';

export const ArrowDown = styled(CaretDownOutlined)`
    transition: transform 300ms ease;

    &.open {
        transform: rotate(180deg);
    }
`;
