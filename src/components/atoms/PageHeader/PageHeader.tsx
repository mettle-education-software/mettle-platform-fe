import styled from '@emotion/styled';
import React from 'react';

const Header = styled.header`
    background: var(--primary-bg);
    width: 100%;
    height: 4rem;
    display: flex;
    padding: 3rem 1rem;
`;

export const PageHeader: React.FC = () => {
    return <Header></Header>;
};
