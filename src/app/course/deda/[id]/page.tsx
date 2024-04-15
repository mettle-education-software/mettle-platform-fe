'use client';

import { useDeda } from 'hooks';

function Page({ params }: { params: { id: string } }) {
    const dedaData = useDeda('deda-notes', params.id);
    if (!dedaData) {
        return null;
    }
    const { data } = dedaData;
    if (!data) {
        return null;
    }

    const { dedaContentCollection: collection } = data;
    const deda = collection.items[0];

    return <div>{params.id}</div>;
}

export default Page;
