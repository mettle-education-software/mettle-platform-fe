import { DEDA_READER_UIDS } from '../dedaReader';
import {
    weekPoints,
    runMilestone,
    weekAxisSpan,
    weekTickLabels,
    activeMenuKeys,
    clampWeekDay,
    fileSizeLabel,
    displayName,
    firstName,
    formatHm,
    goalLabel,
    isModuleOpen,
    isNewDesignAccount,
    lampDateLabel,
    lessonNeighbours,
    lockedModuleOf,
    lockedNotes,
    NEW_DESIGN_UIDS,
    parseHm,
    runDay,
    goalDayStatus,
    calendarDays,
    monthGrid,
    dayBreakdown,
    frontMet,
    countsForRun,
    runBeforeToday,
    lastBreak,
    topRuns,
    dedaStreak,
    bestStreak,
    constancyRuns,
    lastFourVsPrevious,
    weeklyQuality,
    parseDuration,
    durationText,
    implausibleEntry,
    starName,
    goalProgress,
    addMinutes,
    stepDay,
    minutesText,
    axisWords,
    chartTip,
    goalDays,
    fullLoadWeek,
    rankActivities,
    reportHm,
    reportMinutes,
    readMenuCollapsed,
    saveMenuCollapsed,
    vimeoIdOf,
    softChart,
    weekDayOptions,
    plainEmphasis,
} from '../newDesign';

describe('chave da plataforma nova', () => {
    it('é a mesma lista da página do DEDA', () => {
        expect(NEW_DESIGN_UIDS).toBe(DEDA_READER_UIDS);
        expect(isNewDesignAccount(NEW_DESIGN_UIDS[0])).toBe(true);
        expect(isNewDesignAccount('outro-aluno')).toBe(false);
        expect(isNewDesignAccount(undefined)).toBe(false);
        expect(isNewDesignAccount(null)).toBe(false);
    });

    it('DEDA_READER=off desliga para todos', () => {
        expect(isNewDesignAccount(NEW_DESIGN_UIDS[0], true)).toBe(false);
    });
});

describe('menu', () => {
    it('acende o item da rota e o pai IMERSO junto com o filho', () => {
        expect(activeMenuKeys('/')).toEqual(['home']);
        expect(activeMenuKeys('/settings')).toEqual(['settings']);
        expect(activeMenuKeys('/imerso')).toEqual(['imerso']);
        expect(activeMenuKeys('/imerso/deda')).toEqual(['imerso', 'melpDeda']);
        expect(activeMenuKeys('/imerso/deda/change')).toEqual(['imerso', 'melpDeda']);
        expect(activeMenuKeys('/imerso/hpec/welcome')).toEqual(['imerso', 'meplHpec']);
        expect(activeMenuKeys('/imerso/lamp')).toEqual(['imerso', 'melpLamp']);
        expect(activeMenuKeys('/course/x/y')).toEqual([]);
    });

    it('lembra o menu recolhido por aparelho e sobrevive a armazenamento bloqueado', () => {
        const g = globalThis as unknown as { window?: unknown };
        const store = new Map<string, string>();
        g.window = {
            localStorage: {
                getItem: (k: string) => store.get(k) ?? null,
                setItem: (k: string, v: string) => store.set(k, v),
            },
        };
        expect(readMenuCollapsed()).toBe(false);
        saveMenuCollapsed(true);
        expect(readMenuCollapsed()).toBe(true);
        saveMenuCollapsed(false);
        expect(readMenuCollapsed()).toBe(false);
        g.window = {
            get localStorage(): never {
                throw new Error('blocked');
            },
        };
        expect(readMenuCollapsed()).toBe(false);
        expect(() => saveMenuCollapsed(true)).not.toThrow();
        delete g.window;
    });
});

describe('textos', () => {
    it('primeiro nome', () => {
        expect(firstName('Andre Floriano')).toBe('Andre');
        expect(firstName('  Maria ')).toBe('Maria');
        expect(firstName(undefined)).toBe('');
        expect(firstName('Pe. João Silva')).toBe('João');
        expect(firstName('Dr. Dra.')).toBe('');
    });

    it('nome do menu: primeiro nome + último sobrenome', () => {
        expect(displayName('Maria da Silva Souza')).toBe('Maria Souza');
        expect(displayName('Ana de Souza')).toBe('Ana Souza');
        expect(displayName('João Pedro dos Santos')).toBe('João Santos');
        expect(displayName('Pe. João Silva Jr.')).toBe('João Silva');
        expect(displayName('Nome undefined')).toBe('Nome');
        expect(displayName('Maria de')).toBe('Maria');
        expect(displayName('  Cher  ')).toBe('Cher');
        expect(displayName(null)).toBe('');
    });
});

describe('molde de cursos', () => {
    const modules = [
        {
            id: 'm1',
            title: 'Get started',
            lessons: [
                { id: 'a', title: 'A', href: '/a' },
                { id: 'b', title: 'B', href: '/b' },
            ],
        },
        { id: 'm2', title: 'Brain', lessons: [{ id: 'c', title: 'C', href: '/c' }] },
        { id: 'm3', title: 'Locked', lessons: [{ id: 'd', title: 'D', href: '/d' }], locked: 'Oct 12' },
    ];

    it('acha a aula, a anterior e a próxima só entre as liberadas', () => {
        expect(lessonNeighbours(modules, 'b')).toMatchObject({
            previous: { id: 'a' },
            next: { id: 'c' },
            position: 2,
            total: 3,
        });
        expect(lessonNeighbours(modules, 'a').previous).toBeUndefined();
        expect(lessonNeighbours(modules, 'c').next).toBeUndefined();
        expect(lessonNeighbours(modules, 'd').current).toBeUndefined();
        expect(lessonNeighbours(modules, 'zzz')).toMatchObject({ position: 0, total: 3 });
    });

    it('reconhece a aula de módulo trancado', () => {
        expect(lockedModuleOf(modules, 'd')?.locked).toBe('Oct 12');
        expect(lockedModuleOf(modules, 'a')).toBeUndefined();
    });

    it('tamanho de arquivo nas mesmas faixas do card atual', () => {
        expect(fileSizeLabel(900)).toBe('900 B');
        expect(fileSizeLabel(2048)).toBe('2.00 KB');
        expect(fileSizeLabel(3 * 1024 * 1024)).toBe('3.00 MB');
    });
});

describe('LAMP', () => {
    it('lê tempo digitado como HH:MM com as mesmas regras do seletor atual', () => {
        expect(parseHm('1:30')).toBe(90);
        expect(parseHm('01:30')).toBe(90);
        expect(parseHm('130')).toBe(90);
        expect(parseHm('90')).toBe(59); // minutos presos em 59
        expect(parseHm('5')).toBe(5);
        expect(parseHm('')).toBe(0);
        expect(parseHm('2:75')).toBe(2 * 60 + 59);
        expect(parseHm('120:00')).toBe(99 * 60);
        expect(formatHm(90)).toBe('01:30');
        expect(formatHm(0)).toBe('00:00');
        expect(formatHm(parseHm('7:05'))).toBe('07:05');
    });

    it('meta em texto curto', () => {
        expect(goalLabel('00:45')).toBe('45 min');
        expect(goalLabel('01:45')).toBe('1h45');
        expect(goalLabel('03:00')).toBe('3h');
        expect(goalLabel(undefined)).toBe('—');
    });

    it('na semana em curso só oferece os dias até hoje', () => {
        expect(weekDayOptions('week5', 5, 3).map((d) => d.value)).toEqual(['day1', 'day2', 'day3']);
        expect(weekDayOptions('week4', 5, 3)).toHaveLength(7);
        expect(clampWeekDay('day6', weekDayOptions('week5', 5, 3))).toBe('day3');
        expect(clampWeekDay('day2', weekDayOptions('week5', 5, 3))).toBe('day2');
        expect(lampDateLabel('week5', 'day1')).toBe('Week 05 · Monday');
    });
});

describe('gráficos', () => {
    it('troca só a fonte e os tons, mantendo séries, cores e formatadores', () => {
        const formatter = (v: number) => `${v}%`;
        const options = {
            colors: ['#F61F64'],
            chart: { type: 'bar' },
            xaxis: { categories: ['W1'], labels: { style: { colors: '#FFF' } } },
            yaxis: { min: 0, labels: { formatter, style: { colors: '#FFF' } } },
        };
        const soft = softChart(options, 'Manrope');
        expect(soft.colors).toEqual(['#F61F64']);
        expect(soft.chart).toMatchObject({ type: 'bar', fontFamily: 'Manrope' });
        expect(soft.xaxis).toMatchObject({ categories: ['W1'], labels: { style: { fontFamily: 'Manrope' } } });
        expect((soft.yaxis as { labels: { formatter: unknown } }).labels.formatter).toBe(formatter);
        expect(options.xaxis.labels.style.colors).toBe('#FFF'); // o original não muda
    });
});

describe('trilho de aulas: módulos abertos e trancados', () => {
    it('padrão = só o módulo da aula atual; o que o aluno mudou prevalece', () => {
        expect(isModuleOpen({}, 'm1', 'm1')).toBe(true);
        expect(isModuleOpen({}, 'm2', 'm1')).toBe(false);
        expect(isModuleOpen({ m1: false }, 'm1', 'm1')).toBe(false);
        expect(isModuleOpen({ m2: true }, 'm2', 'm1')).toBe(true);
        expect(isModuleOpen({}, 'm1', undefined)).toBe(false);
    });

    it('texto de liberação só quando muda de um trancado para o seguinte', () => {
        const mods = [
            { id: 'a', title: 'A', lessons: [] },
            { id: 'b', title: 'B', lessons: [], locked: 'Oct 12' },
            { id: 'c', title: 'C', lessons: [], locked: 'Start DEDA to unlock this module' },
            { id: 'd', title: 'D', lessons: [], locked: 'Start DEDA to unlock this module' },
        ];
        expect(lockedNotes(mods)).toEqual([undefined, 'Oct 12', 'Start DEDA to unlock this module', undefined]);
    });
});

describe('miniatura do Vimeo', () => {
    it('id numérico do endereço de embed (o HPEC grava com "?" no fim)', () => {
        expect(vimeoIdOf('https://player.vimeo.com/video/678384632?')).toBe('678384632');
        expect(vimeoIdOf('https://player.vimeo.com/video/1055330506')).toBe('1055330506');
        expect(vimeoIdOf('https://vimeo.com/522761378')).toBe('522761378');
        expect(vimeoIdOf('https://www.youtube.com/embed/_5hdGgtKLpM')).toBeUndefined();
        expect(vimeoIdOf(undefined)).toBeUndefined();
    });
});

describe('relatório da LAMP (Overall stats)', () => {
    it('lê e escreve o tempo no formato do servidor', () => {
        expect(reportMinutes('123h 05m')).toBe(7385);
        expect(reportMinutes('00h 00m')).toBe(0);
        expect(reportMinutes(undefined)).toBe(0);
        expect(reportHm(90)).toBe('01h 30m');
        expect(reportHm(reportMinutes('123h 05m'))).toBe('123h 05m');
    });
    it('ranqueia por tempo e separa as atividades sem tempo', () => {
        const rows = [
            { k: 'a', minutes: 10 },
            { k: 'b', minutes: 0 },
            { k: 'c', minutes: 30 },
        ];
        expect(rankActivities(rows, 'time').done.map((r) => r.k)).toEqual(['c', 'a']);
        expect(rankActivities(rows, 'default').done.map((r) => r.k)).toEqual(['a', 'c']);
        expect(rankActivities(rows, 'time').idle.map((r) => r.k)).toEqual(['b']);
    });
});

describe('gráficos e metas da LAMP', () => {
    it('escreve tempos e eixos em palavras', () => {
        expect(minutesText(33)).toBe('33 min');
        expect(minutesText(65)).toBe('1h05');
        expect(minutesText(180)).toBe('3h');
        expect(minutesText(4.5, true)).toBe('4 min 30 s');
        expect(axisWords('W12')).toBe('Week 12');
        expect(axisWords('D02')).toBe('Day 2');
        expect(axisWords('ACTIVE')).toBe('Active');
        expect(axisWords('DEDA')).toBe('DEDA');
        expect(chartTip('3h', 'a<b')).toBe('<div class="ltip"><b>3h</b><span>a&#60;b</span></div>');
    });
    it('soma as categorias da meta e acha a semana de carga cheia', () => {
        const days = goalDays([
            { week: 1, deda: '00:45', active: '00:05', review: '00:00', passive: '00:05' },
            { week: 2, deda: '00:45', active: '00:20', review: '00:10', passive: '01:45' },
            { week: 3, deda: '00:45', active: '00:20', review: '00:10', passive: '01:45' },
        ]);
        expect(days.map((d) => d.total)).toEqual([55, 180, 180]);
        expect(fullLoadWeek(days)).toBe(2);
    });
});

describe('Input da LAMP', () => {
    it('dá nome às estrelas sem mudar o valor', () => {
        expect(starName(3)).toBe('Still Bad');
        expect(starName(5)).toBe('Great');
        expect(starName(0)).toBe('');
    });
    it('mede o dia contra a meta como o servidor (o que passa não conta)', () => {
        expect(goalProgress(15, 20)).toEqual({ counted: 15, extra: 0, missing: 5, met: false, ratio: 0.75 });
        expect(goalProgress(45, 20)).toMatchObject({ counted: 20, extra: 25, met: true, ratio: 1 });
        expect(addMinutes(5990, 30)).toBe(5999);
    });
    it('anda pelos dias atravessando semanas, sem passar de hoje', () => {
        const weeks = ['week1', 'week2', 'week3'];
        expect(stepDay('week2', 'day1', -1, weeks, 3, 4)).toEqual({ week: 'week1', day: 'day7' });
        expect(stepDay('week2', 'day7', 1, weeks, 3, 4)).toEqual({ week: 'week3', day: 'day1' });
        expect(stepDay('week3', 'day4', 1, weeks, 3, 4)).toBeUndefined();
        expect(stepDay('week1', 'day1', -1, weeks, 3, 4)).toBeUndefined();
    });
});

describe('campo de tempo em minutos (Input)', () => {
    // texto digitado → minutos → "HH:MM" do formato antigo (o servidor recebe os minutos, como hoje)
    it.each([
        ['', 0, '00:00'],
        ['0', 0, '00:00'],
        ['15', 15, '00:15'],
        ['90', 90, '01:30'],
        ['1h30', 90, '01:30'],
        ['1h 30', 90, '01:30'],
        ['1 h 30 min', 90, '01:30'],
        ['1:30', 90, '01:30'],
        ['01:30', 90, '01:30'],
        ['1.5h', 90, '01:30'],
        ['1,5', 90, '01:30'],
        ['2h', 120, '02:00'],
        ['45m', 45, '00:45'],
        ['45 min', 45, '00:45'],
        ['15:00', 15, '00:15'],
        ['10:00', 10, '00:10'],
        ['24:00', 24, '00:24'],
        ['9:00', 540, '09:00'],
        ['10:30', 630, '10:30'],
        ['  15  ', 15, '00:15'],
        ['15H', 900, '15:00'],
        ['9999', 5999, '99:59'],
    ])('"%s" → %i min → %s', (text, minutes, hhmm) => {
        expect(parseDuration(text)).toBe(minutes);
        expect(formatHm(parseDuration(text) as number)).toBe(hhmm);
    });
    it.each(['abc', '1:75', 'h', '1h75', '--', '12:3:4'])(
        '"%s" é inválido (o campo volta ao valor anterior)',
        (text) => {
            expect(parseDuration(text)).toBeNull();
        },
    );
    it('mostra minutos primeiro', () => {
        expect(durationText(0)).toBe('');
        expect(durationText(15)).toBe('15 min');
        expect(durationText(90)).toBe('1 h 30');
        expect(durationText(120)).toBe('2 h');
    });
    it('pede confirmação em registros implausíveis', () => {
        expect(implausibleEntry(300, 400)).toBeUndefined();
        expect(implausibleEntry(900, 900)).toEqual({ suggestion: 15 });
        expect(implausibleEntry(120, 800)).toEqual({ suggestion: undefined });
    });
});

describe('LAMP como espelho', () => {
    const d = (deda: number, active = 0, passive = 0, day = 1, week = 1) => ({
        week,
        day,
        deda,
        active,
        passive,
        ratings: [4, 4, 3, 4, 3],
    });
    it('classifica o dia na DEDA Run (80%)', () => {
        expect(runDay(d(80), false)).toBe('counted');
        expect(runDay(d(79), false)).toBe('broke');
        expect(runDay(undefined, false)).toBe('broke');
        expect(runDay(d(60), true)).toBe('today');
        expect(runDay(d(90), true)).toBe('counted');
        expect(runDay(undefined, false, true)).toBe('future');
    });
    it('meta do dia: cumprida, parcial ou nada', () => {
        expect(goalDayStatus(d(80, 100, 100), false)).toBe('met');
        expect(goalDayStatus(d(80, 60, 100), false)).toBe('partial');
        expect(goalDayStatus(d(0, 0, 0), false)).toBe('nothing');
        expect(goalDayStatus(undefined, false)).toBe('nothing');
        // hoje: neutro sem nada, amarelo com algo, verde com as três; nunca vermelho
        expect(goalDayStatus(d(0, 0, 0), true)).toBe('today');
        expect(goalDayStatus(undefined, true)).toBe('today');
        expect(goalDayStatus(d(0, 20, 0), true)).toBe('partial');
        expect(goalDayStatus(d(85, 100, 100), true)).toBe('met');
        expect(goalDayStatus(undefined, false, true)).toBe('future');
    });
    it('frente batida pelos minutos quando a meta é conhecida (o ✓ não mente)', () => {
        const day = { ...d(84, 100, 100), activeMin: 15, passiveMin: 60 };
        const goal = { active: 20, passive: 105 };
        expect(frontMet(60, 105, 100)).toBe(false);
        expect(frontMet(105, 105, 0)).toBe(true);
        expect(frontMet(undefined, undefined, 100)).toBe(true);
        expect(goalDayStatus(day, false, false, goal)).toBe('partial');
        expect(dayBreakdown(day, goal)).toBe('DEDA 84% ✓ · Active 15/20 min · Passive 1h/1h45');
        expect(dayBreakdown({ ...day, activeMin: 20, passiveMin: 105 }, goal)).toBe(
            'DEDA 84% ✓ · Active 20/20 min ✓ · Passive 1h45/1h45 ✓',
        );
    });
    it('a Run é numérica: 80% exato conta, 79,x% zera', () => {
        // 5 + 4 + 3 + 4 + 4 = 20 de 25 = 80%, calculado como o servidor (média ÷ 5 × 100)
        const score = ((5 + 4 + 3 + 4 + 4) / 5 / 5) * 100;
        expect(countsForRun(score)).toBe(true);
        expect(runDay(d(score), false)).toBe('counted');
        expect(countsForRun(79.99)).toBe(false);
        expect(runDay(d(79.5), false)).toBe('broke');
    });
    it('Run até ontem, a quebra e as maiores', () => {
        expect(runBeforeToday([d(0), d(85), d(90), d(70), d(85)])).toBe(2);
        expect(lastBreak([d(0), d(75), d(85), d(90), d(10)])).toMatchObject({ previous: 2 });
        expect(lastBreak([d(0), d(85)])).toBeUndefined();
        const top = topRuns([d(85), d(85), d(0), d(90), d(0), d(95), d(95), d(95)], 2);
        expect(top.map((r) => r.days)).toEqual([3, 2]);
    });
    it('conta a sequência de DEDA bem feito; hoje em andamento não quebra', () => {
        expect(dedaStreak([d(0), d(80), d(90), d(60), d(80)])).toEqual({ current: 2, toEdge: false });
        expect(dedaStreak([d(80), d(80)])).toEqual({ current: 2, toEdge: true });
        expect(dedaStreak([d(0), d(0)])).toEqual({ current: 0, toEdge: false });
        expect(bestStreak([d(80), d(80), d(0), d(80), d(80), d(80)])).toBe(3);
        const runs = constancyRuns([d(80, 0, 0, 1), d(80, 0, 0, 2), d(0, 0, 0, 3), d(90, 0, 0, 4)]);
        expect(runs.map((r) => [r.from.day, r.to.day, r.days])).toEqual([
            [1, 2, 2],
            [4, 4, 1],
        ]);
    });
    it('compara as últimas 4 semanas fechadas com as 4 anteriores', () => {
        expect(lastFourVsPrevious([50, 50, 50, 50, 70, 70, 70, 70, 10])).toEqual({ last: 70, prev: 50, delta: 20 });
        expect(lastFourVsPrevious([60, 80, 5]).prev).toBeUndefined();
    });
    it('qualidade por semana só nos dias avaliados', () => {
        const q = weeklyQuality([d(80, 0, 0, 1, 1), d(0, 0, 0, 2, 1), d(60, 0, 0, 1, 2)]);
        expect(q.map((w) => [w.week, w.score, w.days])).toEqual([
            [1, 80, 1],
            [2, 60, 1],
        ]);
        expect(q[0].criteria).toEqual([4, 4, 3, 4, 3]);
    });
});

describe('dedaStreak com a LAMP parada', () => {
    const d = (deda: number) => ({ week: 1, day: 1, deda, active: 0, passive: 0, ratings: [] });
    it('o último dia de uma LAMP parada já acabou: sem DEDA, quebra a Run (sem o perdão do "hoje")', () => {
        const days = [d(0), d(100), d(100), d(100)];
        expect(dedaStreak(days).current).toBe(3);
        expect(dedaStreak(days, false).current).toBe(0);
        expect(dedaStreak([d(100), d(100)], false)).toEqual({ current: 2, toEdge: true });
        // só "hoje" pendente na janela: a Run anterior é desconhecida (chegou ao fim sem achar a quebra)
        expect(dedaStreak([d(0)])).toEqual({ current: 0, toEdge: true });
    });
});

describe('calendário da LAMP', () => {
    const day = (week: number, n: number) => ({ week, day: n, deda: 80, active: 100, passive: 100, ratings: [] });
    it('põe os dias do programa nas datas, pulando a pausa', () => {
        // hoje 7/out; pausa de 3 a 5/out (volta dia 5): programa = 7, 6, 2, 1/out
        const nf = [day(2, 4), day(2, 3), day(2, 2), day(2, 1)];
        const { byDate, pausedDays, start } = calendarDays(nf, '2026-10-07', [
            { from: '2026-10-03', to: '2026-10-05' },
        ]);
        expect([...byDate.keys()]).toEqual(['2026-10-07', '2026-10-06', '2026-10-05', '2026-10-02']);
        expect([...pausedDays].sort()).toEqual(['2026-10-03', '2026-10-04']);
        expect(start).toBe('2026-10-02');
    });
    it('LAMP parada: ancora no último dia dela, não em hoje; pausa em aberto vai até hoje', () => {
        // pausado: dias 1–7 de 21 a 27/set (o domingo 27 é o último dia ativo); hoje 9/out
        const nf = [7, 6, 5, 4, 3, 2, 1].map((d) => day(1, d));
        const { byDate, pausedDays, start } = calendarDays(nf, '2026-09-27', [{ from: '2026-09-28' }], '2026-10-09');
        expect([...byDate.keys()][0]).toBe('2026-09-27');
        expect(start).toBe('2026-09-21');
        expect(pausedDays.has('2026-09-27')).toBe(false);
        expect(pausedDays.has('2026-09-28')).toBe(true);
        expect(pausedDays.has('2026-10-09')).toBe(true);
        expect(pausedDays.has('2026-10-10')).toBe(false);
    });
    it('monta o mês de segunda a domingo', () => {
        const g = monthGrid(2026, 9); // outubro de 2026 começa numa quinta
        expect(g[0]).toEqual([null, null, null, '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04']);
        expect(g.every((w) => w.length === 7)).toBe(true);
    });
});

describe('eixo das semanas', () => {
    it('até a 10ª semana: W1…W10, um por posição', () => {
        expect(weekTickLabels(3)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        expect(weekTickLabels(10)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        expect(weekAxisSpan(4)).toEqual({ min: 1, max: 10 });
    });
    it('depois: 10 rótulos igualmente espaçados, do W1 até a semana atual', () => {
        expect(weekTickLabels(100)).toEqual([1, 12, 23, 34, 45, 56, 67, 78, 89, 100]);
        const l = weekTickLabels(21);
        expect(l).toHaveLength(10);
        expect(l[0]).toBe(1);
        expect(l[9]).toBe(21);
        expect(weekAxisSpan(21)).toEqual({ min: 1, max: 21 });
    });
});

describe('marcos da DEDA Run', () => {
    it('o maior marco alcançado', () => {
        expect(runMilestone(0)).toBe(0);
        expect(runMilestone(6)).toBe(0);
        expect(runMilestone(7)).toBe(7);
        expect(runMilestone(99)).toBe(50);
        expect(runMilestone(100)).toBe(100);
        expect(runMilestone(400)).toBe(365);
    });
});

describe('pontos semana → valor', () => {
    it('a semana vem do rótulo, em ordem crescente, mesmo com a resposta da mais nova para a mais antiga', () => {
        expect(weekPoints(['W3', 'W2', 'W1'], [30, 20, 10])).toEqual([
            { x: 1, y: 10 },
            { x: 2, y: 20 },
            { x: 3, y: 30 },
        ]);
        const pts = weekPoints(['Week 98', 'Week 5'], ['100', 40]);
        expect(pts.find((p) => p.x === 5)?.y).toBe(40);
        expect(pts.find((p) => p.x === 98)?.y).toBe(100);
        expect(weekPoints([7, 'W?'], [null, 1])).toEqual([{ x: 7, y: 0 }]);
    });
});

test('texto de apresentação: marcas de ênfase do markdown saem, sublinhado dentro da palavra fica', () => {
    expect(plainEmphasis('Bem-vindo(a) ao ___Programa IMERSO___! Esta é ___sua última parada___.')).toBe(
        'Bem-vindo(a) ao Programa IMERSO! Esta é sua última parada.',
    );
    expect(plainEmphasis('**a** e _b_; snake_case_name')).toBe('a e b; snake_case_name');
    expect(plainEmphasis('sem marcas')).toBe('sem marcas');
});
