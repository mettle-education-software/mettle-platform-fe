'use client';

import { css, Global } from '@emotion/react';
import { ADMIN_TOOLS, openAdminPanel } from 'libs/adminTools';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import { ICON } from 'themes/newDesign';
import { NewPage } from './NewPage';
import { PageHead } from './PageHead';

const styles = css`
    .adm {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 16px;
        margin: 8px 0 0;
        padding: 0;
        list-style: none;
    }
    .adm .tool {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: 4px 12px;
        width: 100%;
        min-height: 96px;
        padding: 18px 20px;
        border: 1px solid var(--r-line);
        border-radius: var(--r-radius);
        background: var(--r-surf);
        color: var(--r-text);
        font: inherit;
        text-align: left;
        text-decoration: none;
        cursor: pointer;
        transition: border-color var(--r-ease);
    }
    .adm .tool:hover {
        border-color: var(--r-gold-hi);
    }
    .adm b {
        font-size: 16px;
        font-weight: 500;
    }
    .adm small {
        grid-column: 1;
        font-size: 13px;
        color: var(--r-muted);
    }
    .adm svg {
        grid-row: 1 / span 2;
        grid-column: 2;
        color: var(--r-gold-hi);
    }
`;

/** /admin: as ferramentas internas do dono, lidas de ADMIN_TOOLS (uma linha por ferramenta nova). */
export const NewAdminHub: React.FC = () => (
    <NewPage>
        <Global styles={styles} />
        <PageHead eyebrow="Interno · só você vê" title="Admin" />
        <ul className="adm">
            {ADMIN_TOOLS.map((t) => {
                const body = (
                    <>
                        <b>{t.title}</b>
                        <small>{t.line}</small>
                        <ArrowRight {...ICON} size={18} aria-hidden />
                    </>
                );
                return (
                    <li key={t.key}>
                        {'href' in t ? (
                            <Link className="tool" href={t.href}>
                                {body}
                            </Link>
                        ) : (
                            <button type="button" className="tool" onClick={openAdminPanel}>
                                {body}
                            </button>
                        )}
                    </li>
                );
            })}
        </ul>
    </NewPage>
);

export default NewAdminHub;
