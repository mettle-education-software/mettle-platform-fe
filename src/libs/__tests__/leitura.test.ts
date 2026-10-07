import { deltaPp, isLeituraOwner, markOf, uniqueWords, weekPoint, withSep } from '../leitura';

describe('leitura (piloto interno)', () => {
    it('só o dono abre a página', () => {
        expect(isLeituraOwner('RBgG61nNKdgHUKCkxhR4vhaBLGU2')).toBe(true);
        expect(isLeituraOwner('outroAluno')).toBe(false);
        expect(isLeituraOwner(undefined)).toBe(false);
    });
    it('marca de cada palavra; difícil até na narração fica neutra', () => {
        expect(markOf({ st: 'ok' })).toBe('');
        expect(markOf({ st: 'sub' })).toBe('sub');
        expect(markOf({ st: 'sub', hard: true })).toBe('h');
    });
    it('variação em pontos percentuais e prática sem repetição', () => {
        expect(deltaPp(0.036)).toBe('+4 pp');
        expect(deltaPp(-0.02)).toBe('−2 pp');
        expect(deltaPp(null)).toBe('—');
        expect(uniqueWords([{ w: 'Rushed' }, { w: 'rushed' }, { w: 'worked' }])).toEqual(['rushed', 'worked']);
    });
    it('ponto da semana usa a última gravação; texto com a pontuação do original', () => {
        const base = { week: 'week1', dedaId: 'DEDA1', firstOn: null, lastOn: null };
        expect(weekPoint({ ...base, firstPace: 0.7, firstAcc: 0.9, lastPace: 0.8, lastAcc: 0.95 })).toEqual({
            pace: 0.8,
            acc: 0.95,
        });
        expect(weekPoint({ ...base, firstPace: 0.7, firstAcc: 0.9, lastPace: null, lastAcc: null })).toEqual({
            pace: 0.7,
            acc: 0.9,
        });
        expect(withSep({ w: 'made', sep: '. ' })).toBe('made. ');
        expect(withSep({ w: 'well', sep: '-' })).toBe('well-');
        expect(withSep({ w: 'so' })).toBe('so ');
    });
});
