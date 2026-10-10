/** @jest-environment node */
// Painel de Contas (cliques num DOM): a lista, os selos, a conta abre ao lado e a Lixeira só para o dono.
import { JSDOM } from 'jsdom';
import type { AccountRow } from '../adminPanel';

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

let mockUid = 'RBgG61nNKdgHUKCkxhR4vhaBLGU2';
let mockSearch = '';
let mockList: any;
// o endereço é a fonte dos filtros: navegar troca o que useSearchParams devolve no próximo render
const mockNav = (url: string) => {
    mockSearch = url.split('?')[1] ?? '';
};
const mockPush = jest.fn(mockNav);
const mockReplace = jest.fn(mockNav);
const mockQueries: unknown[] = [];

jest.mock(
    'hooks/useAdmin',
    () => ({
        useAdminAccounts: (query: unknown) => {
            mockQueries.push(query);
            return mockList;
        },
    }),
    { virtual: true },
);
jest.mock('hooks', () => ({ useDeviceSize: () => 'desktop' }), { virtual: true });
jest.mock('libs/adminAccess', () => jest.requireActual('../adminAccess'), { virtual: true });
jest.mock('libs/adminPanel', () => jest.requireActual('../adminPanel'), { virtual: true });
jest.mock(
    'config/firebase',
    () => ({
        auth: {
            get currentUser() {
                return { uid: mockUid };
            },
        },
    }),
    { virtual: true },
);
jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush, replace: mockReplace }),
    useSearchParams: () => new URLSearchParams(mockSearch),
}));
jest.mock('themes/newDesign', () => ({ ICON: {}, UI_FONT_CLASS: '', UI_FONT_VAR: {} }), { virtual: true });
jest.mock('antd', () => {
    const React = jest.requireActual('react');
    return {
        Drawer: ({ open, children }: any) => (open ? React.createElement('aside', null, children) : null),
        Input: ({ value, onChange, disabled, placeholder }: any) =>
            React.createElement('input', { value, onChange, disabled, placeholder }),
    };
});
jest.mock('../../components/_new/AdminNav', () => ({ AdminNav: () => null }));
jest.mock('../../components/_new/NewAdminStudent', () => ({
    StudentDetail: ({ uid }: any) => jest.requireActual('react').createElement('p', null, `DETAIL ${uid}`),
}));
jest.mock('../../components/_new/NewAdminTrash', () => ({
    TrashList: () => jest.requireActual('react').createElement('p', null, 'TRASH'),
}));
jest.mock('../../components/_new/NewPage', () => ({
    NewPage: ({ children }: any) => jest.requireActual('react').createElement('main', null, children),
}));

const { act, createElement } = jest.requireActual('react');
const { createRoot } = jest.requireActual('react-dom/client');
const { NewAdminContas } = jest.requireActual('../../components/_new/NewAdminContas');

const account = (patch: Partial<AccountRow>): AccountRow => ({
    uid: 'u1',
    name: 'Ana Souza',
    email: 'ana@x.test',
    photoURL: null,
    access: {
        imerso: { state: 'ativo', origin: 'compra', validUntil: null, dateToConfirm: true },
        masterclass: { state: 'leitura', origin: 'cortesia', validUntil: '2026-09-30', dateToConfirm: false },
        ebook: { state: 'none', origin: null, validUntil: null, dateToConfirm: false },
    },
    program: { melpStatus: 'DEDA_STARTED', lampWeek: 12, remainingPauses: 2, remainingResets: 3 },
    lastAccess: '2026-10-09T12:00:00Z',
    hasLogin: true,
    inTrash: false,
    ...patch,
});

const mount = () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    act(() => root.render(createElement(NewAdminContas)));
    return { host, root, rerender: () => act(() => root.render(createElement(NewAdminContas))) };
};
const button = (scope: Element, text: string) =>
    [...scope.querySelectorAll('button')].find((b) => b.textContent === text) as HTMLButtonElement | undefined;
const click = (el: Element) =>
    act(() => {
        el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    });

beforeEach(() => {
    mockUid = 'RBgG61nNKdgHUKCkxhR4vhaBLGU2';
    mockSearch = '';
    mockPush.mockClear();
    mockReplace.mockClear();
    mockQueries.length = 0;
    mockList = {
        isLoading: false,
        isError: false,
        data: {
            rows: [account({}), account({ uid: 'u2', name: null, email: 'b@x.test', hasLogin: false })],
            total: 2,
            snapshot: false,
        },
        refetch: jest.fn(),
    };
});

test('a lista: nome e e-mail, os três selos, último acesso, programa e o que resta; a linha abre a conta', () => {
    const { host, root } = mount();
    const first = host.querySelector('tbody tr')!;
    expect(first.textContent).toContain('Ana Souza');
    expect([...first.querySelectorAll('.pill')].map((p) => p.textContent)).toEqual(['Total', 'Leitura']);
    expect(first.textContent).toContain('09/10/2026');
    expect(first.textContent).toContain('Em andamento · sem. 12');
    expect(host.querySelectorAll('tbody tr')[1].textContent).toContain('sem login');
    click(first);
    expect(mockPush).toHaveBeenCalledWith('/admin/contas?conta=u1', { scroll: false });
    act(() => root.unmount());
});

test('filtros no endereço: o Início abre já filtrado, a conta abre sem perder os filtros; Lixeira só do dono', () => {
    mockSearch = 'product=imerso&state=ativo&sort=expiry';
    let { host, root, rerender } = mount();
    expect(mockQueries.at(-1)).toMatchObject({
        product: 'imerso',
        state: 'ativo',
        sort: { key: 'expiry', dir: 'asc' },
    });
    expect(button(host, 'Total')!.getAttribute('aria-pressed')).toBe('true');
    // ordem por vencimento: a data numa coluna
    expect([...host.querySelectorAll('th')].map((th) => th.textContent)).toContain('Vence');
    click(host.querySelector('tbody tr')!);
    expect(mockPush).toHaveBeenLastCalledWith('/admin/contas?product=imerso&state=ativo&sort=expiry&conta=u1', {
        scroll: false,
    });
    // estado: outro clique tira o filtro e mantém a conta aberta
    rerender();
    click(button(host, 'Total')!);
    expect(mockReplace).toHaveBeenLastCalledWith('/admin/contas?product=imerso&sort=expiry&conta=u1', {
        scroll: false,
    });
    // Lixeira (dono): os filtros saem; o link "Lixeira" de outra tela também abre a lista da lixeira
    click(button(host, 'Lixeira')!);
    rerender();
    expect(host.textContent).toContain('TRASH');
    act(() => root.unmount());
    mockSearch = '';
    ({ host, root, rerender } = mount());
    expect(host.textContent).not.toContain('TRASH');
    mockNav('/admin/contas?lixeira=1');
    rerender();
    expect(host.textContent).toContain('TRASH');
    act(() => root.unmount());
    mockUid = 'outro-admin';
    mockSearch = 'lixeira=1';
    ({ host, root } = mount());
    expect(button(host, 'Lixeira')).toBeUndefined();
    expect(host.textContent).not.toContain('TRASH');
    act(() => root.unmount());
});

test('retrato da noite (rota nova ainda fora): produto e estado não valem e não aparecem marcados', () => {
    mockSearch = 'product=imerso&state=ativo';
    mockList.data.snapshot = true;
    const { host, root } = mount();
    expect(button(host, 'Todos')!.getAttribute('aria-pressed')).toBe('true');
    expect(button(host, 'Imerso')!.getAttribute('aria-pressed')).toBe('false');
    expect(button(host, 'Total')).toBeUndefined();
    expect(host.textContent).toContain('Retrato da noite');
    act(() => root.unmount());
});

test('conta aberta ao lado pelo endereço (?conta=)', () => {
    mockSearch = 'conta=u2';
    const { host, root } = mount();
    expect(host.querySelector('aside')?.textContent).toBe('DETAIL u2');
    act(() => root.unmount());
});

test('servidor ainda sem a rota e sem o retrato: uma linha calma', () => {
    mockList = { isLoading: false, isError: true, data: undefined, refetch: jest.fn() };
    const { host, root } = mount();
    expect(host.textContent).toContain('Lista indisponível no momento.');
    act(() => root.unmount());
});
