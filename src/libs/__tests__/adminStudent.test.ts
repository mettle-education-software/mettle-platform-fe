/** @jest-environment node */
// Página do aluno no Admin: cabeçalho, os três produtos (Ativo/Leitura, origem, prazo, selos), compras e LTV, dados do
// perfil (o formulário das Configurações), registro e histórico.
import { JSDOM } from 'jsdom';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StudentDetail } from '../../components/_new/NewAdminStudent';
import type { AccessRow } from '../adminAccess';

let mockAccess: any;
let mockEvents: any;
let mockHistory: any;
let mockLookup: any;
const mockLookupCalls: unknown[][] = [];
const mockMutate = jest.fn();
const mockSaveProfile = { mutateAsync: jest.fn(), isPending: false };
const mockSaveProfileUids: string[] = [];

jest.mock(
    'hooks/useAdmin',
    () => ({
        useStudentAccess: () => mockAccess,
        useStudentAccessEvents: () => mockEvents,
        useImpersonateStudent: () => ({
            mutate: jest.fn(),
            reset: jest.fn(),
            isPending: false,
            isError: false,
            isSuccess: false,
        }),
        useProgramAllowances: () => ({
            mutate: jest.fn(),
            reset: jest.fn(),
            isPending: false,
            isError: false,
            isSuccess: false,
        }),
        useFactoryReset: () => ({
            mutate: jest.fn(),
            reset: jest.fn(),
            isPending: false,
            isError: false,
            isSuccess: false,
        }),
        useTrashAccount: () => ({
            mutate: jest.fn(),
            reset: jest.fn(),
            isPending: false,
            isError: false,
            isSuccess: false,
        }),
        useAdminHistory: () => mockHistory,
        useAdminAccounts: (...args: unknown[]) => {
            mockLookupCalls.push(args);
            return mockLookup;
        },
        useSaveStudentProfile: (uid: string) => {
            mockSaveProfileUids.push(uid);
            return mockSaveProfile;
        },
        useSaveStudentAccess: () => ({
            mutate: mockMutate,
            reset: jest.fn(),
            isPending: false,
            isError: false,
            isSuccess: false,
        }),
    }),
    { virtual: true },
);
jest.mock('libs/adminAccess', () => jest.requireActual('../adminAccess'), { virtual: true });
jest.mock('libs/adminHistory', () => jest.requireActual('../adminHistory'), { virtual: true });
jest.mock('libs/adminPanel', () => jest.requireActual('../adminPanel'), { virtual: true });
jest.mock('../../components/layouts/AdminActions/MercyMode', () => ({ MERCY_MODE_UIDS: [], MercyMode: () => null }));
// o formulário de verdade tem os próprios testes (profileForm.test.ts); aqui, o que ele recebe
jest.mock('../../components/_new/ProfileSettings', () => ({
    ProfileForm: ({ data, save }: any) =>
        jest
            .requireActual('react')
            .createElement(
                'form',
                { className: 'pf-stub', 'data-admin-save': String(save === mockSaveProfile) },
                `${data.user_uid} ${data.first_name} ${data.phone}`,
            ),
}));
jest.mock('libs/leitura', () => ({ isLeituraOwner: () => true }), { virtual: true });
jest.mock('config/firebase', () => ({ auth: { currentUser: { uid: 'dono' } } }), { virtual: true });
jest.mock(
    'next/link',
    () =>
        function Link({ href, className, children }: any) {
            return createElement('a', { href, className }, children);
        },
);
jest.mock('../../components/_new/NewPage', () => ({
    NewPage: ({ children }: any) => createElement('main', null, children),
}));

const row = (patch: Partial<AccessRow>): AccessRow => ({
    product: 'imerso',
    state: 'ativo',
    origin: 'compra',
    plan: null,
    validUntil: '2027-08-07',
    dateToConfirm: false,
    graceUntil: '2027-08-21',
    leituraSince: null,
    updatedAt: '2026-10-10T12:00:00Z',
    updatedBy: 'admin',
    ...patch,
});

const render = () => new JSDOM(renderToStaticMarkup(createElement(StudentDetail, { uid: 'aluno' }))).window.document;
const product = (d: Document, name: string) =>
    [...d.querySelectorAll('li.prod')].find((li) => li.querySelector('.lab b')?.textContent === name) as Element;
const pressed = (el: Element) => [...el.querySelectorAll('button[aria-pressed="true"]')].map((b) => b.textContent);

beforeEach(() => {
    mockMutate.mockClear();
    mockAccess = {
        isLoading: false,
        isError: false,
        data: {
            user: { uid: 'aluno', name: 'Aluna Teste', email: 'aluna@example.test', photoURL: null, disabled: null },
            data: [
                row({ product: 'imerso', origin: 'compra', dateToConfirm: true, validUntil: null, graceUntil: null }),
                row({ product: 'masterclass', state: 'none', origin: null, validUntil: null, updatedAt: null }),
                row({ product: 'ebook', state: 'leitura', origin: 'cortesia', validUntil: '2026-09-30' }),
            ],
        },
    };
    mockEvents = {
        isLoading: false,
        isError: false,
        data: [
            {
                id: 7,
                product: 'ebook',
                at: '2026-10-10T15:30:00Z',
                actor: 'rotina',
                actorName: null,
                reason: 'cortesia-fim',
                before: { state: 'ativo', origin: 'cortesia', valid_until: '2026-09-30' },
                after: { state: 'leitura', origin: 'cortesia', valid_until: '2026-09-30' },
            },
        ],
    };
    mockHistory = { data: undefined };
    mockLookup = { data: undefined };
    mockLookupCalls.length = 0;
});

test('aberta fora da página da lista (Início, saída da impersonação): o programa vem da busca pelo uid', () => {
    mockLookup = {
        data: {
            rows: [
                {
                    uid: 'outra',
                    program: { melpStatus: 'DEDA_PAUSED', lampWeek: 9, remainingPauses: 0, remainingResets: 0 },
                },
                {
                    uid: 'aluno',
                    program: { melpStatus: 'DEDA_STARTED', lampWeek: 3, remainingPauses: 1, remainingResets: 2 },
                },
            ],
        },
    };
    const d = render();
    expect(mockLookupCalls.at(-1)).toEqual([
        { q: 'aluno', todas: true, sort: { key: 'name', dir: 'asc' }, page: 1, pageSize: 25 },
        true,
    ]);
    expect(d.querySelector('section[aria-labelledby="as-program"]')?.textContent).toContain('Sem. 3');
});

test('cabeçalho: nome, e-mail, inicial no lugar da foto e "Sem login"', () => {
    const d = render();
    expect(d.querySelector('h1')?.textContent).toBe('Aluna Teste');
    expect(d.body.textContent).toContain('aluna@example.test');
    expect(d.querySelector('.av')?.textContent).toBe('A');
    expect(d.body.textContent).toContain('Sem login');
});

test('os três produtos na ordem, com Ativo/Leitura, selos e o prazo de cada origem', () => {
    const d = render();
    expect([...d.querySelectorAll('li.prod .lab b')].map((b) => b.textContent)).toEqual([
        'Imerso',
        'Masterclass',
        'E-book',
    ]);
    const imerso = product(d, 'Imerso');
    expect(pressed(imerso)).toEqual(['Ativo']);
    expect(imerso.textContent).toContain('data a confirmar');
    expect(imerso.querySelector('input[type="date"]')).not.toBeNull();
    // Imerso ativo com prazo: estender +1/+3/+6/+12
    expect([...imerso.querySelectorAll('[aria-label^="Estender"] button')].map((b) => b.textContent)).toEqual([
        '+1',
        '+3',
        '+6',
        '+12',
    ]);
    const mc = product(d, 'Masterclass');
    expect(mc.textContent).toContain('Sem acesso');
    expect(mc.textContent).toContain('Origem a confirmar');
    const ebook = product(d, 'E-book');
    expect(pressed(ebook)).toEqual(['Leitura']);
    expect(ebook.textContent).toContain('cortesia até 30/09/2026');
    // cortesia de E-book: sempre 1 mês
    expect([...ebook.querySelectorAll('[aria-label^="Conceder"] button')].map((b) => b.textContent)).toEqual(['1 mês']);
    // nada mudou: Salvar desligado nos três
    expect([...d.querySelectorAll('li.prod .btn.gold')].every((b) => b.hasAttribute('disabled'))).toBe(true);
});

test('registro: antes → depois, quando e quem', () => {
    const text = render().querySelector('.log')?.textContent ?? '';
    expect(text).toContain('E-book');
    expect(text).toContain('Ativo · Cortesia até 30/09/2026 → Leitura · Cortesia até 30/09/2026');
    expect(text).toContain('Rotina diária');
    expect(text).toContain('10/10/2026');
});

test('servidor ainda sem a rota (404 no gateway): uma linha calma e "Tentar de novo"', () => {
    mockAccess = { isLoading: false, isError: true, error: { response: { status: 404 } }, refetch: jest.fn() };
    mockEvents = { isLoading: false, isError: true };
    const d = render();
    expect(d.body.textContent).toContain('Acessos indisponíveis no momento.');
    expect(d.body.textContent).toContain('Tentar de novo');
    expect(d.body.textContent).toContain('Registro indisponível no momento.');
    expect(d.querySelector('li.prod')).toBeNull();
});

test('aluno que não existe: "Conta não encontrada."', () => {
    mockAccess = {
        isLoading: false,
        isError: true,
        error: { response: { status: 404, data: { code: 'USER_NOT_FOUND' } } },
        refetch: jest.fn(),
    };
    const d = render();
    expect(d.body.textContent).toContain('Conta não encontrada.');
    expect(d.body.textContent).not.toContain('Tentar de novo');
});

test('sem o `user` do servidor: nome e e-mail do retrato do histórico; a linha do tempo do programa aparece', () => {
    mockAccess.data.user = undefined;
    mockHistory = {
        data: {
            generatedAt: '2026-10-10T00:00:00Z',
            students: [
                {
                    uid: 'aluno',
                    name: 'Aluna do Retrato',
                    email: 'retrato@example.test',
                    status: 'DEDA_STARTED',
                    clock: 'calendar',
                    startedAt: '2026-06-01',
                    lampWeek: 18,
                    pausesUsed: 0,
                    pausesLeft: 3,
                    resetsUsed: 0,
                    resetsLeft: 3,
                    pausedSince: null,
                    lastPauseFrom: null,
                    lastPauseTo: null,
                    lastResetAt: null,
                    events: [{ kind: 'start', at: '2026-06-01', actor: 'student' }],
                },
            ],
        },
    };
    const d = render();
    expect(d.querySelector('h1')?.textContent).toBe('Aluna do Retrato');
    expect(d.body.textContent).toContain('retrato@example.test');
    expect(d.querySelector('#as-history')).not.toBeNull();
});

test('carência: o selo diz até quando ela vai (o prazo antigo fica no campo de data)', () => {
    mockAccess.data.data[0] = row({ product: 'imerso', validUntil: '2020-05-12', graceUntil: '2099-10-11' });
    expect(product(render(), 'Imerso').textContent).toContain('carência até 11/10/2099');
});

test('compras: a mais recente primeiro (sem data no fim), estornada com selo; o LTV no título', () => {
    mockAccess.data.purchases = [
        { date: '2025-04-22', product: 'imerso', plan: 'Anual', value: 997, channel: 'HeroSpark', refunded: false },
        { date: '2026-04-22', product: 'masterclass', plan: null, value: 497, channel: 'Guru', refunded: true },
        { date: null, product: 'ebook', plan: null, value: 47, channel: null, refunded: false },
    ];
    mockAccess.data.ltv = { total: 997, compras: 1 };
    const section = render().querySelector('section[aria-labelledby="as-buys"]')!;
    expect(section.querySelector('h2')?.textContent).toMatch(/^Compras LTV R\$\s997,00 · 1 compra$/);
    const items = [...section.querySelectorAll('li')].map((li) => li.textContent);
    expect(items[0]).toMatch(/^Masterclass22\/04\/2026 · GuruR\$\s497,00Estornada$/);
    expect(items[1]).toMatch(/^Imerso · Anual22\/04\/2025 · HeroSparkR\$\s997,00$/);
    // sem data: no fim
    expect(items[2]).toMatch(/^E-book—R\$\s47,00$/);
});

test('sem compras: uma linha calma; sem acesso carregado, nem compras nem dados', () => {
    mockAccess.data.purchases = [];
    expect(render().querySelector('section[aria-labelledby="as-buys"]')?.textContent).toContain(
        'Nenhuma compra registrada.',
    );
    mockAccess = { isLoading: true, isError: false };
    const d = render();
    expect(d.querySelector('section[aria-labelledby="as-buys"]')).toBeNull();
    expect(d.querySelector('section[aria-labelledby="as-data"]')).toBeNull();
});

test('dados: o formulário das Configurações com o perfil do aluno e a gravação do administrador', () => {
    mockSaveProfileUids.length = 0;
    mockAccess.data.profile = { first_name: 'Aluna', last_name: 'Teste', phone: '+5511912345678' };
    const form = render().querySelector('section[aria-labelledby="as-data"] .pf-stub')!;
    expect(form.textContent).toBe('aluno Aluna +5511912345678');
    expect(form.getAttribute('data-admin-save')).toBe('true');
    expect(mockSaveProfileUids).toEqual(['aluno']);
});
