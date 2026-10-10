'use client';

import { css, Global } from '@emotion/react';
import { auth } from 'config/firebase';
import { ADMIN_NAV } from 'libs/adminPanel';
import { ADMIN_MFA_EVENT, adminMfaRequired } from 'libs/authentication/mfa';
import { isLeituraOwner } from 'libs/leitura';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';

/** Botões de filtro do Admin (Contas e o período do Início). */
export const chipStyles = css`
    .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
    }
    .chips button {
        min-height: 36px;
        padding: 0 12px;
        border: 1px solid var(--r-line);
        border-radius: 999px;
        background: none;
        color: var(--r-muted);
        font: inherit;
        font-size: 13px;
        cursor: pointer;
    }
    .chips button[aria-pressed='true'] {
        border-color: var(--r-gold);
        background: var(--r-gold-tint);
        color: var(--r-text);
    }
    .chips button:disabled {
        opacity: 0.45;
        cursor: default;
    }
`;

const styles = css`
    .admin-nav {
        display: flex;
        flex-wrap: wrap;
        gap: 4px 24px;
        margin: -8px 0 28px;
    }
    .admin-nav a {
        display: inline-flex;
        align-items: center;
        min-height: 40px;
        border-bottom: 1px solid transparent;
        color: var(--r-muted);
        font-size: 14px;
        letter-spacing: 0.01em;
        text-decoration: none;
    }
    .admin-nav a:hover {
        color: var(--r-text);
    }
    .admin-nav a[aria-current='page'] {
        border-bottom-color: var(--r-gold);
        color: var(--r-text);
    }
`;

/** Menu do Admin, no alto de cada página: Início, Contas e, para o dono, Leaderboard e Gestão de Leituras. */
export const AdminNav: React.FC = () => {
    const pathname = usePathname() ?? '';
    const owner = isLeituraOwner(auth.currentUser?.uid);
    // o servidor recusou o Admin por falta do segundo fator: uma linha calma com o caminho
    const [mfa, setMfa] = useState(adminMfaRequired);
    useEffect(() => {
        const on = () => setMfa(true);
        window.addEventListener(ADMIN_MFA_EVENT, on);
        return () => window.removeEventListener(ADMIN_MFA_EVENT, on);
    }, []);
    return (
        <>
            <nav className="admin-nav" aria-label="Admin">
                <Global styles={styles} />
                {ADMIN_NAV.filter((item) => !item.owner || owner).map((item) => {
                    const current = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
                    return (
                        <Link key={item.key} href={item.href} aria-current={current ? 'page' : undefined}>
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
            {mfa && (
                <div className="notice" role="alert">
                    <div>
                        <b>Ative a verificação em duas etapas em Configurações para usar o Admin.</b>
                    </div>
                    <Link className="btn line" href="/settings">
                        Configurações
                    </Link>
                </div>
            )}
        </>
    );
};

export default AdminNav;
