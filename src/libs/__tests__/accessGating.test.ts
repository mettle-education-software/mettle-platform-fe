/** @jest-environment node */
// Leitura (modelo novo, claims `access`) na plataforma nova: cards da home, home do IMERSO e o aviso de renovação.
import { JSDOM } from 'jsdom';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NewHome } from '../../components/_new/NewHome';
import { NewImersoHome } from '../../components/_new/NewImersoHome';
import { AccessCtaBlock } from '../../providers/AccessProvider';
import { EBOOK_SALES_URL } from '../ebook';
import { MASTERCLASS_SALES_URL } from '../masterclass';
import { type AccessLevels, RENEWAL_URLS, resolveAccess } from '../productAccess';

const MC = 'MASTERCLASS_"AS_7_REGRAS"_9c466a35-2685-4d1e-8434-b29044628056';
let mockLevels: AccessLevels | undefined;
let mockRoles: string[] = [];
let mockSummary: any;
let mockPath = '/';
let mockNewDesign = true;

const mockAccess = (product: string) => resolveAccess(product, mockRoles, undefined, mockLevels);

jest.mock(
    'providers',
    () => ({
        useAppContext: () => ({ user: { uid: 'aluno', name: 'Aluno', roles: mockRoles } }),
        useMelpContext: () => ({ melpSummary: mockSummary, noMelpProgram: mockSummary === null }),
        useProductAccess: () => ({ access: mockAccess, openCta: jest.fn() }),
        AccessCtaBlock: () => createElement('div', { 'data-test': 'renew' }, 'RENEW-LINE'),
    }),
    { virtual: true },
);
jest.mock('../../providers/AppProvider', () => ({ useAppContext: () => ({}) }));
jest.mock(
    'components/molecules/MettleCoursesList/MettleCoursesList',
    () => jest.requireActual('../../components/molecules/MettleCoursesList/MettleCoursesList'),
    { virtual: true },
);
jest.mock('../../components/atoms', () => ({ CourseCard: () => null }));
jest.mock(
    'hooks',
    () => ({
        useGetCourses: () => ({
            loading: false,
            error: undefined,
            data: {
                courseCollection: {
                    items: [
                        {
                            courseSlug: 'masterclass-as-7-regras',
                            courseTitle: 'Masterclass',
                            courseCategory: 'Masterclass',
                            courseFeaturedImage: { url: '/mc.webp' },
                            coursePurchaseId: MC,
                            paymentCheckout: 'https://checkout.example/imerso',
                            courseModulesCollection: {
                                items: [{ lessonsCollection: { items: [{ lessonId: 'aula-1' }] } }],
                            },
                        },
                    ],
                },
            },
        }),
        useResumeDeda: () => ({ mutate: jest.fn(), isPending: false }),
        useStartDeda: () => ({ mutate: jest.fn(), isPending: false }),
    }),
    { virtual: true },
);
jest.mock('hooks/queries/dedaQueries', () => ({ useFeaturedDedaData: () => ({ data: undefined }) }), { virtual: true });
jest.mock('hooks/useNewDesign', () => ({ useNewDesign: () => mockNewDesign }), { virtual: true });
jest.mock('hooks/useTheme', () => ({ useNewAntdTheme: () => ({}) }), { virtual: true });
jest.mock('services', () => ({ accountService: { get: jest.fn() } }), { virtual: true });
jest.mock('config/firebase', () => ({ auth: { currentUser: null } }), { virtual: true });
jest.mock('components/_new/ui', () => ({ popupStyles: '' }), { virtual: true });
jest.mock('interfaces/melp', () => jest.requireActual('../../interfaces/melp'), { virtual: true });
jest.mock('libs', () => ({ formatImersoDate: () => 'Oct 12', nextMondayDate: () => new Date() }), { virtual: true });
jest.mock('libs/cleanUrls', () => jest.requireActual('../cleanUrls'), { virtual: true });
jest.mock(
    'libs/dedaClock',
    () => ({
        isCalendarClock: () => false,
        lampToday: () => null,
        todaysDedaId: () => null,
        weekDayLabel: () => '',
        lampOpen: jest.requireActual('../dedaClock').lampOpen,
        lampLastDay: jest.requireActual('../dedaClock').lampLastDay,
    }),
    { virtual: true },
);
jest.mock('libs/dedaHeader', () => ({ contentfulImage: () => null }), { virtual: true });
jest.mock('libs/ebook', () => jest.requireActual('../ebook'), { virtual: true });
jest.mock('libs/masterclass', () => jest.requireActual('../masterclass'), { virtual: true });
jest.mock('libs/productAccess', () => jest.requireActual('../productAccess'), { virtual: true });
jest.mock(
    'libs/newDesign',
    () => ({ firstName: (n?: string) => n, readIntensityLang: () => 'en', saveIntensityLang: jest.fn() }),
    { virtual: true },
);
jest.mock('themes/newDesign', () => ({ ICON: {} }), { virtual: true });
jest.mock(
    'next/link',
    () =>
        function Link({ href, className, children }: any) {
            return createElement('a', { href, className }, children);
        },
);
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }), usePathname: () => mockPath }));
jest.mock('../../components/_new/NewPage', () => ({
    NewPage: ({ children }: any) => createElement('main', null, children),
}));
jest.mock('../../components/_new/NewStatus', () => ({ NewContentLoading: () => createElement('p', null, 'LOADING') }));
jest.mock('../../components/_new/NewDedasGrid', () => ({ NewDedasGrid: () => createElement('p', null, 'GRID') }));
jest.mock('../../components/_new/NewImersoDash', () => {
    const stub = (text: string) =>
        function Stub() {
            return createElement('p', null, text);
        };
    return {
        Dash: ({ children }: any) => createElement('div', null, children),
        HpecSection: stub('HPEC'),
        Kpis: stub('KPIS'),
        LampPaused: stub('LAMP-PAUSED'),
        NoProgram: stub('NO-PROGRAM'),
        NowRow: stub('NOW'),
        RecentDedas: stub('RECENT'),
        SummaryError: stub('SUMMARY-ERROR'),
        SuspendedNotice: stub('SUSPENDED'),
        useTrail: () => ({ trail: undefined, loading: false, error: false }),
    };
});

const doc = (el: any) => new JSDOM(renderToStaticMarkup(el)).window.document;
const card = (d: Document, title: string) =>
    [...d.querySelectorAll('a.cc, div.cc')].find((a) => a.querySelector('b')?.textContent === title) as HTMLElement;

beforeEach(() => {
    mockLevels = undefined;
    mockRoles = ['METTLE_STUDENT'];
    mockPath = '/';
    mockNewDesign = true;
    mockSummary = { melp_status: 'DEDA_STARTED', days_since_melp_start: 40 };
});

describe('home: cards por estado', () => {
    test('ativo: Masterclass abre a aula e o e-book abre o leitor, sem cadeado', () => {
        mockLevels = { imerso: 'ativo', masterclass: 'ativo', ebook: 'ativo' };
        const d = doc(createElement(NewHome));
        const mc = card(d, 'Masterclass');
        expect(mc.getAttribute('href')).toBe('/course/masterclass-as-7-regras/aula-1');
        expect(mc.classList.contains('locked')).toBe(false);
        const ebook = [...d.querySelectorAll('a.cc')].find((a) => a.getAttribute('href') === '/guia');
        expect(ebook?.textContent).toContain('Ler');
        expect(ebook?.classList.contains('locked')).toBe(false);
    });

    test('leitura: IMERSO abre (só ver); Masterclass e e-book trancados levam à renovação', () => {
        mockLevels = { imerso: 'leitura', masterclass: 'leitura', ebook: 'leitura' };
        const d = doc(createElement(NewHome));
        const imerso = card(d, 'IMERSO');
        expect(imerso.getAttribute('href')).toBe('/imerso');
        expect(imerso.classList.contains('locked')).toBe(false);
        const mc = card(d, 'Masterclass');
        expect(mc.getAttribute('href')).toBe(MASTERCLASS_SALES_URL);
        expect(mc.classList.contains('locked')).toBe(true);
        expect(mc.textContent).toContain('Renovar');
        const ebook = [...d.querySelectorAll('a.cc')].find((a) => a.getAttribute('href') === EBOOK_SALES_URL);
        expect(ebook?.classList.contains('locked')).toBe(true);
        expect(ebook?.textContent).toContain('Renovar');
        expect(d.querySelector('a[href="/guia"]')).toBeNull();
    });

    test('sem acesso: Masterclass e e-book trancados levam à compra', () => {
        mockLevels = { imerso: 'ativo', masterclass: 'none', ebook: 'none' };
        const d = doc(createElement(NewHome));
        const mc = card(d, 'Masterclass');
        expect(mc.getAttribute('href')).toBe(MASTERCLASS_SALES_URL);
        expect(mc.textContent).toContain('Desbloquear');
        const ebook = [...d.querySelectorAll('a.cc')].find((a) => a.getAttribute('href') === EBOOK_SALES_URL);
        expect(ebook?.textContent).toContain('Desbloquear');
        // os trancados vêm depois dos do aluno
        const titles = [...d.querySelectorAll('.cc b')].map((b) => b.textContent);
        expect(titles[0]).toBe('IMERSO');
    });
});

describe('home do IMERSO', () => {
    test('leitura: a linha de renovação no lugar do aviso do estado; o painel continua', () => {
        mockLevels = { imerso: 'leitura' };
        mockSummary = { melp_status: 'CAN_START_DEDA', days_since_melp_start: 12 };
        const text = doc(createElement(NewImersoHome)).body.textContent;
        expect(text).toContain('RENEW-LINE');
        expect(text).not.toContain('Start DEDA');
        expect(text).toContain('NOW');
        expect(text).toContain('HPEC');
        // a LAMP ainda sem dia: pausada, não números vazios (a mesma regra da página da LAMP)
        expect(text).toContain('LAMP-PAUSED');
        expect(text).not.toContain('KPIS');
    });

    test('leitura com a LAMP pausada pelo sistema: sem "Return to DEDA"', () => {
        mockLevels = { imerso: 'leitura' };
        mockSummary = {
            melp_status: 'DEDA_PAUSED',
            days_since_melp_start: 90,
            current_deda_day: 40,
            current_deda_week: 6,
        };
        const text = doc(createElement(NewImersoHome)).body.textContent;
        expect(text).toContain('RENEW-LINE');
        expect(text).not.toContain('Return to DEDA');
        expect(text).toContain('KPIS');
    });

    test('leitura sem programa (resumo 404): a home de sempre, com a LAMP pausada — nunca página em branco', () => {
        mockLevels = { imerso: 'leitura' };
        mockSummary = null;
        const text = doc(createElement(NewImersoHome)).body.textContent;
        expect(text).toContain('RENEW-LINE');
        expect(text).toContain('NOW');
        expect(text).toContain('LAMP-PAUSED');
        expect(text).toContain('HPEC');
        expect(text).not.toContain('NO-PROGRAM');
    });

    test('sem programa fora da Leitura: a linha calma; resumo ainda chegando: carregando', () => {
        mockLevels = { imerso: 'ativo' };
        mockSummary = null;
        expect(doc(createElement(NewImersoHome)).body.textContent).toContain('NO-PROGRAM');
        mockSummary = undefined;
        expect(doc(createElement(NewImersoHome)).body.textContent).toContain('LOADING');
    });

    test('ativo: o aviso do estado, sem a linha de renovação', () => {
        mockLevels = { imerso: 'ativo' };
        mockSummary = { melp_status: 'CAN_START_DEDA', days_since_melp_start: 12 };
        const text = doc(createElement(NewImersoHome)).body.textContent;
        expect(text).not.toContain('RENEW-LINE');
        expect(text).toContain('Start DEDA');
    });
});

describe('aviso de renovação (plataforma nova)', () => {
    test('dentro do IMERSO: inglês, uma linha e a renovação do Imerso', () => {
        mockPath = '/imerso/deda/london';
        const d = doc(createElement(AccessCtaBlock, { target: { product: 'METTLE_STUDENT' } }));
        expect(d.querySelector('.notice b')?.textContent).toBe('Your IMERSO is read-only');
        const a = d.querySelector('a.btn');
        expect(a?.textContent).toBe('Renew');
        expect(a?.getAttribute('href')).toBe(RENEWAL_URLS.METTLE_STUDENT);
        expect(d.querySelector('p')).toBeNull();
    });

    test('fora do IMERSO (Comunidade): português', () => {
        mockPath = '/comunidade';
        const d = doc(createElement(AccessCtaBlock, { target: { product: 'METTLE_STUDENT' } }));
        expect(d.querySelector('.notice b')?.textContent).toBe('Seu IMERSO está em modo leitura');
        expect(d.querySelector('a.btn')?.textContent).toBe('Renovar');
    });

    test('Masterclass: a página de vendas dela, nunca o checkout do curso (que leva ao Imerso)', () => {
        mockPath = '/course/masterclass-as-7-regras/aula-1';
        const d = doc(
            createElement(AccessCtaBlock, {
                target: { product: MC, name: 'Masterclass', renewUrl: 'https://checkout.example/imerso' },
            }),
        );
        expect(d.querySelector('.notice b')?.textContent).toBe('Acesso encerrado');
        expect(d.querySelector('a.btn')?.getAttribute('href')).toBe(MASTERCLASS_SALES_URL);
    });

    test('tela clássica: o convite de antes, intocado', () => {
        mockNewDesign = false;
        const d = doc(createElement(AccessCtaBlock, { target: { product: 'METTLE_STUDENT' } }));
        expect(d.querySelector('.notice')).toBeNull();
        expect(d.body.textContent).toContain('Seu acesso ao Programa Imerso expirou');
    });
});
