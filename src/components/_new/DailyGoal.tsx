'use client';

import { css, Global } from '@emotion/react';
import { useGetGoalByLevel } from 'hooks';
import { dayBreakdown, goalDays, GoalDayStatus, goalDayStatus, LampDay, WEEK_DAYS } from 'libs/newDesign';
import { Check, X } from 'lucide-react';
import { useMelpContext } from 'providers';
import React, { useState } from 'react';
import { ICON } from 'themes/newDesign';

/*
 * "Daily goal": a semana dia a dia contra a meta do dia (decisão do André). Verde = cumpriu as três (DEDA 80%+, Active
 * e Passive); amarelo = fez algo mas não cumpriu; vermelho = não fez nada; hoje = pendente. Forma além da cor
 * (✓ / meio / ✗). Tocar ou passar o mouse mostra o detalhe do dia. Usado na LAMP e na faixa da home do IMERSO.
 */

const styles = css`
    .dgoal {
        --dg-met: #4f8a5c;
        --dg-part: #a8801f;
        --dg-none: var(--r-danger);
    }
    html:not([data-theme='light']) .dgoal {
        --dg-met: #86bf93;
        --dg-part: #d6b45e;
    }
    .dgoal ol {
        display: grid;
        grid-template-columns: repeat(7, minmax(0, 1fr));
        gap: 6px;
        margin: 0;
        padding: 0;
        list-style: none;
    }
    .dgoal button {
        display: grid;
        justify-items: center;
        gap: 6px;
        width: 100%;
        min-height: 44px;
        padding: 4px 0;
        border: 0;
        background: none;
        color: var(--r-muted);
        font: inherit;
        font-size: 11px;
        letter-spacing: 0.06em;
        cursor: pointer;
    }
    .dgoal .dg-dot {
        display: grid;
        place-items: center;
        width: 26px;
        height: 26px;
        border-radius: 50%;
        border: 1.5px solid var(--r-line-strong);
        color: var(--r-bg);
    }
    .dgoal .met .dg-dot {
        border-color: var(--dg-met);
        background: var(--dg-met);
    }
    .dgoal .partial .dg-dot {
        border-color: var(--dg-part);
        background: linear-gradient(90deg, var(--dg-part) 50%, transparent 50%);
    }
    .dgoal .nothing .dg-dot {
        border-color: var(--dg-none);
        color: var(--dg-none);
    }
    .dgoal .today .dg-dot {
        border: 2px dashed var(--r-line-strong);
    }
    .dgoal .future .dg-dot {
        border-style: dotted;
        border-color: var(--r-line);
    }
    .dgoal .sel .dg-dot {
        box-shadow: 0 0 0 3px var(--r-gold-tint);
    }
    .dgoal .dg-now {
        color: var(--r-text);
        font-weight: 500;
    }
    .dgoal .dg-detail {
        min-height: 20px;
        margin-top: 10px;
        font-size: 13px;
        line-height: 1.45;
        color: var(--r-text);
    }
    .dgoal .dg-key {
        display: flex;
        gap: 14px;
        margin-top: 6px;
        font-size: 12px;
        color: var(--r-muted);
    }
    .dgoal .dg-key i {
        display: inline-block;
        width: 9px;
        height: 9px;
        margin-right: 5px;
        border-radius: 50%;
        vertical-align: -1px;
    }
    .dgoal .dg-key .dg-m i {
        background: var(--dg-met);
    }
    .dgoal .dg-key .dg-p i {
        background: linear-gradient(90deg, var(--dg-part) 50%, transparent 50%);
        box-shadow: inset 0 0 0 1.5px var(--dg-part);
    }
    .dgoal .dg-key .dg-n i {
        box-shadow: inset 0 0 0 1.5px var(--dg-none);
    }
    /* compacto (faixa da home) */
    .dgoal.compact ol {
        gap: 2px;
    }
    .dgoal.compact button {
        min-height: 0;
        gap: 3px;
        font-size: 10px;
        cursor: default;
    }
    .dgoal.compact .dg-dot {
        width: 16px;
        height: 16px;
    }
    .dgoal.compact .dg-dot svg {
        width: 10px;
        height: 10px;
    }
`;

const SAID: Record<GoalDayStatus, string> = {
    met: 'goal met',
    partial: 'partial',
    nothing: 'nothing logged',
    today: 'today, pending',
    future: 'ahead',
};

export const DailyGoal: React.FC<{
    days: LampDay[];
    week: number;
    today: number;
    compact?: boolean;
}> = ({ days, week, today, compact }) => {
    const { melpSummary } = useMelpContext();
    const goals = goalDays(useGetGoalByLevel(melpSummary?.deda_difficulty).data);
    const goal = goals[Math.min(week, goals.length) - 1];
    const [sel, setSel] = useState<number>();
    const shown = sel ?? (compact ? undefined : today);
    const shownDay = days.find((x) => x.week === week && x.day === shown);
    return (
        <div className={`dgoal${compact ? ' compact' : ''}`}>
            <Global styles={styles} />
            <ol aria-label={`Daily goal, week ${week}`}>
                {WEEK_DAYS.map((w, i) => {
                    const n = i + 1;
                    const d = days.find((x) => x.week === week && x.day === n);
                    const st = goalDayStatus(d, n === today, n > today, goal);
                    const text = `${w.label}: ${SAID[st]}${st === 'future' ? '' : ` — ${dayBreakdown(d, goal)}`}`;
                    return (
                        <li key={w.value} className={`${st}${sel === n ? ' sel' : ''}`}>
                            <button
                                type="button"
                                title={text}
                                aria-label={text}
                                tabIndex={compact ? -1 : undefined}
                                onMouseEnter={() => !compact && st !== 'future' && setSel(n)}
                                onFocus={() => !compact && st !== 'future' && setSel(n)}
                                onClick={() => !compact && st !== 'future' && setSel(n)}
                            >
                                <span className="dg-dot" aria-hidden>
                                    {st === 'met' && <Check {...ICON} size={14} strokeWidth={2.4} />}
                                    {st === 'nothing' && <X {...ICON} size={14} strokeWidth={2.4} />}
                                </span>
                                <span className={n === today ? 'dg-now' : undefined}>
                                    {compact ? w.label[0] : w.label.slice(0, 3)}
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ol>
            {!compact && (
                <>
                    <p className="dg-detail" aria-live="polite">
                        {shown
                            ? `${WEEK_DAYS[shown - 1].label}: ${dayBreakdown(shownDay, goal)}`
                            : 'Tap a day to see it'}
                    </p>
                    <p className="dg-key" aria-hidden>
                        <span className="dg-m">
                            <i />
                            Met
                        </span>
                        <span className="dg-p">
                            <i />
                            Partial
                        </span>
                        <span className="dg-n">
                            <i />
                            Nothing
                        </span>
                    </p>
                </>
            )}
        </div>
    );
};
