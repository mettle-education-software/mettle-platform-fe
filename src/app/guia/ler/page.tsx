'use client';

import NotFound from 'app/not-found';
import { AppLayout } from 'components';
import { useNewDesign } from 'hooks/useNewDesign';
import { withAuthentication } from 'libs';
import dynamic from 'next/dynamic';

// Leitor do e-book (edição web): só nas contas da plataforma nova, como /guia; as demais veem "não existe".
const NewEbookReader = dynamic(() => import('components/_new/NewEbookReader'), { ssr: false, loading: () => null });

function GuiaLer() {
    const newDesign = useNewDesign();
    if (!newDesign) return <NotFound />;

    return (
        <AppLayout>
            <NewEbookReader />
        </AppLayout>
    );
}

export default withAuthentication(GuiaLer);
