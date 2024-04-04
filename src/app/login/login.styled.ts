import styled from '@emotion/styled';
import { Button } from 'antd';

export const Container = styled.div((props) => ({
    alignItems: 'center',
    display: 'flex',
    gap: '12rem',
    justifyContent: 'center',
}));

export const Form = styled.div((props) => ({
    span: {
        color: 'var(--font-primary)',
    },
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    width: '22.5rem',
}));

export const input_height = '3.125rem';

export const input_icon = {
    color: 'var(--secondary)',
};

export const EnterButton = styled(Button)((props) => ({
    height: '3.125rem',
    span: {
        color: 'var(--primary)',
    },
}));

export const Terms = styled.div((props) => ({
    span: {
        fontSize: '0.6rem',
        width: '20rem',
    },
    'span > a': {
        fontSize: '0.6rem',
    },
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
}));

export const LoginErrorContainer = styled.div((props) => ({
    color: 'var(--danger)',
    fontSize: '0.8rem',
    paddingTop: '0.4rem',
    paddingBottom: '0.4rem',
}));
