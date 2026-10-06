import { InputDataDTO } from 'interfaces';
import { getDayToday } from 'libs';
import { useMelpContext } from 'providers';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useGetInputData, useSaveInput } from './lamp';

/**
 * Estado e gravação da aba Input da LAMP (plataforma nova). É a MESMA lógica de components/_melp/_lamp/InputTab:
 * mesmos campos (menos Reading time e DEDA time, que vão inalterados), a mesma leitura (useGetInputData), a mesma
 * gravação (useSaveInput → PATCH /input/v2/…) e o mesmo atraso de 3,5 s depois da última alteração. Só a apresentação
 * mudou; a aba atual continua intacta.
 */
export interface LampInputEdit {
    dedaPredPlace: number;
    dedaFiveSteps: number;
    dedaStateMind: number;
    dedaStateBeing: number;
    dedaFocus: number;
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

export const SAVE_DELAY_MS = 3500;

export const useLampInputForm = () => {
    const { melpSummary } = useMelpContext();

    const [selectedWeek, setSelectedWeek] = useState(`week${melpSummary?.current_deda_week}`);
    useEffect(() => {
        if (melpSummary) setSelectedWeek(`week${melpSummary.current_deda_week}`);
    }, [melpSummary]);
    const [selectedDay, setSelectedDay] = useState(getDayToday());

    const { data: inputData, isLoading } = useGetInputData(selectedWeek, selectedDay);
    const saveInput = useSaveInput();
    const [lastSavedAt, setLastSavedAt] = useState<Date>();

    const [edit, setEdit] = useState<LampInputEdit>({} as LampInputEdit);
    useEffect(() => {
        if (!inputData) return;
        const { dedaInput, activeInput, passiveInput, reviewInput } = inputData;
        const next: LampInputEdit = {
            dedaPredPlace: dedaInput?.deda_pred_place,
            dedaFiveSteps: dedaInput?.deda_steps,
            dedaStateMind: dedaInput?.deda_state_mind,
            dedaStateBeing: dedaInput?.deda_state_being,
            dedaFocus: dedaInput?.deda_focus,
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
        if (reviewInput) {
            next.reviewStatus1 = reviewInput.review1.status;
            if (reviewInput.review2) next.reviewStatus2 = reviewInput.review2.status;
            if (reviewInput.review3) next.reviewStatus3 = reviewInput.review3.status;
        }
        setEdit(next);
    }, [inputData]);

    // a gravação lê o estado mais recente quando o atraso vence (o atual recria a função a cada render; mesmo efeito)
    const latest = useRef({ edit, inputData, selectedWeek, selectedDay });
    latest.current = { edit, inputData, selectedWeek, selectedDay };
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const save = useCallback(() => {
        const { edit: data, inputData: current, selectedWeek: week, selectedDay: day } = latest.current;
        // sem os dados do servidor não há como reenviar os tempos do Summary inalterados: não grava
        if (Object.keys(data).length === 0 || !current?.dedaInput) return;
        const inputDTO: InputDataDTO = {
            inputData: {
                dedaInputData: {
                    // Reading time e DEDA time saíram da tela (quem grava é o Summary do DEDA). O servidor regrava as
                    // duas colunas a cada PATCH (omitir = NULL), então vão os valores atuais do servidor, inalterados.
                    dedaTime: current.dedaInput.deda_time,
                    readingTime: current.dedaInput.reading_time,
                    dedaPredPlace: data.dedaPredPlace,
                    dedaSteps: data.dedaFiveSteps,
                    dedaStateMind: data.dedaStateMind,
                    dedaStateBeing: data.dedaStateBeing,
                    dedaFocus: data.dedaFocus,
                },
                activeInputData: {
                    book: data.activeBook,
                    dedaNotes: data.activeDedaNotes,
                    mooc: data.activeMooc,
                    others: data.activeOthers,
                    review: data.activeReview,
                },
                passiveInputData: {
                    audiobook: data.passiveAudiobook,
                    conversation: data.passiveConversation,
                    movieDoc: data.passiveMovieDoc,
                    newsShows: data.passiveNewsShows,
                    others: data.passiveOthers,
                    podcast: data.passivePodcast,
                    series: data.passiveSeries,
                    ted: data.passiveTed,
                    youtube: data.passiveYoutube,
                },
            },
        };
        if (current?.reviewInput) {
            inputDTO.inputData.reviewInputData = { review1: { status: data.reviewStatus1 as boolean } };
            if (current.reviewInput.review2)
                inputDTO.inputData.reviewInputData.review2 = { status: data.reviewStatus2 as boolean };
            if (current.reviewInput.review3)
                inputDTO.inputData.reviewInputData.review3 = { status: data.reviewStatus3 as boolean };
        }
        saveInput.mutate({ week, day, inputDTO }, { onSuccess: () => setLastSavedAt(new Date()) });
    }, [saveInput]);

    /** Altera um campo e agenda a gravação (3,5 s depois da última alteração, como hoje). */
    const change = useCallback(
        <K extends keyof LampInputEdit>(key: K, value: LampInputEdit[K]) => {
            setEdit((previous) => ({ ...previous, [key]: value }));
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(save, SAVE_DELAY_MS);
        },
        [save],
    );

    return {
        selectedWeek,
        setSelectedWeek,
        selectedDay,
        setSelectedDay,
        inputData,
        isLoading,
        edit,
        change,
        isSaving: saveInput.isPending,
        lastSavedAt,
    };
};
