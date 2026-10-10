/** @jest-environment node */
// Perfil num formulário só (cliques de verdade, num DOM): um Salvar, só o que mudou num PATCH, erros embaixo de cada
// campo com o primeiro em foco, o que o servidor devolve volta aos campos e valor novo de fora não apaga a edição.
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
const mockSave = jest.fn();

jest.mock(
    'hooks/useProfile',
    () => ({
        useProfile: () => ({ data: mockProfile, isError: false }),
        useSaveProfile: () => ({ mutateAsync: mockSave, isPending: false }),
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
        Input: React.forwardRef(function Input(props: any, ref: any) {
            const { id, value, onChange, type, readOnly, placeholder, inputMode } = props;
            return React.createElement('input', {
                id,
                value,
                onChange,
                type,
                readOnly,
                placeholder,
                inputMode,
                ref,
                'aria-invalid': props['aria-invalid'],
                'aria-describedby': props['aria-describedby'],
            });
        }),
        Button: ({ children, onClick }: any) => React.createElement('button', { type: 'button', onClick }, children),
        Modal: () => null,
    };
});
jest.mock('../../components/_new/ThemeSwitch', () => ({ ThemeSwitch: () => null }));

const { act, createElement } = jest.requireActual('react');
const { createRoot } = jest.requireActual('react-dom/client');
const { ProfileSettings } = jest.requireActual('../../components/_new/ProfileSettings');

const BASE = {
    user_uid: 'aluno',
    first_name: 'Ana',
    last_name: 'Silva',
    username: 'ana.silva',
    instagram: null,
    birth_date: null,
    city: null,
    state: null,
    country: null,
    phone: '+5511912345678',
};

const mount = () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    act(() => root.render(createElement(ProfileSettings)));
    const field = (key: string) => host.querySelector(`#profile-${key}`) as HTMLInputElement;
    const salvar = () => [...host.querySelectorAll('button')].find((b) => /Salvar|Salvando/.test(b.textContent!))!;
    return { host, root, field, salvar, rerender: () => act(() => root.render(createElement(ProfileSettings))) };
};
const type = (input: HTMLInputElement, value: string) =>
    act(() => {
        Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value')!.set!.call(input, value);
        input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    });
const submit = async (host: HTMLElement) => {
    await act(async () => {
        host.querySelector('form')!.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
    });
};

beforeEach(() => {
    mockProfile = { ...BASE };
    mockSave.mockReset();
});

test('um formulário, um Salvar à vista: apagado sem mudança, aceso com mudança; telefone formatado', () => {
    const { host, root, field, salvar } = mount();
    expect(host.querySelectorAll('form')).toHaveLength(1);
    expect([...host.querySelectorAll('button')].filter((b) => b.textContent === 'Salvar')).toHaveLength(1);
    expect(salvar().disabled).toBe(true);
    // o número salvo (E.164) aparece no formato internacional; o mesmo número em outro formato não é mudança
    expect(field('phone').value).toBe('+55 11 91234 5678');
    type(field('phone'), '+55 (11) 91234-5678');
    expect(salvar().disabled).toBe(true);
    type(field('first_name'), 'Anabela');
    expect(salvar().disabled).toBe(false);
    act(() => root.unmount());
});

test('Salvar: só o que mudou num pedido; o que o servidor devolve volta aos campos; "Salvo"', async () => {
    mockSave.mockResolvedValue({ saved: { first_name: 'André', city: 'São Paulo', phone: '+447911123456' } });
    const { host, root, field, salvar } = mount();
    type(field('first_name'), 'andré');
    type(field('city'), 'são paulo');
    type(field('phone'), '+447911123456');
    expect(field('phone').value).toBe('+44 7911 123456');
    await submit(host);
    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(mockSave).toHaveBeenCalledWith({ first_name: 'andré', city: 'são paulo', phone: '+44 7911 123456' });
    expect(field('first_name').value).toBe('André');
    expect(field('city').value).toBe('São Paulo');
    expect(host.querySelector('[role="status"]')?.textContent).toBe('Salvo');
    // editar de novo tira o "Salvo"
    type(field('last_name'), 'Souza');
    expect(host.querySelector('[role="status"]')).toBeNull();
    expect(salvar().disabled).toBe(false);
    act(() => root.unmount());
});

test('inválidos: erro embaixo de cada campo, foco no primeiro, nada é enviado', async () => {
    const { host, root, field } = mount();
    type(field('username'), 'A');
    type(field('phone'), '123');
    await submit(host);
    expect(mockSave).not.toHaveBeenCalled();
    expect(field('username').value).toBe('a'); // minúsculas ao digitar
    expect(host.querySelector('#profile-username-error')?.textContent).toContain('3 a 20');
    expect(host.querySelector('#profile-phone-error')?.textContent).toContain('Telefone inválido');
    expect(field('phone').getAttribute('aria-describedby')).toBe('profile-phone-hint profile-phone-error');
    expect(document.activeElement).toBe(field('username'));
    act(() => root.unmount());
});

test('recusas do servidor: as do @username embaixo dele; o resto ao lado do botão', async () => {
    const taken = {
        response: { status: 409, data: { code: 'username_taken', message: 'Este username já está em uso.' } },
    };
    mockSave.mockRejectedValueOnce(taken);
    const { host, root, field } = mount();
    type(field('username'), 'ana.nova');
    await submit(host);
    expect(host.querySelector('#profile-username-error')?.textContent).toBe('Este username já está em uso.');
    expect(document.activeElement).toBe(field('username'));
    // sem a frase do servidor, a nossa
    mockSave.mockRejectedValueOnce({ response: { status: 409, data: { code: 'username_cooldown' } } });
    await submit(host);
    expect(host.querySelector('#profile-username-error')?.textContent).toBe(
        'O @username foi trocado há pouco. Tente mais tarde.',
    );
    mockSave.mockRejectedValueOnce({ response: { status: 500 } });
    await submit(host);
    expect(host.querySelector('#profile-username-error')).toBeNull();
    expect(host.querySelector('.profile-actions [role="alert"]')?.textContent).toBe(
        'Não foi possível salvar. Tente novamente.',
    );
    act(() => root.unmount());
});

test('valor novo de fora: o campo em edição fica como o aluno digitou; os outros acompanham', () => {
    const { root, field, rerender } = mount();
    type(field('first_name'), 'Anabela');
    mockProfile = { ...mockProfile, first_name: 'Ana Maria', last_name: 'Souza' };
    rerender();
    expect(field('first_name').value).toBe('Anabela');
    expect(field('last_name').value).toBe('Souza');
    act(() => root.unmount());
});

test('administrador (conta no Admin): o mesmo formulário, gravado por ele — só o que mudou, num pedido', async () => {
    const { ProfileForm } = jest.requireActual('../../components/_new/ProfileSettings');
    const adminSave = { mutateAsync: jest.fn().mockResolvedValue({ saved: { city: 'Recife' } }), isPending: false };
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    act(() => root.render(createElement(ProfileForm, { data: BASE, save: adminSave })));
    type(host.querySelector('#profile-city') as HTMLInputElement, 'Recife');
    await submit(host);
    expect(adminSave.mutateAsync).toHaveBeenCalledTimes(1);
    expect(adminSave.mutateAsync).toHaveBeenCalledWith({ city: 'Recife' });
    expect(mockSave).not.toHaveBeenCalled();
    expect(host.querySelector('[role="status"]')?.textContent).toBe('Salvo');
    act(() => root.unmount());
});
