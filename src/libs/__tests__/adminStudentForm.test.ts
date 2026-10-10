/** @jest-environment node */
// Formulário de um produto na página do aluno (cliques de verdade, num DOM): nada de pedido em dobro enquanto grava,
// e o rascunho recomeça da linha do servidor depois de gravar.
import { JSDOM } from 'jsdom';
import type { AccessRow } from '../adminAccess';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://plataforma.mettle.com.br/' });
Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement,
    Node: dom.window.Node,
    Event: dom.window.Event,
    MouseEvent: dom.window.MouseEvent,
    IS_REACT_ACT_ENVIRONMENT: true,
});

const mockCalls: unknown[] = [];
const mockAllowances: unknown[] = [];
let mockFinish: (() => void) | undefined;
let mockRows: AccessRow[] = [];

jest.mock(
    'hooks/useAdmin',
    () => {
        const React = jest.requireActual('react');
        return {
            useStudentAccess: () => ({ isLoading: false, isError: false, data: { data: mockRows } }),
            useStudentAccessEvents: () => ({ isLoading: false, isError: false, data: [] }),
            useImpersonateStudent: () => ({
                mutate: jest.fn(),
                reset: jest.fn(),
                isPending: false,
                isError: false,
                isSuccess: false,
            }),
            useProgramAllowances: () => ({
                mutate: (body: unknown) => mockAllowances.push(body),
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
            useAdminHistory: () => ({ data: undefined }),
            useAdminAccounts: () => ({ data: undefined }),
            useTrashAccount: () => ({ isSuccess: false, isPending: false, isError: false, reset: jest.fn() }),
            useSaveStudentAccess: () => {
                const [state, setState] = React.useState({ isPending: false, isSuccess: false });
                return {
                    ...state,
                    isError: false,
                    data: undefined,
                    reset: () => setState({ isPending: false, isSuccess: false }),
                    mutate: (body: unknown, options?: { onSuccess?: () => void }) => {
                        mockCalls.push(body);
                        setState({ isPending: true, isSuccess: false });
                        mockFinish = () => {
                            setState({ isPending: false, isSuccess: true });
                            options?.onSuccess?.();
                        };
                    },
                };
            },
        };
    },
    { virtual: true },
);
jest.mock('libs/adminAccess', () => jest.requireActual('../adminAccess'), { virtual: true });
jest.mock('libs/adminHistory', () => jest.requireActual('../adminHistory'), { virtual: true });
jest.mock('libs/adminPanel', () => jest.requireActual('../adminPanel'), { virtual: true });
jest.mock('../../components/layouts/AdminActions/MercyMode', () => ({ MERCY_MODE_UIDS: [], MercyMode: () => null }));
jest.mock('../../components/_new/ProfileSettings', () => ({ ProfileForm: () => null }));
jest.mock('libs/leitura', () => ({ isLeituraOwner: () => false }), { virtual: true });
jest.mock('config/firebase', () => ({ auth: { currentUser: { uid: 'admin' } } }), { virtual: true });
jest.mock(
    'next/link',
    () =>
        function Link({ href, children }: any) {
            return jest.requireActual('react').createElement('a', { href }, children);
        },
);
jest.mock('antd', () => ({
    Select: function Select({ value, options, disabled, onChange, ...rest }: any) {
        return jest.requireActual('react').createElement(
            'select',
            {
                value: value ?? '',
                disabled,
                'aria-label': rest['aria-label'],
                onChange: (e: any) => onChange(e.target.value),
            },
            [{ value: '', label: '' }, ...options].map((o: any) =>
                jest.requireActual('react').createElement('option', { key: o.value, value: o.value }, o.label),
            ),
        );
    },
}));
jest.mock('../../components/_new/NewPage', () => ({
    NewPage: ({ children }: any) => jest.requireActual('react').createElement('main', null, children),
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

const { act, createElement } = jest.requireActual('react');
const { createRoot } = jest.requireActual('react-dom/client');

const mount = () => {
    const { StudentDetail: NewAdminStudent } = jest.requireActual('../../components/_new/NewAdminStudent');
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    act(() => root.render(createElement(NewAdminStudent, { uid: 'aluno' })));
    return { host, root };
};
const imerso = (host: HTMLElement) =>
    [...host.querySelectorAll('li.prod')].find((li) => li.querySelector('.lab b')?.textContent === 'Imerso')!;
const button = (scope: Element, text: string) =>
    [...scope.querySelectorAll('button')].find((b) => b.textContent === text) as HTMLButtonElement;
const click = (el: HTMLElement) =>
    act(() => {
        el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    });

beforeEach(() => {
    mockCalls.length = 0;
    mockFinish = undefined;
    mockRows = [
        row({}),
        row({ product: 'masterclass', state: 'none', origin: null, validUntil: null, graceUntil: null }),
        row({ product: 'ebook', state: 'none', origin: null, validUntil: null, graceUntil: null }),
    ];
});

test('estender +6 grava uma vez; gravando, nada muda nem grava de novo', () => {
    const { host, root } = mount();
    const li = imerso(host);
    // sem mudança, o Salvar não aparece
    expect(button(li, 'Salvar')).toBeUndefined();
    click(button(li, '+6'));
    expect(button(li, 'Salvar').disabled).toBe(false);
    click(button(li, 'Salvar'));
    expect(mockCalls).toEqual([{ state: 'ativo', origin: 'compra', extendMonths: 6 }]);
    // gravando: os controles ficam parados (sem segundo pedido, sem apagar o retorno)
    expect(button(li, 'Leitura').disabled).toBe(true);
    expect(button(li, '+12').disabled).toBe(true);
    click(button(li, 'Leitura'));
    click(button(li, 'Salvando…'));
    expect(mockCalls).toHaveLength(1);
    // resposta: o rascunho recomeça da linha do servidor (relida) e o "Salvo." aparece
    mockRows = [row({ validUntil: '2028-02-07', graceUntil: '2028-02-21', updatedAt: '2026-10-10T13:00:00Z' })];
    act(() => mockFinish!());
    act(() =>
        root.render(
            createElement(jest.requireActual('../../components/_new/NewAdminStudent').StudentDetail, {
                uid: 'aluno',
            }),
        ),
    );
    const after = imerso(host);
    expect(after.textContent).toContain('Salvo.');
    expect(button(after, 'Salvar')).toBeUndefined();
    expect([...after.querySelectorAll('[aria-pressed="true"]')].map((b) => b.textContent)).toEqual(['Ativo']);
    act(() => root.unmount());
});

test('Leitura → Ativo com prazo vencido: não grava até escolher um prazo novo', () => {
    mockRows = [row({ state: 'leitura', origin: 'cortesia', validUntil: '2026-01-31', graceUntil: null })];
    const { host, root } = mount();
    const li = imerso(host);
    click(button(li, 'Ativo'));
    expect(li.textContent).toContain('Prazo vencido: escolha um prazo novo.');
    expect(button(li, 'Salvar').disabled).toBe(true);
    click(button(li, '+3'));
    expect(button(li, 'Salvar').disabled).toBe(false);
    click(button(li, 'Salvar'));
    expect(mockCalls).toEqual([{ state: 'ativo', origin: 'cortesia', grantMonths: 3 }]);
    act(() => root.unmount());
});

test('sem acesso: nada marcado; escolher a origem já concede (Ativo) e grava', () => {
    const { host, root } = mount();
    const ebook = [...host.querySelectorAll('li.prod')].find(
        (li) => li.querySelector('.lab b')?.textContent === 'E-book',
    )!;
    expect(ebook.querySelectorAll('[aria-pressed="true"]')).toHaveLength(0);
    expect(button(ebook, 'Salvar')).toBeUndefined();
    const select = ebook.querySelector('select') as HTMLSelectElement;
    act(() => {
        select.value = 'parceiro';
        select.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    });
    expect([...ebook.querySelectorAll('[aria-pressed="true"]')].map((b) => b.textContent)).toEqual(['Ativo']);
    expect(ebook.textContent).toContain('Sem prazo');
    click(button(ebook, 'Salvar'));
    expect(mockCalls).toEqual([{ state: 'ativo', origin: 'parceiro' }]);
    act(() => root.unmount());
});

test('programa: +2 pausas grava na hora com addPauses; o que resta vem da linha da lista', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    const { StudentDetail } = jest.requireActual('../../components/_new/NewAdminStudent');
    act(() =>
        root.render(
            createElement(StudentDetail, {
                uid: 'aluno',
                account: {
                    uid: 'aluno',
                    name: 'Ana',
                    email: 'ana@x.test',
                    photoURL: null,
                    access: null,
                    program: { melpStatus: 'DEDA_STARTED', lampWeek: 3, remainingPauses: 1, remainingResets: 0 },
                    lastAccess: null,
                    hasLogin: true,
                    inTrash: false,
                },
            }),
        ),
    );
    const program = host.querySelector('section[aria-labelledby="as-program"]')!;
    expect(program.textContent).toContain('Programa Sem. 3');
    expect(program.textContent).toContain('Restam 1');
    click(program.querySelector('button[aria-label="Dar 2 pausas a mais"]') as HTMLElement);
    expect(mockAllowances).toEqual([{ addPauses: 2 }]);
    // não é o dono: sem reset de fábrica nem exclusão
    expect(host.textContent).not.toContain('Reset de fábrica');
    expect(host.textContent).not.toContain('Excluir conta permanentemente');
    act(() => root.unmount());
});
