import { DEDA_READER_UIDS } from '../dedaReader';
import {
    activeMenuKeys,
    clampWeekDay,
    fileSizeLabel,
    firstName,
    formatHm,
    goalLabel,
    isNewDesignAccount,
    lampDateLabel,
    lessonNeighbours,
    lockedModuleOf,
    NEW_DESIGN_UIDS,
    parseHm,
    readMenuCollapsed,
    saveMenuCollapsed,
    settingsTabFromQuery,
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
