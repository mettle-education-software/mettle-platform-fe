import { InputDataDTO, InputDataResponse } from 'interfaces';
import { lampLastDay, lampRunning, lampSaveError, lampSaveProblem } from 'libs/dedaClock';
import { useMelpContext } from 'providers';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useGetInputData, useSaveInput } from './lamp';

/**
 * Estado e gravação da aba Input da LAMP (plataforma nova): os mesmos campos de components/_melp/_lamp/InputTab (menos
 * Reading time e DEDA time, que vão inalterados), a mesma leitura (useGetInputData), a mesma gravação (useSaveInput →
 * PATCH /input/v2/…) e o mesmo atraso de 3,5 s depois da última alteração.
 *
 * O pedido de gravação é montado na hora da alteração e fica preso ao dia em que ela foi feita: trocar de dia, de aba
 * ou sair da página grava o que está pendente antes (PF-08), e uma releitura do mesmo dia não apaga o que o aluno digitou.
 * Com a LAMP parada (pausa, fim, espera da segunda, manutenção) o formulário é só leitura.
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

type Day = InputDataResponse['data'];
type Job = { week: string; day: string; inputDTO: InputDataDTO };

const fromInput = ({ dedaInput, activeInput, passiveInput, reviewInput }: Day): LampInputEdit => {
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
    return next;
};

const toDTO = (data: LampInputEdit, current: Day): InputDataDTO => {
    const inputDTO: InputDataDTO = {
        // relógio novo: a identidade da linha que o formulário carregou (o servidor recusa se ela foi trocada)
        expectedRowId: current.dedaInput.rowId,
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
    if (current.reviewInput) {
        inputDTO.inputData.reviewInputData = { review1: { status: data.reviewStatus1 as boolean } };
        if (current.reviewInput.review2)
            inputDTO.inputData.reviewInputData.review2 = { status: data.reviewStatus2 as boolean };
        if (current.reviewInput.review3)
            inputDTO.inputData.reviewInputData.review3 = { status: data.reviewStatus3 as boolean };
    }
    return inputDTO;
};

/** "saving" cobre também a espera dos 3,5 s: nada aparece como gravado antes de o servidor confirmar. */
export type LampSaveStatus =
    | { kind: 'saved'; at?: Date }
    | { kind: 'saving' }
    | { kind: 'error'; text: string; retry: boolean };

export const useLampInputForm = () => {
    const { melpSummary } = useMelpContext();
    const last = lampLastDay(melpSummary);
    const readOnly = !lampRunning(melpSummary);
    const currentWeek = melpSummary?.current_deda_week;

    // sem dia na LAMP ainda (semana 0: aguardando a segunda) não há o que pedir
    const weekOf = (week?: number) => (week ? `week${week}` : '');
    const [selectedWeek, setSelectedWeek] = useState(weekOf(currentWeek));
    const [selectedDay, setSelectedDay] = useState(`day${last?.day ?? 1}`);
    const { data: inputData, isLoading, refetch } = useGetInputData(selectedWeek, selectedDay);
    // só funções estáveis entram nas dependências (o objeto de useMutation muda a cada render)
    const { mutateAsync: saveDay } = useSaveInput();

    const [status, setStatus] = useState<LampSaveStatus>({ kind: 'saved' });
    const pending = useRef<Job | null>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inflight = useRef(0);

    // edição local: segue o servidor a cada leitura do dia, menos enquanto há alteração deste dia pendente ou a caminho
    // (uma releitura não apaga o que o aluno acabou de digitar)
    const [edit, setEdit] = useState<LampInputEdit>({} as LampInputEdit);
    const editRef = useRef(edit);
    const loaded = useRef<string>();
    const key = `${selectedWeek}:${selectedDay}`;
    useEffect(() => {
        if (!inputData) return;
        if (loaded.current === key && (pending.current || inflight.current > 0)) return;
        loaded.current = key;
        editRef.current = fromInput(inputData);
        setEdit(editRef.current);
    }, [inputData, key]);
    // o último pedido que falhou e pode ser repetido ("Try again"), com a frase do erro
    const failed = useRef<{ job: Job; text: string } | null>(null);

    const send = useCallback(
        (job: Job) => {
            inflight.current += 1;
            setStatus({ kind: 'saving' });
            saveDay(job).then(
                () => {
                    inflight.current -= 1;
                    const old = failed.current;
                    if (old && old.job.week === job.week && old.job.day === job.day) failed.current = null;
                    if (failed.current) setStatus({ kind: 'error', text: failed.current.text, retry: true });
                    else if (!inflight.current && !pending.current) setStatus({ kind: 'saved', at: new Date() });
                },
                (error) => {
                    inflight.current -= 1;
                    const problem = lampSaveProblem(error);
                    // a linha do dia foi trocada (pausa e volta na mesma segunda): o pedido velho não serve mais —
                    // relê o dia; o aluno lança de novo
                    const replaced = lampSaveError(error) === 'LAMP_DAY_REPLACED';
                    failed.current = replaced || !problem.retry ? null : { job, text: problem.text };
                    if (replaced && loaded.current === `${job.week}:${job.day}`) {
                        loaded.current = undefined;
                        refetch();
                    }
                    setStatus({ kind: 'error', text: problem.text, retry: !!failed.current });
                },
            );
        },
        [saveDay, refetch],
    );

    /** Grava já o que está pendente (troca de dia, de aba, saída da página, aba escondida). */
    const flush = useCallback(() => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = null;
        const job = pending.current;
        pending.current = null;
        if (job) send(job);
    }, [send]);

    useEffect(() => {
        const hide = () => document.visibilityState === 'hidden' && flush();
        document.addEventListener('visibilitychange', hide);
        return () => {
            document.removeEventListener('visibilitychange', hide);
            flush();
        };
    }, [flush]);

    // a semana inicial segue o resumo só quando a LAMP muda de semana (não a cada releitura do resumo)
    useEffect(() => {
        if (currentWeek === undefined) return;
        flush();
        setSelectedWeek(weekOf(currentWeek));
    }, [currentWeek, flush]);

    /** Altera um campo e agenda a gravação (3,5 s depois da última alteração), presa a este dia. */
    const change = useCallback(
        <K extends keyof LampInputEdit>(field: K, value: LampInputEdit[K]) => {
            if (readOnly || !inputData?.dedaInput || loaded.current !== key) return;
            editRef.current = { ...editRef.current, [field]: value };
            setEdit(editRef.current);
            pending.current = { week: selectedWeek, day: selectedDay, inputDTO: toDTO(editRef.current, inputData) };
            setStatus({ kind: 'saving' });
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(flush, SAVE_DELAY_MS);
        },
        [readOnly, inputData, key, selectedWeek, selectedDay, flush],
    );

    return {
        selectedWeek,
        setSelectedWeek: (week: string) => {
            flush();
            setSelectedWeek(week);
        },
        selectedDay,
        setSelectedDay: (day: string) => {
            flush();
            setSelectedDay(day);
        },
        inputData,
        isLoading,
        edit,
        change,
        readOnly,
        /** dia de hoje na LAMP (com ela contando) ou o último dia dela (semana congelada) */
        lastDay: last,
        status,
        retry: () => failed.current && send(failed.current.job),
    };
};
