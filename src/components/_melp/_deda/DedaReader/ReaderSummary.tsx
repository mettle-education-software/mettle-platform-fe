'use client';

import { SaveDedaInputMutationDedaData } from 'hooks';
import { useDedaRun } from 'hooks/melp/lampDays';
import { summaryTimes } from 'libs/dedaReader';
import { countsForRun, DEDA_QUALITY_MIN, STAR_NAMES } from 'libs/newDesign';
import { Star } from 'lucide-react';
import React, { useEffect, useId, useRef, useState } from 'react';
import { InfoTip } from './ReaderInfo';
import { ICON } from './readerStyles';

type Ratings = Omit<SaveDedaInputMutationDedaData, 'readingTime' | 'dedaTime'>;

/**
 * Os cinco quesitos da qualidade do DEDA. As explicações resumem a aula "LAMP | Input: DEDA" (HPEC): o aluno
 * dá de 1 a 5 a cada um, com honestidade — é o que mostra os gargalos da rotina de estudo.
 */
const CRITERIA: { key: keyof Ratings; label: string; info: string }[] = [
    {
        key: 'dedaPredPlace',
        label: 'Predetermined Place/Time',
        info: 'Did you study at the time and place you set in advance — like an appointment you keep, with the same setup — instead of fitting it in “if there’s time”?',
    },
    {
        key: 'dedaSteps',
        label: 'Five steps (DEEP)',
        info: 'The most objective one: did you do all five steps, following the DEEP technique? Score it accordingly.',
    },
    {
        key: 'dedaStateMind',
        label: 'State of mind',
        info: 'How you were mentally while doing the DEDA. Doing it every day is not enough: it has to be done well. If your only available time is a bad one, let the score show it.',
    },
    {
        key: 'dedaStateBeing',
        label: 'State of being',
        info: 'How you were physically while doing the DEDA: tired, hungry, thirsty, sleepy? Sitting down at the set time doesn’t help if your body wasn’t ready.',
    },
    {
        key: 'dedaFocus',
        label: 'Focus',
        info: 'How much your attention drifted: thinking about other things, picking up your phone, stopping for any reason. It is not the same as state of mind — you can be tired and very focused.',
    },
];

/** Os nomes dos 5 níveis (decisão do André; os mesmos da aba Input da LAMP). */
const RATINGS = [...STAR_NAMES];

const Rating = ({
    labelId,
    value,
    disabled,
    onChange,
}: {
    labelId: string;
    value: number;
    disabled: boolean;
    onChange(value: number): void;
}) => {
    const stars = useRef<(HTMLButtonElement | null)[]>([]);
    const step = (event: React.KeyboardEvent, by: number) => {
        event.preventDefault();
        const next = Math.min(5, Math.max(1, value + by));
        onChange(next);
        stars.current[next - 1]?.focus();
    };
    return (
        <div className="stars" role="radiogroup" aria-labelledby={labelId}>
            {RATINGS.map((word, i) => {
                const n = i + 1;
                return (
                    <button
                        key={n}
                        ref={(el) => {
                            stars.current[i] = el;
                        }}
                        type="button"
                        role="radio"
                        aria-checked={value === n}
                        aria-label={`${n} of 5, ${word}`}
                        // um só ponto de parada no Tab por quesito; as setas mudam a nota
                        tabIndex={(value || 1) === n ? 0 : -1}
                        className={n <= value ? 'on' : undefined}
                        disabled={disabled}
                        // tocar de novo na nota escolhida limpa (como as estrelas do Summary atual)
                        onClick={() => onChange(n === value ? 0 : n)}
                        onKeyDown={(event) => {
                            if (event.key === 'ArrowRight' || event.key === 'ArrowUp') step(event, 1);
                            if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') step(event, -1);
                        }}
                    >
                        <Star {...ICON} size={24} aria-hidden />
                    </button>
                );
            })}
            <span className="word" aria-hidden>
                {value ? RATINGS[value - 1] : ''}
            </span>
        </div>
    );
};

interface Props {
    /** Cronômetro do dia, em segundos. */
    stopwatchSeconds: number;
    /** Duração da gravação de hoje no passo 2; null/undefined quando não há. */
    recordingMs?: number | null;
    onInputs(inputValue: SaveDedaInputMutationDedaData): void;
    saving: boolean;
}

/**
 * Summary da página nova: só os cinco quesitos (1 a 5, começando sem nota, como hoje). Reading Time e DEDA Time não
 * têm campo: seguem para o servidor nos mesmos campos, vindos da gravação de hoje e do cronômetro (libs/dedaReader).
 */
export const ReaderSummary: React.FC<Props> = ({ stopwatchSeconds, recordingMs, onInputs, saving }) => {
    const id = useId();
    const [ratings, setRatings] = useState<Ratings>({
        dedaPredPlace: 0,
        dedaSteps: 0,
        dedaStateMind: 0,
        dedaStateBeing: 0,
        dedaFocus: 0,
    });
    useEffect(() => {
        onInputs({ ...ratings, ...summaryTimes(stopwatchSeconds, recordingMs) });
    }, [ratings, stopwatchSeconds, recordingMs, onInputs]);
    // o que o dia faz com a DEDA Run, com as cinco notas dadas (mesma conta do servidor: média ÷ 5 × 100)
    const run = useDedaRun(2);
    const values = Object.values(ratings);
    const score = values.every((v) => v > 0) ? (values.reduce((a, b) => a + b, 0) / 5 / 5) * 100 : undefined;

    return (
        <div className="summary" aria-busy={saving}>
            <h2>How was your DEDA today?</h2>
            <ul>
                {CRITERIA.map(({ key, label, info }) => (
                    <li key={key}>
                        <span className="crit">
                            <span id={`${id}-${key}`}>{label}</span>
                            <InfoTip text={info} label={`About ${label}`} />
                        </span>
                        <Rating
                            labelId={`${id}-${key}`}
                            value={ratings[key]}
                            disabled={saving}
                            onChange={(value) => setRatings((prev) => ({ ...prev, [key]: value }))}
                        />
                    </li>
                ))}
            </ul>
            {score !== undefined && !run.loading && (
                <p
                    className="runline"
                    role="status"
                    style={{
                        margin: '18px 0 0',
                        fontSize: 14.5,
                        fontWeight: 500,
                        color: countsForRun(score) ? 'var(--r-gold-hi)' : 'var(--r-text)',
                    }}
                >
                    {countsForRun(score)
                        ? `${Math.round(score)}% · DEDA Run +1 → ${run.beforeToday + 1}`
                        : `${Math.round(score)}% · below ${DEDA_QUALITY_MIN}%: your DEDA Run resets`}
                </p>
            )}
        </div>
    );
};
