'use client';

import { CustomerServiceOutlined, HomeOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import { MenuProps, Typography } from 'antd';
import { handleLogout } from 'libs';
import { hpecLessonPath } from 'libs/cleanUrls';
import { IMERSO_PRODUCT } from 'libs/productAccess';
import { usePathname, useRouter } from 'next/navigation';
import { useMelpContext, useProductAccess } from 'providers';
import React from 'react';
import { DedaIcon } from '../../icons';

const { Text } = Typography;

/**
 * Itens do menu da Plataforma — fonte única: o menu lateral (AppLayout) e a gaveta da página nova do DEDA usam esta
 * lista. `onNavigate` roda antes de cada destino (fechar a gaveta no celular).
 */
export const useAppMenu = (onNavigate: () => void = () => {}) => {
    const pathname = usePathname();
    const router = useRouter();
    const { melpSummary } = useMelpContext();
    const { access } = useProductAccess();
    const imersoState = access(IMERSO_PRODUCT).state;

    const go = (action: () => void) => (info: { domEvent: React.SyntheticEvent }) => {
        info.domEvent.preventDefault();
        onNavigate();
        action();
    };
    const goImerso = (event: React.MouseEvent) => {
        event.stopPropagation();
        router.push('/imerso');
    };

    const items: NonNullable<MenuProps['items']> = [
        { key: 'home', icon: <HomeOutlined />, label: 'Início', onClick: go(() => router.push('/')) },
        ...(imersoState !== 'none'
            ? [
                  {
                      key: 'imerso',
                      icon: <DedaIcon style={{ marginLeft: '-3px' }} onClick={goImerso} />,
                      label: (
                          <Text style={{ cursor: 'pointer' }} onClick={goImerso}>
                              IMERSO
                          </Text>
                      ),
                      children: [
                          {
                              key: 'meplHpec',
                              label: 'HPEC',
                              onClick: go(() => router.push(hpecLessonPath('welcome'))),
                          },
                          {
                              key: 'melpDeda',
                              label: 'DEDA',
                              onClick: go(() => router.push('/imerso/deda')),
                              disabled: ['MELP_SUSPENDED'].includes(melpSummary?.melp_status),
                          },
                          {
                              key: 'melpLamp',
                              label: 'LAMP',
                              disabled: !['DEDA_STARTED', 'DEDA_FINISHED', 'DEDA_PAUSED'].includes(
                                  melpSummary?.melp_status,
                              ),
                              onClick: go(() => router.push('/imerso/lamp')),
                          },
                      ],
                  },
              ]
            : []),
        {
            key: 'settings',
            label: 'Configurações',
            icon: <SettingOutlined />,
            onClick: go(() => router.push('/settings')),
        },
        // O chat não tem balão flutuante (hideMessageBubble no layout); abre por aqui.
        {
            key: 'support',
            label: 'Suporte',
            icon: <CustomerServiceOutlined />,
            onClick: go(() => {
                if (window.$chatwoot?.toggle) window.$chatwoot.toggle('open');
                else router.push('/settings?tab=help');
            }),
        },
        { key: 'logout', label: 'Sair', icon: <LogoutOutlined />, onClick: go(() => handleLogout()) },
    ];

    // `goImerso`: a casca nova torna a linha inteira do IMERSO clicável (o mesmo destino do rótulo).
    return { items, selectedKeys: pathname.split('/'), goImerso };
};
