/** @jest-environment node */
// Início do Admin (desenho do André): Base, No período (com o período no cabeçalho), Imerso e Atenção; as listas
// abrem a conta e os "ver todos" abrem o Contas filtrado; sem a rota, "—".
import { JSDOM } from 'jsdom';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NewAdminDashboard } from '../../components/_new/NewAdminDashboard';
import { readDashboard } from '../adminDashboard';

let mockData: any;
const mockRanges: unknown[] = [];
jest.mock(
    'hooks/useAdmin',
    () => ({
        useAdminDashboard: (range: unknown) => {
            mockRanges.push(range);
            return mockData;
        },
    }),
    { virtual: true },
);
jest.mock('hooks/useTheme', () => ({ useTheme: () => ({ resolved: 'dark' }) }), { virtual: true });
jest.mock('libs/adminAccess', () => jest.requireActual('../adminAccess'), { virtual: true });
jest.mock('libs/adminDashboard', () => jest.requireActual('../adminDashboard'), { virtual: true });
jest.mock('libs/adminPanel', () => jest.requireActual('../adminPanel'), { virtual: true });
jest.mock('themes/newDesign', () => ({ DARK: { '--r-gold': '#b78a5b' }, LIGHT: { '--r-gold': '#8a5f31' } }), {
    virtual: true,
});
jest.mock(
    'next/dynamic',
    () => () =>
        function Chart() {
            return createElement('div', { className: 'chart' });
        },
);
jest.mock(
    'next/link',
    () =>
        function Link({ href, children }: any) {
            return createElement('a', { href }, children);
        },
);
jest.mock('../../components/_new/AdminNav', () => ({ AdminNav: () => null, chipStyles: undefined }));
jest.mock('../../components/_new/lampCharts', () => ({ useSoftChart: () => (options: unknown) => options }));
jest.mock('../../components/_new/NewPage', () => ({
    NewPage: ({ children }: any) => createElement('main', null, children),
}));

// mesma resposta de libs/__tests__/adminDashboard.test.ts
const full = {
    base: {
        contas: { total: 5210, ativo: 1700, leitura: 400, semProduto: 3110 },
        imerso: { total: 1500, ativo: 1250, leitura: 250 },
        masterclass: { total: 300, ativo: 280, leitura: 20 },
        ebook: { total: 40, ativo: 39, leitura: 1 },
    },
    combinacoes: { imerso: 900, masterclass: 120, 'imerso+masterclass': 500 },
    periodo: {
        from: '2026-09-11',
        to: '2026-10-10',
        gravacoes: { total: 812, segundos: 7_384 },
        dedasConcluidos: 640,
        estudoAtivoMin: 12_345,
        estudoPassivoMin: 59,
        alunosEstudaram: 990,
        compras: { novas: 31, renovacoes: 12 },
    },
    estudoPorDia: [
        { date: '2026-10-09', alunos: 40 },
        { date: 'ontem', alunos: 3 },
    ],
    planosImerso: { mensal: 400, anual: 600, tresAnos: 100, vitalicio: 90, cortesia: 50, parceiro: 10, aConfirmar: 0 },
    tempoPrograma: [
        { min: null, max: null, alunos: 80 },
        { min: 1, max: 3, alunos: 300 },
        { min: 24, max: null, alunos: 120 },
        { min: 4, max: 6 },
    ],
    renovaramImerso: 77,
    vencendo: [
        { uid: 'u1', name: 'Ana', product: 'imerso', origin: 'compra', validUntil: '2026-10-20', inCarencia: false },
        { uid: 'u2', name: 'Bia', product: 'outro', origin: 'compra', validUntil: null },
    ],
    vencendoTotal: 64,
    vencendoPessoas: 41,
    semAcesso: [{ uid: 'u3', name: 'Caio', lastAccess: '2026-09-20T10:00:00Z', dias: 20, semana: 8 }],
    semAcessoTotal: 210,
    eventos: [
        {
            at: '2026-10-10T12:00:00Z',
            uid: 'u1',
            name: 'Ana',
            product: 'imerso',
            from: 'leitura',
            to: 'ativo',
            origin: 'cortesia',
            by: 'André',
        },
    ],
    usersCount: 999,
};

const render = () => new JSDOM(renderToStaticMarkup(createElement(NewAdminDashboard))).window.document;
const cards = (d: Document, section: string) =>
    [...d.querySelectorAll(`section[aria-labelledby="${section}"] .kp li`)].map((li) => li.textContent);

test('com os números: base, período, Imerso e atenção; listas abrem a conta; "ver todos" filtrados', () => {
    mockData = { isLoading: false, isPlaceholderData: false, data: readDashboard(full) };
    const d = render();
    expect(cards(d, 'db-base')).toEqual([
        'Contas na Plataforma5.210Ativos 1.700 · Leitura 400 · Sem produto 3.110',
        'Alunos Imerso1.500Ativos 1.250 · Leitura 250',
        'Masterclass300Ativos 280 · Leitura 20',
        'E-book40Ativos 39 · Leitura 1',
    ]);
    expect(cards(d, 'db-period')).toEqual([
        'Gravações8122h 3m',
        'DEDAs concluídos640',
        'Horas de Estudo Ativo205h 45m',
        'Horas de Estudo Passivo0h 59m',
    ]);
    // o período mora no cabeçalho do bloco que ele filtra; 30 dias por padrão
    const period = d.querySelector('section[aria-labelledby="db-period"] .sh')!;
    expect(period.querySelector('[aria-pressed="true"]')?.textContent).toBe('30 dias');
    expect(period.querySelectorAll('input[type="date"]')).toHaveLength(2);
    expect(mockRanges.at(-1)).toMatchObject({ from: expect.any(String), to: expect.any(String) });
    expect(d.body.textContent).toContain('990 alunos estudaram · Compras: 31 novas, 12 renovações');
    // Imerso: planos em barras finas, tempo de programa em gráfico, renovaram (de sempre)
    const imerso = d.querySelector('section[aria-labelledby="db-imerso"]')!;
    expect([...imerso.querySelectorAll('.bars li')].map((li) => li.textContent)).toEqual([
        'Mensal400',
        'Anual600',
        '3 anos100',
        'Vitalício90',
        'Cortesia50',
        'Parceiro10',
    ]);
    expect(imerso.querySelectorAll('.chart')).toHaveLength(1);
    expect(cards(d, 'db-imerso')).toEqual(['Renovaram o Imerso77']);
    // atenção: totais exatos do servidor, linhas abrem a conta
    const attention = d.querySelector('section[aria-labelledby="db-attention"]')!;
    // o total do servidor conta produtos (64) e a lista veio cortada: pessoas que vieram, com "+"
    // o total de pessoas do servidor
    expect(attention.textContent).toContain('Vencem em 30 dias · 41');
    // combinações: lista calma (só as que vieram)
    // Combinações fechadas de início: details sem "open", o cabeçalho é o summary (abre e fecha pelo teclado)
    const combos = d.querySelector('details.combos');
    expect(combos?.hasAttribute('open')).toBe(false);
    expect(combos?.querySelector('summary h3')?.textContent).toBe('Combinações');
    expect([...d.querySelectorAll('.combo-list li')].map((li) => li.textContent)).toEqual([
        'Só Imerso900',
        'Só Masterclass120',
        'Imerso + Masterclass500',
    ]);
    expect(attention.textContent).toContain('Sem acessar há 14+ dias · 210');
    const links = [...d.querySelectorAll('a')].map((a) => [a.textContent, a.getAttribute('href')]);
    // "ver todos": a mesma situação do painel, em todas as contas (os números batem)
    expect(links).toContainEqual(['ver todos', '/admin/contas?situacao=vence30&scope=todas']);
    expect(links).toContainEqual(['ver todos', '/admin/contas?situacao=semAcesso14&scope=todas&sort=lastAccess']);
    expect(links.filter(([, href]) => href === '/admin/contas?conta=u1')).toHaveLength(2);
    expect(d.body.textContent).toContain('Ana · Imerso: Leitura → Ativo');
    expect(d.body.textContent).not.toContain('ver registro');
});

test('resposta de hoje (be #158, sem os campos novos): "—" onde falta, listas seguem, sem o gráfico de 30 dias fixos', () => {
    mockData = {
        isLoading: false,
        isPlaceholderData: false,
        data: readDashboard({
            acessos: { imerso: { ativo: 1 } },
            estudo: { hoje: 1 },
            estudoPorDia: [{ date: '2026-10-09', alunos: 40 }],
            compras30d: 3,
            vencendo: full.vencendo,
            semAcesso: full.semAcesso,
            eventos: full.eventos,
        }),
    };
    const d = render();
    expect([...d.querySelectorAll('.kp b')].map((b) => b.textContent)).toEqual(Array(9).fill('—'));
    expect(d.querySelector('.chart')).toBeNull();
    const imerso = d.querySelector('section[aria-labelledby="db-imerso"]')!;
    expect(imerso.textContent).not.toContain('Sem planos ativos');
    expect(imerso.textContent).not.toContain('Sem dados');
    expect(d.body.textContent).toContain('Ana · Imerso: Leitura → Ativo');
    // sem o total do servidor, só o título
    expect(d.body.textContent).toContain('Vencem em 30 dias');
    expect(d.body.textContent).not.toContain('Vencem em 30 dias ·');
});

test('sem a rota nova (ou a antiga no mesmo endereço): "—" em tudo, nada inventado', () => {
    mockData = { isLoading: false, data: null };
    const d = render();
    expect([...d.querySelectorAll('.kp b')].map((b) => b.textContent)).toEqual(Array(9).fill('—'));
    expect(d.querySelector('.chart')).toBeNull();
    expect(d.body.textContent).not.toContain('alunos estudaram');
});

test('um dia só: sem curva (fica a linha do número); quem nunca entrou diz "nunca entrou"', () => {
    mockData = {
        isLoading: false,
        isPlaceholderData: false,
        data: readDashboard({
            ...full,
            estudoPorDia: [{ date: '2026-10-10', alunos: 2 }],
            semAcesso: [
                { uid: 'u9', name: 'Zé', lastAccess: null, dias: null, semana: null },
                // login recriado: entrou antes, o histórico se perdeu — "sem registro", não "nunca entrou"
                { uid: 'u10', name: 'Lia', lastAccess: null, dias: null, semana: null, loginRecriado: true },
            ],
            ltvMedio: { valor: 1363, dias: 742 },
        }),
    };
    const d = render();
    expect(d.querySelector('section[aria-labelledby="db-period"] .chart')).toBeNull();
    expect(d.body.textContent).toContain('990 alunos estudaram');
    const rows = [...d.querySelectorAll('ol.rows li')].map((li) => li.textContent ?? '');
    expect(rows.find((t) => t.startsWith('Zé'))).toContain('nunca entrou');
    expect(rows.find((t) => t.startsWith('Lia'))).toContain('sem registro');
    // LTV médio do Imerso: o dinheiro e os dias, uma linha no bloco do Imerso
    const imerso = d.querySelector('section[aria-labelledby="db-imerso"]')!;
    expect(imerso.textContent).toMatch(/LTV médio \(Imerso\): R\$\s1\.363,00 · 742 dias/);
});

test('vencem em carência: "carência até" o fim da carência, nunca a data antiga do produto', () => {
    const due = (uid: string, extra: object) => ({
        uid,
        name: uid,
        product: 'imerso',
        origin: 'compra',
        validUntil: '2024-05-12',
        inCarencia: true,
        ...extra,
    });
    mockData = {
        isLoading: false,
        isPlaceholderData: false,
        data: readDashboard({
            ...full,
            vencendo: [
                due('Bia', { graceUntil: '2026-10-11' }),
                // servidor sem o campo: só "carência"
                due('Cris', {}),
                due('Duda', { validUntil: '2026-10-20', inCarencia: false }),
                // carência e outro produto: as duas datas (a mais cedo manda na ordem); carimbo vira o dia
                due('Eva', { graceUntil: '2026-10-30T03:00:00.000Z' }),
                due('Eva', { product: 'masterclass', validUntil: '2026-10-12', inCarencia: false }),
            ],
        }),
    };
    const rows = [
        ...render().querySelectorAll('section[aria-labelledby="db-attention"] ol.rows')[0].querySelectorAll('li'),
    ];
    expect(rows.map((li) => li.textContent)).toEqual([
        'CrisImerso · carência',
        'BiaImerso · carência até 11/10/2026',
        'EvaImerso e Masterclass · 12/10/2026 · carência até 30/10/2026',
        'DudaImerso · 20/10/2026',
    ]);
});
