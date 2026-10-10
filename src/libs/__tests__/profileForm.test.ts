/** @jest-environment node */
// Campo do perfil com cliques de verdade (num DOM): valor novo do servidor não apaga o que o aluno está digitando.
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://plataforma.mettle.com.br/' });
Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement,
    Node: dom.window.Node,
    Event: dom.window.Event,
    IS_REACT_ACT_ENVIRONMENT: true,
});

let mockProfile: Record<string, string | null> = {};

jest.mock(
    'hooks/useProfile',
    () => ({
        useProfile: () => ({ data: mockProfile, isError: false }),
        useSaveProfile: () => ({ mutateAsync: jest.fn(), isPending: false }),
        useSaveProfilePhoto: () => ({ mutateAsync: jest.fn(), isPending: false }),
    }),
    { virtual: true },
);
jest.mock('libs/profile', () => jest.requireActual('../profile'), { virtual: true });
jest.mock('providers', () => ({ useAppContext: () => ({ user: { uid: 'aluno', name: 'Ana' } }) }), {
    virtual: true,
});
jest.mock('antd', () => {
    const React = jest.requireActual('react');
    return {
        Input: ({ id, value, onChange, disabled, type }: any) =>
            React.createElement('input', { id, value, onChange, disabled, type }),
        Button: ({ children, htmlType, disabled, onClick, style, ...rest }: any) =>
            React.createElement(
                'button',
                { type: htmlType ?? 'button', disabled, onClick, style, 'aria-label': rest['aria-label'] },
                children,
            ),
        Modal: () => null,
    };
});
jest.mock('../../components/_new/ThemeSwitch', () => ({ ThemeSwitch: () => null }));

const { act, createElement } = jest.requireActual('react');
const { createRoot } = jest.requireActual('react-dom/client');
const { ProfileSettings } = jest.requireActual('../../components/_new/ProfileSettings');

const type = (input: HTMLInputElement, value: string) =>
    act(() => {
        Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value')!.set!.call(input, value);
        input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    });

test('valor novo do servidor: o campo em edição fica como o aluno digitou; os outros acompanham', () => {
    mockProfile = { user_uid: 'aluno', first_name: 'Ana', last_name: 'Silva', username: 'ana.silva' };
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    act(() => root.render(createElement(ProfileSettings)));
    const first = host.querySelector('#profile-first_name') as HTMLInputElement;
    const save = host.querySelector('button[aria-label="Salvar Nome"]') as HTMLButtonElement;
    // sem mudança, o Salvar não aparece (o espaço fica)
    expect(save.style.visibility).toBe('hidden');
    type(first, 'Anabela');
    expect(save.style.visibility).toBe('');
    expect(save.disabled).toBe(false);
    // outra sessão muda nome e sobrenome
    mockProfile = { ...mockProfile, first_name: 'Ana Maria', last_name: 'Souza' };
    act(() => root.render(createElement(ProfileSettings)));
    expect((host.querySelector('#profile-first_name') as HTMLInputElement).value).toBe('Anabela');
    expect((host.querySelector('#profile-last_name') as HTMLInputElement).value).toBe('Souza');
    // @username vira minúsculas ao digitar
    const username = host.querySelector('#profile-username') as HTMLInputElement;
    type(username, 'Ana.Silva2');
    expect(username.value).toBe('ana.silva2');
    act(() => root.unmount());
});
