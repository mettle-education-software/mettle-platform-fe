import styled from '@emotion/styled';

/** Botão do gravador: alvo de toque ≥ 44 px, contraste ≥ 4,5:1 e foco visível no teclado. */
export const RecButton = styled.button`
    min-height: 44px;
    min-width: 44px;
    padding: 0 1.25rem;
    border-radius: 50rem;
    border: 2px solid transparent;
    font: inherit;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    white-space: nowrap;
    background: #b89261; /* texto escuro sobre o dourado: 5,9:1 */
    color: #1f1b16;

    &.ghost {
        background: transparent;
        border-color: #d9d2c7;
        color: #ffffff;
    }

    &.record {
        background: #b3261e; /* branco sobre vermelho: 6,2:1 */
        color: #ffffff;
    }

    &.link {
        background: transparent;
        color: #e8dccb;
        text-decoration: underline;
        padding: 0 0.5rem;
        font-weight: 400;
    }

    &:focus-visible {
        outline: 3px solid #ffffff;
        outline-offset: 2px;
    }

    &:disabled {
        opacity: 0.55;
        cursor: not-allowed;
    }

    svg {
        width: 1.25rem;
        height: 1.25rem;
    }
`;

/** Texto só para leitores de tela. */
export const SrOnly = styled.span`
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
`;
