import { deltaPp, isLeituraOwner, markOf, uniqueWords } from '../leitura';

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
});
