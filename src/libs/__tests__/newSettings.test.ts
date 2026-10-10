/** @jest-environment node */
import { JSDOM } from 'jsdom';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NewSettings } from '../../components/_new/NewSettings';
import { resolveAccess, type AccessLevels, type MyAccessResponse } from '../productAccess';

let mockUser: { uid: string; name: string; email: string; roles?: string[] } | undefined;
let mockAccess: MyAccessResponse | undefined;
let mockLevels: AccessLevels | undefined;
let mockAccessLoading = false;
let mockMutating = 0;
let mockSummary: any;
const mockReset = { mutateAsync: jest.fn(), isPending: false };
const mockPause = { mutateAsync: jest.fn(), isPending: false };
const mockPassword = { mutate: jest.fn(), isPending: false };
const mockConfirm = jest.fn();
const mockSummaryHook = jest.fn((_uid?: string) => mockSummary);
const mockButtons = new Map<string, any>();

jest.mock(
    'hooks',
    () => ({
        useMelpSummary: (uid?: string) => mockSummaryHook(uid),
        useResetMelp: () => mockReset,
        usePauseDeda: () => mockPause,
        useUpdatePassword: () => mockPassword,
    }),
    { virtual: true },
);
jest.mock(
    'providers',
    () => ({
        useAppContext: () => ({ user: mockUser }),
        useProductAccess: () => ({
            access: (product: string) => resolveAccess(product, mockUser?.roles, mockAccess, mockLevels),
            accessLoading: mockAccessLoading,
        }),
    }),
    { virtual: true },
);
jest.mock(
    'hooks/queries/useCourses',
    () => ({
        useCachedCourses: () => ({
            data: {
                courseCollection: {
                    items: [{ courseSlug: 'masterclass-as-7-regras', coursePurchaseId: 'MASTERCLASS_TEST' }],
                },
            },
        }),
    }),
    { virtual: true },
);
jest.mock('libs', () => ({ passwordRules: [] }), { virtual: true });
jest.mock('libs/ebook', () => ({ EBOOK_PRODUCT: 'EBOOK_GUIA_COMPLETO' }), { virtual: true });
jest.mock('libs/masterclass', () => ({ MASTERCLASS_COURSE: 'masterclass-as-7-regras' }), { virtual: true });
jest.mock('libs/productAccess', () => jest.requireActual('../productAccess'), { virtual: true });
jest.mock('libs/programHistory', () => jest.requireActual('../programHistory'), { virtual: true });
jest.mock('themes/newDesign', () => ({ ICON: {} }), { virtual: true });
jest.mock('@tanstack/react-query', () => ({ useIsMutating: () => mockMutating }));
jest.mock('../../components/_new/NewPage', () => ({
    NewPage: ({ children }: any) => createElement('main', null, children),
}));
jest.mock('../../components/_new/ThemeSwitch', () => ({ ThemeSwitch: () => createElement('button', null, 'Tema') }));
jest.mock('antd', () => {
    const actual = jest.requireActual('antd');
    return {
        ...actual,
        Button: (props: any) => {
            mockButtons.set(props.children, props);
            return createElement(actual.Button, props);
        },
        Modal: { ...actual.Modal, useModal: () => [{ confirm: mockConfirm }, null] },
    };
});

const render = () => new JSDOM(renderToStaticMarkup(createElement(NewSettings))).window.document;
const action = (label: string) => mockButtons.get(label);

beforeEach(() => {
    jest.clearAllMocks();
    mockButtons.clear();
    mockUser = { uid: 'test', name: 'Aluno de Teste', email: 'aluno@example.test', roles: ['METTLE_STUDENT'] };
    mockAccess = undefined;
    mockLevels = undefined;
    mockAccessLoading = false;
    mockMutating = 0;
    mockReset.isPending = false;
    mockPause.isPending = false;
    mockReset.mutateAsync.mockResolvedValue(undefined);
    mockPause.mutateAsync.mockResolvedValue(undefined);
    mockSummary = {
        data: {
            melp_status: 'DEDA_STARTED',
            remaining_resets: 2,
            remaining_pauses: 3,
            program_events: [{ id: '1', kind: 'start', at: '2026-10-01T12:00:00Z', actor: 'student' }],
        },
        isLoading: false,
        isError: false,
        isPaused: false,
        refetch: jest.fn(),
    };
});

test('uma página com as quatro seções na ordem, perfil só leitura, senha e histórico juntos', () => {
    const doc = render();
    expect([...doc.querySelectorAll('h2')].map((h) => h.textContent)).toEqual(['Perfil', 'Conta', 'Senha', 'IMERSO']);
    expect(doc.querySelector('[role="tablist"]')).toBeNull();
    expect(doc.querySelector('section[aria-labelledby="settings-profile"] input')).toBeNull();
    expect(doc.body.textContent).toContain('Aluno de Teste');
    expect(doc.body.textContent).toContain('aluno@example.test');
    expect(doc.body.textContent).toContain('Telefone');
    expect(doc.body.textContent).toContain('Histórico do programa');
    expect(doc.body.textContent).not.toContain('Ajuda');
    expect(doc.querySelectorAll('input[type="password"]')).toHaveLength(2);
});

test('aluno sem Imerso não vê a seção nem consulta o resumo', () => {
    mockUser!.roles = ['MASTERCLASS_TEST', 'EBOOK_GUIA_COMPLETO'];
    const doc = render();
    expect(doc.querySelector('#settings-imerso')).toBeNull();
    expect(mockSummaryHook).not.toHaveBeenCalled();
    const account = doc.querySelector('section[aria-labelledby="settings-account"]')!;
    expect(account.textContent).toContain('Masterclass');
    expect(account.textContent).toContain('E-book');
    expect(account.textContent).not.toContain('Imerso');
});

test.each([undefined, []])('conta com roles %p não quebra', (roles) => {
    mockUser!.roles = roles;
    const doc = render();
    expect(doc.querySelector('#settings-imerso')).toBeNull();
    expect(doc.body.textContent).toContain('Nenhum produto disponível.');
    expect(doc.querySelector('#settings-password')).not.toBeNull();
});

test('contexto ainda sem usuário não quebra', () => {
    mockUser = undefined;
    expect(render().querySelector('#settings-imerso')).toBeNull();
});

test('Conta respeita o acesso já consultado, inclusive carência e expiração', () => {
    mockAccess = {
        imerso: null,
        products: {
            METTLE_STUDENT: { state: 'expired' },
            MASTERCLASS_TEST: { state: 'grace' },
            EBOOK_GUIA_COMPLETO: { state: 'active' },
        },
    };
    const text = render().querySelector('section[aria-labelledby="settings-account"]')!.textContent;
    expect(text).toContain('ImersoLeitura');
    expect(text).toContain('MasterclassEm carência');
    expect(text).toContain('E-bookAtivo');
});

test('Imerso em leitura (claims): sem reiniciar nem pausar; o histórico e a Conta continuam', () => {
    mockLevels = { imerso: 'leitura', masterclass: 'none', ebook: 'ativo' };
    const doc = render();
    expect(action('Reiniciar')).toBeUndefined();
    expect(action('Pausar')).toBeUndefined();
    expect(doc.body.textContent).not.toContain('Reinícios restantes');
    expect(doc.body.textContent).toContain('Histórico do programa');
    const text = doc.querySelector('section[aria-labelledby="settings-account"]')!.textContent;
    expect(text).toContain('ImersoLeitura');
    expect(text).not.toContain('Masterclass');
    expect(text).toContain('E-bookAtivo');
});

test('Conta em carregamento não anuncia ausência de produtos', () => {
    mockAccessLoading = true;
    const text = render().querySelector('section[aria-labelledby="settings-account"]')!.textContent;
    expect(text).toContain('Carregando');
    expect(text).not.toContain('Nenhum produto');
});

test.each([403, 404])('conta sem programa (%s) preserva Perfil, Conta e Senha', (status) => {
    mockSummary = { ...mockSummary, data: undefined, isError: true, error: { response: { status } } };
    const doc = render();
    expect(doc.body.textContent).toContain('Programa IMERSO indisponível nesta conta.');
    expect(doc.querySelectorAll('h2')).toHaveLength(4);
    expect(action('Reiniciar')).toBeUndefined();
});

test('programa carregando não apresenta ausência nem ações', () => {
    mockSummary = { ...mockSummary, data: undefined, isLoading: true };
    const doc = render();
    expect(doc.querySelector('[role="status"]')?.textContent).toContain('Carregando');
    expect(doc.body.textContent).not.toContain('indisponível');
    expect(action('Reiniciar')).toBeUndefined();
});

test.each([{ isError: true }, { isPaused: true }])('falha/sem conexão oferece nova tentativa: %p', (state) => {
    mockSummary = { ...mockSummary, ...state, data: undefined };
    expect(render().body.textContent).toContain('Não foi possível carregar');
    action('Tentar de novo').onClick();
    expect(mockSummary.refetch).toHaveBeenCalledTimes(1);
});

test.each(['global', 'reset', 'pause', 'stale'])('trava pausa e reset durante %s', (state) => {
    mockMutating = state === 'global' ? 1 : 0;
    mockReset.isPending = state === 'reset';
    mockPause.isPending = state === 'pause';
    mockSummary.isError = state === 'stale';
    render();
    expect(action('Reiniciar').disabled).toBe(true);
    expect(action('Pausar').disabled).toBe(true);
    if (state === 'stale') expect(action('Tentar de novo')).toBeDefined();
});

test.each(['Reiniciar', 'Pausar'])('%s só executa após confirmação e absorve rejeição da mutação', async (label) => {
    render();
    const mutation = label === 'Reiniciar' ? mockReset : mockPause;
    action(label).onClick();
    expect(mutation.mutateAsync).not.toHaveBeenCalled();
    const config = mockConfirm.mock.calls[0][0];
    expect(config.content).toContain('Tem certeza');
    mutation.mutateAsync.mockRejectedValueOnce(new Error('offline'));
    await expect(config.onOk()).resolves.toBeUndefined();
    expect(mutation.mutateAsync).toHaveBeenCalledTimes(1);
});

test('DEDA pausado mantém reset e histórico, sem oferecer pausa de novo', () => {
    mockSummary.data.melp_status = 'DEDA_PAUSED';
    expect(render().body.textContent).toContain('Histórico do programa');
    expect(action('Reiniciar')).toBeDefined();
    expect(action('Pausar')).toBeUndefined();
});
