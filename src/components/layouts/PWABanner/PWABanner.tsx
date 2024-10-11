import { AndroidFilled, AppleFilled } from '@ant-design/icons';
import styled from '@emotion/styled';
import { IosShare } from '@mui/icons-material';
import { Flex, Tabs, Typography } from 'antd';
import { Logo, MaxWidthContainer } from 'components';
import { LoadingLayout } from 'components/layouts/LoadingLayout/LoadingLayout';
import { useDeviceSize } from 'hooks';
import { SMALL_VIEWPORT } from 'libs';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';

const { Text } = Typography;

interface PWABanner {
    children: React.ReactNode;
}

const Container = styled.div`
    width: 100%;
    height: 100%;
    min-height: 90vh;
    background: var(--main-bg);
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    padding: 2rem 0;
`;

export const PWABanner: React.FC<PWABanner> = ({ children }) => {
    const deviceSize = useDeviceSize();
    const [isLoading, setIsLoading] = useState(true);

    const [isStandalone, setIsStandAlone] = useState(false);
    const [isDeviceMobile, setIsDeviceMobile] = useState(false);
    const [deviceOS, setDeviceOS] = useState('ios');

    useEffect(() => {
        if (window && navigator) {
            setIsStandAlone(window.matchMedia('(display-mode: standalone)').matches);
            setIsDeviceMobile(/Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
            setDeviceOS(navigator.userAgent);
        }
        setIsLoading(false);
    }, []);

    const [tab, setTab] = useState<'ios' | 'android'>(deviceOS.includes('Android') ? 'android' : 'ios');

    return children;

    if (isLoading) return <LoadingLayout />;

    if ((isDeviceMobile && isStandalone && deviceSize === 'mobile') || deviceSize === 'desktop') return children;

    return (
        <Container>
            <MaxWidthContainer>
                <Flex vertical align="center" gap="0.5rem">
                    <Logo />
                    <Text className="color-white center">
                        Você está a um passo de usar o aplicativo móvel da Mettle. Basta instalar e aproveitar!
                    </Text>
                </Flex>

                <Tabs
                    activeKey={tab}
                    onChange={(key) => setTab(key as 'ios' | 'android')}
                    centered
                    items={[
                        {
                            key: 'ios',
                            label: 'iOS',
                            icon: <AppleFilled />,
                            children: (
                                <div style={{ padding: '0 1.5rem', width: '100%' }}>
                                    <Flex vertical gap="0.8rem">
                                        <ol className="color-white">
                                            <li>
                                                <Text className="color-white">
                                                    <strong>Toque no botão de compartilhamento</strong>: O botão{' '}
                                                    <IosShare /> está localizado na parte inferior da tela.
                                                </Text>
                                            </li>
                                            <li>
                                                <Text className="color-white">
                                                    <strong>Selecione Adicionar à Tela de Início</strong>: Role a lista
                                                    de opções até encontrar Adicionar à Tela de Início e toque nela.
                                                </Text>
                                            </li>
                                            <li>
                                                <Text className="color-white">
                                                    <strong>Confirme o nome</strong>: Você pode editar o nome do
                                                    aplicativo se desejar, ou deixar o nome padrão.
                                                </Text>
                                            </li>
                                            <li>
                                                <Text className="color-white">
                                                    <strong>Toque em Adicionar</strong>: Localizado no canto superior
                                                    direito da tela.
                                                </Text>
                                            </li>
                                            <li>
                                                <Text className="color-white">
                                                    <strong>Pronto!</strong>: A aplicativo agora está instalado no seu
                                                    iPhone!
                                                </Text>
                                            </li>
                                        </ol>
                                        <div style={{ width: '100%', aspectRatio: '9/16' }}>
                                            <Image
                                                priority
                                                style={{ borderRadius: '1rem' }}
                                                objectFit="contain"
                                                src="/ios-install-tutorial.gif"
                                                alt="install-tutorial-on-ios"
                                                layout="intrinsic"
                                                width={SMALL_VIEWPORT - 100}
                                                height={500}
                                            />
                                        </div>
                                    </Flex>
                                </div>
                            ),
                        },
                        {
                            key: 'android',
                            label: 'Android',
                            icon: <AndroidFilled />,
                            children: (
                                <div style={{ padding: '0 1.5rem' }}>
                                    <ol className="color-white">
                                        <li>
                                            <Text className="color-white">
                                                <strong>Toque no menu de três pontos</strong>: Localizado no canto
                                                superior direito da tela do navegador Chrome.
                                            </Text>
                                        </li>
                                        <li>
                                            <Text className="color-white">
                                                <strong>Selecione Adicionar à tela inicial</strong>: Esta opção irá
                                                aparecer no menu.
                                            </Text>
                                        </li>
                                        <li>
                                            <Text className="color-white">
                                                <strong>Confirme o nome</strong>: Você pode editar o nome do aplicativo
                                                se desejar, ou deixar o nome padrão.
                                            </Text>
                                        </li>
                                        <li>
                                            <Text className="color-white">
                                                <strong>Toque em Adicionar</strong>: O Android pode pedir para você
                                                confirmar se deseja adicionar à tela inicial.
                                            </Text>
                                        </li>
                                        <li>
                                            <Text className="color-white">
                                                <strong>Pronto!</strong>: A aplicativo agora está instalado no seu
                                                aparelho!
                                            </Text>
                                        </li>
                                    </ol>
                                </div>
                            ),
                        },
                    ]}
                />
            </MaxWidthContainer>
        </Container>
    );
};
