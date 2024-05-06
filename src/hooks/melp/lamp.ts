import { useQuery, useMutation } from '@tanstack/react-query';
import { InputDataDTO, InputDataResponse } from 'interfaces';
import { lampService } from 'services';

export interface SaveDedaInputMutationDedaData {
    dedaFocus: number;
    dedaSteps: number;
    dedaPredPlace: number;
    dedaStateBeing: number;
    dedaStateMind: number;
    readingTime: number;
    dedaTime: number;
}

interface SaveDedaInputMutation {
    userUid: string;
    week: string;
    day: string;
    inputData: SaveDedaInputMutationDedaData;
}

export const useSaveDedaInput = () => {
    return useMutation({
        mutationFn: async ({ userUid, week, day, inputData }: SaveDedaInputMutation) => {
            try {
                const { data: currentInputData } = await lampService
                    .get<InputDataResponse>(`/input/v2/${userUid}/${week}/${day}`)
                    .then(({ data }) => data);

                const inputDTO: InputDataDTO = {
                    inputData: {
                        activeInputData: {
                            book: currentInputData.activeInput.book,
                            dedaNotes: currentInputData.activeInput.deda_notes,
                            mooc: currentInputData.activeInput.mooc,
                            others: currentInputData.activeInput.others,
                            review: currentInputData.activeInput.review,
                        },
                        passiveInputData: {
                            audiobook: currentInputData.passiveInput.audiobook,
                            conversation: currentInputData.passiveInput.conversation,
                            movieDoc: currentInputData.passiveInput.movie_doc,
                            newsShows: currentInputData.passiveInput.news_shows,
                            others: currentInputData.passiveInput.others,
                            podcast: currentInputData.passiveInput.podcast,
                            series: currentInputData.passiveInput.series,
                            ted: currentInputData.passiveInput.ted,
                            youtube: currentInputData.passiveInput.youtube,
                        },
                        dedaInputData: {
                            dedaFocus: inputData.dedaFocus,
                            dedaSteps: inputData.dedaFocus,
                            dedaPredPlace: inputData.dedaFocus,
                            dedaStateBeing: inputData.dedaFocus,
                            dedaStateMind: inputData.dedaFocus,
                            readingTime: inputData.readingTime,
                            dedaTime: inputData.dedaTime,
                        },
                    },
                };

                if (currentInputData.reviewInput) {
                    inputDTO.inputData.reviewInputData = {
                        review1: {
                            status: currentInputData.reviewInput.review1.status,
                        },
                    };

                    if (currentInputData.reviewInput.review2) {
                        inputDTO.inputData.reviewInputData.review2 = {
                            status: currentInputData.reviewInput.review2.status,
                        };
                    }

                    if (currentInputData.reviewInput.review3) {
                        inputDTO.inputData.reviewInputData.review3 = {
                            status: currentInputData.reviewInput.review3.status,
                        };
                    }
                }

                await lampService.patch(`/input/v2/${userUid}/${week}/${day}`, { ...inputDTO });
            } catch (error) {
                throw error;
            }
        },
        onSuccess: () => {
            // Invalidate the cache here
            alert('DEDA saved successfully!');
        },
        onError: (error) => {
            alert(error.message);
        },
    });
};

export const useGetInputData = (userUid: string, week: number, day: number) => {
    return useQuery({
        queryKey: ['input', userUid, week, day],
        queryFn: () => lampService.get(`/input/v2/${userUid}/${week}/${day}`).then(({ data }) => data),
        enabled: !!userUid && !!week && !!day,
    });
};
