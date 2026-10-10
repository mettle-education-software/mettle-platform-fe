/** @jest-environment node */
// Início do Admin: os seis números, as listas que abrem a conta e os "ver todos" filtrados; sem a rota, vazio.
import { JSDOM } from 'jsdom';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NewAdminDashboard } from '../../components/_new/NewAdminDashboard';
import { readDashboard } from '../adminDashboard';

let mockData: any;
jest.mock('hooks/useAdmin', () => ({ useAdminDashboard: () => mockData }), { virtual: true });
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
jest.mock('../../components/_new/AdminNav', () => ({ AdminNav: () => null }));
jest.mock('../../components/_new/lampCharts', () => ({ useSoftChart: () => (options: unknown) => options }));
jest.mock('../../components/_new/NewPage', () => ({
    NewPage: ({ children }: any) => createElement('main', null, children),
}));

const render = () => new JSDOM(renderToStaticMarkup(createElement(NewAdminDashboard))).window.document;

test('com os números: seis cartões, gráfico, listas que abrem a conta e "ver todos" filtrados', () => {
    mockData = {
        isLoading: false,
        data: readDashboard({
            acessos: {
                imerso: { ativo: 120, leitura: 30, carencia: 4, aConfirmar: 7 },
                masterclass: { ativo: 200, leitura: 5 },
                ebook: { ativo: 12, leitura: 1 },
                lixeira: 0,
            },
            estudo: { hoje: 41, d7: 88, d30: 101, base: 120, pausados: 6 },
            estudoPorDia: [{ date: '2026-10-09', alunos: 40 }],
            compras30d: 9,
            vencendo: [
                {
                    uid: 'u1',
                    name: 'Ana',
                    product: 'imerso',
                    origin: 'compra',
                    validUntil: '2026-10-20',
                    inCarencia: true,
                },
            ],
            semAcesso: [{ uid: 'u3', name: 'Caio', lastAccess: null, dias: 20, semana: 8 }],
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
        }),
    };
    const d = render();
    const cards = [...d.querySelectorAll('.kp li')].map((li) => li.textContent);
    expect(cards).toEqual([
        'Imerso ativo120leitura 30',
        'Estudaram hoje4188 em 7 dias, de 120',
        'Vencem em 30 dias1em carência 4',
        'Sem acessar 14+ dias1',
        'Compras 30 dias9',
        'Masterclass / E-book ativos200 / 12',
    ]);
    expect(d.querySelector('.chart')).not.toBeNull();
    const links = [...d.querySelectorAll('a')].map((a) => [a.textContent, a.getAttribute('href')]);
    expect(links).toContainEqual(['ver todos', '/admin/contas?product=imerso&state=ativo&sort=expiry']);
    expect(links).toContainEqual(['ver todos', '/admin/contas?sort=lastAccess']);
    expect(links.filter(([, href]) => href === '/admin/contas?conta=u1')).toHaveLength(2);
    expect(d.body.textContent).toContain('Ana · Imerso: Leitura → Total');
    expect(d.body.textContent).not.toContain('ver registro');
});

test('listas no teto do servidor (50 linhas): o número diz "50+"', () => {
    const row = { uid: 'u', name: 'X', lastAccess: null, dias: 20, semana: 1 };
    mockData = {
        isLoading: false,
        data: readDashboard({
            acessos: { imerso: { ativo: 1 } },
            estudo: { hoje: 1 },
            semAcesso: Array.from({ length: 50 }, (_, i) => ({ ...row, uid: `u${i}` })),
        }),
    };
    const d = render();
    const cards = [...d.querySelectorAll('.kp li')].map((li) => li.textContent);
    expect(cards).toContain('Sem acessar 14+ dias50+');
    expect(cards).toContain('Imerso ativo1leitura —');
    expect(cards).toContain('Compras 30 dias—');
    // a lista mostra só 10
    expect(d.querySelectorAll('section[aria-labelledby="db-idle"] li')).toHaveLength(10);
});

test('sem a rota nova (ou a antiga no mesmo endereço): rótulos com "—", nada inventado', () => {
    mockData = { isLoading: false, data: null };
    const d = render();
    expect([...d.querySelectorAll('.kp b')].map((b) => b.textContent)).toEqual(['—', '—', '—', '—', '—', '—']);
    expect(d.body.textContent).toContain('Sem dados no momento.');
    expect(d.querySelector('.chart')).toBeNull();
});
