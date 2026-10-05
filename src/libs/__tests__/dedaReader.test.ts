import {
    canJumpTo,
    DEDA_READER_UIDS,
    isDedaReaderAccount,
    nextBlocked,
    openWriteDay,
    readReaderView,
    saveReaderView,
    StepRules,
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
