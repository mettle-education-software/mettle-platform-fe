/** @jest-environment node */
// Foto do perfil (cliques num DOM): escolher abre o recorte redondo (arrastar, pinça/roda, setas); "Usar foto" grava a
// área escolhida (croppedAreaPixels) pelo recorte de 1024 px em JPEG; sem área ainda, o botão espera.
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://plataforma.mettle.com.br/' });
Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement,
    Node: dom.window.Node,
    Event: dom.window.Event,
    File: dom.window.File,
    IS_REACT_ACT_ENVIRONMENT: true,
});
Object.assign(URL, { createObjectURL: () => 'blob:foto', revokeObjectURL: () => undefined });

const mockUpload = jest.fn();
const mockCrop = jest.fn();
let mockCropper: any;

jest.mock(
    'hooks/useProfile',
    () => ({
        useProfile: () => ({ data: { user_uid: 'aluno', first_name: 'Ana' }, isError: false }),
        useSaveProfile: () => ({ mutateAsync: jest.fn(), isPending: false }),
        useSaveProfilePhoto: () => ({ mutateAsync: mockUpload, isPending: false }),
    }),
    { virtual: true },
);
jest.mock(
    'libs/profile',
    () => ({ ...jest.requireActual('../profile'), cropProfileImage: (...args: unknown[]) => mockCrop(...args) }),
    { virtual: true },
);
jest.mock('providers', () => ({ useAppContext: () => ({ user: { uid: 'aluno', name: 'Ana' } }) }), {
    virtual: true,
});
jest.mock('react-easy-crop', () => ({
    __esModule: true,
    default: (props: any) => {
        mockCropper = props;
        return null;
    },
}));
jest.mock('antd', () => {
    const React = jest.requireActual('react');
    return {
        Input: React.forwardRef(function Input(props: any, ref: any) {
            return React.createElement('input', { id: props.id, value: props.value, onChange: props.onChange, ref });
        }),
        Button: ({ children, onClick }: any) => React.createElement('button', { type: 'button', onClick }, children),
        Modal: ({ open, children, okText, onOk, okButtonProps }: any) =>
            open
                ? React.createElement(
                      'div',
                      { role: 'dialog' },
                      children,
                      React.createElement(
                          'button',
                          { type: 'button', onClick: onOk, disabled: okButtonProps?.disabled },
                          okText,
                      ),
                  )
                : null,
    };
});
jest.mock('../../components/_new/ThemeSwitch', () => ({ ThemeSwitch: () => null }));

const { act, createElement } = jest.requireActual('react');
const { createRoot } = jest.requireActual('react-dom/client');
const { ProfileSettings } = jest.requireActual('../../components/_new/ProfileSettings');

test('recorte redondo com arrastar e teclado; "Usar foto" grava a área escolhida', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    act(() => root.render(createElement(ProfileSettings)));
    const picker = host.querySelector('input[type="file"]') as HTMLInputElement;
    const photo = new File(['x'], 'foto.png', { type: 'image/png' });
    act(() => {
        Object.defineProperty(picker, 'files', { value: [photo], configurable: true });
        picker.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    });
    expect(host.querySelector('[role="dialog"]')).not.toBeNull();
    expect(mockCropper).toMatchObject({ image: 'blob:foto', aspect: 1, cropShape: 'round', minZoom: 1, maxZoom: 3 });
    expect(mockCropper.keyboardStep).toBeGreaterThan(1);
    const usar = [...host.querySelectorAll('button')].find((b) => b.textContent === 'Usar foto') as HTMLButtonElement;
    // antes da área calculada, o botão espera
    expect(usar.disabled).toBe(true);
    // arrastar e o zoom (pinça, roda ou a barra) chegam pelo recorte
    act(() => {
        mockCropper.onCropChange({ x: 12, y: -4 });
        mockCropper.onZoomChange(1.8);
    });
    expect(mockCropper.crop).toEqual({ x: 12, y: -4 });
    expect((host.querySelector('#profile-photo-zoom') as HTMLInputElement).value).toBe('1.8');
    const area = { x: 220, y: 140, width: 900, height: 900 };
    act(() => mockCropper.onCropComplete({ x: 0, y: 0, width: 50, height: 50 }, area));
    const cropped = new File(['y'], 'profile.jpg', { type: 'image/jpeg' });
    mockCrop.mockResolvedValue(cropped);
    mockUpload.mockResolvedValue({ photoURL: 'nova' });
    expect(usar.disabled).toBe(false);
    await act(async () => {
        usar.click();
    });
    expect(mockCrop).toHaveBeenCalledWith('blob:foto', area);
    expect(mockUpload).toHaveBeenCalledWith(cropped);
    expect(host.querySelector('[role="dialog"]')).toBeNull();
    act(() => root.unmount());
});
