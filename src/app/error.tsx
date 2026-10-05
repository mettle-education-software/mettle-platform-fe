'use client';

// Error components must be Client Components
import styled from '@emotion/styled';
import * as Sentry from '@sentry/nextjs';
import { Flex, Result, Button, Typography } from 'antd';
import { useNewDesign } from 'hooks/useNewDesign';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useEffect } from 'react';

// Página de erro da plataforma nova (libs/newDesign), só para as contas da lista: fora do bundle dos alunos.
const NewStatus = dynamic(() => import('components/_new/NewStatus'), { ssr: false, loading: () => null });

const ErrorContainer = styled.div`
    height: 100vh;
    width: 100%;
    background: var(--main-bg);
`;

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        Sentry.captureException(error);
        console.error(error);
    }, [error]);

    const newDesign = useNewDesign();
    if (newDesign)
        return (
            <NewStatus
                title="Ops!"
                text="Parece que algo deu errado."
                detail={error.message}
                action={
                    <button type="button" className="btn line" onClick={reset}>
                        Tentar de novo
                    </button>
                }
            />
        );

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
                    status="500"
                    title={
                        <Typography.Title style={{ color: '#FFF' }} level={2}>
                            Ops!
                        </Typography.Title>
                    }
                    subTitle={
                        <Flex vertical>
                            <Typography.Text style={{ color: '#FFF' }}>Parece que algo deu errado.</Typography.Text>
                            <Typography.Text style={{ color: '#FFF' }}>
                                Detalhes do erro: {error.message}
                            </Typography.Text>
                        </Flex>
                    }
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
