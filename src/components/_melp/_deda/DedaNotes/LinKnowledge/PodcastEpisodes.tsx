'use client';

import styled from '@emotion/styled';
import { usePodcastEpisodes, PodcastEpisode } from 'hooks/queries/dedaQueries';
import { cssUrl } from 'libs/podcast';
import React, { useId, useState } from 'react';
import { ArticleReaderModal } from '../../../ArticleFrame/ArticleFrame';
import { LinKnowledgeCard, LinKnowledgeCardsRow } from './LinKnowledgeCard';
import { PodcastPlayer } from './PodcastPlayer';

// Capa quadrada no card 16:9: arte centralizada sobre a própria capa desfocada.
const CoverArt = styled.div<{ src: string }>`
    position: absolute;
    inset: 0;
    overflow: hidden;

    &::before,
    &::after {
        content: '';
        position: absolute;
        background: ${({ src }) => cssUrl(src)} center / cover no-repeat;
    }

    &::before {
        inset: -10%;
        filter: blur(16px) brightness(0.7);
    }

    &::after {
        inset: 0;
        margin: auto;
        height: 100%;
        aspect-ratio: 1;
        background-size: contain;
    }
`;

/** Episódios de podcast do DEDA no card comum; sem episódios, os embeds do Spotify como antes. */
export const PodcastEpisodes = ({ dedaId, fallback }: { dedaId: string; fallback: React.ReactNode }) => {
    const { data, loading } = usePodcastEpisodes(dedaId);
    const [open, setOpen] = useState<number | null>(null);
    const titleId = useId();
    const episodes = (data?.dedaContentCollection.items[0]?.dedaPodcastEpisodesCollection?.items ?? []).filter(
        (episode): episode is PodcastEpisode => !!episode?.audioUrl,
    );

    if (episodes.length === 0) return loading ? null : <>{fallback}</>;

    const episode = open === null ? undefined : episodes[open];

    return (
        <>
            <LinKnowledgeCardsRow>
                {episodes.map((item, index) => (
                    <LinKnowledgeCard
                        key={item.audioUrl}
                        meta={item.showName || 'Podcast'}
                        title={item.title}
                        image={item.coverImageUrl ? <CoverArt src={item.coverImageUrl} /> : undefined}
                        onClick={() => setOpen(index)}
                    />
                ))}
            </LinKnowledgeCardsRow>
            <ArticleReaderModal
                open={!!episode}
                onClose={() => setOpen(null)}
                title={episode?.title ?? ''}
                labelledBy={titleId}
            >
                {episode && <PodcastPlayer key={episode.audioUrl} episode={episode} titleId={titleId} />}
            </ArticleReaderModal>
        </>
    );
};
