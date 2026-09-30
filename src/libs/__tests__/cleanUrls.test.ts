import { legacyRedirectTarget } from '../cleanUrls';

const lookups = {
    dedaSlugOf: async (id: string) => ({ DEDA34: 'london' })[id] ?? null,
    firstLessonOf: async (id: string) => ({ HPEC3: 'lamp-intro' })[id] ?? null,
};

describe('legacyRedirectTarget', () => {
    it('DEDA antigo vai para o slug, preservando o resto do caminho', async () => {
        expect(await legacyRedirectTarget('/imerso/deda/DEDA34', lookups)).toBe('/imerso/deda/london');
        expect(await legacyRedirectTarget('/imerso/deda/DEDA34/articles/2', lookups)).toBe(
            '/imerso/deda/london/articles/2',
        );
    });

    it('DEDA desconhecido ou já com slug não redireciona', async () => {
        expect(await legacyRedirectTarget('/imerso/deda/DEDA999', lookups)).toBeNull();
        expect(await legacyRedirectTarget('/imerso/deda/london', lookups)).toBeNull();
        expect(await legacyRedirectTarget('/imerso/deda', lookups)).toBeNull();
    });

    it('HPEC antigo vai para /imerso/hpec/<lessonId>', async () => {
        expect(await legacyRedirectTarget('/imerso/hpec/HPEC1/welcome', lookups)).toBe('/imerso/hpec/welcome');
        expect(await legacyRedirectTarget('/imerso/hpec/HPEC3/first-lesson', lookups)).toBe('/imerso/hpec/lamp-intro');
        expect(await legacyRedirectTarget('/imerso/hpec/HPEC9/first-lesson', lookups)).toBeNull();
        expect(await legacyRedirectTarget('/imerso/hpec/welcome', lookups)).toBeNull();
    });
});
