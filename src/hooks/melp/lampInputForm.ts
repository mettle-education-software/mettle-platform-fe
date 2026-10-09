import { useQueryClient } from '@tanstack/react-query';
import { InputDataDTO, InputDataResponse } from 'interfaces';
import { lampLastDay, lampRunning, lampSaveError, lampSaveProblem } from 'libs/dedaClock';
import { useAppContext, useMelpContext, useNotificationsContext } from 'providers';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
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

/**
 * Um dia com alteração local. Os valores ficam aqui até o servidor confirmar (voltar ao dia mostra o rascunho, não a
 * leitura em cache) e o pedido usa sempre a leitura que originou o rascunho (`snapshot`: identidade da linha e tempos
 * do Summary) — uma releitura com outra linha nunca empresta a identidade nova a valores velhos.
 */
interface DayDraft {
    week: string;
    day: string;
    values: LampInputEdit;
    snapshot: Day;
    /** alteração ainda não enviada */
    dirty: boolean;
    /** um pedido por dia de cada vez: o seguinte espera e leva os valores mais recentes */
    inflight: boolean;
    error?: { text: string; retry: boolean };
}

export const useLampInputForm = () => {
    const { user } = useAppContext();
    const { melpSummary } = useMelpContext();
    const { showNotification } = useNotificationsContext();
    const queryClient = useQueryClient();
    const last = lampLastDay(melpSummary);
    const readOnly = !lampRunning(melpSummary);
    const currentWeek = melpSummary?.current_deda_week;

    // sem dia na LAMP ainda (semana 0: aguardando a segunda) não há o que pedir
    const weekOf = (week?: number) => (week ? `week${week}` : '');
    const [selectedWeek, setSelectedWeek] = useState(weekOf(currentWeek));
    const [selectedDay, setSelectedDay] = useState(`day${last?.day ?? 1}`);
    const { data: inputData, isLoading } = useGetInputData(selectedWeek, selectedDay);
    // só funções estáveis entram nas dependências (o objeto de useMutation muda a cada render)
    const { mutateAsync: saveDay } = useSaveInput();

    const drafts = useRef(new Map<string, DayDraft>());
    const [, render] = useReducer((n: number) => n + 1, 0);
    const [lastSavedAt, setLastSavedAt] = useState<Date>();
    const [notice, setNotice] = useState<string>();
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const mounted = useRef(true);
    const notify = useRef(showNotification);
    notify.current = showNotification;

    const send = useCallback(
        (k: string) => {
            const d = drafts.current.get(k);
            if (!d || d.inflight || !d.dirty) return;
            d.inflight = true;
            d.dirty = false;
            d.error = undefined;
            render();
            saveDay({ week: d.week, day: d.day, inputDTO: toDTO(d.values, d.snapshot) }).then(
                () => {
                    d.inflight = false;
                    if (drafts.current.get(k) !== d) return;
                    if (d.dirty) return send(k); // chegou alteração durante o pedido: vai a mais recente
                    drafts.current.delete(k); // gravado: o dia volta a seguir o servidor
                    setLastSavedAt(new Date());
                    render();
                },
                (error) => {
                    d.inflight = false;
                    const problem = lampSaveProblem(error);
                    if (lampSaveError(error) === 'LAMP_DAY_REPLACED') {
                        // a linha do dia foi trocada (pausa e volta na mesma segunda): o rascunho não vale mais
                        drafts.current.delete(k);
                        setNotice('This LAMP day was updated. Please enter it again.');
                        queryClient.invalidateQueries({ queryKey: ['get-input-data', user?.uid, d.week, d.day] });
                    } else if (drafts.current.get(k) === d) {
                        d.error = problem; // os valores ficam; "Try again" manda os mais recentes deste dia
                        d.dirty = problem.retry;
                    }
                    // fora da tela (saiu da LAMP): a falha não pode sumir em silêncio
                    if (!mounted.current) notify.current('error', 'LAMP', problem.text);
                    render();
                },
            );
        },
        [saveDay, queryClient, user?.uid],
    );

    /** Grava já o que está pendente em qualquer dia (troca de dia, de aba, saída da página, aba escondida). */
    const flush = useCallback(() => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = null;
        for (const [k, d] of drafts.current) if (!d.error) send(k);
    }, [send]);

    useEffect(() => {
        mounted.current = true;
        const hide = () => document.visibilityState === 'hidden' && flush();
        document.addEventListener('visibilitychange', hide);
        return () => {
            document.removeEventListener('visibilitychange', hide);
            flush();
            mounted.current = false;
        };
    }, [flush]);

    // a semana inicial segue o resumo só quando a LAMP muda de semana (não a cada releitura do resumo)
    useEffect(() => {
        if (currentWeek === undefined) return;
        flush();
        setSelectedWeek(weekOf(currentWeek));
    }, [currentWeek, flush]);

    const key = `${selectedWeek}:${selectedDay}`;
    const draft = drafts.current.get(key);
    const edit = useMemo(
        () => draft?.values ?? (inputData ? fromInput(inputData) : ({} as LampInputEdit)),
        [draft?.values, inputData],
    );

    /** Altera um campo deste dia e agenda a gravação (3,5 s depois da última alteração). */
    const change = <K extends keyof LampInputEdit>(field: K, value: LampInputEdit[K]) => {
        if (readOnly || !inputData?.dedaInput) return;
        const d = drafts.current.get(key) ?? {
            week: selectedWeek,
            day: selectedDay,
            values: fromInput(inputData),
            snapshot: inputData,
            dirty: false,
            inflight: false,
        };
        d.values = { ...d.values, [field]: value };
        d.dirty = true;
        d.error = undefined;
        drafts.current.set(key, d);
        setNotice(undefined);
        render();
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(flush, SAVE_DELAY_MS);
    };

    const all = [...drafts.current.values()];
    const failed = all.filter((d) => d.error);
    const status: LampSaveStatus = failed.length
        ? {
              kind: 'error',
              text: failed[failed.length - 1].error?.text ?? '',
              retry: failed.some((d) => d.error?.retry),
          }
        : notice
          ? { kind: 'error', text: notice, retry: false }
          : all.length
            ? { kind: 'saving' }
            : { kind: 'saved', at: lastSavedAt };

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
        /** repete os dias que falharam, cada um com os seus valores mais recentes */
        retry: () => {
            for (const [k, d] of drafts.current)
                if (d.error?.retry) {
                    d.error = undefined;
                    d.dirty = true;
                    send(k);
                }
        },
    };
};

export type LampInputForm = ReturnType<typeof useLampInputForm>;
