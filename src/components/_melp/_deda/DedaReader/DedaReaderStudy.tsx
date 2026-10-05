'use client';

import { gql, useQuery } from '@apollo/client';
import { Drawer, Tooltip } from 'antd';
import { AudioPlayer } from 'components';
import { DedaRecorder } from 'components/_melp/_deda/DedaRecorder/DedaRecorder';
import { TwoTrackPlayer } from 'components/_melp/_deda/DedaRecorder/TwoTrackPlayer';
import { SaveDedaInputMutationDedaData, useConfetti, useDeviceSize, useSaveDedaInput } from 'hooks';
import { useDedaRecordings, useFlushRecordingQueue } from 'hooks/melp/dedaRecording';
import { useDeda } from 'hooks/queries/dedaQueries';
import {
    DedaListenQueryResponse,
    DedaListenReadQueryResponse,
    DedaReadRecordQueryResponse,
    DedaWatchQueryResponse,
    DedaWriteQueryResponse,
} from 'interfaces';
import { getDayToday, padNumber } from 'libs';
import { contentfulImage } from 'libs/dedaHeader';
import {
    canJumpTo,
    nextBlocked,
    openWriteDay,
    READER_STEPS,
    ReaderStep,
    StepRules,
    WRITE_DAY_KEYS,
    writeDayState,
    writeDayToday,
} from 'libs/dedaReader';
import { Check, ChevronRight, ChevronUp, Clock, Info, Lock, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAppContext, useMelpContext } from 'providers';
import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { DedaActivitySummary, DedaStepsCompleted } from '../DedaActivity/steps';
import { ReaderProse } from './ReaderProse';
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

const STEP_INFO: Record<ReaderStep, { name: string; hint: string }> = {
    listen: { name: 'Listen', hint: 'Just listen. Don’t read along yet.' },
    readRecord: { name: 'Read + Record', hint: 'Read the text aloud and record your voice.' },
    watch: { name: 'Watch', hint: 'Watch the talk.' },
    listenRead: { name: 'Listen + Read', hint: 'Listen and follow the text with your eyes.' },
    write: { name: 'Write', hint: 'Copy today’s passage by hand.' },
    finish: { name: 'Summary', hint: 'Rate the quality of your study session today.' },
    completed: { name: 'Completed', hint: '' },
};
const stepNumber = (step: ReaderStep) => READER_STEPS.indexOf(step) + 1;

interface Props {
    dedaId: string;
    /** Lugar do cronômetro na faixa do topo (DedaReaderPage): a faixa é da página, o cronômetro é do estudo. */
    timerSlot: HTMLElement | null;
}

/** Cronômetro do dia: mesma contagem do StopWatch de DedaSteps (o valor vai ao Summary); aqui, discreto. */
const ReaderTimer = ({ onStop }: { onStop(duration: number): void }) => {
    const [stopwatch, setStopwatch] = useState(0);
    const [isOpen, setIsOpen] = useState(true);
    const [tooltipOpen, setTooltipOpen] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => setStopwatch((prev) => prev + 1), 1000);
        return () => {
            clearInterval(interval);
            onStop(stopwatch);
        };
    }, [stopwatch, onStop]);

    useEffect(() => {
        const tooltipTimeout = setTimeout(() => setTooltipOpen(false), 5000);
        return () => clearTimeout(tooltipTimeout);
    }, []);

    const time = `${padNumber(Math.floor(stopwatch / 3600))}:${padNumber(
        Math.floor(stopwatch / 60) - Math.floor(stopwatch / 3600) * 60,
    )}:${padNumber(stopwatch % 60)}`;

    return (
        <Tooltip title="Your time has started and is now being tracked." open={tooltipOpen}>
            <button
                type="button"
                className="timer"
                aria-pressed={!isOpen}
                aria-label={isOpen ? `Study time today ${time}. Hide timer` : 'Show timer'}
                onClick={() => setIsOpen((v) => !v)}
            >
                <Clock {...ICON} aria-hidden />
                {isOpen && <span>{time}</span>}
            </button>
        </Tooltip>
    );
};

/** ⓘ do passo: a instrução fica guardada aqui (toque ou teclado abre; tocar fora, Esc ou o próprio ⓘ fecha). */
const StepInfo = ({ text }: { text: string }) => {
    const [open, setOpen] = useState(false);
    const box = useRef<HTMLDivElement>(null);
    const id = useId();
    useEffect(() => {
        if (!open) return;
        const outside = (event: PointerEvent) => !box.current?.contains(event.target as Node) && setOpen(false);
        const escape = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
        document.addEventListener('pointerdown', outside);
        document.addEventListener('keydown', escape);
        return () => {
            document.removeEventListener('pointerdown', outside);
            document.removeEventListener('keydown', escape);
        };
    }, [open]);
    return (
        <div className="info" ref={box}>
            <button
                type="button"
                aria-label="Step instructions"
                aria-expanded={open}
                aria-controls={id}
                onClick={() => setOpen((v) => !v)}
            >
                <Info {...ICON} size={16} aria-hidden />
            </button>
            {/* role=status: o leitor de tela anuncia o texto ao abrir */}
            <p id={id} role="status" hidden={!open}>
                {open && text}
            </p>
        </div>
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
                    src={link}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                    allowFullScreen
                />
            )}
        </div>
    );
};

const WriteDays = ({
    dedaId,
    day,
    today,
    onDay,
}: {
    dedaId: string;
    day: number;
    today: number;
    onDay(day: number): void;
}) => {
    const { data } = useDeda<DedaWriteQueryResponse>('deda-write', dedaId);
    const days = data?.dedaContentCollection?.items[0];
    const content = days?.[WRITE_DAY_KEYS[day - 1]] as { json: unknown; links: never } | undefined;
    return (
        <>
            <div className="days" role="group" aria-label="Passage of each day">
                {[1, 2, 3, 4, 5, 6, 7].map((d) => {
                    const state = writeDayState(d, today);
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
                            <small>
                                {state === 'today' ? 'Today' : state === 'locked' ? <Lock {...ICON} /> : null}
                            </small>
                        </button>
                    );
                })}
            </div>
            {day !== today && (
                <div className="past" role="status">
                    <span>
                        <b>Day {day}</b> · for reference. Today’s step is still Day {today}.
                    </span>
                    <button type="button" className="btn line" onClick={() => onDay(today)}>
                        Back to today
                    </button>
                </div>
            )}
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
    const { melpSummary, isTodaysDedaCompleted } = useMelpContext();
    const { user } = useAppContext();

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
    const saveInput = useSaveDedaInput();
    const { shootStars } = useConfetti();

    const handleFinishSave = () => {
        const week = `week${melpSummary.unlocked_dedas.indexOf(dedaId)}`;
        const day = getDayToday();
        const userUid = user?.uid as string;
        saveInput.mutate(
            { userUid, week, day, inputData },
            {
                onSuccess: () => {
                    setCurrentStep('completed');
                    shootStars();
                },
            },
        );
    };

    const isTodaysDeda = melpSummary?.unlocked_dedas[melpSummary?.unlocked_dedas.length - 1] === dedaId;
    const isTodaysDedaAndNotCompleted = isTodaysDeda && !isTodaysDedaCompleted;

    const recordings = useDedaRecordings(dedaId);
    useFlushRecordingQueue(recordings.active, recordings.uid);
    const recorderOn = recordings.active && isTodaysDeda;
    const [readRecordDone, setReadRecordDone] = useState(false);
    const markReadRecordDone = useCallback(() => setReadRecordDone(true), []);

    const [hasPlayStarted, setHasPlayStarted] = useState(false);
    const handleDedaListenStart = useCallback(() => setHasPlayStarted(true), []);

    const handleStepChange = (direction: 'next' | 'previous') => {
        const currentIndex = READER_STEPS.indexOf(currentStep);
        const newStep = READER_STEPS[direction === 'next' ? currentIndex + 1 : currentIndex - 1];
        if (newStep === 'finish' && !isTodaysDedaAndNotCompleted) {
            handleFinishSave();
        } else if (newStep === 'completed') {
            router.push('/imerso/deda');
        } else {
            setCurrentStep(newStep);
        }
    };

    const blockedByRecorder = recorderOn && currentStep === 'readRecord' && !readRecordDone;
    const isNotWeekZero = !['CAN_START_DEDA', 'WEEK_ZERO'].includes(melpSummary.melp_status);
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
    const canNext = inSession && !saveInput.isPending && !nextBlocked(currentStep, rules);
    const goTo = (step: ReaderStep) => {
        if (!saveInput.isPending && canJumpTo(currentStep, step, rules)) setCurrentStep(step);
        setStepsOpen(false);
    };

    // ---- apresentação ----
    const todayDay = writeDayToday();
    const [writeDay, setWriteDay] = useState<number>(todayDay);
    const shownWriteDay = openWriteDay(writeDay, todayDay);
    const [stepsOpen, setStepsOpen] = useState(false);
    const scrollRef = useRef<HTMLElement>(null);
    useEffect(() => {
        scrollRef.current?.scrollTo({ top: 0 });
    }, [currentStep, shownWriteDay]);
    useEffect(() => {
        if (currentStep !== 'write') setWriteDay(todayDay);
    }, [currentStep, todayDay]);

    const stepsShown = READER_STEPS.filter(
        (step) => step !== 'completed' && (step !== 'finish' || isTodaysDedaAndNotCompleted),
    );
    const stepLabel = currentStep === 'finish' ? '' : `Step ${stepNumber(currentStep)} of 5`;
    // Instrução do passo, guardada no ⓘ (antes de começar o DEDA de hoje, o aviso do cronômetro).
    const infoText =
        currentStep === 'listen' && isTodaysDedaAndNotCompleted && !hasPlayStarted
            ? 'Click PLAY to start today’s DEDA. Once you click, the timer will begin.'
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
                    <DockTwoTracks
                        dedaId={dedaId}
                        isCurrentDeda={isTodaysDeda}
                        onGoRecord={recorderOn ? () => setCurrentStep('readRecord') : undefined}
                    />
                ) : (
                    <ListenPlayer key="listenRead" dedaId={dedaId} />
                );
            default:
                return null;
        }
    })();

    const cta =
        currentStep === 'completed' ? (
            <a className="btn gold" href="/imerso/deda">
                Go back
            </a>
        ) : currentStep === 'finish' ? (
            isTodaysDedaAndNotCompleted && (
                <button
                    type="button"
                    className="btn gold"
                    onClick={handleFinishSave}
                    disabled={saveInput.isPending}
                    aria-busy={saveInput.isPending}
                >
                    {saveInput.isPending ? 'Saving…' : 'Complete DEDA'}
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
                        disabled={!canJumpTo(currentStep, step, rules) || saveInput.isPending}
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
        const eyebrow = (
            <p className="eyebrow">
                <b>
                    {currentStep === 'finish'
                        ? 'Summary'
                        : `Step ${stepNumber(currentStep)} · ${STEP_INFO[currentStep].name}`}
                </b>
            </p>
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
            case 'listenRead':
                return (
                    <>
                        <div className="col">{eyebrow}</div>
                        <ReadText dedaId={dedaId} />
                        <p className="endcap">End of the text.</p>
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
                        <WriteDays dedaId={dedaId} day={shownWriteDay} today={todayDay} onDay={setWriteDay} />
                    </div>
                );
            case 'finish':
                return (
                    <div className="col form">
                        {eyebrow}
                        <DedaActivitySummary
                            defaultDedaTime={dedaTime}
                            onInputs={setInputData}
                            isDedaCompleted={!isTodaysDedaAndNotCompleted}
                            loading={saveInput.isPending}
                        />
                    </div>
                );
            default:
                return (
                    <div className="col wide">
                        <DedaStepsCompleted dedaId={dedaId} />
                    </div>
                );
        }
    })();

    return (
        <div className="stage">
            {showStopwatch && timerSlot && createPortal(<ReaderTimer onStop={setDedaTime} />, timerSlot)}
            <div className="body">
                <main className="scroll" ref={scrollRef} tabIndex={-1}>
                    <div className="study">{studyContent}</div>
                </main>
                {infoText && <StepInfo key={currentStep} text={infoText} />}
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
                                    {currentStep === 'write' && shownWriteDay !== todayDay
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
                                        disabled={cur || saveInput.isPending || !canJumpTo(currentStep, step, rules)}
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
                            <small>{currentStep === 'completed' ? 'Done' : stepLabel}</small>
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
