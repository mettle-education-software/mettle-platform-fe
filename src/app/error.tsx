'use client';

// Error components must be Client Components
import styled from '@emotion/styled';
import { Flex, Result, Button, Typography } from 'antd';
import Image from 'next/image';
import { useEffect } from 'react';

const ErrorContainer = styled.div`
    height: 100vh;
    width: 100%;
    background: var(--main-bg);
`;

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <ErrorContainer>
            <Flex
                justify="center"
                align="center"
                vertical
                style={{ height: '100vh', width: '100%', background: 'var(--main-bg)' }}
            >
                <Image
                    style={{ marginBottom: -100 }}
                    src="/img/logo_light.svg"
                    height={300}
                    width={400}
                    alt="Mettle-logo"
                />
                <Result
                    status="500"
                    title={
                        <Typography.Title style={{ color: '#FFF' }} level={2}>
                            Ops!
                        </Typography.Title>
                    }
                    subTitle={<Typography.Text style={{ color: '#FFF' }}>Sorry, something went wrong.</Typography.Text>}
                    extra={
                        <Button type="primary" onClick={reset}>
                            Try again
                        </Button>
                    }
                />
            </Flex>
        </ErrorContainer>
    );
}
