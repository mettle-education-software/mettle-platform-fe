'use client';

import { AppLayout } from 'components';
import { useNewDesign } from 'hooks/useNewDesign';
import { withAuthentication } from 'libs';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Comunidade Imerso (libs/comunidade): só na plataforma nova; o Worker decide quem é membro.
const NewComunidade = dynamic(() => import('components/_new/NewComunidade'), { ssr: false, loading: () => null });

function Comunidade() {
    const newDesign = useNewDesign();
    const router = useRouter();
    useEffect(() => {
        if (!newDesign) router.replace('/');
    }, [newDesign, router]);
    if (!newDesign) return null;

    return (
        <AppLayout>
            <NewComunidade />
        </AppLayout>
    );
}

export default withAuthentication(Comunidade);
