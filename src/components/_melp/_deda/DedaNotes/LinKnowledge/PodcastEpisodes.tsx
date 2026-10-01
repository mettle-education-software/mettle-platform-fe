'use client';

import styled from '@emotion/styled';
import { usePodcastEpisodes, PodcastEpisode } from 'hooks/queries/dedaQueries';
import React from 'react';
import { PodcastCard } from './PodcastCard';

// Colunas via variável CSS (número nosso): 3, ou 4 quando houver exatamente 4; 2 no tablet; 1 no celular.
const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(var(--columns, 3), minmax(0, 1fr));
    gap: 1rem;
    padding-bottom: 1rem;

    @media (max-width: 1024px) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media (max-width: 600px) {
        grid-template-columns: minmax(0, 1fr);
    }
`;

/** Episódios de podcast do DEDA em cards estilo Spotify com player inline; sem episódios, os embeds do Spotify como antes. */
export const PodcastEpisodes = ({ dedaId, fallback }: { dedaId: string; fallback: React.ReactNode }) => {
    const { data, loading } = usePodcastEpisodes(dedaId);
    const episodes = (data?.dedaContentCollection.items[0]?.dedaPodcastEpisodesCollection?.items ?? []).filter(
        (episode): episode is PodcastEpisode => !!episode?.audioUrl,
    );

    if (episodes.length === 0) return loading ? null : <>{fallback}</>;

    return (
        <Grid style={{ '--columns': episodes.length === 4 ? 4 : 3 } as React.CSSProperties}>
            {episodes.map((episode) => (
                <PodcastCard key={episode.audioUrl} episode={episode} />
            ))}
        </Grid>
    );
};
