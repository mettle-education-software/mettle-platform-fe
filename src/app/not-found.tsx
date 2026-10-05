'use client';

import styled from '@emotion/styled';
import { Flex, Result, Button, Typography } from 'antd';
import { useNewDesign } from 'hooks/useNewDesign';
import dynamic from 'next/dynamic';
import Image from 'next/image';

// Página "não existe" da plataforma nova (libs/newDesign), só para as contas da lista: fora do bundle dos alunos.
const NewStatus = dynamic(() => import('components/_new/NewStatus'), { ssr: false, loading: () => null });

const ErrorContainer = styled.div`
    height: 100vh;
    width: 100%;
    background: var(--main-bg);
`;

export default function NotFound() {
    const newDesign = useNewDesign();
    if (newDesign)
        return (
            <NewStatus
                title="Ops!"
                text="A página que você está procurando não existe."
                action={
                    <a className="btn line" href="/">
                        Voltar
                    </a>
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
