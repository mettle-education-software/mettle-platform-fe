'use client';

import { useQuery } from '@tanstack/react-query';
import { vimeoIdOf, vimeoOembedUrl, vumbnailUrl } from 'libs/newDesign';
import React, { useState } from 'react';

/** Miniatura do Vimeo (oEmbed; vumbnail se o oEmbed não der; sem imagem, o fundo neutro do card). */
export const VimeoThumb: React.FC<{ embedUrl?: string | null }> = ({ embedUrl }) => {
    const id = vimeoIdOf(embedUrl);
    const [failed, setFailed] = useState(false);
    const { data: oembed, isPending } = useQuery({
        queryKey: ['vimeo-oembed', id],
        queryFn: () =>
            fetch(vimeoOembedUrl(id as string))
                .then((r) => (r.ok ? r.json() : null))
                .then((j: { thumbnail_url?: string } | null) => j?.thumbnail_url ?? null)
                .catch(() => null),
        enabled: !!id,
        staleTime: Infinity,
        gcTime: Infinity,
        retry: false,
    });
    if (!id || isPending || failed) return null;
    return (
        // eslint-disable-next-line @next/next/no-img-element -- miniatura do Vimeo
        <img src={oembed || vumbnailUrl(id)} alt="" loading="lazy" onError={() => setFailed(true)} />
    );
};
