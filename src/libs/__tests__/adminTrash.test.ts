/** @jest-environment node */
// Lixeira: a página (só o dono) e a exclusão na página do aluno (confirmação pelo e-mail, só o dono).
import { JSDOM } from 'jsdom';
import type { AccessRow, TrashEntry } from '../adminAccess';

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
let mockTrash: any;
const mockRestore = jest.fn();
const mockTrashCalls: string[] = [];
let mockTrashDone: (() => void) | undefined;

jest.mock(
    'hooks/useAdmin',
    () => {
        const React = jest.requireActual('react');
        return {
            useTrash: () => mockTrash,
            useRestoreAccount: () => ({ mutate: mockRestore, isPending: false, isError: false }),
            useStudentAccess: () => ({
                isLoading: false,
                isError: false,
                data: {
                    user: { uid: 'aluno', name: 'Aluna', email: 'Aluna@Example.test', photoURL: null, disabled: false },
                    data: [] as AccessRow[],
                },
            }),
            useStudentAccessEvents: () => ({ isLoading: false, isError: false, data: [] }),
            useAdminHistory: () => ({ data: undefined }),
            useSaveStudentAccess: () => ({ isPending: false, isError: false, isSuccess: false, reset: jest.fn() }),
            useTrashAccount: () => {
                const [state, setState] = React.useState({ isPending: false, isSuccess: false, data: undefined });
                return {
                    ...state,
                    isError: false,
                    reset: () => setState({ isPending: false, isSuccess: false, data: undefined }),
                    mutate: (email: string) => {
                        mockTrashCalls.push(email);
                        setState({ isPending: true, isSuccess: false, data: undefined });
                        mockTrashDone = () =>
                            setState({
                                isPending: false,
                                isSuccess: true,
                                data: { purgeAfter: '2026-11-09T15:00:00Z' } as any,
                            });
                    },
                };
            },
        };
    },
    { virtual: true },
);
jest.mock('libs/adminAccess', () => jest.requireActual('../adminAccess'), { virtual: true });
jest.mock('libs/adminHistory', () => jest.requireActual('../adminHistory'), { virtual: true });
jest.mock('libs/leitura', () => ({ isLeituraOwner: () => false }), { virtual: true });
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
jest.mock(
    'next/link',
    () =>
        function Link({ href, children }: any) {
            return jest.requireActual('react').createElement('a', { href }, children);
        },
);
jest.mock('antd', () => ({ Select: () => null }));
jest.mock('../../components/_new/NewPage', () => ({
    NewPage: ({ children }: any) => jest.requireActual('react').createElement('main', null, children),
}));
jest.mock('../../components/_new/PageHead', () => ({
    PageHead: ({ title }: any) => jest.requireActual('react').createElement('h1', null, title),
}));

const { act, createElement } = jest.requireActual('react');
const { createRoot } = jest.requireActual('react-dom/client');
const { emailMatches, isTrashOwner, trashName, brInstantDay } = jest.requireActual('../adminAccess');

const mount = (component: string, props = {}) => {
    const Component = jest.requireActual(`../../components/_new/${component}`)[component];
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    act(() => root.render(createElement(Component, props)));
    return { host, root };
};
const button = (scope: Element, text: string) =>
    [...scope.querySelectorAll('button')].find((b) => b.textContent === text) as HTMLButtonElement | undefined;
const click = (el: HTMLElement) =>
    act(() => {
        el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    });
const type = (input: HTMLInputElement, value: string) =>
    act(() => {
        Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value')!.set!.call(input, value);
        input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    });

const entry = (patch: Partial<TrashEntry> = {}): TrashEntry => ({
    userUid: 'aluno',
    email: 'aluna@example.test',
    firstName: 'Aluna',
    lastName: 'Teste',
    priorStatus: 'ACTIVE',
    trashedAt: '2026-10-10T15:00:00Z',
    purgeAfter: '2026-11-09T15:00:00Z',
    trashedBy: 'dono',
    ...patch,
});

beforeEach(() => {
    mockUid = 'RBgG61nNKdgHUKCkxhR4vhaBLGU2';
    mockTrash = { isLoading: false, isError: false, data: [entry()] };
    mockRestore.mockClear();
    mockTrashCalls.length = 0;
    mockTrashDone = undefined;
});

describe('regras', () => {
    it('só o dono; e-mail confere sem maiúsculas nem espaços', () => {
        expect(isTrashOwner('RBgG61nNKdgHUKCkxhR4vhaBLGU2')).toBe(true);
        expect(isTrashOwner('outro-admin')).toBe(false);
        expect(isTrashOwner(undefined)).toBe(false);
        expect(emailMatches('  ALUNA@example.test ', 'aluna@Example.test')).toBe(true);
        expect(emailMatches('aluna@example.tes', 'aluna@example.test')).toBe(false);
        expect(emailMatches('x', null)).toBe(false);
        expect(trashName(entry())).toBe('Aluna Teste');
        expect(trashName(entry({ firstName: null, lastName: null }))).toBe('aluna@example.test');
        expect(brInstantDay('2026-11-09T15:00:00Z')).toBe('09/11/2026');
    });
});

describe('/admin/lixeira', () => {
    it('lista com a data da exclusão definitiva e o Restaurar', () => {
        const { host, root } = mount('NewAdminTrash');
        expect(host.textContent).toContain('Aluna Teste');
        expect(host.textContent).toContain('aluna@example.test');
        expect(host.textContent).toContain('Exclusão definitiva em 09/11/2026');
        expect(host.querySelector('a')?.getAttribute('href')).toBe('/admin/aluno/aluno');
        click(button(host, 'Restaurar')!);
        expect(mockRestore).toHaveBeenCalledWith('aluno');
        act(() => root.unmount());
    });

    it('vazia e indisponível (404 até o gateway publicar): uma linha calma', () => {
        mockTrash = { isLoading: false, isError: false, data: [] };
        let { host, root } = mount('NewAdminTrash');
        expect(host.textContent).toContain('Lixeira vazia.');
        act(() => root.unmount());
        mockTrash = { isLoading: false, isError: true, refetch: jest.fn() };
        ({ host, root } = mount('NewAdminTrash'));
        expect(host.textContent).toContain('Lixeira indisponível no momento.');
        act(() => root.unmount());
    });
});

describe('Excluir conta permanentemente (página do aluno)', () => {
    it('só o dono vê', () => {
        mockUid = 'outro-admin';
        const { host, root } = mount('NewAdminStudent', { uid: 'aluno' });
        expect(button(host, 'Excluir conta permanentemente')).toBeUndefined();
        act(() => root.unmount());
    });

    it('confirma digitando o e-mail; depois, "vai para a lixeira por 30 dias"', () => {
        const { host, root } = mount('NewAdminStudent', { uid: 'aluno' });
        click(button(host, 'Excluir conta permanentemente')!);
        const input = host.querySelector('form.del input') as HTMLInputElement;
        expect(button(host, 'Excluir')!.disabled).toBe(true);
        type(input, 'aluna@example.tes');
        expect(button(host, 'Excluir')!.disabled).toBe(true);
        type(input, ' aluna@example.test ');
        expect(button(host, 'Excluir')!.disabled).toBe(false);
        click(button(host, 'Excluir')!);
        expect(mockTrashCalls).toEqual(['aluna@example.test']);
        act(() => mockTrashDone!());
        expect(host.textContent).toContain(
            'A conta vai para a lixeira por 30 dias (exclusão definitiva em 09/11/2026).',
        );
        act(() => root.unmount());
    });
});
