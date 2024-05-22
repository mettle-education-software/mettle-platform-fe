'use client';

import { Col, Flex, Row, Skeleton, Typography } from 'antd';
import { WidgetCard } from 'components';
import { DedaRateInput } from 'components/_melp/DedaInput/DedaInput';
import { DedaWeekDaySelect } from 'components/_melp/DedaWeekDaySelect/DedaWeekDaySelect';
import { DedasListSelect } from 'components/_melp/DedasListSelect/DedasListSelect';
import { InputsWrapper } from 'components/_melp/InputsWrapper/InputsWrapper';
import { ReviewThumbnail } from 'components/_melp/ReviewThumbnail/ReviewThumbnail';
import { useGetInputData, useSaveInput } from 'hooks';
import { InputDataDTO } from 'interfaces';
import { getDayToday } from 'libs';
import { useMelpContext } from 'providers';
import React, { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';
import { InputWithTime } from '../../InputWithTime/InputWithTime';

const { Title, Text } = Typography;

const SectionTitle = ({ title, subtitle }: { title: string; subtitle: string }) => {
    return (
        <div>
            <Title style={{ color: 'var(--secondary)', fontWeight: 500 }} level={4}>
                {title}
            </Title>
            <Text style={{ color: '#FFF' }}>{subtitle}</Text>
        </div>
    );
};

interface InputDataEdit {
    dedaPredPlace: number;
    dedaFiveSteps: number;
    dedaStateMind: number;
    dedaStateBeing: number;
    dedaFocus: number;
    readingTime: number;
    dedaTime: number;
    activeBook: number;
    activeDedaNotes: number;
    activeMooc: number;
    activeOthers: number;
    activeReview: number;
    passiveAudiobook: number;
    passiveConversation: number;
    passiveMovieDoc: number;
    passiveNewsShows: number;
    passiveOthers: number;
    passivePodcast: number;
    passiveSeries: number;
    passiveTed: number;
    passiveYoutube: number;
    reviewStatus1?: boolean;
    reviewStatus2?: boolean;
    reviewStatus3?: boolean;
}

interface InputTabProps {
    setIsSaving: Dispatch<SetStateAction<boolean>>;
    setLastTimeSaved: Dispatch<SetStateAction<Date | undefined>>;
}

export const InputTab: React.FC<InputTabProps> = ({ setIsSaving, setLastTimeSaved }) => {
    const { melpSummary } = useMelpContext();

    const [inputDataEdit, setInputDataEdit] = useState<InputDataEdit>({} as InputDataEdit);

    const [selectedWeek, setSelectedWeek] = useState(`week${melpSummary?.current_deda_week}`);
    useEffect(() => {
        if (melpSummary) {
            setSelectedWeek(`week${melpSummary.current_deda_week}`);
        }
    }, [melpSummary]);
    const [selectedDay, setSelectedDay] = useState(getDayToday());

    const { data: inputData, isLoading: isInputLoading } = useGetInputData(selectedWeek, selectedDay);

    const saveInput = useSaveInput();

    useEffect(() => {
        setIsSaving(saveInput.isPending);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [saveInput.isPending]);

    useEffect(() => {
        if (inputData) {
            const { dedaInput, activeInput, passiveInput } = inputData;

            const editData: InputDataEdit = {
                dedaPredPlace: dedaInput?.deda_pred_place,
                dedaFiveSteps: dedaInput?.deda_steps,
                dedaStateMind: dedaInput?.deda_state_mind,
                dedaStateBeing: dedaInput?.deda_state_being,
                dedaFocus: dedaInput?.deda_focus,
                readingTime: dedaInput?.reading_time,
                dedaTime: dedaInput?.deda_time,
                activeBook: activeInput?.book,
                activeDedaNotes: activeInput?.deda_notes,
                activeMooc: activeInput?.mooc,
                activeOthers: activeInput?.others,
                activeReview: activeInput?.review,
                passiveAudiobook: passiveInput?.audiobook,
                passiveConversation: passiveInput?.conversation,
                passiveMovieDoc: passiveInput?.movie_doc,
                passiveNewsShows: passiveInput?.news_shows,
                passiveOthers: passiveInput?.others,
                passivePodcast: passiveInput?.podcast,
                passiveSeries: passiveInput?.series,
                passiveTed: passiveInput?.ted,
                passiveYoutube: passiveInput?.youtube,
            };

            if (inputData.reviewInput) {
                editData.reviewStatus1 = inputData.reviewInput.review1.status;

                if (inputData.reviewInput.review2) {
                    editData.reviewStatus2 = inputData.reviewInput.review2.status;
                }

                if (inputData.reviewInput.review3) {
                    editData.reviewStatus3 = inputData.reviewInput.review3.status;
                }
            }

            setInputDataEdit(editData);
        }
    }, [inputData]);

    const [saveKey, setSaveKey] = useState<string>();

    const getSaveKey = useCallback(
        (keyPrefix: string) => `${keyPrefix}-${selectedWeek}-${selectedDay}-${new Date().getTime()}`,
        [selectedDay, selectedWeek],
    );

    const saveInputCall = () => {
        if (Object.keys(inputDataEdit).length === 0) return;

        const inputDTO: InputDataDTO = {
            inputData: {
                dedaInputData: {
                    dedaTime: inputDataEdit.dedaTime,
                    readingTime: inputDataEdit.readingTime,
                    dedaPredPlace: inputDataEdit.dedaPredPlace,
                    dedaSteps: inputDataEdit.dedaFiveSteps,
                    dedaStateMind: inputDataEdit.dedaStateMind,
                    dedaStateBeing: inputDataEdit.dedaStateBeing,
                    dedaFocus: inputDataEdit.dedaFocus,
                },
                activeInputData: {
                    book: inputDataEdit.activeBook,
                    dedaNotes: inputDataEdit.activeDedaNotes,
                    mooc: inputDataEdit.activeMooc,
                    others: inputDataEdit.activeOthers,
                    review: inputDataEdit.activeReview,
                },
                passiveInputData: {
                    audiobook: inputDataEdit.passiveAudiobook,
                    conversation: inputDataEdit.passiveConversation,
                    movieDoc: inputDataEdit.passiveMovieDoc,
                    newsShows: inputDataEdit.passiveNewsShows,
                    others: inputDataEdit.passiveOthers,
                    podcast: inputDataEdit.passivePodcast,
                    series: inputDataEdit.passiveSeries,
                    ted: inputDataEdit.passiveTed,
                    youtube: inputDataEdit.passiveYoutube,
                },
            },
        };

        if (inputData?.reviewInput) {
            inputDTO.inputData.reviewInputData = {
                review1: {
                    status: inputDataEdit.reviewStatus1 as boolean,
                },
            };
            if (inputData.reviewInput.review2) {
                inputDTO.inputData.reviewInputData.review2 = {
                    status: inputDataEdit.reviewStatus2 as boolean,
                };
            }
            if (inputData.reviewInput.review3) {
                inputDTO.inputData.reviewInputData.review3 = {
                    status: inputDataEdit.reviewStatus3 as boolean,
                };
            }
        }

        saveInput.mutate(
            {
                week: selectedWeek,
                day: selectedDay,
                inputDTO,
            },
            {
                onSuccess: () => {
                    setLastTimeSaved(new Date());
                    setSaveKey(undefined);
                },
            },
        );
    };

    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

    const saveInputDebounce = () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        const newTimeoutId = setTimeout(saveInputCall, 3500);
        setTimeoutId(newTimeoutId);
    };

    useEffect(() => {
        if (saveKey) {
            saveInputDebounce();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [saveKey]);

    const extraInputSelect = () => (
        <Flex gap="1rem">
            <DedasListSelect
                value={selectedWeek}
                onChange={(value) => {
                    setSelectedWeek(value);
                }}
            />
            <DedaWeekDaySelect
                selectedWeek={selectedWeek}
                value={selectedDay}
                onChange={(value) => {
                    setSelectedDay(value);
                }}
            />
        </Flex>
    );

    return (
        <WidgetCard title="Pick your DEDA date" extra={extraInputSelect()}>
            {isInputLoading || !inputData ? (
                <Skeleton active loading paragraph={{ rows: 10 }} />
            ) : (
                <Row align="top" gutter={[24, 24]}>
                    <Col span={8}>
                        <Flex vertical gap="1rem">
                            <SectionTitle title="DEDA" subtitle="How is the QUALITY of your relationship with DEDA?" />
                            <Flex vertical gap="1rem">
                                <InputsWrapper>
                                    <DedaRateInput
                                        label="Predetermined Place/Time"
                                        onChange={(value) => {
                                            setInputDataEdit((previousData) => ({
                                                ...previousData,
                                                dedaPredPlace: value,
                                            }));
                                            setSaveKey(getSaveKey('dedaPredPlace'));
                                        }}
                                        value={inputDataEdit.dedaPredPlace}
                                    />
                                    <DedaRateInput
                                        label="Five steps (DEEP)"
                                        onChange={(value) => {
                                            setInputDataEdit((previousData) => ({
                                                ...previousData,
                                                dedaFiveSteps: value,
                                            }));
                                            setSaveKey(getSaveKey('dedaFiveSteps'));
                                        }}
                                        value={inputDataEdit.dedaFiveSteps}
                                    />
                                    <DedaRateInput
                                        label="State of mind"
                                        onChange={(value) => {
                                            setInputDataEdit((previousData) => ({
                                                ...previousData,
                                                dedaStateMind: value,
                                            }));
                                            setSaveKey(getSaveKey('dedaStateMind'));
                                        }}
                                        value={inputDataEdit.dedaStateMind}
                                    />
                                    <DedaRateInput
                                        label="State of being"
                                        onChange={(value) => {
                                            setInputDataEdit((previousData) => ({
                                                ...previousData,
                                                dedaStateBeing: value,
                                            }));
                                            setSaveKey(getSaveKey('dedaStateBeing'));
                                        }}
                                        value={inputDataEdit.dedaStateBeing}
                                    />
                                    <DedaRateInput
                                        label="Focus"
                                        onChange={(value) => {
                                            setInputDataEdit((previousData) => ({
                                                ...previousData,
                                                dedaFocus: value,
                                            }));
                                            setSaveKey(getSaveKey('dedaFocus'));
                                        }}
                                        value={inputDataEdit.dedaFocus}
                                    />
                                </InputsWrapper>

                                <InputsWrapper>
                                    <InputWithTime
                                        label={
                                            <>
                                                Enter the{' '}
                                                <span style={{ color: 'var(--secondary)' }}>Reading Time</span>
                                            </>
                                        }
                                        value={inputDataEdit.readingTime}
                                        onChange={(value) => {
                                            setInputDataEdit((previousData) => ({
                                                ...previousData,
                                                readingTime: value,
                                            }));
                                            setSaveKey(getSaveKey('readingTime'));
                                        }}
                                    />
                                    <InputWithTime
                                        label={
                                            <>
                                                Enter the <span style={{ color: 'var(--secondary)' }}>DEDA Time</span>
                                            </>
                                        }
                                        value={inputDataEdit.dedaTime}
                                        onChange={(value) => {
                                            setInputDataEdit((previousData) => ({
                                                ...previousData,
                                                dedaTime: value,
                                            }));
                                            setSaveKey(getSaveKey('dedaTime'));
                                        }}
                                    />
                                </InputsWrapper>
                            </Flex>
                        </Flex>
                    </Col>
                    <Col span={8}>
                        <Flex vertical gap="1rem">
                            <SectionTitle title="Active" subtitle="Input your Active Studying (HH:MM)" />
                            <InputsWrapper>
                                <InputWithTime
                                    label="Book"
                                    value={inputDataEdit.activeBook}
                                    onChange={(value) => {
                                        setInputDataEdit((previousData) => ({
                                            ...previousData,
                                            activeBook: value,
                                        }));
                                        setSaveKey(getSaveKey('activeBook'));
                                    }}
                                />
                                <InputWithTime
                                    label="Deda Notes"
                                    value={inputDataEdit.activeDedaNotes}
                                    onChange={(value) => {
                                        setInputDataEdit((previousData) => ({
                                            ...previousData,
                                            activeDedaNotes: value,
                                        }));
                                        setSaveKey(getSaveKey('activeDedaNotes'));
                                    }}
                                />
                                <InputWithTime
                                    label="Mooc"
                                    value={inputDataEdit.activeMooc}
                                    onChange={(value) => {
                                        setInputDataEdit((previousData) => ({
                                            ...previousData,
                                            activeMooc: value,
                                        }));
                                        setSaveKey(getSaveKey('activeMooc'));
                                    }}
                                />
                                <InputWithTime
                                    label="Others"
                                    value={inputDataEdit.activeOthers}
                                    onChange={(value) => {
                                        setInputDataEdit((previousData) => ({
                                            ...previousData,
                                            activeOthers: value,
                                        }));
                                        setSaveKey(getSaveKey('activeOthers'));
                                    }}
                                />
                                <InputWithTime
                                    label="Review"
                                    value={inputDataEdit.activeReview}
                                    onChange={(value) => {
                                        setInputDataEdit((previousData) => ({
                                            ...previousData,
                                            activeReview: value,
                                        }));
                                        setSaveKey(getSaveKey('activeReview'));
                                    }}
                                />
                            </InputsWrapper>
                        </Flex>
                    </Col>
                    <Col span={8}>
                        <Flex vertical gap="1rem">
                            <SectionTitle title="Passive" subtitle="Input your Passive Studying (HH:MM)" />
                            <InputsWrapper>
                                <InputWithTime
                                    label="Audiobook"
                                    value={inputDataEdit.passiveAudiobook}
                                    onChange={(value) => {
                                        setInputDataEdit((previousData) => ({
                                            ...previousData,
                                            passiveAudiobook: value,
                                        }));
                                        setSaveKey(getSaveKey('passiveAudiobook'));
                                    }}
                                />
                                <InputWithTime
                                    label="Conversation"
                                    value={inputDataEdit.passiveConversation}
                                    onChange={(value) => {
                                        setInputDataEdit((previousData) => ({
                                            ...previousData,
                                            passiveConversation: value,
                                        }));
                                        setSaveKey(getSaveKey('passiveConversation'));
                                    }}
                                />
                                <InputWithTime
                                    label="Movie/Doc"
                                    value={inputDataEdit.passiveMovieDoc}
                                    onChange={(value) => {
                                        setInputDataEdit((previousData) => ({
                                            ...previousData,
                                            passiveMovieDoc: value,
                                        }));
                                        setSaveKey(getSaveKey('passiveMovieDoc'));
                                    }}
                                />
                                <InputWithTime
                                    label="News Shows"
                                    value={inputDataEdit.passiveNewsShows}
                                    onChange={(value) => {
                                        setInputDataEdit((previousData) => ({
                                            ...previousData,
                                            passiveNewsShows: value,
                                        }));
                                        setSaveKey(getSaveKey('passiveNewsShows'));
                                    }}
                                />
                                <InputWithTime
                                    label="Others"
                                    value={inputDataEdit.passiveOthers}
                                    onChange={(value) => {
                                        setInputDataEdit((previousData) => ({
                                            ...previousData,
                                            passiveOthers: value,
                                        }));
                                        setSaveKey(getSaveKey('passiveOthers'));
                                    }}
                                />
                                <InputWithTime
                                    label="Podcast"
                                    value={inputDataEdit.passivePodcast}
                                    onChange={(value) => {
                                        setInputDataEdit((previousData) => ({
                                            ...previousData,
                                            passivePodcast: value,
                                        }));
                                        setSaveKey(getSaveKey('passivePodcast'));
                                    }}
                                />
                                <InputWithTime
                                    label="Series"
                                    value={inputDataEdit.passiveSeries}
                                    onChange={(value) => {
                                        setInputDataEdit((previousData) => ({
                                            ...previousData,
                                            passiveSeries: value,
                                        }));
                                        setSaveKey(getSaveKey('passiveSeries'));
                                    }}
                                />
                                <InputWithTime
                                    label="TED"
                                    value={inputDataEdit.passiveTed}
                                    onChange={(value) => {
                                        setInputDataEdit((previousData) => ({
                                            ...previousData,
                                            passiveTed: value,
                                        }));
                                        setSaveKey(getSaveKey('passiveTed'));
                                    }}
                                />
                                <InputWithTime
                                    label="Youtube"
                                    value={inputDataEdit.passiveYoutube}
                                    onChange={(value) => {
                                        setInputDataEdit((previousData) => ({
                                            ...previousData,
                                            passiveYoutube: value,
                                        }));
                                        setSaveKey(getSaveKey('passiveYoutube'));
                                    }}
                                />
                            </InputsWrapper>
                        </Flex>
                    </Col>
                    {inputData.reviewInput && (
                        <Col span={24}>
                            <Flex vertical gap="1rem">
                                <SectionTitle
                                    title="Review"
                                    subtitle="Mark the reviews as completed as you finish them"
                                />
                                <InputsWrapper>
                                    <Row gutter={[24, 24]}>
                                        <Col span={8}>
                                            <ReviewThumbnail
                                                dedaId={inputData.reviewInput.review1.dedaId}
                                                number={1}
                                                title={inputData.reviewInput.review1.name}
                                                week={inputData.reviewInput.review1.weekNumber}
                                                status={inputDataEdit.reviewStatus1 as boolean}
                                                onMarkCompleted={(status) => {
                                                    setInputDataEdit((previousData) => ({
                                                        ...previousData,
                                                        reviewStatus1: status,
                                                    }));
                                                    setSaveKey(getSaveKey('reviewStatus1'));
                                                }}
                                            />
                                        </Col>
                                        {inputData.reviewInput.review2 && (
                                            <Col span={8}>
                                                <ReviewThumbnail
                                                    dedaId={inputData.reviewInput.review2.dedaId}
                                                    number={2}
                                                    title={inputData.reviewInput.review2.name}
                                                    week={inputData.reviewInput.review2.weekNumber}
                                                    status={inputDataEdit.reviewStatus2 as boolean}
                                                    onMarkCompleted={(status) => {
                                                        setInputDataEdit((previousData) => ({
                                                            ...previousData,
                                                            reviewStatus2: status,
                                                        }));
                                                        setSaveKey(getSaveKey('reviewStatus2'));
                                                    }}
                                                />
                                            </Col>
                                        )}
                                        {inputData.reviewInput.review3 && (
                                            <Col span={8}>
                                                <ReviewThumbnail
                                                    dedaId={inputData.reviewInput.review3.dedaId}
                                                    number={3}
                                                    title={inputData.reviewInput.review3.name}
                                                    week={inputData.reviewInput.review3.weekNumber}
                                                    status={inputDataEdit.reviewStatus3 as boolean}
                                                    onMarkCompleted={(status) => {
                                                        setInputDataEdit((previousData) => ({
                                                            ...previousData,
                                                            reviewStatus3: status,
                                                        }));
                                                        setSaveKey(getSaveKey('reviewStatus3'));
                                                    }}
                                                />
                                            </Col>
                                        )}
                                    </Row>
                                </InputsWrapper>
                            </Flex>
                        </Col>
                    )}
                </Row>
            )}
        </WidgetCard>
    );
};
