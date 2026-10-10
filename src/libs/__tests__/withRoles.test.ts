/** @jest-environment node */
// Quem entra nas páginas do Imerso: role antiga ou acesso; o modelo novo (claims) manda, inclusive o "none".
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { withRoles } from '../../components/HOCs/withRoles';
import { type AccessLevels, resolveAccess } from '../productAccess';

let mockRoles: string[] = [];
let mockLevels: AccessLevels | undefined;
let mockLoading = false;
const mockPush = jest.fn();

jest.mock('components', () => ({ LoadingLayout: () => 'LOADING' }), { virtual: true });
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock(
    'providers',
    () => ({
        useAppContext: () => ({ user: { uid: 'aluno', roles: mockRoles } }),
        useProductAccess: () => ({
            access: (product: string) => resolveAccess(product, mockRoles, undefined, mockLevels),
            accessLoading: mockLoading,
        }),
    }),
    { virtual: true },
);

const Page = withRoles(() => createElement('main', null, 'IMERSO'), {
    roles: ['METTLE_STUDENT', 'METTLE_ADMIN'],
    fallback: { type: 'redirect', to: '/' },
});
const render = () => renderToStaticMarkup(createElement(Page));

beforeEach(() => {
    mockRoles = ['METTLE_STUDENT'];
    mockLevels = undefined;
    mockLoading = false;
    mockPush.mockClear();
});

test('sem claims: a role antiga abre, como antes', () => {
    expect(render()).toBe('<main>IMERSO</main>');
});

test('claims com o Imerso em none: a role antiga não abre mais', () => {
    mockLevels = { imerso: 'none' };
    expect(render()).toBe('');
    expect(mockPush).toHaveBeenCalledWith('/');
});

test('leitura sem a role: entra (só para ver)', () => {
    mockRoles = [];
    mockLevels = { imerso: 'leitura' };
    expect(render()).toBe('<main>IMERSO</main>');
});

test('sem role nem claims: espera a resposta que pode liberar antes de barrar', () => {
    mockRoles = [];
    mockLoading = true;
    expect(render()).toBe('LOADING');
    expect(mockPush).not.toHaveBeenCalled();
});

test('administrador navegando como um aluno sem o Imerso: entra (a equipe vê)', () => {
    mockRoles = ['METTLE_ADMIN'];
    mockLevels = { imerso: 'none' };
    expect(render()).toBe('<main>IMERSO</main>');
});
