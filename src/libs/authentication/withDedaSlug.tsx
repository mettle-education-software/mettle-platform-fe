'use client';

import { LoadingLayout } from 'components/layouts/LoadingLayout/LoadingLayout';
import { useDedaIdBySlug } from 'hooks/queries/dedaQueries';
import { useNewDesign } from 'hooks/useNewDesign';
import { DEDA_ID_PATTERN } from 'libs/cleanUrls';
import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import React from 'react';

const NewStatus = dynamic(() => import('components/_new/NewStatus'), { ssr: false, loading: () => null });

// A URL leva o dedaSlug (ex.: /imerso/deda/london); daqui para dentro tudo segue com o dedaId.
// eslint-disable-next-line react/display-name
export const withDedaSlug = (Component: any) => (props: { params: { dedaSlug: string } }) => {
    const { dedaSlug } = props.params;
    const isLegacyId = DEDA_ID_PATTERN.test(dedaSlug);
    const { data, loading, error, refetch } = useDedaIdBySlug(dedaSlug, isLegacyId);
    const newDesign = useNewDesign();
    const dedaId = isLegacyId ? dedaSlug : data?.dedaContentCollection.items[0]?.dedaId;

    if (!dedaId) {
        // conteúdo fora do ar (espelho) não é "esta página não existe": a plataforma nova oferece tentar de novo
        if (error && newDesign)
            return (
                <NewStatus
                    title="Ops!"
                    text="We couldn’t load this DEDA."
                    action={
                        <button type="button" className="btn line" onClick={() => refetch()}>
                            Try again
                        </button>
                    }
                />
            );
        if (!loading) notFound();
        return <LoadingLayout />;
    }
    return <Component {...props} params={{ ...props.params, dedaId }} />;
};
