'use client';

import styled from '@emotion/styled';
import { Flex, Result, Button, Typography } from 'antd';
import Image from 'next/image';

const ErrorContainer = styled.div`
    height: 100vh;
    width: 100%;
    background: var(--main-bg);
`;

export default function NotFound() {
    return (
        <ErrorContainer>
            <Flex
                justify="center"
                align="center"
                vertical
                style={{ height: '100vh', width: '100%', background: 'var(--main-bg)' }}
            >
                <Image
                    priority
                    style={{ marginBottom: -100 }}
                    src="/img/logo_light.svg"
                    height={300}
                    width={400}
                    alt="Mettle-logo"
                />
                <Result
                    status="404"
                    title={
                        <Typography.Title style={{ color: '#FFF' }} level={2}>
                            Ops!
                        </Typography.Title>
                    }
                    subTitle={
                        <Typography.Text style={{ color: '#FFF' }}>
                            A página que você está procurando não existe.
                        </Typography.Text>
                    }
                    extra={
                        <Button type="primary" href="/">
                            Voltar
                        </Button>
                    }
                />
            </Flex>
        </ErrorContainer>
    );
}
