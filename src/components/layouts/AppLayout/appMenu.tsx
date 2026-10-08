'use client';

import {
    CustomerServiceOutlined,
    HomeOutlined,
    LogoutOutlined,
    SettingOutlined,
    TeamOutlined,
} from '@ant-design/icons';
import { MenuProps, Typography } from 'antd';
import { useChatUnread } from 'hooks/useChatUnread';
import { useComunidade } from 'hooks/useComunidade';
import { useNewDesign } from 'hooks/useNewDesign';
import { handleLogout } from 'libs';
import { CHAT_PATH } from 'libs/chat';
import { hpecLessonPath } from 'libs/cleanUrls';
import { COMUNIDADE_PATH } from 'libs/comunidade';
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
    const newDesign = useNewDesign();
    const unread = useChatUnread();
    const comunidade = useComunidade();

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
        // Comunidade Imerso (/comunidade): só para quem o Worker reconhece como membro (fase 1: o dono)
        ...(comunidade.member
            ? [
                  {
                      key: 'community',
                      label: 'Comunidade',
                      icon: <TeamOutlined />,
                      ...(comunidade.unread > 0 ? { badge: comunidade.unread } : {}),
                      onClick: go(() => router.push(COMUNIDADE_PATH)),
                  },
              ]
            : []),
        // O chat não tem balão flutuante (hideMessageBubble no layout); abre por aqui. Na plataforma nova, a página
        // Mettle Chat (/suporte) no lugar do widget, com o número de respostas não vistas (badge).
        {
            key: 'support',
            label: 'Suporte',
            icon: <CustomerServiceOutlined />,
            ...(newDesign && unread > 0 ? { badge: unread } : {}),
            onClick: go(() => {
                if (newDesign) router.push(CHAT_PATH);
                else if (window.$chatwoot?.toggle) window.$chatwoot.toggle('open');
                else router.push('/settings?tab=help');
            }),
        },
        { key: 'logout', label: 'Sair', icon: <LogoutOutlined />, onClick: go(() => handleLogout()) },
    ];

    // `goImerso`: a casca nova torna a linha inteira do IMERSO clicável (o mesmo destino do rótulo).
    return { items, selectedKeys: pathname.split('/'), goImerso };
};
