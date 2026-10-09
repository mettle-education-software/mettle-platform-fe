import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { InputDataDTO, InputDataResponse } from 'interfaces';
import { MelpSummaryResponse } from 'interfaces/melp';
import { lampLastDay, lampRunning, lampSaveError, lampSaveProblem } from 'libs/dedaClock';
import { useAppContext, useMelpContext, useNotificationsContext } from 'providers';
import { useEffect, useMemo, useReducer, useState } from 'react';
import { lampService } from 'services';
import { useGetInputData } from './lamp';

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

// ---------- rascunhos por conta e dia, fora do componente ----------
// Sobrevivem a trocar de aba e a sair e voltar à LAMP: um pedido por dia de cada vez, sempre com os valores mais
// recentes, e a falha continua à vista.

interface DayDraft {
    uid: string;
    week: string;
    day: string;
    values: LampInputEdit;
    /** a leitura do dia que originou o rascunho: identidade da linha e tempos do Summary vêm sempre dela */
    snapshot: Day;
    /** alteração ainda não enviada */
    dirty: boolean;
    inflight: boolean;
    /** confirmado pelo servidor; o rascunho só some quando chega uma leitura mais nova do dia */
    ackedAt?: number;
    error?: { text: string; retry: boolean };
}

const drafts = new Map<string, DayDraft>();
/** dias cuja linha o servidor trocou (409 LAMP_DAY_REPLACED): a leitura com o rowId recusado não aceita edição */
const replaced = new Map<string, string>();
const savedAt = new Map<string, Date>();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());
const keyOf = (uid: string, week: string, day: string) => `${uid}:${week}:${day}`;
let timer: ReturnType<typeof setTimeout> | null = null;
/** o que só a tela sabe: o cliente de consultas, se a LAMP está aberta, o dia na tela e como avisar */
const env: {
    queryClient?: QueryClient;
    mounted: boolean;
    currentKey?: string;
    notify?: (text: string) => void;
} = { mounted: false };

/** A LAMP conta agora para esta conta? Pelo resumo mais recente em cache (vale também com a LAMP fora da tela). */
const writable = (uid: string) =>
    lampRunning(env.queryClient?.getQueryData<MelpSummaryResponse['data']>(['imerso-summary', uid]));

const dayText = (d: DayDraft) => `Week ${Number(d.week.replace('week', ''))} · Day ${Number(d.day.replace('day', ''))}`;

const refresh = async (d: DayDraft) => {
    const qc = env.queryClient;
    if (!qc) return;
    // uma leitura do dia começada antes da gravação não pode aposentar o rascunho confirmado: cancela e relê
    const queryKey = ['get-input-data', d.uid, d.week, d.day];
    await qc.cancelQueries({ queryKey });
    qc.invalidateQueries({ queryKey, refetchType: 'all' });
    for (const queryKey of [
        ['get-weekly-performance'],
        ['get-general-weekly-development'],
        ['get-overall-progress'],
        ['lamp-days', d.uid],
    ])
        qc.invalidateQueries({ queryKey });
};

const send = (k: string) => {
    const d = drafts.get(k);
    if (!d || d.inflight || !d.dirty || d.error) return;
    // a LAMP parou de contar (pausa em outra aba, fim, manutenção) entre a alteração e o envio: não grava
    if (!writable(d.uid)) {
        d.dirty = false;
        d.error = { text: 'Your LAMP is not counting now, so this change was not saved.', retry: false };
        return emit();
    }
    d.inflight = true;
    d.dirty = false;
    emit();
    lampService.patch(`/input/v2/${d.uid}/${d.week}/${d.day}`, { ...toDTO(d.values, d.snapshot) }).then(
        () => {
            d.inflight = false;
            if (drafts.get(k) !== d) return;
            if (d.dirty) return send(k); // chegou alteração durante o pedido: vai a mais recente
            d.ackedAt = Date.now();
            savedAt.set(d.uid, new Date());
            void refresh(d);
            emit();
        },
        (error) => {
            d.inflight = false;
            const problem = lampSaveProblem(error);
            const code = lampSaveError(error);
            if (code === 'LAMP_DAY_REPLACED') {
                // a linha do dia foi trocada (pausa e volta na mesma segunda): o rascunho não vale mais
                drafts.delete(k);
                replaced.set(k, d.snapshot.dedaInput?.rowId ?? '');
                void refresh(d);
                // outro dia que não o da tela: o aviso diz qual
                if (env.mounted && env.currentKey !== k)
                    env.notify?.(`${dayText(d)} was updated. Please enter it again.`);
            } else if (drafts.get(k) === d) {
                d.error = problem; // os valores ficam; "Try again" manda os mais recentes deste dia
                d.dirty = problem.retry;
            }
            // recusa definitiva (manutenção, LAMP encerrada): o resumo relido deixa a LAMP só leitura
            if (!problem.retry) env.queryClient?.invalidateQueries({ queryKey: ['imerso-summary', d.uid] });
            // fora da LAMP: a falha não pode sumir em silêncio
            if (!env.mounted)
                env.notify?.(code === 'LAMP_DAY_REPLACED' ? `${dayText(d)}: ${problem.text}` : problem.text);
            emit();
        },
    );
};

/** Envia o pendente de todos os dias (troca de dia ou aba, saída da página, aba escondida, fim dos 3,5 s). */
const flushAll = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    for (const k of drafts.keys()) send(k);
};

export const useLampInputForm = () => {
    const { user } = useAppContext();
    const uid = user?.uid;
    const { melpSummary } = useMelpContext();
    const { showNotification } = useNotificationsContext();
    const queryClient = useQueryClient();
    const last = lampLastDay(melpSummary);
    const readOnly = !lampRunning(melpSummary);
    const currentWeek = melpSummary?.current_deda_week;
    env.queryClient = queryClient;
    env.notify = (text) => showNotification('error', 'LAMP', text);

    // sem dia na LAMP ainda (semana 0: aguardando a segunda) não há o que pedir
    const weekOf = (week?: number) => (week ? `week${week}` : '');
    const [selectedWeek, setSelectedWeek] = useState(weekOf(currentWeek));
    const [selectedDay, setSelectedDay] = useState(`day${last?.day ?? 1}`);
    const { data: inputData, isLoading, dataUpdatedAt, refetch } = useGetInputData(selectedWeek, selectedDay);

    const [, render] = useReducer((n: number) => n + 1, 0);
    useEffect(() => {
        listeners.add(render);
        env.mounted = true;
        const hide = () => document.visibilityState === 'hidden' && flushAll();
        document.addEventListener('visibilitychange', hide);
        return () => {
            listeners.delete(render);
            document.removeEventListener('visibilitychange', hide);
            env.mounted = false;
            flushAll();
        };
    }, []);

    // a semana inicial segue o resumo só quando a LAMP muda de semana (não a cada releitura do resumo)
    useEffect(() => {
        if (currentWeek === undefined) return;
        flushAll();
        setSelectedWeek(weekOf(currentWeek));
    }, [currentWeek]);

    const k = uid ? keyOf(uid, selectedWeek, selectedDay) : '';
    env.currentKey = k;
    const draft = drafts.get(k);
    const rejected = replaced.get(k);
    const stale = !!rejected && inputData?.dedaInput?.rowId === rejected;
    useEffect(() => {
        const d = drafts.get(k);
        // confirmado e relido do servidor: o dia volta a seguir o servidor
        if (d?.ackedAt && !d.dirty && !d.inflight && !d.error && dataUpdatedAt > d.ackedAt) {
            drafts.delete(k);
            render();
        }
        // chegou a linha nova do dia trocado: a edição volta a valer
        const r = replaced.get(k);
        if (r !== undefined && inputData && inputData.dedaInput?.rowId !== r) {
            replaced.delete(k);
            render();
        }
    }, [k, dataUpdatedAt, inputData]);

    const edit = useMemo(
        () => draft?.values ?? (inputData ? fromInput(inputData) : ({} as LampInputEdit)),
        [draft?.values, inputData],
    );

    /** Altera um campo deste dia e agenda a gravação (3,5 s depois da última alteração). */
    const change = <K extends keyof LampInputEdit>(field: K, value: LampInputEdit[K]) => {
        if (readOnly || stale || !uid || !inputData?.dedaInput) return;
        // recusa definitiva neste dia (manutenção, LAMP encerrada): nada mais é enviado até o resumo se refazer
        if (drafts.get(k)?.error?.retry === false) return;
        const d = drafts.get(k) ?? {
            uid,
            week: selectedWeek,
            day: selectedDay,
            values: fromInput(inputData),
            snapshot: inputData,
            dirty: false,
            inflight: false,
        };
        d.values = { ...d.values, [field]: value };
        d.dirty = true;
        d.ackedAt = undefined;
        d.error = undefined;
        drafts.set(k, d);
        emit();
        if (timer) clearTimeout(timer);
        timer = setTimeout(flushAll, SAVE_DELAY_MS);
    };

    const mine = [...drafts.values()].filter((d) => d.uid === uid);
    const failed = mine.filter((d) => d.error);
    const status: LampSaveStatus = failed.length
        ? {
              kind: 'error',
              text: failed[failed.length - 1].error?.text ?? '',
              retry: failed.some((d) => d.error?.retry),
          }
        : stale
          ? { kind: 'error', text: 'This LAMP day was updated. Please enter it again.', retry: true }
          : mine.some((d) => d.dirty || d.inflight)
            ? { kind: 'saving' }
            : { kind: 'saved', at: uid ? savedAt.get(uid) : undefined };

    return {
        selectedWeek,
        setSelectedWeek: (week: string) => {
            flushAll();
            setSelectedWeek(week);
        },
        selectedDay,
        setSelectedDay: (day: string) => {
            flushAll();
            setSelectedDay(day);
        },
        inputData,
        isLoading,
        edit,
        change,
        readOnly: readOnly || stale,
        /** dia de hoje na LAMP (com ela contando) ou o último dia dela (semana congelada) */
        lastDay: last,
        status,
        /** repete os dias que falharam (cada um com os seus valores mais recentes) ou relê o dia trocado */
        retry: () => {
            if (stale) return void refetch();
            for (const [key, d] of drafts)
                if (d.uid === uid && d.error?.retry) {
                    d.error = undefined;
                    d.dirty = true;
                    send(key);
                }
        },
    };
};

export type LampInputForm = ReturnType<typeof useLampInputForm>;
