'use client';

import { useDedaReviews } from 'components/_melp/_deda/DedaReview/DedaReview';
import { useDeda } from 'hooks/queries/dedaQueries';
import { DedaWatchQueryResponse } from 'interfaces';
import { padNumber } from 'libs';
import { Check } from 'lucide-react';
import React from 'react';
import { InfoTip } from './ReaderInfo';
import { ICON } from './readerStyles';

const WHEN = ['1 day after', '1 week after', '1 month after'] as const;
type ReviewKey = 'review1' | 'review2' | 'review3';

const ReviewVideo = ({ dedaId, title }: { dedaId: string; title: string }) => {
    const { data } = useDeda<DedaWatchQueryResponse>('deda-watch', dedaId);
    const link = data?.dedaContentCollection?.items[0]?.dedaWatchVideoLink;
    return (
        <div className="video">
            {link && (
                <iframe
                    title={title}
                    src={link}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                    allowFullScreen
                />
            )}
        </div>
    );
};

/**
 * Aba Review da página nova: as mesmas três revisões, o mesmo vídeo e a mesma gravação de "Mark as Completed" da
 * página atual (useDedaReviews); muda só a apresentação.
 */
export const ReaderReview = ({ dedaId }: { dedaId: string }) => {
    const { unlockedDEDAs, inputData, isInputLoading, editReview, setEditReview, setSaveKey, saveInput } =
        useDedaReviews(dedaId);

    const head = (
        <div className="head">
            <h2>Your weekly reviews</h2>
            <InfoTip label="About the reviews" text="Mark each review as completed when done." />
        </div>
    );

    if (!inputData || isInputLoading)
        return (
            <div className="review">
                {head}
                <p className="hint">Loading…</p>
            </div>
        );

    if (unlockedDEDAs.indexOf(dedaId) < 4)
        return (
            <div className="review">
                {head}
                <p className="empty">
                    No reviews available at this stage of the program. Keep progressing to unlock them!
                </p>
            </div>
        );

    const mark = (key: ReviewKey, status: boolean) => {
        setEditReview((previousEdit) => ({ ...previousEdit, [key]: status }));
        setSaveKey(`reviewInput.${key}.status=${status}-${new Date().getTime()}`);
    };

    return (
        <div className="review">
            {head}
            <ol className="cards">
                {(['review1', 'review2', 'review3'] as const).map((key, i) => {
                    const review = inputData.reviewInput?.[key];
                    const done = !!editReview[key];
                    return (
                        <li key={key} className={review ? (done ? 'done' : undefined) : 'none'}>
                            <p className="when">
                                <b>Review {i + 1}</b>
                                <span>{WHEN[i]}</span>
                            </p>
                            {review ? (
                                <>
                                    <ReviewVideo dedaId={review.dedaId} title={`Review ${i + 1}: ${review.name}`} />
                                    <div className="meta">
                                        <span className="name">
                                            <b title={review.name}>{review.name}</b>
                                            <small>Week {padNumber(Number(review.weekNumber.split('week')[1]))}</small>
                                        </span>
                                        <button
                                            type="button"
                                            className={`btn ${done ? 'tint' : 'line'}`}
                                            aria-pressed={done}
                                            disabled={saveInput.isPending}
                                            onClick={() => mark(key, !done)}
                                        >
                                            {done && <Check {...ICON} size={16} aria-hidden />}
                                            {done ? 'Completed' : 'Mark as Completed'}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="video placeholder">
                                    <span>Not available yet</span>
                                </div>
                            )}
                        </li>
                    );
                })}
            </ol>
        </div>
    );
};
