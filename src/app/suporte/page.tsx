'use client';

import { AppLayout } from 'components';
import { useNewDesign } from 'hooks/useNewDesign';
import { withAuthentication } from 'libs';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Mettle Chat (libs/chat): por ora só nas contas da plataforma nova; as demais seguem com o widget do Chatwoot.
const NewChat = dynamic(() => import('components/_new/NewChat'), { ssr: false, loading: () => null });

function Suporte() {
    const newDesign = useNewDesign();
    const router = useRouter();
    useEffect(() => {
        if (newDesign) return;
        // tela atual: o widget do Chatwoot entra depois de conhecida a sessão; abre quando ficar pronto
        const open = () => {
            window.$chatwoot?.toggle?.('open');
            router.replace('/');
        };
        if (window.$chatwoot?.toggle) return open();
        window.addEventListener('chatwoot:ready', open, { once: true });
        // widget bloqueado ou fora do ar: a aba de ajuda (e-mail) no lugar de uma tela vazia
        const fallback = window.setTimeout(() => router.replace('/settings?tab=help'), 8000);
        return () => {
            window.removeEventListener('chatwoot:ready', open);
            window.clearTimeout(fallback);
        };
    }, [newDesign, router]);
    if (!newDesign) return null;

    return (
        <AppLayout>
            <NewChat />
        </AppLayout>
    );
}

export default withAuthentication(Suporte);
