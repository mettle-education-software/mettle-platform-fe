/** @jest-environment node */
// Painel de Contas v2 (cliques num DOM): o resumo de auditoria aplica filtros, os filtros moram no endereço, a lista
// (selos Ativo/Leitura, linha miúda, programa, último acesso, LTV), a conta abre ao lado, CSV e Lixeira só do dono.
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

const OWNER = 'RBgG61nNKdgHUKCkxhR4vhaBLGU2';
let mockUid = OWNER;
let mockSearch = '';
let mockList: any;
// o endereço é a fonte dos filtros: navegar troca o que useSearchParams devolve no próximo render
const mockNav = (url: string) => {
    mockSearch = url.split('?')[1] ?? '';
};
const mockPush = jest.fn(mockNav);
const mockReplace = jest.fn(mockNav);
const mockQueries: any[] = [];
const mockFetchAll = jest.fn();

jest.mock(
    'hooks/useAdmin',
    () => ({
        useAdminAccounts: (query: unknown) => {
            mockQueries.push(query);
            return mockList;
        },
        fetchAllAccounts: (...args: unknown[]) => mockFetchAll(...args),
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
        // um <select> de verdade: o valor escolhido volta com o tipo da opção
        Select: ({ value, onChange, options, placeholder, disabled, 'aria-label': label }: any) =>
            React.createElement(
                'select',
                {
                    'aria-label': label,
                    value: value ?? '',
                    disabled,
                    onChange: (event: any) =>
                        onChange(options.find((o: any) => String(o.value) === event.target.value)?.value),
                },
                React.createElement('option', { value: '' }, placeholder ?? ''),
                ...options.map((o: any) => React.createElement('option', { key: o.value, value: o.value }, o.label)),
            ),
    };
});
jest.mock('../../components/_new/AdminNav', () => ({ AdminNav: () => null, chipStyles: undefined }));
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

const none = {
    state: 'none' as const,
    origin: null,
    plan: null,
    validUntil: null,
    graceUntil: null,
    dateToConfirm: false,
};
const account = (patch: Partial<AccountRow>): AccountRow => ({
    uid: 'u1',
    name: 'Ana Souza',
    email: 'ana@x.test',
    phone: null,
    photoURL: null,
    team: false,
    access: {
        imerso: { ...none, state: 'ativo', origin: 'compra', plan: 'Anual', validUntil: '2027-04-22' },
        masterclass: { ...none, state: 'leitura', origin: 'parceiro' },
        ebook: none,
    },
    program: { melpStatus: 'DEDA_STARTED', lampWeek: 12, remainingPauses: 2, remainingResets: 3, level: 'boost' },
    lastAccess: '2026-10-09T12:00:00Z',
    hasLogin: true,
    loginRecriado: false,
    inTrash: false,
    ltv: { total: 1994, compras: 2, dias: 742 },
    overall: 85.37,
    dedaRun: 77,
    leaderboardPos: 12,
    status: 'ACTIVE',
    lastPurchase: '2026-04-22',
    ...patch,
});
const summary = {
    contas: 424,
    imerso: { ativo: 76, leitura: 146 },
    masterclass: { ativo: 45, leitura: 205 },
    ebook: { ativo: 18, leitura: 3 },
    semProduto: 1,
    lixeira: 2,
    arquivadas: 7,
};

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
const choose = (scope: Element, label: string, value: string) =>
    act(() => {
        const select = scope.querySelector(`select[aria-label="${label}"]`) as HTMLSelectElement;
        select.value = value;
        select.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    });
const lastUrl = () => mockReplace.mock.calls.at(-1)?.[0];
// digitar na busca (o valor pelo setter nativo, como o navegador) e esperar a pausa da digitação
const search = async (host: Element, value: string) => {
    const input = host.querySelector('input[placeholder^="Buscar"]') as HTMLInputElement;
    act(() => {
        Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value')!.set!.call(input, value);
        input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    });
    await act(async () => {
        await new Promise((done) => setTimeout(done, 350));
    });
    return input;
};

beforeEach(() => {
    mockUid = OWNER;
    mockSearch = '';
    mockPush.mockClear();
    mockReplace.mockClear();
    mockFetchAll.mockReset();
    mockQueries.length = 0;
    mockList = {
        isLoading: false,
        isError: false,
        data: {
            rows: [
                account({ team: true }),
                account({
                    uid: 'u2',
                    name: null,
                    email: 'b@x.test',
                    hasLogin: false,
                    lastAccess: null,
                    access: null,
                    program: null,
                    ltv: { total: 0, compras: 0 },
                }),
            ],
            total: 2,
            summary,
        },
        refetch: jest.fn(),
    };
});

test('a lista: conta com selo Equipe, Ativo/Leitura com a linha miúda, programa, último acesso e LTV', () => {
    const { host, root } = mount();
    expect([...host.querySelectorAll('th')].map((th) => th.textContent)).toEqual([
        'Conta',
        'Imerso (vencimento)',
        'Masterclass',
        'E-book',
        'Programa (em semanas)',
        'Nível',
        'Overall',
        'DEDA Run',
        'Leaderboard (posição geral)',
        'Último acesso',
        'LTV (valor)dias com acesso',
    ]);
    const [first, second] = [...host.querySelectorAll('tbody tr')];
    const cells = [...first.querySelectorAll('td')].map((td) => td.textContent);
    expect(cells[0]).toBe('Ana SouzaEquipeana@x.test');
    expect(cells[1]).toBe('AtivoAnual · até 22/04/2027');
    expect(cells[2]).toBe('LeituraParceiro');
    expect(cells[3]).toBe('—');
    // programa só com o número; nível como selo; métricas curtas; LTV em dinheiro e "compras · dias"
    expect(cells[4]).toBe('12');
    expect(cells[5]).toBe('Boost');
    expect(cells[6]).toBe('85,4%');
    expect(cells[7]).toBe('77');
    expect(cells[8]).toBe('12º');
    expect(cells[9]).toBe('09/10/2026');
    expect(cells[10]).toMatch(/^R\$\s1\.994,002 compras · 742 dias$/);
    // nunca "Total"; sem colunas de pausas e resets
    expect(host.textContent).not.toContain('Total');
    expect(host.textContent).not.toContain('Pausas');
    expect(second.textContent).toContain('sem login');
    expect(second.textContent).toContain('nunca entrou');
    click(first);
    expect(mockPush).toHaveBeenCalledWith('/admin/contas?conta=u1', { scroll: false });
    act(() => root.unmount());
});

test('resumo de auditoria: os números da base; cada um aplica o seu filtro (do zero, sem busca, mantendo a ordem)', async () => {
    mockSearch = 'origin=parceiro&sort=ltv&dir=desc';
    const { host, root, rerender } = mount();
    const audit = host.querySelector('[aria-label="Resumo das contas"]')!;
    const input = await search(host, 'ana');
    expect(mockQueries.at(-1)).toMatchObject({ origin: 'parceiro', q: 'ana' });
    // cada número diz de que produto é (leitor de tela)
    expect([...audit.querySelectorAll('button')].map((b) => b.getAttribute('aria-label'))).toContain(
        'Imerso Leitura 146',
    );
    expect(audit.textContent).toBe(
        '424 contasImersoAtivo 76/Leitura 146MasterclassAtivo 45/Leitura 205E-bookAtivo 18/Leitura 3Sem produto 1Lixeira 2',
    );
    click([...audit.querySelectorAll('button')].find((b) => b.textContent === 'Leitura 146')!);
    expect(lastUrl()).toBe('/admin/contas?product=imerso&state=leitura&sort=ltv&dir=desc');
    rerender();
    expect(mockQueries.at(-1)).toMatchObject({ product: 'imerso', state: 'leitura', todas: false, origin: undefined });
    // a busca sai junto: a lista é a do número
    expect(mockQueries.at(-1).q).toBeFalsy();
    expect(input.value).toBe('');
    expect(
        [...audit.querySelectorAll('button')]
            .find((b) => b.textContent === 'Leitura 146')!
            .getAttribute('aria-pressed'),
    ).toBe('true');
    click(button(audit, 'Sem produto 1')!);
    expect(lastUrl()).toBe('/admin/contas?situacao=semProduto&sort=ltv&dir=desc');
    click(button(audit, '424 contas')!);
    expect(lastUrl()).toBe('/admin/contas?sort=ltv&dir=desc');
    act(() => root.unmount());
    // outro administrador: sem a Lixeira no resumo
    mockUid = 'outro-admin';
    const other = mount();
    expect(other.host.textContent).not.toContain('Lixeira');
    act(() => other.root.unmount());
});

test('filtros no endereço: produto e estado, origem, situação, arquivadas, tamanho da página e limpar', () => {
    mockSearch = 'product=imerso&state=ativo&sort=expiry';
    const { host, root, rerender } = mount();
    expect(mockQueries.at(-1)).toMatchObject({
        product: 'imerso',
        state: 'ativo',
        sort: { key: 'expiry', dir: 'asc' },
        page: 1,
        pageSize: 25,
    });
    const states = host.querySelector('[aria-label="Estado no Imerso"]')!;
    expect(button(states, 'Ativo')!.getAttribute('aria-pressed')).toBe('true');
    // vencimento: a coluna do produto filtrado ordena
    expect(host.querySelector('th[aria-sort="ascending"]')?.textContent).toBe('Imerso (vencimento)');
    // a conta abre sem perder os filtros
    click(host.querySelector('tbody tr')!);
    expect(mockPush).toHaveBeenLastCalledWith('/admin/contas?product=imerso&state=ativo&sort=expiry&conta=u1', {
        scroll: false,
    });
    rerender();
    // estado: outro clique tira o filtro e mantém a conta aberta
    click(button(host.querySelector('[aria-label="Estado no Imerso"]')!, 'Ativo')!);
    expect(lastUrl()).toBe('/admin/contas?product=imerso&sort=expiry&conta=u1');
    rerender();
    choose(host, 'Origem', 'aconfirmar');
    rerender();
    choose(host, 'Situação', 'vence30');
    rerender();
    click(host.querySelector('.toggle input')!);
    rerender();
    choose(host, 'Contas por página', '100');
    expect(lastUrl()).toBe(
        '/admin/contas?product=imerso&origin=aconfirmar&situacao=vence30&scope=todas&sort=expiry&pageSize=100&conta=u1',
    );
    rerender();
    expect(mockQueries.at(-1)).toMatchObject({ origin: 'aconfirmar', situacao: 'vence30', todas: true, pageSize: 100 });
    expect(host.textContent).toContain('Incluir arquivadas');
    // limpar: como os números do resumo, a ordem e o tamanho da página ficam
    click(button(host, 'Limpar filtros')!);
    expect(lastUrl()).toBe('/admin/contas?sort=expiry&pageSize=100&conta=u1');
    act(() => root.unmount());
});

test('Lixeira só do dono: os filtros saem; o link de outra tela abre a lista da lixeira', () => {
    let { host, root, rerender } = mount();
    click(button(host.querySelector('[aria-label="Lixeira"]')!, 'Lixeira')!);
    expect(lastUrl()).toBe('/admin/contas?lixeira=1');
    rerender();
    expect(host.textContent).toContain('TRASH');
    expect(mockQueries.length).toBeGreaterThan(0);
    act(() => root.unmount());
    mockUid = 'outro-admin';
    mockSearch = 'lixeira=1';
    ({ host, root } = mount());
    expect(host.querySelector('[aria-label="Lixeira"]')).toBeNull();
    expect(host.textContent).not.toContain('TRASH');
    act(() => root.unmount());
});

test('Exportar CSV (só o dono): todas as páginas do filtro atual num arquivo', async () => {
    mockSearch = 'product=masterclass&situacao=nuncaEntrou';
    mockFetchAll.mockResolvedValue([account({})]);
    const blobs: Blob[] = [];
    const create = jest.spyOn(URL, 'createObjectURL').mockImplementation((blob: any) => {
        blobs.push(blob);
        return 'blob:csv';
    });
    const revoke = jest.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const clicks: string[] = [];
    const anchor = jest.spyOn(dom.window.HTMLAnchorElement.prototype, 'click').mockImplementation(function (
        this: HTMLAnchorElement,
    ) {
        clicks.push(this.download);
    });
    const { host, root } = mount();
    await act(async () => {
        button(host, 'Exportar CSV')!.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    });
    expect(mockFetchAll).toHaveBeenCalledWith(
        expect.objectContaining({ product: 'masterclass', situacao: 'nuncaEntrou' }),
    );
    expect(clicks).toEqual([expect.stringMatching(/^contas-\d{4}-\d{2}-\d{2}\.csv$/)]);
    const text = await blobs[0].text();
    expect(text.split('\r\n')).toHaveLength(2);
    expect(text).toContain('u1;Ana Souza;ana@x.test');
    act(() => root.unmount());
    // outro administrador: sem o botão
    mockUid = 'outro-admin';
    const other = mount();
    expect(button(other.host, 'Exportar CSV')).toBeUndefined();
    act(() => other.root.unmount());
    [create, revoke, anchor].forEach((spy) => spy.mockRestore());
});

test('conta aberta ao lado pelo endereço (?conta=)', () => {
    mockSearch = 'conta=u2';
    const { host, root } = mount();
    expect(host.querySelector('aside')?.textContent).toBe('DETAIL u2');
    act(() => root.unmount());
});

test('lista indisponível: uma linha calma com nova tentativa', () => {
    mockList = { isLoading: false, isError: true, data: undefined, refetch: jest.fn() };
    const { host, root } = mount();
    expect(host.textContent).toContain('Lista indisponível no momento.');
    click(button(host, 'Tentar de novo')!);
    expect(mockList.refetch).toHaveBeenCalled();
    act(() => root.unmount());
});

test('busca fora do endereço (dado de aluno não vai para a telemetria); telefone formatado vira dígitos', async () => {
    const { host, root } = mount();
    await search(host, 'Ana Souza');
    expect(mockQueries.at(-1).q).toBe('Ana Souza');
    await search(host, '(11) 91234-5678');
    expect(mockQueries.at(-1).q).toBe('11912345678');
    // nada da busca no endereço
    expect(mockReplace.mock.calls.concat(mockPush.mock.calls).some(([url]) => /[?&]q=/.test(url))).toBe(false);
    // com busca, nenhum número do resumo aparece marcado
    expect(host.querySelectorAll('.audit [aria-pressed="true"]')).toHaveLength(0);
    act(() => root.unmount());
});
