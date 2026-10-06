'use client';

import NotFound from 'app/not-found';
import { AppLayout } from 'components';
import { useNewDesign } from 'hooks/useNewDesign';
import { withAuthentication } from 'libs';
import dynamic from 'next/dynamic';

// E-book como produto (libs/ebook): por ora só nas contas da plataforma nova; as demais veem "não existe", como hoje.
const NewEbook = dynamic(() => import('components/_new/NewEbook'), { ssr: false, loading: () => null });

function Guia() {
    const newDesign = useNewDesign();
    if (!newDesign) return <NotFound />;

    return (
        <AppLayout>
            <NewEbook />
        </AppLayout>
    );
}

export default withAuthentication(Guia);
