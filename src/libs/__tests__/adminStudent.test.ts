/** @jest-environment node */
// Página do aluno no Admin: cabeçalho, os três produtos (Total/Leitura, origem, prazo, selos), registro e histórico.
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

test('aberta fora da página da lista (Início, saída da impersonação): o programa vem da busca pelo e-mail', () => {
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
        { q: 'aluna@example.test', sort: { key: 'name', dir: 'asc' }, page: 1 },
        true,
    ]);
    expect(d.querySelector('section[aria-labelledby="as-program"]')?.textContent).toContain('Em andamento · sem. 3');
});

test('cabeçalho: nome, e-mail, inicial no lugar da foto e "Sem login"', () => {
    const d = render();
    expect(d.querySelector('h1')?.textContent).toBe('Aluna Teste');
    expect(d.body.textContent).toContain('aluna@example.test');
    expect(d.querySelector('.av')?.textContent).toBe('A');
    expect(d.body.textContent).toContain('Sem login');
});

test('os três produtos na ordem, com Total/Leitura, selos e o prazo de cada origem', () => {
    const d = render();
    expect([...d.querySelectorAll('li.prod .lab b')].map((b) => b.textContent)).toEqual([
        'Imerso',
        'Masterclass',
        'E-book',
    ]);
    const imerso = product(d, 'Imerso');
    expect(pressed(imerso)).toEqual(['Total']);
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
    expect(text).toContain('Total · Cortesia até 30/09/2026 → Leitura · Cortesia até 30/09/2026');
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
