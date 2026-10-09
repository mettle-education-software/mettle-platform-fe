import {
    canJumpTo,
    DEDA_READER_UIDS,
    isDedaReaderAccount,
    nextBlocked,
    DEFAULT_TEXT_SCALE,
    hasReviews,
    openWriteDay,
    readReaderView,
    readTextScale,
    saveReaderView,
    saveTextScale,
    StepRules,
    summaryTimes,
    TEXT_SCALES,
    withAutoplay,
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
        expect(writeDayToday(new Date('2026-10-05T15:00:00Z'))).toBe(1); // segunda
        expect(writeDayToday(new Date('2026-10-11T15:00:00Z'))).toBe(7); // domingo
        // quinta 22h30 em Brasília é sexta em UTC: vale o dia de Brasília
        expect(writeDayToday(new Date('2026-10-09T01:30:00Z'))).toBe(4);
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

    it('DEDA que já passou: os 7 dias abertos para consulta (sem "hoje", sem cadeado); abre no Day 1', () => {
        for (let day = 1; day <= 7; day += 1) {
            expect(writeDayState(day, 2, true)).toBe('past');
            expect(openWriteDay(day, 2, true)).toBe(day);
        }
        expect(openWriteDay(null, 5, true)).toBe(1);
        expect(openWriteDay(8, 5, true)).toBe(1);
        expect(openWriteDay(0, 5, true)).toBe(1);
        expect(openWriteDay(2.5, 5, true)).toBe(1);
    });
});

describe('tamanho do texto', () => {
    it('padrão = o primeiro (menor) da lista; lembra um fator da lista; ignora valor estranho e armazenamento bloqueado', () => {
        const g = globalThis as unknown as { window?: unknown };
        const store = new Map<string, string>();
        g.window = {
            localStorage: {
                getItem: (k: string) => store.get(k) ?? null,
                setItem: (k: string, v: string) => store.set(k, v),
            },
        };
        expect(DEFAULT_TEXT_SCALE).toBe(TEXT_SCALES[0]);
        expect(readTextScale()).toBe(0.9); // quem nunca escolheu vê o novo padrão
        for (const scale of TEXT_SCALES) {
            saveTextScale(scale);
            expect(readTextScale()).toBe(scale);
        }
        store.set('dedaReaderTextScale', '7');
        expect(readTextScale()).toBe(0.9);
        store.set('dedaReaderTextScale', 'big');
        expect(readTextScale()).toBe(0.9);
        g.window = {
            get localStorage(): never {
                throw new Error('blocked');
            },
        };
        expect(readTextScale()).toBe(0.9);
        expect(() => saveTextScale(1.2)).not.toThrow();
        delete g.window;
        expect(readTextScale()).toBe(0.9);
    });

    it('migração: quem escolheu um tamanho antes da mudança do padrão continua com o mesmo tamanho visual', () => {
        const g = globalThis as unknown as { window?: unknown };
        // o que as versões anteriores gravavam (inclusive o antigo padrão "1", escolhido à mão)
        for (const saved of ['0.9', '1', '1.1', '1.2', '1.3']) {
            g.window = { localStorage: { getItem: () => saved, setItem: () => undefined } };
            expect(readTextScale()).toBe(Number(saved));
        }
        delete g.window;
    });

    it('cinco opções: começa no padrão e só aumenta; a maior é a de sempre (1,3×)', () => {
        expect([...TEXT_SCALES]).toEqual([0.9, 1, 1.1, 1.2, 1.3]);
        expect(Math.min(...TEXT_SCALES)).toBe(DEFAULT_TEXT_SCALE);
    });
});

describe('vídeo que começa sozinho', () => {
    it('acrescenta autoplay=1 sem perder os parâmetros do player e nunca pede mudo', () => {
        expect(withAutoplay('https://player.vimeo.com/video/123?h=abc')).toBe(
            'https://player.vimeo.com/video/123?h=abc&autoplay=1',
        );
        expect(withAutoplay('https://www.youtube.com/embed/xyz')).toBe('https://www.youtube.com/embed/xyz?autoplay=1');
        expect(withAutoplay('https://player.vimeo.com/video/1?autoplay=0')).toBe(
            'https://player.vimeo.com/video/1?autoplay=1',
        );
        expect(withAutoplay('https://player.vimeo.com/video/1')).not.toMatch(/muted/);
        expect(withAutoplay('not a url')).toBe('not a url');
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

describe('aba Review (hasReviews)', () => {
    const unlocked = ['d0', 'd1', 'd2', 'd3', 'd4', 'd5'];

    it('só a partir do quinto DEDA liberado (a mesma regra de "No reviews available")', () => {
        expect(hasReviews(unlocked, 'd0')).toBe(false);
        expect(hasReviews(unlocked, 'd3')).toBe(false);
        expect(hasReviews(unlocked, 'd4')).toBe(true);
        expect(hasReviews(unlocked, 'd5')).toBe(true);
    });

    it('DEDA fora da lista não tem revisão; sem resumo ainda = indefinido (não pisca)', () => {
        expect(hasReviews(unlocked, 'outro')).toBe(false);
        expect(hasReviews([], 'd0')).toBe(false);
        expect(hasReviews(undefined, 'd0')).toBeUndefined();
    });
});
