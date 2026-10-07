import { DEDA_READER_UIDS } from '../dedaReader';
import {
    activeMenuKeys,
    clampWeekDay,
    fileSizeLabel,
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
    settingsTabFromQuery,
    vimeoIdOf,
    softChart,
    weekDayOptions,
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
    });

    it('aba de /settings pelo ?tab=', () => {
        const keys = ['personal-information', 'help'] as const;
        expect(settingsTabFromQuery('help', keys)).toBe('help');
        expect(settingsTabFromQuery('nope', keys)).toBe('personal-information');
        expect(settingsTabFromQuery(null, keys)).toBe('personal-information');
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
