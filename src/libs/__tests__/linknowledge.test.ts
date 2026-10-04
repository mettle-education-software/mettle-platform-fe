import { editionArticles, formatEditionDate, splitAtMiddle, todayCardDay } from '../linknowledge';

describe('linknowledge', () => {
    it('data da edição em inglês, sem deslocar o dia', () => {
        expect(formatEditionDate('2026-09-28')).toBe('28 September 2026');
        expect(formatEditionDate(null)).toBeNull();
    });

    it('corta o corpo ao meio logo depois de um parágrafo', () => {
        const n = (nodeType: string) => ({ nodeType });
        const [a, b] = splitAtMiddle([n('paragraph'), n('heading-2'), n('paragraph'), n('paragraph')]);
        expect(a.map((x) => x.nodeType)).toEqual(['paragraph', 'heading-2', 'paragraph']);
        expect(b).toHaveLength(1);
        expect(splitAtMiddle([])).toEqual([[], []]);
    });

    it('artigos da edição: ordem por dia, nulos fora; vazio mantém os links externos', () => {
        expect(editionArticles([{ day: 3 }, null, { day: 1 }]).map((a) => a.day)).toEqual([1, 3]);
        expect(editionArticles([])).toEqual([]);
        expect(editionArticles(undefined)).toEqual([]);
        expect(editionArticles(null)).toEqual([]);
    });

    describe('todayCardDay', () => {
        const base = {
            melp_status: 'DEDA_STARTED' as const,
            current_deda_day: 17, // semana 3, 3º dia
            current_deda_week: 3,
            unlocked_dedas: ['DEDA0', 'DEDA5', 'DEDA6', 'DEDA7'],
        };

        it('dia do aluno dentro do DEDA da semana (1 a 7)', () => {
            expect(todayCardDay(base, 'DEDA7')).toBe(3);
            expect(
                todayCardDay(
                    {
                        ...base,
                        current_deda_day: 14,
                        current_deda_week: 2,
                        unlocked_dedas: ['DEDA0', 'DEDA5', 'DEDA6'],
                    },
                    'DEDA6',
                ),
            ).toBe(7);
            expect(
                todayCardDay(
                    { ...base, current_deda_day: 1, current_deda_week: 1, unlocked_dedas: ['DEDA0', 'DEDA5'] },
                    'DEDA5',
                ),
            ).toBe(1);
        });

        it('DEDA antigo ou futuro: nenhum destaque', () => {
            expect(todayCardDay(base, 'DEDA6')).toBeNull();
            expect(todayCardDay(base, 'DEDA8')).toBeNull();
            expect(todayCardDay(base, '')).toBeNull();
        });

        it('programa concluído: dia do calendário de Brasília, só no DEDA da semana na rotação', () => {
            const done = { ...base, melp_status: 'DEDA_FINISHED' as const, current_deda_day: 729, current_deda_week: 105 };
            const sunday = new Date('2026-10-04T15:00:00Z'); // domingo em Brasília
            const mondayUtc = new Date('2026-10-05T01:00:00Z'); // ainda domingo 22h em Brasília
            expect(todayCardDay(done, 'DEDA34', 'DEDA34', sunday)).toBe(7);
            expect(todayCardDay(done, 'DEDA34', 'DEDA34', mondayUtc)).toBe(7);
            expect(todayCardDay(done, 'DEDA34', 'DEDA34', new Date('2026-10-05T15:00:00Z'))).toBe(1);
            expect(todayCardDay(done, 'DEDA20', 'DEDA34', sunday)).toBeNull();
            expect(todayCardDay(done, 'DEDA34', undefined, sunday)).toBeNull();
        });

        it('pausa, sem programa iniciado ou concluído: nenhum destaque', () => {
            for (const melp_status of [
                'DEDA_PAUSED',
                'DEDA_FINISHED',
                'DEDA_STARTED_NOT_BEGUN',
                'CAN_START_DEDA',
                'MELP_BEGIN',
                'WEEK_ZERO',
                'MELP_SUSPENDED',
            ] as const) {
                expect(todayCardDay({ ...base, melp_status }, 'DEDA7')).toBeNull();
            }
        });

        it('dado ausente, em carregamento ou incoerente: nenhum destaque', () => {
            expect(todayCardDay(undefined, 'DEDA7')).toBeNull();
            expect(todayCardDay(null, 'DEDA7')).toBeNull();
            expect(todayCardDay({ ...base, current_deda_day: 0 }, 'DEDA7')).toBeNull();
            expect(todayCardDay({ ...base, current_deda_week: 2 }, 'DEDA7')).toBeNull();
            expect(todayCardDay({ ...base, unlocked_dedas: undefined as unknown as string[] }, 'DEDA7')).toBeNull();
        });
    });
});
