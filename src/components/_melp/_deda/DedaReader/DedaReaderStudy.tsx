'use client';

import { gql, useQuery } from '@apollo/client';
import { Drawer } from 'antd';
import { AudioPlayer } from 'components';
import { DedaRecorder } from 'components/_melp/_deda/DedaRecorder/DedaRecorder';
import { TwoTrackPlayer } from 'components/_melp/_deda/DedaRecorder/TwoTrackPlayer';
import { SaveDedaInputMutationDedaData, useConfetti, useDeviceSize } from 'hooks';
import { useDedaRecordings, useFlushRecordingQueue, useQueuedRecording } from 'hooks/melp/dedaRecording';
import { useDedaCompletion } from 'hooks/melp/lamp';
import { useDeda } from 'hooks/queries/dedaQueries';
import {
    DedaListenQueryResponse,
    DedaListenReadQueryResponse,
    DedaReadRecordQueryResponse,
    DedaWatchQueryResponse,
    DedaWriteQueryResponse,
} from 'interfaces';
import { padNumber } from 'libs';
import { weekDayLabel } from 'libs/dedaClock';
import { contentfulImage } from 'libs/dedaHeader';
import {
    canJumpTo,
    nextBlocked,
    openWriteDay,
    READER_STEPS,
    ReaderStep,
    StepRules,
    withAutoplay,
    WRITE_DAY_KEYS,
    writeDayState,
    writeDayToday,
} from 'libs/dedaReader';
import { brasiliaDate, pickMyReading } from 'libs/dedaRecording';
import { Check, ChevronRight, ChevronUp, Clock, Lock, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ReadAlong, ReadAlongModes } from './ReadAlong';
import { InfoTip } from './ReaderInfo';
import { ReaderProse } from './ReaderProse';
import { ReaderSummary } from './ReaderSummary';
import { readFont, uiFont } from './readerFonts';
import { DrawerBody, ICON } from './readerStyles';

// Texto da transcrição com as notas de contexto (entry-hyperlink) — só a página nova pede `entries`.
const readerReadQuery = gql`
    query DedaReaderRead($dedaId: String) {
        dedaContentCollection(where: { dedaId: $dedaId }, limit: 1) {
            items {
                dedaReadContent {
                    json
                    links {
                        entries {
                            hyperlink {
                                sys {
                                    id
                                }
                                ... on ContextNote {
                                    term
                                    body
                                    image {
                                        url
                                        width
                                        height
                                        description
                                    }
                                }
                            }
                        }
                        assets {
                            block {
                                sys {
                                    id
                                }
                                url
                                title
                                width
                                height
                                description
                            }
                        }
                    }
                }
            }
        }
    }
`;

/**
 * Os ⓘ dos cinco passos resumem o que o André ensina no HPEC — aulas "DEDA Method" (os passos) e "DEEP" (os
 * protocolos de eficiência de cada passo): o porquê e o como, sem nada além do que está nas aulas.
 */
const STEP_INFO: Record<ReaderStep, { name: string; hint: string }> = {
    listen: {
        name: 'Listen',
        hint: 'Headphones on, eyes closed: just listen, straight through — don’t pause, go back or try to understand. When your mind starts translating, bring it back to the story from the Introduction (from Day 2 on, to the images of the video).',
    },
    readRecord: {
        name: 'Read + Record',
        hint: 'Read the whole text aloud and record it. Read with energy and expression, following the punctuation and breathing — it trains your speech; the focus is the process, not perfect pronunciation.',
    },
    watch: {
        name: 'Watch',
        hint: 'Watch in full screen, with headphones. Don’t force yourself to understand: let the English happen and map the images — faces, gestures, clothes, the whole setting — as if you had to draw them later.',
    },
    listenRead: {
        name: 'Listen + Read',
        hint: 'Mouth closed, follow the text with your eyes while you listen — first to your own recording, then to the original. Guide your eyes with a pen or a finger: this is where sound and spelling match.',
    },
    write: {
        name: 'Write',
        hint: 'Copy today’s part by hand in your DEDA notebook, looking at the text — it is not a dictation. Use your best handwriting: it shows your brain that this matters.',
    },
    finish: {
        name: 'Summary',
        hint: 'Rate the quality of today’s DEDA: from 1 to 5, score each of the five variables. It is subjective — the more honest you are, the better your results.',
    },
    completed: { name: 'Completed', hint: '' },
};
const stepNumber = (step: ReaderStep) => READER_STEPS.indexOf(step) + 1;

interface Props {
    dedaId: string;
    /** Lugar do cronômetro na faixa do topo (DedaReaderPage): a faixa é da página, o cronômetro é do estudo. */
    timerSlot: HTMLElement | null;
}

const TIMER_STARTED = 'Your time has started and is now being tracked.';

/**
 * Cronômetro do dia: mesma contagem do StopWatch de DedaSteps (o valor vai ao Summary); aqui, discreto. Ao começar,
 * o próprio cronômetro avisa por alguns segundos ("Timer started") — nada flutua sobre o rótulo do passo ou o texto.
 */
const ReaderTimer = ({ onStop }: { onStop(duration: number): void }) => {
    const [stopwatch, setStopwatch] = useState(0);
    const latest = useRef(0);
    latest.current = stopwatch;
    const [isOpen, setIsOpen] = useState(true);
    const [notice, setNotice] = useState('');

    // O total sobe para o estudo só quando o cronômetro sai de cena (fim dos passos): o texto e os players não
    // são redesenhados a cada segundo.
    useEffect(() => {
        const interval = setInterval(() => setStopwatch((prev) => prev + 1), 1000);
        return () => {
            clearInterval(interval);
            onStop(latest.current);
        };
    }, [onStop]);

    useEffect(() => {
        setNotice(TIMER_STARTED);
        const timeout = setTimeout(() => setNotice(''), 4500);
        return () => clearTimeout(timeout);
    }, []);

    const hours = Math.floor(stopwatch / 3600);
    const minutesSeconds = `${padNumber(Math.floor(stopwatch / 60) - hours * 60)}:${padNumber(stopwatch % 60)}`;
    const time = `${padNumber(hours)}:${minutesSeconds}`;

    return (
        <>
            <button
                type="button"
                className={`timer${notice ? ' fresh' : ''}`}
                aria-pressed={!isOpen}
                aria-label={isOpen ? `Study time today ${time}. Hide timer` : 'Show timer'}
                onClick={() => setIsOpen((v) => !v)}
            >
                <Clock {...ICON} aria-hidden />
                {notice ? (
                    <span>
                        <span className="wd">Timer </span>started
                    </span>
                ) : (
                    // a hora só aparece quando existe: a barra do celular fica com espaço para o título
                    isOpen && <span>{hours ? time : minutesSeconds}</span>
                )}
            </button>
            <span className="sr" aria-live="polite">
                {notice}
            </span>
        </>
    );
};

/* ---------- conteúdo de cada passo ---------- */

const ListenStage = ({ dedaId }: { dedaId: string }) => {
    const { data } = useDeda<DedaListenQueryResponse>('deda-listen', dedaId);
    const item = data?.dedaContentCollection?.items[0];
    const cover = contentfulImage(item?.dedaFeaturedImage?.url, { w: 1240, fm: 'webp', q: 75 });
    return (
        <div className="stagecard">
            {/* eslint-disable-next-line @next/next/no-img-element -- imagem do Contentful já dimensionada */}
            {cover && <img src={cover} alt="" />}
            <h2>{item?.dedaTitle}</h2>
        </div>
    );
};

const ReadText = ({ dedaId }: { dedaId: string }) => {
    const { data, loading } = useQuery<DedaReadRecordQueryResponse>(readerReadQuery, {
        variables: { dedaId },
        fetchPolicy: 'cache-first',
    });
    const content = data?.dedaContentCollection?.items[0]?.dedaReadContent;
    if (loading && !content) return <p className="hint">Loading the text…</p>;
    return <ReaderProse rawContent={content?.json} links={content?.links} />;
};

const WatchVideo = ({ dedaId }: { dedaId: string }) => {
    const { data, loading } = useDeda<DedaWatchQueryResponse>('deda-watch', dedaId);
    const link = data?.dedaContentCollection?.items[0]?.dedaWatchVideoLink;
    return (
        <div className="video">
            {!loading && link && (
                <iframe
                    title="DEDA video"
                    // O aluno chegou aqui por um clique ("Next step", "Complete step" ou o passo 3 na barra): o vídeo
                    // começa sozinho, com som. Se o navegador recusar (iPhone), o player fica pronto, com o play grande.
                    src={withAutoplay(link)}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                    allowFullScreen
                />
            )}
        </div>
    );
};

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

const WriteDays = ({
    dedaId,
    day,
    today,
    pastDeda,
    onDay,
}: {
    dedaId: string;
    day: number;
    today: number;
    /** DEDA que não é o da semana: os 7 dias abertos para consulta, sem cadeado e sem "Today". */
    pastDeda: boolean;
    onDay(day: number): void;
}) => {
    const { data } = useDeda<DedaWriteQueryResponse>('deda-write', dedaId);
    const days = data?.dedaContentCollection?.items[0];
    const content = days?.[WRITE_DAY_KEYS[day - 1]] as { json: unknown; links: never } | undefined;
    return (
        <>
            <div className={pastDeda ? 'days all' : 'days'} role="group" aria-label="Passage of each day">
                {[1, 2, 3, 4, 5, 6, 7].map((d) => {
                    const state = writeDayState(d, today, pastDeda);
                    return (
                        <button
                            key={d}
                            type="button"
                            className={state}
                            aria-pressed={d === day}
                            disabled={state === 'locked'}
                            aria-label={`Day ${d}${
                                state === 'today' ? ', today' : state === 'locked' ? ', opens on its day' : ''
                            }`}
                            onClick={() => onDay(d)}
                        >
                            <b>
                                <span className="wd">Day </span>
                                {d}
                            </b>
                            {/* Day 1..7 = segunda..domingo (writeDayToday): dias passados mostram o dia da semana */}
                            <small>
                                {state === 'today' ? (
                                    'Today'
                                ) : state === 'locked' ? (
                                    <Lock {...ICON} />
                                ) : (
                                    WEEKDAYS[d - 1]
                                )}
                            </small>
                        </button>
                    );
                })}
            </div>
            <ReaderProse rawContent={content?.json as never} links={content?.links} />
        </>
    );
};

/** Passo 4 com o gravador liberado: as duas faixas, com os mesmos dados que steps/ListenRead usa. */
const DockTwoTracks = ({
    dedaId,
    isCurrentDeda,
    onGoRecord,
}: {
    dedaId: string;
    isCurrentDeda: boolean;
    onGoRecord?: () => void;
}) => {
    const { data, loading } = useDeda<DedaListenReadQueryResponse>('deda-listen-read', dedaId);
    const item = data?.dedaContentCollection?.items[0];
    if (loading) return null;
    return (
        <TwoTrackPlayer
            docked
            dedaId={dedaId}
            isCurrentDeda={isCurrentDeda}
            title={item?.dedaTitle ?? 'Listen'}
            coverSrc={item?.dedaFeaturedImage?.url ?? ''}
            originalUrl={item?.dedaListenAudioMedia?.url ?? ''}
            onGoRecord={onGoRecord}
        />
    );
};

const ListenPlayer = ({ dedaId, onPlay }: { dedaId: string; onPlay?(): void }) => {
    const { data } = useDeda<DedaListenQueryResponse>('deda-listen', dedaId);
    const url = data?.dedaContentCollection?.items[0]?.dedaListenAudioMedia?.url;
    return url ? <AudioPlayer compact audioURL={url} onPlayStart={onPlay} /> : null;
};

/**
 * Modo de estudo da página nova do DEDA ("Direção A — Leitor focado"). A lógica dos passos é a de DedaSteps
 * (mesmos passos, ordem, cronômetro, gravador e chamadas); só a apresentação muda: faixa fina no topo, texto como
 * protagonista numa rolagem só e uma barra fixa embaixo com passos, player/gravador e "Complete step".
 */
export const DedaReaderStudy: React.FC<Props> = ({ dedaId, timerSlot }) => {
    const router = useRouter();
    const isMobile = useDeviceSize() === 'mobile';

    // ---- estado e regras: as mesmas de DedaActivity/DedaSteps.tsx ----
    const [stepsProgress, setStepsProgress] = useState<Record<ReaderStep, boolean | null>>({
        listen: false,
        readRecord: false,
        watch: false,
        listenRead: false,
        write: false,
        finish: null,
        completed: null,
    });
    const [currentStep, setCurrentStep] = useState<ReaderStep>('listen');
    const [dedaTime, setDedaTime] = useState(0);
    const [inputData, setInputData] = useState<SaveDedaInputMutationDedaData>({} as SaveDedaInputMutationDedaData);
    const { shootStars } = useConfetti();

    // Concluir só o DEDA de hoje e só com a LAMP contando; semana/dia do resumo (hooks/melp/lamp.useDedaCompletion).
    const completion = useDedaCompletion(dedaId);
    const handleFinishSave = () =>
        completion.complete(inputData, () => {
            setCurrentStep('completed');
            shootStars();
        });

    const isTodaysDeda = completion.isTodaysDeda;
    const isTodaysDedaAndNotCompleted = completion.completable;

    const recordings = useDedaRecordings(dedaId);
    useFlushRecordingQueue(recordings.active, recordings.uid);
    // O gravador vale em qualquer DEDA já liberado (o aluno pode estar fazendo um DEDA antigo como o "da semana"
    // dele); o servidor recusa DEDA não liberado. As regras de concluir passo, cronômetro e Summary não mudam.
    const recorderOn = recordings.active;
    const today = brasiliaDate(new Date());
    const queuedToday = useQueuedRecording(recordings.uid, dedaId, today, recorderOn);
    // Reading Time do Summary: a gravação de hoje (a que ficou no aparelho, se ainda não subiu); sem ela, zero.
    const readingMs =
        queuedToday.data?.durationMs ??
        pickMyReading(recordings.data?.recordings ?? [], today, true)?.durationMs ??
        null;
    const [readRecordDone, setReadRecordDone] = useState(false);
    const markReadRecordDone = useCallback(() => setReadRecordDone(true), []);

    const [hasPlayStarted, setHasPlayStarted] = useState(false);
    const handleDedaListenStart = useCallback(() => setHasPlayStarted(true), []);

    const handleStepChange = (direction: 'next' | 'previous') => {
        const currentIndex = READER_STEPS.indexOf(currentStep);
        const newStep = READER_STEPS[direction === 'next' ? currentIndex + 1 : currentIndex - 1];
        if (newStep === 'finish' && !isTodaysDedaAndNotCompleted) {
            return; // sem conclusão possível (DEDA passado, LAMP parada, já concluído): o Summary não existe
        } else if (newStep === 'completed') {
            router.push('/imerso/deda');
        } else {
            setCurrentStep(newStep);
        }
    };

    const blockedByRecorder = recorderOn && currentStep === 'readRecord' && !readRecordDone;
    // Semana zero, pausa, fim e espera da segunda (LAMP parada): sem cronômetro e sem gravar na LAMP, passos abertos.
    const isNotWeekZero = !!completion.lampDay;
    const showStopwatch =
        isTodaysDedaAndNotCompleted &&
        !['finish', 'completed'].includes(currentStep) &&
        hasPlayStarted &&
        isNotWeekZero;
    const rules: StepRules = {
        isTodaysDeda,
        todaysAndNotCompleted: isTodaysDedaAndNotCompleted,
        notWeekZero: isNotWeekZero,
        progress: stepsProgress,
    };
    const inSession = !['finish', 'completed'].includes(currentStep);
    const showComplete = inSession && isTodaysDedaAndNotCompleted && isNotWeekZero && !stepsProgress[currentStep];
    const completeStep = () => {
        setStepsProgress((prev) => ({ ...prev, [currentStep]: true }));
        handleStepChange('next');
    };
    const canNext = inSession && !completion.saving && !nextBlocked(currentStep, rules);
    const goTo = (step: ReaderStep) => {
        if (!completion.saving && canJumpTo(currentStep, step, rules)) setCurrentStep(step);
        setStepsOpen(false);
    };

    // ---- apresentação ----
    const todayDay = writeDayToday();
    // Passo 5: no DEDA da semana abre o dia de hoje; num DEDA que já passou, os 7 dias ficam abertos e abre o Day 1.
    const pastDeda = !isTodaysDeda;
    const defaultWriteDay = pastDeda ? 1 : todayDay;
    const [writeDay, setWriteDay] = useState<number>(defaultWriteDay);
    const shownWriteDay = openWriteDay(writeDay, todayDay, pastDeda);
    const [stepsOpen, setStepsOpen] = useState(false);
    const scrollRef = useRef<HTMLElement>(null);
    useEffect(() => {
        scrollRef.current?.scrollTo({ top: 0 });
        // O foco vai para o texto a cada passo: rolar (toque, roda ou teclado) nunca depende de tocar no player.
        scrollRef.current?.focus({ preventScroll: true });
    }, [currentStep, shownWriteDay]);
    useEffect(() => {
        if (currentStep !== 'write') setWriteDay(defaultWriteDay);
    }, [currentStep, defaultWriteDay]);
    // falhou ao concluir: o aviso fica no topo do Summary, à vista
    useEffect(() => {
        if (completion.problem) scrollRef.current?.scrollTo({ top: 0 });
    }, [completion.problem]);

    const stepsShown = READER_STEPS.filter(
        (step) => step !== 'completed' && (step !== 'finish' || isTodaysDedaAndNotCompleted),
    );
    const stepLabel =
        currentStep === 'finish' ? '' : currentStep === 'completed' ? 'Done' : `Step ${stepNumber(currentStep)} of 5`;
    // Instrução do passo, guardada no ⓘ (antes de começar o DEDA de hoje, o aviso do cronômetro).
    const infoText =
        currentStep === 'listen' && isTodaysDedaAndNotCompleted && !hasPlayStarted
            ? `${STEP_INFO.listen.hint} The timer starts when you press play.`
            : STEP_INFO[currentStep].hint;

    const media = (() => {
        switch (currentStep) {
            case 'listen':
                return <ListenPlayer key="listen" dedaId={dedaId} onPlay={handleDedaListenStart} />;
            case 'readRecord':
                return recorderOn && recordings.data && recordings.uid ? (
                    <DedaRecorder
                        docked
                        dedaId={dedaId}
                        uid={recordings.uid}
                        data={recordings.data}
                        onDone={markReadRecordDone}
                    />
                ) : null;
            case 'listenRead':
                return recordings.active ? (
                    <DockTwoTracks dedaId={dedaId} isCurrentDeda onGoRecord={() => setCurrentStep('readRecord')} />
                ) : (
                    <>
                        <ListenPlayer key="listenRead" dedaId={dedaId} />
                        <ReadAlongModes />
                    </>
                );
            default:
                return null;
        }
    })();

    const cta =
        currentStep === 'completed' ? (
            <Link className="btn gold" href="/imerso/deda">
                Go back
            </Link>
        ) : currentStep === 'finish' ? (
            isTodaysDedaAndNotCompleted && (
                <button
                    type="button"
                    className="btn gold"
                    onClick={handleFinishSave}
                    disabled={completion.saving || !completion.ready || completion.problem?.retry === false}
                    aria-busy={completion.saving}
                >
                    {completion.saving ? 'Saving…' : completion.problem?.retry ? 'Try again' : 'Complete DEDA'}
                </button>
            )
        ) : showComplete ? (
            <button
                type="button"
                className="btn gold"
                disabled={!hasPlayStarted || blockedByRecorder}
                onClick={completeStep}
            >
                {currentStep === 'write' ? 'Finish' : 'Complete step'}
                <ChevronRight {...ICON} size={16} className="arrow" aria-hidden />
            </button>
        ) : (
            canNext && (
                <button type="button" className="btn line" onClick={() => handleStepChange('next')}>
                    Next step
                    <ChevronRight {...ICON} size={16} className="arrow" aria-hidden />
                </button>
            )
        );

    const stepList = (
        <div className="menu">
            {stepsShown.map((step) => {
                const n = stepNumber(step);
                return (
                    <button
                        key={step}
                        type="button"
                        className={stepsProgress[step] ? 'done' : undefined}
                        aria-current={currentStep === step ? 'step' : undefined}
                        disabled={!canJumpTo(currentStep, step, rules) || completion.saving}
                        onClick={() => goTo(step)}
                    >
                        <i>{stepsProgress[step] ? <Check {...ICON} size={14} /> : step === 'finish' ? 'S' : n}</i>
                        {STEP_INFO[step].name}
                        {stepsProgress[step] && <small>Done</small>}
                    </button>
                );
            })}
        </div>
    );

    const drawerProps = {
        rootClassName: `deda-reader-drawer reader-theme-dark ${uiFont.className}`,
        rootStyle: { '--r-read-font': readFont.style.fontFamily } as React.CSSProperties,
        closeIcon: <X {...ICON} aria-label="Close" />,
    };

    const studyContent = (() => {
        // rótulo do passo e, na mesma linha, o ⓘ com a instrução
        const eyebrow = (
            <div className="eyebrow">
                <b>
                    {currentStep === 'finish'
                        ? 'Summary'
                        : `Step ${stepNumber(currentStep)} · ${STEP_INFO[currentStep].name}`}
                </b>
                {infoText && <InfoTip key={currentStep} text={infoText} label="Step instructions" />}
            </div>
        );
        switch (currentStep) {
            case 'listen':
                return (
                    <>
                        <div className="col">{eyebrow}</div>
                        <ListenStage dedaId={dedaId} />
                    </>
                );
            case 'readRecord':
                return (
                    <>
                        <div className="col">{eyebrow}</div>
                        <ReadText dedaId={dedaId} />
                    </>
                );
            case 'listenRead':
                return (
                    <>
                        <div className="col">{eyebrow}</div>
                        <ReadAlong dedaId={dedaId}>
                            <ReadText dedaId={dedaId} />
                        </ReadAlong>
                    </>
                );
            case 'watch':
                return (
                    <>
                        <div className="col wide">{eyebrow}</div>
                        <WatchVideo dedaId={dedaId} />
                    </>
                );
            case 'write':
                return (
                    <div className="col">
                        {eyebrow}
                        <WriteDays
                            dedaId={dedaId}
                            day={shownWriteDay}
                            today={todayDay}
                            pastDeda={pastDeda}
                            onDay={setWriteDay}
                        />
                    </div>
                );
            case 'finish':
                return (
                    <div className="col form">
                        {eyebrow}
                        {completion.problem && (
                            <p className="err" role="alert">
                                {completion.problem.text}
                            </p>
                        )}
                        {isTodaysDedaAndNotCompleted && (
                            <ReaderSummary
                                stopwatchSeconds={dedaTime}
                                recordingMs={readingMs}
                                onInputs={setInputData}
                                saving={completion.saving}
                            />
                        )}
                    </div>
                );
            default:
                // concluído: fica no leitor, sem recarregar a página (PF-05); o resto do app se atualiza pelas consultas
                return (
                    <div className="col form">
                        <div className="summary" role="status">
                            <h2>DEDA completed</h2>
                            {completion.lampDay && (
                                <p className="hint">{weekDayLabel(completion.lampDay.week, completion.lampDay.day)}</p>
                            )}
                        </div>
                    </div>
                );
        }
    })();

    return (
        <div className="stage">
            {showStopwatch && timerSlot && createPortal(<ReaderTimer onStop={setDedaTime} />, timerSlot)}
            <div className="body">
                {/* key: cada passo nasce com a própria área de rolagem, já com o conteúdo dentro */}
                <main className="scroll" key={currentStep} ref={scrollRef} tabIndex={-1}>
                    <div className="study">{studyContent}</div>
                </main>
            </div>

            <footer className="dock">
                {isMobile ? (
                    <>
                        <div className="segs" aria-hidden style={{ '--n': stepsShown.length } as React.CSSProperties}>
                            {stepsShown.map((step) => (
                                <i
                                    key={step}
                                    className={stepsProgress[step] ? 'done' : currentStep === step ? 'cur' : undefined}
                                />
                            ))}
                        </div>
                        {['listen', 'readRecord', 'listenRead'].includes(currentStep) && (
                            <div className="mid">{media}</div>
                        )}
                        <div className="nav">
                            <button
                                type="button"
                                className="stepchip"
                                aria-haspopup="dialog"
                                onClick={() => setStepsOpen(true)}
                                disabled={currentStep === 'completed'}
                            >
                                <small>
                                    {currentStep === 'write' && !pastDeda && shownWriteDay !== todayDay
                                        ? `Viewing Day ${shownWriteDay}`
                                        : stepLabel}
                                </small>
                                <b>
                                    <span>{STEP_INFO[currentStep].name}</span>
                                    <ChevronUp {...ICON} size={16} aria-hidden />
                                </b>
                            </button>
                            <div className="cta">{cta}</div>
                        </div>
                    </>
                ) : (
                    <div className="in">
                        <div className="pips" role="group" aria-label="Steps">
                            {stepsShown.map((step) => {
                                const done = !!stepsProgress[step];
                                const cur = currentStep === step;
                                return (
                                    <button
                                        key={step}
                                        type="button"
                                        className={`${done ? 'done' : ''} ${cur ? 'cur' : ''}`}
                                        aria-current={cur ? 'step' : undefined}
                                        aria-label={`${step === 'finish' ? 'Summary' : `Step ${stepNumber(step)}: ${STEP_INFO[step].name}`}${done ? ' (completed)' : ''}`}
                                        title={
                                            step === 'finish'
                                                ? 'Summary'
                                                : `${stepNumber(step)}. ${STEP_INFO[step].name}`
                                        }
                                        disabled={cur || completion.saving || !canJumpTo(currentStep, step, rules)}
                                        onClick={() => goTo(step)}
                                    >
                                        <i>
                                            {done && !cur ? (
                                                <Check {...ICON} size={14} aria-hidden />
                                            ) : step === 'finish' ? (
                                                'S'
                                            ) : (
                                                stepNumber(step)
                                            )}
                                        </i>
                                    </button>
                                );
                            })}
                        </div>
                        <div className="stl">
                            <small>{stepLabel}</small>
                            {STEP_INFO[currentStep].name}
                        </div>
                        <div className="mid">{media}</div>
                        <div className="cta">{cta}</div>
                    </div>
                )}
            </footer>

            <Drawer
                {...drawerProps}
                open={stepsOpen}
                onClose={() => setStepsOpen(false)}
                placement="bottom"
                height="auto"
                title="Today’s steps"
            >
                <DrawerBody>{stepList}</DrawerBody>
            </Drawer>
        </div>
    );
};

export default DedaReaderStudy;
