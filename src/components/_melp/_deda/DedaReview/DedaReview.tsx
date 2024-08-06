'use client';

import styled from '@emotion/styled';
import { Col, Flex, Row, Skeleton, Typography } from 'antd';
import { InputsWrapper, MaxWidthContainer } from 'components';
import { ReviewThumbnail } from 'components/_melp/ReviewThumbnail/ReviewThumbnail';
import { useGetInputData, useSaveInput } from 'hooks';
import { InputDataDTO } from 'interfaces';
import { getDayToday, SMALL_VIEWPORT } from 'libs';
import { useMelpContext } from 'providers';
import React, { useEffect, useState } from 'react';

const { Title, Text } = Typography;

const ReviewContainer = styled.section`
    background: var(--main-bg);
    width: 100%;
    height: 100%;
    min-height: 100%;
    display: flex;
    align-items: center;
    flex-direction: column;

    @media (max-width: ${SMALL_VIEWPORT}px) {
        padding-top: 1rem;
        padding-bottom: 2rem;
        height: unset;
        min-height: unset;
    }
`;

const NoReviewContainer = styled.div`
    background: rgba(255, 255, 255, 0.05);
    border-radius: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 500px;
`;

interface EditReviews {
    review1: boolean;
    review2?: boolean;
    review3?: boolean;
}

export const DedaReview = ({ dedaId }: { dedaId: string }) => {
    const { melpSummary } = useMelpContext();

    const unlockedDEDAs = melpSummary?.unlocked_dedas ?? [];

    const selectedWeek = `week${unlockedDEDAs.indexOf(dedaId)}`;
    const selectedDay = getDayToday();

    const { data: inputData, isLoading: isInputLoading } = useGetInputData(selectedWeek, selectedDay);
    const [editReview, setEditReview] = useState<EditReviews>({
        review1: inputData?.reviewInput?.review1?.status as boolean,
    });

    useEffect(() => {
        if (inputData?.reviewInput) {
            const review1 = inputData.reviewInput.review1.status;
            const review2 = inputData.reviewInput.review2?.status;
            const review3 = inputData.reviewInput.review3?.status;

            const reviews: EditReviews = {
                review1,
            };

            if (review2) reviews.review2 = review2;
            if (review3) reviews.review3 = review3;

            setEditReview(reviews);
        }
    }, [inputData?.reviewInput]);

    const [saveKey, setSaveKey] = useState<string>();
    const saveInput = useSaveInput();

    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

    const saveReviewCall = () => {
        if (!inputData) return;

        const inputDTO: InputDataDTO = {
            inputData: {
                dedaInputData: {
                    dedaTime: inputData.dedaInput.deda_time,
                    readingTime: inputData.dedaInput.reading_time,
                    dedaPredPlace: inputData.dedaInput.deda_pred_place,
                    dedaSteps: inputData.dedaInput.deda_steps,
                    dedaStateMind: inputData.dedaInput.deda_state_mind,
                    dedaStateBeing: inputData.dedaInput.deda_state_being,
                    dedaFocus: inputData.dedaInput.deda_focus,
                },
                activeInputData: {
                    book: inputData.activeInput.book,
                    dedaNotes: inputData.activeInput.deda_notes,
                    mooc: inputData.activeInput.mooc,
                    others: inputData.activeInput.others,
                    review: inputData.activeInput.review,
                },
                passiveInputData: {
                    audiobook: inputData.passiveInput.audiobook,
                    conversation: inputData.passiveInput.conversation,
                    movieDoc: inputData.passiveInput.movie_doc,
                    newsShows: inputData.passiveInput.news_shows,
                    others: inputData.passiveInput.others,
                    podcast: inputData.passiveInput.podcast,
                    series: inputData.passiveInput.series,
                    ted: inputData.passiveInput.ted,
                    youtube: inputData.passiveInput.youtube,
                },
                reviewInputData: {
                    review1: {
                        status: editReview.review1,
                    },
                },
            },
        };

        if (inputData?.reviewInput?.review2 && inputDTO.inputData.reviewInputData)
            inputDTO.inputData.reviewInputData.review2 = {
                status: editReview.review2 === undefined ? false : editReview.review2,
            };
        if (inputData?.reviewInput?.review3 && inputDTO.inputData.reviewInputData)
            inputDTO.inputData.reviewInputData.review3 = {
                status: editReview.review3 === undefined ? false : editReview.review3,
            };

        saveInput.mutate(
            {
                week: selectedWeek,
                day: selectedDay,
                inputDTO,
            },
            {
                onSuccess: () => {
                    setSaveKey(undefined);
                },
            },
        );
    };

    const saveReviewDebounce = () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        const newTimeoutId = setTimeout(saveReviewCall, 1200);
        setTimeoutId(newTimeoutId);
    };

    useEffect(() => {
        if (saveKey) {
            saveReviewDebounce();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [saveKey]);

    if (!inputData || isInputLoading)
        return (
            <ReviewContainer>
                <MaxWidthContainer>
                    <Skeleton active loading />
                </MaxWidthContainer>
            </ReviewContainer>
        );

    if (unlockedDEDAs.indexOf(dedaId) < 4)
        return (
            <ReviewContainer>
                <MaxWidthContainer>
                    <Flex vertical gap="1rem">
                        <div>
                            <Title className="color-white" style={{ fontWeight: 500 }} level={4}>
                                Here are your reviews for this week
                            </Title>
                            <Text className="color-white">(Mark the reviews as completed as you finish them)</Text>
                        </div>
                        <NoReviewContainer>
                            <div>
                                <Title level={4} className="color-white">
                                    There are no reviews on this week yet.
                                </Title>
                            </div>
                        </NoReviewContainer>
                    </Flex>
                </MaxWidthContainer>
            </ReviewContainer>
        );

    return (
        <ReviewContainer>
            <MaxWidthContainer>
                <Flex vertical gap="1rem">
                    <div>
                        <Title className="color-white" style={{ fontWeight: 500 }} level={4}>
                            Here are your reviews for this week
                        </Title>
                        <Text className="color-white">(Mark the reviews as completed as you finish them)</Text>
                    </div>
                    <InputsWrapper>
                        <Row gutter={[24, 24]}>
                            <Col xs={24} md={8}>
                                <ReviewThumbnail
                                    loading={saveInput.isPending}
                                    dedaId={inputData.reviewInput?.review1.dedaId as string}
                                    number={1}
                                    title={inputData.reviewInput?.review1.name as string}
                                    week={inputData.reviewInput?.review1.weekNumber as string}
                                    status={editReview.review1}
                                    onMarkCompleted={(status) => {
                                        setEditReview((previousEdit) => ({
                                            ...previousEdit,
                                            review1: status,
                                        }));
                                        setSaveKey(`reviewInput.review1.status=${status}-${new Date().getTime()}`);
                                    }}
                                />
                            </Col>
                            {inputData.reviewInput?.review2 && (
                                <Col xs={24} md={8}>
                                    <ReviewThumbnail
                                        loading={saveInput.isPending}
                                        dedaId={inputData.reviewInput.review2.dedaId}
                                        number={2}
                                        title={inputData.reviewInput.review2.name}
                                        week={inputData.reviewInput.review2.weekNumber}
                                        status={editReview.review2 as boolean}
                                        onMarkCompleted={(status) => {
                                            setEditReview((previousEdit) => ({
                                                ...previousEdit,
                                                review2: status,
                                            }));
                                            setSaveKey(`reviewInput.review2.status=${status}-${new Date().getTime()}`);
                                        }}
                                    />
                                </Col>
                            )}
                            {inputData.reviewInput?.review3 && (
                                <Col xs={24} md={8}>
                                    <ReviewThumbnail
                                        loading={saveInput.isPending}
                                        dedaId={inputData.reviewInput.review3.dedaId}
                                        number={3}
                                        title={inputData.reviewInput.review3.name}
                                        week={inputData.reviewInput.review3.weekNumber}
                                        status={editReview.review3 as boolean}
                                        onMarkCompleted={(status) => {
                                            setEditReview((previousEdit) => ({
                                                ...previousEdit,
                                                review3: status,
                                            }));
                                            setSaveKey(`reviewInput.review3.status=${status}-${new Date().getTime()}`);
                                        }}
                                    />
                                </Col>
                            )}
                        </Row>
                    </InputsWrapper>
                </Flex>
            </MaxWidthContainer>
        </ReviewContainer>
    );
};
