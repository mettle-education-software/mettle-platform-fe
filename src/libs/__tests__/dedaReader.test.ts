import {
    canJumpTo,
    DEDA_READER_UIDS,
    isDedaReaderAccount,
    nextBlocked,
    openWriteDay,
    readReaderView,
    readTextScale,
    saveReaderView,
    saveTextScale,
    StepRules,
    summaryTimes,
    TEXT_SCALES,
    writeDayState,
    writeDayToday,
} from '../dedaReader';

describe('chave por conta', () => {
    const owner = DEDA_READER_UIDS[0];

    it('liga só para as contas da lista', () => {
        expect(isDedaReaderAccount(owner)).toBe(true);
        expect(isDedaReaderAccount('outro-aluno')).toBe(false);
        expect(isDedaReaderAccount(undefined)).toBe(false);
        expect(isDedaReaderAccount(null)).toBe(false);
        expect(isDedaReaderAccount('')).toBe(false);
    });

    it('a variável de teste desliga para todos', () => {
        expect(isDedaReaderAccount(owner, true)).toBe(false);
    });

    it('preferência de visão: padrão "new", lembra "classic", sobrevive a armazenamento bloqueado', () => {
        const g = globalThis as unknown as { window?: unknown };
        const store = new Map<string, string>();
        g.window = {
            localStorage: {
                getItem: (k: string) => store.get(k) ?? null,
                setItem: (k: string, v: string) => store.set(k, v),
            },
        };
        expect(readReaderView()).toBe('new');
        saveReaderView('classic');
        expect(readReaderView()).toBe('classic');
        saveReaderView('new');
        expect(readReaderView()).toBe('new');
        g.window = {
            get localStorage(): never {
                throw new Error('blocked');
            },
        };
        expect(readReaderView()).toBe('new');
        expect(() => saveReaderView('classic')).not.toThrow();
        delete g.window;
        expect(readReaderView()).toBe('new');
    });
});

describe('passos', () => {
    const today: StepRules = { isTodaysDeda: true, todaysAndNotCompleted: true, notWeekZero: true, progress: {} };

    it('DEDA de hoje: avança só pelo passo concluído', () => {
        expect(nextBlocked('listen', today)).toBe(true);
        expect(nextBlocked('listen', { ...today, progress: { listen: true } })).toBe(false);
        expect(canJumpTo('watch', 'listen', today)).toBe(true);
        expect(canJumpTo('listen', 'watch', today)).toBe(false);
        expect(canJumpTo('listen', 'watch', { ...today, progress: { listen: true, readRecord: true } })).toBe(true);
        expect(canJumpTo('listen', 'watch', { ...today, progress: { listen: true } })).toBe(false);
    });

    it('DEDA anterior ou já feito: passos livres até o Write, Summary fechado', () => {
        const past = { ...today, isTodaysDeda: false };
        expect(canJumpTo('listen', 'write', past)).toBe(true);
        expect(canJumpTo('listen', 'finish', past)).toBe(false);
        expect(canJumpTo('write', 'finish', { ...today, todaysAndNotCompleted: false })).toBe(false);
    });

    it('"completed" nunca é destino nem origem', () => {
        expect(canJumpTo('finish', 'completed', today)).toBe(false);
        expect(canJumpTo('completed', 'listen', today)).toBe(false);
    });
});

describe('passo 5: dias', () => {
    it('segunda = Day 1, domingo = Day 7', () => {
        expect(writeDayToday(new Date(2026, 9, 5))).toBe(1); // segunda
        expect(writeDayToday(new Date(2026, 9, 11))).toBe(7); // domingo
    });

    it('hoje, anteriores para consulta, futuros bloqueados', () => {
        expect(writeDayState(4, 4)).toBe('today');
        expect(writeDayState(2, 4)).toBe('past');
        expect(writeDayState(5, 4)).toBe('locked');
    });

    it('dia aberto: hoje por padrão; nunca um dia futuro ou inválido', () => {
        expect(openWriteDay(null, 4)).toBe(4);
        expect(openWriteDay(2, 4)).toBe(2);
        expect(openWriteDay(4, 4)).toBe(4);
        expect(openWriteDay(6, 4)).toBe(4);
        expect(openWriteDay(0, 4)).toBe(4);
        expect(openWriteDay(1.5, 4)).toBe(4);
    });
});

describe('tamanho do texto', () => {
    it('padrão 1; lembra um fator da lista; ignora valor estranho e armazenamento bloqueado', () => {
        const g = globalThis as unknown as { window?: unknown };
        const store = new Map<string, string>();
        g.window = {
            localStorage: {
                getItem: (k: string) => store.get(k) ?? null,
                setItem: (k: string, v: string) => store.set(k, v),
            },
        };
        expect(readTextScale()).toBe(1);
        for (const scale of TEXT_SCALES) {
            saveTextScale(scale);
            expect(readTextScale()).toBe(scale);
        }
        store.set('dedaReaderTextScale', '7');
        expect(readTextScale()).toBe(1);
        store.set('dedaReaderTextScale', 'big');
        expect(readTextScale()).toBe(1);
        g.window = {
            get localStorage(): never {
                throw new Error('blocked');
            },
        };
        expect(readTextScale()).toBe(1);
        expect(() => saveTextScale(1.2)).not.toThrow();
        delete g.window;
        expect(readTextScale()).toBe(1);
    });

    it('vai de 0,9× a 1,3× em passos de 10%, com o padrão na lista', () => {
        expect([...TEXT_SCALES]).toEqual([0.9, 1, 1.1, 1.2, 1.3]);
    });
});

describe('tempos do Summary', () => {
    it('DEDA Time em minutos inteiros do cronômetro; Reading Time em segundos da gravação de hoje', () => {
        expect(summaryTimes(27 * 60 + 59, 372_900)).toEqual({ dedaTime: 27, readingTime: 372 });
        expect(summaryTimes(59, 5_000)).toEqual({ dedaTime: 0, readingTime: 5 });
    });

    it('sem gravação hoje: Reading Time zero, nunca inventado', () => {
        expect(summaryTimes(1800, null)).toEqual({ dedaTime: 30, readingTime: 0 });
        expect(summaryTimes(1800, undefined)).toEqual({ dedaTime: 30, readingTime: 0 });
        expect(summaryTimes(1800, 0)).toEqual({ dedaTime: 30, readingTime: 0 });
        expect(summaryTimes(NaN, NaN)).toEqual({ dedaTime: 0, readingTime: 0 });
    });
});
