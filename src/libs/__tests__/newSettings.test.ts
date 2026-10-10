/** @jest-environment node */
// Configurações (desenho "Apple ID", 10-Out-2026): cabeçalho da conta, Meus produtos (só do modelo de acesso, nunca do
// catálogo), Programa Imerso, Dados pessoais (um Salvar), Acesso e segurança (senha num modal) e Aparência.
import { JSDOM } from 'jsdom';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NewSettings } from '../../components/_new/NewSettings';
import { resolveAccess, type AccessLevels } from '../productAccess';

let mockUser: { uid: string; name: string; email: string; roles?: string[] } | undefined;
let mockLevels: AccessLevels | undefined;
let mockMutating = 0;
let mockSummary: any;
let mockProfile: any;
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
            access: (product: string) => resolveAccess(product, mockUser?.roles, undefined, mockLevels),
            accessLoading: false,
        }),
    }),
    { virtual: true },
);
jest.mock(
    'hooks/useProfile',
    () => ({
        useProfile: () => mockProfile,
        useSaveProfile: () => ({ mutateAsync: jest.fn(), isPending: false }),
        useSaveProfilePhoto: () => ({ mutateAsync: jest.fn(), isPending: false }),
    }),
    { virtual: true },
);
jest.mock('libs/profile', () => jest.requireActual('../profile'), { virtual: true });
jest.mock('libs/myProducts', () => jest.requireActual('../myProducts'), { virtual: true });
jest.mock('libs', () => ({ passwordRules: [], saoPauloWeekday: () => 3 }), { virtual: true });
jest.mock('libs/productAccess', () => jest.requireActual('../productAccess'), { virtual: true });
jest.mock('libs/programHistory', () => jest.requireActual('../programHistory'), { virtual: true });
jest.mock('themes/newDesign', () => ({ ICON: {} }), { virtual: true });
jest.mock('@tanstack/react-query', () => ({ useIsMutating: () => mockMutating }));
jest.mock('../../components/_new/NewPage', () => ({
    NewPage: ({ children }: any) => createElement('main', null, children),
}));
jest.mock('../../components/_new/ThemeSwitch', () => ({ ThemeSwitch: () => createElement('span', null, 'Tema') }));
jest.mock('antd', () => {
    const actual = jest.requireActual('antd');
    return {
        ...actual,
        Button: (props: any) => {
            mockButtons.set(props.children, props);
            return createElement(actual.Button, props);
        },
        Modal: Object.assign((props: any) => createElement(actual.Modal, props), {
            ...actual.Modal,
            useModal: () => [{ confirm: mockConfirm }, null],
        }),
    };
});

const render = () => new JSDOM(renderToStaticMarkup(createElement(NewSettings))).window.document;
const action = (label: string) => mockButtons.get(label);
const section = (doc: Document, id: string) => doc.querySelector(`section[aria-labelledby="${id}"]`)!;
const rows = (doc: Document) =>
    [...section(doc, 'settings-products').querySelectorAll('li')].map((li) => li.textContent);
const inDays = (days: number) => {
    const d = new Date(Date.now() + days * 86_400_000);
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(d);
};

beforeEach(() => {
    jest.clearAllMocks();
    mockButtons.clear();
    mockUser = { uid: 'test', name: 'Aluno de Teste', email: 'aluno@example.test', roles: ['METTLE_STUDENT'] };
    mockLevels = undefined;
    mockMutating = 0;
    mockReset.isPending = false;
    mockPause.isPending = false;
    mockReset.mutateAsync.mockResolvedValue(undefined);
    mockPause.mutateAsync.mockResolvedValue(undefined);
    mockProfile = {
        data: {
            user_uid: 'test',
            first_name: 'Aluno',
            last_name: 'de Teste',
            username: 'aluno.teste',
            email: 'aluno@example.test',
            phone: '+5511999999999',
            accessDetails: [
                { product: 'imerso', state: 'ativo', origin: 'compra', plan: 'Anual', validUntil: '2030-03-12' },
                { product: 'masterclass', state: 'ativo', origin: 'compra', plan: 'Mensal', validUntil: inDays(20) },
                { product: 'ebook', state: 'none' },
            ],
        },
        isError: false,
        refetch: jest.fn(),
    };
    mockSummary = {
        data: {
            melp_status: 'DEDA_STARTED',
            current_deda_week: 12,
            deda_first_monday: '2026-07-20',
            remaining_resets: 2,
            remaining_pauses: 3,
            program_events: [{ id: '1', kind: 'start', at: '2026-07-20T12:00:00Z', actor: 'student' }],
        },
        isLoading: false,
        isError: false,
        isPaused: false,
        refetch: jest.fn(),
    };
});

test('página na ordem: conta, Meus produtos, Programa Imerso, Dados pessoais, Acesso e segurança, Aparência', () => {
    const doc = render();
    expect(doc.querySelector('h1')?.textContent).toBe('Configurações');
    expect([...doc.querySelectorAll('h2')].map((h) => h.textContent)).toEqual([
        'Meus produtos',
        'Programa Imerso',
        'Dados pessoais',
        'Acesso e segurança',
        'Aparência',
    ]);
    // cabeçalho: a foto é o botão (selo da câmera), o nome e "@username · e-mail"
    expect(doc.querySelector('.idh-av')?.getAttribute('aria-label')).toBe('Trocar foto');
    expect(doc.querySelector('.idh-name')?.textContent).toBe('Aluno de Teste');
    expect(doc.querySelector('.idh-sub')?.textContent).toBe('@aluno.teste · aluno@example.test');
    // um formulário, um Salvar na página inteira; WhatsApp no lugar de Telefone; rótulos acima dos campos
    expect(doc.querySelectorAll('form')).toHaveLength(1);
    expect([...doc.querySelectorAll('button')].filter((b) => b.textContent === 'Salvar')).toHaveLength(1);
    expect(doc.querySelector('label[for="profile-phone"]')?.textContent).toBe('WhatsApp');
    expect(doc.querySelector('#profile-first_name')?.getAttribute('value')).toBe('Aluno');
    // senha num modal (fechado): o botão "Alterar senha"; e-mail só para ler, "E-mail da compra"
    const security = section(doc, 'settings-security');
    expect(security.textContent).toContain('aluno@example.test');
    expect(security.textContent).toContain('E-mail da compra');
    expect([...security.querySelectorAll('button')].map((b) => b.textContent)).toEqual(['Alterar senha']);
    expect(doc.querySelectorAll('input[type="password"]')).toHaveLength(0);
    expect(section(doc, 'settings-appearance').textContent).toContain('Tema');
});

test('Meus produtos só do modelo de acesso: a Masterclass aparece sem catálogo; prazo perto avisa', () => {
    const doc = render();
    const list = rows(doc);
    expect(list).toHaveLength(2);
    expect(list[0]).toBe('Programa ImersoPlano anualVálido até 12 de março de 2030Ativo');
    expect(list[1]).toContain('Masterclass');
    expect(list[1]).toContain('Plano mensal');
    expect(list[1]).toContain(' · faltam 20 dias');
});

test('Leitura e carência: a frase de cada caso e o Renovar', () => {
    mockProfile.data.accessDetails = [
        { product: 'imerso', state: 'leitura', origin: 'cortesia', validUntil: '2026-09-30' },
        {
            product: 'masterclass',
            state: 'ativo',
            origin: 'compra',
            plan: 'Anual',
            validUntil: inDays(-3),
            graceUntil: inDays(11),
        },
    ];
    const doc = render();
    const [leitura, carencia] = rows(doc);
    expect(leitura).toContain('Acesso encerrado em 30 de setembro de 2026. Você ainda pode navegar.');
    expect(leitura).toContain('Leitura');
    expect(carencia).toContain('Seu plano venceu em');
    expect(carencia).toContain('Acesso total até');
    const renew = [...section(doc, 'settings-products').querySelectorAll('a')].map((a) => a.textContent);
    expect(renew).toEqual(['Renovar', 'Renovar']);
});

test('sem produto: uma linha calma; perfil ainda carregando: Carregando', () => {
    mockProfile.data.accessDetails = [{ product: 'imerso', state: 'none' }];
    expect(section(render(), 'settings-products').textContent).toContain('Nenhum produto nesta conta.');
    mockProfile = { data: undefined, isError: false, refetch: jest.fn() };
    expect(section(render(), 'settings-products').textContent).toContain('Carregando');
});

test('Programa Imerso: semana e início; pausar antes de reiniciar; histórico', () => {
    const doc = render();
    const program = section(doc, 'settings-imerso');
    expect(program.textContent).toContain('Semana 12 · Dia 3');
    expect(program.textContent).toContain('Início em 20 de julho de 2026');
    expect(program.textContent!.indexOf('Pausar a LAMP')).toBeLessThan(
        program.textContent!.indexOf('Reiniciar a LAMP'),
    );
    expect(program.textContent).toContain('Pausas restantes: 3');
    expect(program.textContent).toContain('Reinícios restantes: 2');
    expect(program.textContent).toContain('Histórico do programa');
});

test('aluno sem Imerso não vê o programa nem consulta o resumo', () => {
    mockUser!.roles = ['MASTERCLASS_TEST'];
    const doc = render();
    expect(doc.querySelector('#settings-imerso')).toBeNull();
    expect(mockSummaryHook).not.toHaveBeenCalled();
});

test('contexto ainda sem usuário não quebra', () => {
    mockUser = undefined;
    expect(render().querySelector('#settings-imerso')).toBeNull();
});

test('Imerso em leitura (claims): sem reiniciar nem pausar; o histórico continua', () => {
    mockLevels = { imerso: 'leitura', masterclass: 'none', ebook: 'ativo' };
    const doc = render();
    expect(action('Reiniciar')).toBeUndefined();
    expect(action('Pausar')).toBeUndefined();
    expect(doc.body.textContent).toContain('Histórico do programa');
});

test.each([403, 404])('conta sem programa (%s): uma linha, o resto da página fica', (status) => {
    mockSummary = { ...mockSummary, data: undefined, isError: true, error: { response: { status } } };
    const doc = render();
    expect(doc.body.textContent).toContain('Programa IMERSO indisponível nesta conta.');
    expect(doc.querySelectorAll('h2')).toHaveLength(5);
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
    expect(renderToStaticMarkup(config.content)).toContain(
        label === 'Reiniciar' ? 'A sua LAMP é zerada' : 'A LAMP para de contar',
    );
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
