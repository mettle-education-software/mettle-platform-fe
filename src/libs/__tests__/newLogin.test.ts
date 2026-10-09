import { isNewLogin, NEW_LOGIN } from '../newDesign';

describe('gate do login novo', () => {
    it('fica desligado até o lançamento, independentemente do gate da plataforma', () => {
        expect(NEW_LOGIN).toBe(false);
        expect(isNewLogin()).toBe(false);
    });

    it.each([undefined, null, '', 'true', 'Novo', 'novo-aluno', 'off'])(
        'mantém o clássico com preview=%s',
        (preview) => {
            expect(isNewLogin(preview, false)).toBe(false);
        },
    );

    it('libera somente o preview exato com a chave desligada', () => {
        expect(isNewLogin(new URLSearchParams('preview=novo').get('preview'), false)).toBe(true);
    });

    it.each([undefined, null, '', 'novo', 'off'])('libera com NEW_LOGIN=true e preview=%s', (preview) => {
        expect(isNewLogin(preview, true)).toBe(true);
    });
});
