import { DedaWeek, MelpSummaryResponse } from '../../interfaces/melp';
import {
    dedaLampWeek,
    isCalendarClock,
    lampRunning,
    lampToday,
    lampWeekOptions,
    recentDedaIds,
    todaysDedaId,
    weekDayLabel,
} from '../dedaClock';
import { hasReviews } from '../dedaReader';

type Summary = MelpSummaryResponse['data'];

const addDays = (iso: string, n: number) =>
    new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);

/**
 * Rotação sintética pela regra da função (§3.4): a cada segunda, `DEDA(n + 1)`, ou `DEDA1` quando n + 1 passa do
 * tamanho do círculo lido NAQUELA segunda — o círculo cresce sem constante nenhuma.
 */
const rotation = (first: number, weeks: number, sizeAt: (week: number) => number) => {
    const ids: string[] = [];
    let n = first;
    for (let w = 0; w < weeks; w++) {
        ids.push(`DEDA${n}`);
        n = n + 1 > sizeAt(w + 1) ? 1 : n + 1;
    }
    return ids;
};

/** `deda_weeks` (§2.3): uma entrada por semana de calendário; `lampWeek(i)` = semana da LAMP naquela semana ou null. */
const dedaWeeks = (firstMonday: string, ids: (string | null)[], lampWeek: (i: number) => number | null): DedaWeek[] =>
    ids.map((id, i) => ({ monday: addDays(firstMonday, 7 * i), deda_id: id, lamp_week: lampWeek(i) }));

const calendar = (over: Partial<Summary> & { deda_weeks: DedaWeek[] }): Summary => {
    const weeks = over.deda_weeks;
    const unlocked = ['DEDA0', ...new Set(weeks.flatMap((w) => (w.deda_id ? [w.deda_id] : [])))];
    const lampWeeks = weeks.filter((w) => w.lamp_week).map((w) => w.lamp_week as number);
    const current = lampWeeks.length ? Math.max(...lampWeeks) : 0;
    return {
        melp_status: 'DEDA_STARTED',
        current_deda_week: current,
        current_deda_day: current ? 7 * (current - 1) + 3 : 0,
        unlocked_dedas: unlocked,
        deda_clock: 'calendar',
        program_health: 'ok',
        deda_first_monday: weeks[0]?.monday ?? null,
        deda_calendar_day: weeks.length ? 7 * (weeks.length - 1) + 3 : 0,
        deda_calendar_week: weeks.length,
        deda_today: weeks[weeks.length - 1]?.deda_id ?? null,
        lamp_active_from: null,
        ...over,
    } as Summary;
};

const legacy = (over: Partial<Summary>): Summary =>
    ({ melp_status: 'DEDA_STARTED', current_deda_week: 4, current_deda_day: 25, ...over }) as Summary;

// Aluno que entrou em DEDA35 em 7-Out-2024; o círculo passou de 104 para 106 no meio (DEDA105 e DEDA106 entram no fim)
// e voltou a DEDA35 na 107ª semana: segunda exibição (§3.4). LAMP sempre ativa.
const lap = rotation(35, 107, (w) => (w < 60 ? 104 : 106));
const secondLap = calendar({ deda_weeks: dedaWeeks('2024-10-07', lap, (i) => i + 1) });

describe('rotação sintética (fixture)', () => {
    it('cresce sem constante e dá a volta: DEDA105/106 entram antes de DEDA1; DEDA35 de novo na semana 107', () => {
        expect(lap).toHaveLength(107);
        expect(lap.slice(69, 73)).toEqual(['DEDA104', 'DEDA105', 'DEDA106', 'DEDA1']);
        expect(lap[0]).toBe('DEDA35');
        expect(lap[106]).toBe('DEDA35');
        expect(secondLap.unlocked_dedas).toHaveLength(107); // DEDA0 + 106 distintos: a repetição não duplica
    });
});

describe('isCalendarClock', () => {
    it('só com deda_clock = calendar', () => {
        expect(isCalendarClock(secondLap)).toBe(true);
        expect(isCalendarClock(legacy({}))).toBe(false);
        expect(isCalendarClock(undefined)).toBe(false);
    });
});

describe('lampRunning / lampToday (dia da LAMP pelo resumo, nunca pelo aparelho)', () => {
    it('DEDA_STARTED: semana e dia dos contadores (dia 23 = semana 4, dia 2)', () => {
        const s = legacy({ current_deda_day: 23, current_deda_week: 4 });
        expect(lampRunning(s)).toBe(true);
        expect(lampToday(s)).toEqual({ week: 4, day: 2 });
        expect(lampToday(legacy({ current_deda_day: 28, current_deda_week: 4 }))).toEqual({ week: 4, day: 7 });
    });

    it('LAMP parada: pausa, fim, aguardando a segunda, antes do início e semana zero', () => {
        for (const melp_status of [
            'DEDA_PAUSED',
            'DEDA_FINISHED',
            'DEDA_STARTED_NOT_BEGUN',
            'CAN_START_DEDA',
            'MELP_BEGIN',
        ] as const) {
            expect(lampRunning(legacy({ melp_status }))).toBe(false);
            expect(lampToday(legacy({ melp_status }))).toBeNull();
        }
        expect(lampToday(legacy({ current_deda_week: 0, current_deda_day: 0 }))).toBeNull();
    });

    it('programa inconsistente (relógio novo) para a LAMP; contadores desencontrados não inventam dia', () => {
        expect(lampRunning({ ...secondLap, program_health: 'inconsistent' })).toBe(false);
        expect(lampToday(legacy({ current_deda_day: 30, current_deda_week: 4 }))).toBeNull();
    });
});

describe('todaysDedaId', () => {
    it('relógio novo: deda_today, mesmo quando a lista de liberados não termina nele (volta do círculo)', () => {
        expect(todaysDedaId(secondLap)).toBe('DEDA35');
        expect(secondLap.unlocked_dedas[secondLap.unlocked_dedas.length - 1]).not.toBe('DEDA35');
    });

    it('semana ainda não publicada (cron atrasado): null, nunca o DEDA da semana passada', () => {
        const ids = [...lap.slice(0, 9), null];
        const s = calendar({ deda_weeks: dedaWeeks('2024-10-07', ids, (i) => i + 1), deda_today: null });
        expect(todaysDedaId(s)).toBeNull();
    });

    it('antes da primeira segunda (sem start ou aguardando): o DEDA0 de treino', () => {
        const s = calendar({ deda_weeks: [], melp_status: 'CAN_START_DEDA', deda_calendar_day: 0, deda_today: null });
        expect(todaysDedaId(s)).toBe('DEDA0');
    });

    it('legado: o último liberado', () => {
        expect(todaysDedaId(legacy({ unlocked_dedas: ['DEDA0', 'DEDA7', 'DEDA8'] }))).toBe('DEDA8');
        expect(todaysDedaId(undefined)).toBeNull();
    });
});

describe('dedaLampWeek (semana do DEDA na LAMP)', () => {
    it('segunda volta: a exibição mais recente (semana 107), não a primeira (semana 1)', () => {
        expect(dedaLampWeek(secondLap, 'DEDA35')).toBe(107);
        expect(dedaLampWeek(secondLap, 'DEDA36')).toBe(2);
        expect(dedaLampWeek(secondLap, 'DEDA106')).toBe(72);
    });

    it('repetição durante a pausa não esconde a semana em que o aluno fez o DEDA', () => {
        // 40 semanas de LAMP, depois 100 semanas pausado: o círculo dá a volta e reexibe DEDAs das semanas 1..36
        const ids = rotation(10, 140, () => 104);
        const s = calendar({
            melp_status: 'DEDA_PAUSED',
            deda_weeks: dedaWeeks('2023-01-02', ids, (i) => (i < 40 ? i + 1 : null)),
        });
        const today = todaysDedaId(s) as string;
        expect(ids.indexOf(today)).toBe(35); // a de hoje (semana 140) repete a da semana 36, feita com a LAMP ativa
        expect(dedaLampWeek(s, today)).toBe(36);
        expect(hasReviews(s, today)).toBe(true);
        // DEDA que só apareceu durante a pausa: sem semana na LAMP, sem revisão
        expect(dedaLampWeek(s, ids[50])).toBeNull();
        expect(hasReviews(s, ids[50])).toBe(false);
    });

    it('ponte do teto: semanas 1–104, intervalo do sistema sem semana, e a LAMP segue na 105', () => {
        const ids = rotation(1, 112, () => 104);
        const lamp = (i: number) => (i < 104 ? i + 1 : i < 108 ? null : i - 3);
        const s = calendar({ deda_weeks: dedaWeeks('2024-08-05', ids, lamp) });
        expect(ids[108]).toBe('DEDA5');
        expect(dedaLampWeek(s, 'DEDA5')).toBe(105);
        expect(dedaLampWeek(s, ids[105])).toBe(ids.indexOf(ids[105]) + 1); // exibido só no intervalo: a semana da 1ª vez
        expect(s.current_deda_week).toBe(108);
    });

    it('reset só-LAMP: o ciclo arquivado não dá semana (lamp_week null antes do reset)', () => {
        const ids = rotation(50, 30, () => 104);
        const s = calendar({ deda_weeks: dedaWeeks('2025-01-06', ids, (i) => (i < 20 ? null : i - 19)) });
        expect(dedaLampWeek(s, ids[5])).toBeNull();
        expect(dedaLampWeek(s, ids[20])).toBe(1);
        expect(dedaLampWeek(s, 'DEDA0')).toBeNull();
    });

    it('legado: a posição em unlocked_dedas, como sempre (o servidor protege a 2ª volta: be #148)', () => {
        const finished = legacy({
            melp_status: 'DEDA_FINISHED',
            unlocked_dedas: ['DEDA0', 'DEDA9', 'DEDA10', 'DEDA9'],
        });
        expect(dedaLampWeek(finished, 'DEDA10')).toBe(2);
        expect(dedaLampWeek(finished, 'DEDA9')).toBe(1);
        expect(dedaLampWeek(finished, 'DEDA0')).toBeNull();
        expect(dedaLampWeek(finished, 'outro')).toBeNull();
    });
});

describe('hasReviews (aba Review)', () => {
    it('relógio novo: pela semana da LAMP da exibição mais recente com semana (≥ 4)', () => {
        expect(hasReviews(secondLap, 'DEDA35')).toBe(true);
        expect(hasReviews(secondLap, 'DEDA37')).toBe(false); // semana 3
        expect(hasReviews(secondLap, 'DEDA38')).toBe(true); // semana 4
        expect(hasReviews(secondLap, 'DEDA0')).toBe(false);
    });

    it('legado inalterado: posição ≥ 4; sem resumo = indefinido (não pisca)', () => {
        const s = legacy({ unlocked_dedas: ['d0', 'd1', 'd2', 'd3', 'd4'] });
        expect(hasReviews(s, 'd3')).toBe(false);
        expect(hasReviews(s, 'd4')).toBe(true);
        expect(hasReviews(undefined, 'd4')).toBeUndefined();
    });
});

describe('recentDedaIds', () => {
    it('relógio novo: exibições mais recentes, sem repetir e sem semana não publicada', () => {
        expect(recentDedaIds(secondLap, 4)).toEqual(['DEDA35', 'DEDA34', 'DEDA33', 'DEDA32']);
        const s = calendar({ deda_weeks: dedaWeeks('2024-10-07', [...lap.slice(0, 5), null], (i) => i + 1) });
        expect(recentDedaIds(s, 2)).toEqual(['DEDA39', 'DEDA38']);
    });

    it('legado: o fim de unlocked_dedas, do mais novo para trás', () => {
        expect(recentDedaIds(legacy({ unlocked_dedas: ['DEDA0', 'DEDA1', 'DEDA2'] }), 4)).toEqual([
            'DEDA2',
            'DEDA1',
            'DEDA0',
        ]);
    });
});

describe('lampWeekOptions (seletor de semana da LAMP)', () => {
    const titles = { DEDA35: 'Meatless Monday', DEDA36: 'Grit' };

    it('relógio novo: uma opção por semana da LAMP (pausas e ciclos arquivados ficam de fora)', () => {
        const opts = lampWeekOptions(secondLap, titles);
        expect(opts).toHaveLength(107);
        expect(opts[0]).toEqual({ value: 'week1', label: 'W1 · Meatless Monday' });
        expect(opts[106]).toEqual({ value: 'week107', label: 'W107 · Meatless Monday' });
        const paused = calendar({
            deda_weeks: dedaWeeks('2024-10-07', lap.slice(0, 6), (i) => (i < 3 ? i + 1 : null)),
        });
        expect(lampWeekOptions(paused, titles).map((o) => o.value)).toEqual(['week1', 'week2', 'week3']);
    });

    it('semana sem DEDA publicado (ou sem título): só "W n"', () => {
        const s = calendar({ deda_weeks: dedaWeeks('2024-10-07', ['DEDA35', null], (i) => i + 1) });
        expect(lampWeekOptions(s, titles).map((o) => o.label)).toEqual(['W1 · Meatless Monday', 'W2']);
    });

    it('legado: posição em unlocked_dedas a partir do DEDA1', () => {
        const s = legacy({ unlocked_dedas: ['DEDA0', 'DEDA35', 'DEDA36'] });
        expect(lampWeekOptions(s, titles)).toEqual([
            { value: 'week1', label: 'W1 · Meatless Monday' },
            { value: 'week2', label: 'W2 · Grit' },
        ]);
        expect(lampWeekOptions(undefined, titles)).toEqual([]);
    });
});

describe('weekDayLabel', () => {
    it('"Week 4 · Day 4": inglês, sem zero à esquerda', () => {
        expect(weekDayLabel(4, 4)).toBe('Week 4 · Day 4');
        expect(weekDayLabel(105, 1)).toBe('Week 105 · Day 1');
    });
});
