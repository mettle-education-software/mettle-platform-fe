import { DEDA_READER_UIDS } from '../dedaReader';
import {
    activeMenuKeys,
    firstName,
    isNewDesignAccount,
    NEW_DESIGN_UIDS,
    readMenuCollapsed,
    saveMenuCollapsed,
    settingsTabFromQuery,
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
