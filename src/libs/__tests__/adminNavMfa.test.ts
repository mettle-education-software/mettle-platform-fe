/** @jest-environment node */
// Aviso do Admin sem o segundo fator (403 MFA_REQUIRED): sem 2FA, "Ative… em Configurações"; já ativado e o servidor
// ainda recusa (sessão de antes do código), "Saia e entre de novo"; desligado, nada.
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AdminNav } from '../../components/_new/AdminNav';
import { clearAdminMfa, flagAdminMfa } from '../authentication/mfa';

let mockUser: { factors: { factorId: string }[] } | null = null;
jest.mock(
    'config/firebase',
    () => ({
        auth: {
            get currentUser() {
                return mockUser;
            },
        },
    }),
    { virtual: true },
);
jest.mock('firebase/auth', () => ({
    getMultiFactorResolver: jest.fn(),
    multiFactor: (user: { factors: unknown[] }) => ({ enrolledFactors: user.factors }),
    TotpMultiFactorGenerator: { FACTOR_ID: 'totp' },
}));
jest.mock('libs/authentication/mfa', () => jest.requireActual('../authentication/mfa'), { virtual: true });
jest.mock('libs/authentication/handleLogout', () => ({ handleLogout: jest.fn() }), { virtual: true });
jest.mock('libs/adminPanel', () => ({ ADMIN_NAV: [{ key: 'inicio', href: '/admin', label: 'Início' }] }), {
    virtual: true,
});
jest.mock('libs/leitura', () => ({ isLeituraOwner: () => false }), { virtual: true });
jest.mock('next/navigation', () => ({ usePathname: () => '/admin' }));
jest.mock(
    'next/link',
    () =>
        function Link({ href, children, className }: any) {
            return createElement('a', { href, className }, children);
        },
);

const html = () => renderToStaticMarkup(createElement(AdminNav));

test('sem recusa: só o menu', () => {
    expect(html()).not.toContain('class="notice"');
});

test('recusado sem 2FA: a frase calma e o caminho para as Configurações', () => {
    mockUser = { factors: [] };
    flagAdminMfa();
    const out = html();
    expect(out).toContain('role="status"');
    expect(out).toContain('Ative a verificação em duas etapas em Configurações para usar o Admin.');
    expect(out).toContain('href="/settings"');
    clearAdminMfa();
    expect(html()).not.toContain('class="notice"');
});

test('recusado já com 2FA (sessão de antes do código): sair e entrar de novo', () => {
    mockUser = { factors: [{ factorId: 'totp' }] };
    flagAdminMfa();
    const out = html();
    expect(out).toContain('Saia e entre de novo com o código do app para usar o Admin.');
    expect(out).toContain('>Sair</button>');
    expect(out).not.toContain('href="/settings"');
    clearAdminMfa();
});
