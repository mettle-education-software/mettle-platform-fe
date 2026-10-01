'use client';

import styled from '@emotion/styled';
import { usePodcastEpisodes, PodcastEpisode } from 'hooks/queries/dedaQueries';
import { coverBackground } from 'libs/podcast';
import React, { useId, useState } from 'react';
import { ArticleReaderModal } from '../../../ArticleFrame/ArticleFrame';
import { LinKnowledgeCard, LinKnowledgeCardsRow } from './LinKnowledgeCard';
import { PodcastPlayer } from './PodcastPlayer';

// Capa quadrada no card 16:9: arte centralizada sobre a própria capa desfocada.
const CoverLayer = styled.div<{ blurred?: boolean }>`
    position: absolute;
    background-position: center;
    background-repeat: no-repeat;
    background-size: ${({ blurred }) => (blurred ? 'cover' : 'contain')};
    ${({ blurred }) => (blurred ? 'inset: -10%; filter: blur(16px) brightness(0.7);' : 'inset: 0;')}
`;

const CoverArt = ({ src }: { src: string }) => {
    const backgroundImage = coverBackground(src);
    if (!backgroundImage) return null;
    return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            <CoverLayer blurred style={{ backgroundImage }} />
            <CoverLayer style={{ backgroundImage }} />
        </div>
    );
};

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
                        image={
                            coverBackground(item.coverImageUrl) ? (
                                <CoverArt src={item.coverImageUrl as string} />
                            ) : undefined
                        }
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
