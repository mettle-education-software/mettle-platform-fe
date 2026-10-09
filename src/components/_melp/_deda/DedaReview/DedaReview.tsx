'use client';

import styled from '@emotion/styled';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Col, Flex, Row, Skeleton, Typography } from 'antd';
import { InputsWrapper, MaxWidthContainer } from 'components';
import { ReviewThumbnail } from 'components/_melp/ReviewThumbnail/ReviewThumbnail';
import { useGetInputData } from 'hooks';
import { LampInputEdit, saveReviewStatuses } from 'hooks/melp/lampInputForm';
import { getDayToday, SMALL_VIEWPORT } from 'libs';
import { dedaLampWeek } from 'libs/dedaClock';
import { hasReviews } from 'libs/dedaReader';
import { useAppContext, useMelpContext } from 'providers';
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

/** Dados e gravação das revisões do DEDA: a mesma lógica para a página atual e para a página nova (ReaderReview). */
export const useDedaReviews = (dedaId: string) => {
    const { melpSummary } = useMelpContext();

    // semana da LAMP em que o aluno fez o DEDA (libs/dedaClock): relógio novo pela exibição datada, legado pela posição
    const hasReview = hasReviews(melpSummary, dedaId); // undefined = resumo ainda não chegou
    const selectedWeek = `week${dedaLampWeek(melpSummary, dedaId) ?? 0}`;
    const selectedDay = getDayToday();

    // sem semana de revisão (antes da semana 4, DEDA exibido só em pausa ou de um ciclo arquivado): nada a pedir
    const { data: inputData, isLoading: isInputLoading } = useGetInputData(hasReview ? selectedWeek : '', selectedDay);
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
    const { user } = useAppContext();
    const queryClient = useQueryClient();
    // na fila do dia (a mesma da aba Input e da conclusão do DEDA): lê o dia na hora e manda só as revisões
    const saveInput = useMutation({
        mutationFn: (statuses: Pick<LampInputEdit, 'reviewStatus1' | 'reviewStatus2' | 'reviewStatus3'>) =>
            saveReviewStatuses(user?.uid as string, selectedWeek, selectedDay, statuses),
        onSuccess: () =>
            Promise.all(
                [
                    ['get-input-data', user?.uid, selectedWeek, selectedDay],
                    ['get-weekly-performance'],
                    ['get-general-weekly-development'],
                    ['get-overall-progress'],
                ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
            ),
    });

    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

    const saveReviewCall = () => {
        if (!inputData || !user?.uid) return;
        saveInput.mutate(
            {
                reviewStatus1: editReview.review1,
                reviewStatus2: editReview.review2 ?? false,
                reviewStatus3: editReview.review3 ?? false,
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

    return { hasReview, inputData, isInputLoading, editReview, setEditReview, setSaveKey, saveInput };
};

export const DedaReview = ({ dedaId }: { dedaId: string }) => {
    const { hasReview, inputData, isInputLoading, editReview, setEditReview, setSaveKey, saveInput } =
        useDedaReviews(dedaId);

    if (hasReview === false)
        return (
            <ReviewContainer>
                <MaxWidthContainer>
                    <Flex vertical gap="1rem">
                        <div>
                            <Title className="color-white" style={{ fontWeight: 500 }} level={4}>
                                Your weekly reviews
                            </Title>
                            <Text className="color-white">(Mark each review as completed when done).</Text>
                        </div>
                        <NoReviewContainer>
                            <div>
                                <Title level={4} className="color-white">
                                    No reviews available at this stage of the program. Keep progressing to unlock them!
                                </Title>
                            </div>
                        </NoReviewContainer>
                    </Flex>
                </MaxWidthContainer>
            </ReviewContainer>
        );

    if (!inputData || isInputLoading)
        return (
            <ReviewContainer>
                <MaxWidthContainer>
                    <Skeleton active loading />
                </MaxWidthContainer>
            </ReviewContainer>
        );

    return (
        <ReviewContainer>
            <MaxWidthContainer>
                <Flex vertical gap="1rem">
                    <div>
                        <Title className="color-white" style={{ fontWeight: 500 }} level={4}>
                            Your weekly reviews
                        </Title>
                        <Text className="color-white">(Mark each review as completed when done).</Text>
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
