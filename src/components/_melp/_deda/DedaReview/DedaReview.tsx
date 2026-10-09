'use client';

import styled from '@emotion/styled';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Col, Flex, Row, Skeleton, Typography } from 'antd';
import { InputsWrapper, MaxWidthContainer } from 'components';
import { ReviewThumbnail } from 'components/_melp/ReviewThumbnail/ReviewThumbnail';
import { useGetInputData } from 'hooks';
import { saveReviewStatuses } from 'hooks/melp/lampInputForm';
import { getDayToday, SMALL_VIEWPORT } from 'libs';
import { dedaLampWeek, lampSaveError, lampSaveProblem } from 'libs/dedaClock';
import { hasReviews } from 'libs/dedaReader';
import { useAppContext, useMelpContext } from 'providers';
import React, { useEffect, useRef, useState } from 'react';

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

type ReviewKey = 'review1' | 'review2' | 'review3';

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
    // revisões que o aluno mudou e o servidor ainda não confirmou: só elas vão no pedido; as demais seguem o servidor
    const changed = useRef(new Set<ReviewKey>());
    const editRef = useRef(editReview);
    editRef.current = editReview;

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

            // uma releitura não desfaz a marca que ainda vai ser gravada
            setEditReview((previous) => ({
                ...reviews,
                ...Object.fromEntries([...changed.current].map((key) => [key, previous[key]])),
            }));
        }
    }, [inputData?.reviewInput]);

    const [saveKey, setSaveKey] = useState<string>();
    const { user } = useAppContext();
    const queryClient = useQueryClient();
    // na fila do dia (a mesma da aba Input e da conclusão do DEDA): lê o dia na hora e manda só as revisões alteradas;
    // o destino vai no próprio pedido (um pedido que espera a rede não muda de dia)
    const saveInput = useMutation({
        mutationFn: saveReviewStatuses,
        onSuccess: (_data, job) =>
            Promise.all(
                [
                    ['get-input-data', job.uid, job.week, job.day],
                    ['get-weekly-performance'],
                    ['get-general-weekly-development'],
                    ['get-overall-progress'],
                ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
            ),
        onError: (error, job) => {
            // dia trocado no servidor: a marca não vale para a linha nova — relê o dia
            if (lampSaveError(error) !== 'LAMP_DAY_REPLACED') return;
            changed.current.clear();
            queryClient.invalidateQueries({ queryKey: ['get-input-data', job.uid, job.week, job.day] });
        },
    });

    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

    const saveReviewCall = () => {
        if (!inputData || !user?.uid || !changed.current.size) return;
        const sent = Object.fromEntries([...changed.current].map((key) => [key, !!editRef.current[key]])) as Record<
            ReviewKey,
            boolean
        >;
        saveInput.mutate(
            {
                uid: user.uid,
                week: selectedWeek,
                day: selectedDay,
                expectedRowId: inputData.dedaInput?.rowId,
                statuses: Object.fromEntries(
                    Object.entries(sent).map(([key, value]) => [`reviewStatus${key.slice(6)}`, value]),
                ),
            },
            {
                onSuccess: () => {
                    // confirmadas (e não mudadas de novo durante o pedido) voltam a seguir o servidor
                    for (const [key, value] of Object.entries(sent) as [ReviewKey, boolean][])
                        if (!!editRef.current[key] === value) changed.current.delete(key);
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

    /** Marca/desmarca uma revisão e agenda a gravação. */
    const markReview = (key: ReviewKey, status: boolean) => {
        changed.current.add(key);
        setEditReview((previous) => ({ ...previous, [key]: status }));
        setSaveKey(`reviewInput.${key}.status=${status}-${Date.now()}`);
    };

    return { hasReview, inputData, isInputLoading, editReview, markReview, saveInput };
};

export const DedaReview = ({ dedaId }: { dedaId: string }) => {
    const { hasReview, inputData, isInputLoading, editReview, markReview, saveInput } = useDedaReviews(dedaId);

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
                    {saveInput.isError && (
                        <Text type="danger" role="alert">
                            {lampSaveProblem(saveInput.error).text}
                        </Text>
                    )}
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
                                    onMarkCompleted={(status) => markReview('review1', status)}
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
                                        onMarkCompleted={(status) => markReview('review2', status)}
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
                                        onMarkCompleted={(status) => markReview('review3', status)}
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
