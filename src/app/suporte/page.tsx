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
        window.$chatwoot?.toggle?.('open');
        router.replace('/');
    }, [newDesign, router]);
    if (!newDesign) return null;

    return (
        <AppLayout>
            <NewChat />
        </AppLayout>
    );
}

export default withAuthentication(Suporte);
