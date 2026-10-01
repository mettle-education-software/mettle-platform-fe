'use client';

import { LoadingLayout } from 'components/layouts/LoadingLayout/LoadingLayout';
import { useDedaIdBySlug } from 'hooks/queries/dedaQueries';
import { DEDA_ID_PATTERN } from 'libs/cleanUrls';
import { notFound } from 'next/navigation';
import React from 'react';

// A URL leva o dedaSlug (ex.: /imerso/deda/london); daqui para dentro tudo segue com o dedaId.
// eslint-disable-next-line react/display-name
export const withDedaSlug = (Component: any) => (props: { params: { dedaSlug: string } }) => {
    const { dedaSlug } = props.params;
    const isLegacyId = DEDA_ID_PATTERN.test(dedaSlug);
    const { data, loading } = useDedaIdBySlug(dedaSlug, isLegacyId);
    const dedaId = isLegacyId ? dedaSlug : data?.dedaContentCollection.items[0]?.dedaId;

    if (!dedaId) {
        if (!loading) notFound();
        return <LoadingLayout />;
    }
    return <Component {...props} params={{ ...props.params, dedaId }} />;
};
