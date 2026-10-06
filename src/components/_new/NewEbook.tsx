'use client';

import styled from '@emotion/styled';
import { auth } from 'config/firebase';
import {
    EBOOK,
    EBOOK_LINK_URL,
    EBOOK_PRODUCT,
    EBOOK_READ_PATH,
    ebookOpen,
    type EbookLink,
    linkFresh,
} from 'libs/ebook';
import { BookOpen, Download } from 'lucide-react';
import Link from 'next/link';
import { useAppContext, useProductAccess } from 'providers';
import React, { useCallback, useEffect, useState } from 'react';
import { ICON } from 'themes/newDesign';
import { NewPage } from './NewPage';

/**
 * Capa tipográfica (a mesma do PDF: fundo escuro, título claro, filete dourado), desenhada em `em` a partir da largura:
 * nítida em qualquer tamanho. Usada aqui e no card da Home.
 */
export const EbookCover: React.FC<{ width: number; className?: string }> = ({ width, className }) => (
    <Cover className={className} style={{ width, fontSize: width / 10 }} aria-hidden>
        <span className="logo" />
        <span className="t">{EBOOK.title}</span>
        <span className="r" />
        <span className="a">{EBOOK.author}</span>
    </Cover>
);

/* classes, não tags: os cards da Home estilizam b/img por tag */
const Cover = styled.span`
    display: flex;
    flex-direction: column;
    flex: none;
    aspect-ratio: 2 / 3;
    padding: 1.2em 1.1em 1em;
    border-radius: 0.15em 0.3em 0.3em 0.15em;
    background: linear-gradient(160deg, #24211e 0%, #16130f 100%);
    box-shadow:
        inset 0.12em 0 0 rgba(255, 255, 255, 0.06),
        0 0.7em 1.6em rgba(0, 0, 0, 0.45);
    color: #f3ede4;
    text-align: left;

    .logo {
        width: 3.4em;
        aspect-ratio: 275 / 74;
        background: url('/img/logo_light.svg') left center / contain no-repeat;
        opacity: 0.9;
    }
    .t {
        margin-top: auto;
        font-size: 0.96em;
        font-weight: 300;
        line-height: 1.18;
    }
    .r {
        width: 1.8em;
        height: 1px;
        margin: 0.7em 0 0.5em;
        background: #b78a5b;
    }
    .a {
        font-size: 0.5em;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #bdb4a8;
    }
`;

/** Link curto (10 min) do Worker para baixar o PDF. Antes do 8º dia da compra o Worker recusa (403): sem botão. */
const fetchLink = async (): Promise<EbookLink> => {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch(EBOOK_LINK_URL, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    if (!res.ok) throw new Error(String(res.status));
    return res.json();
};

/**
 * Página do e-book na plataforma nova: capa, descrição curta e as ações. "Ler" abre o leitor da Plataforma
 * (/guia/ler); "Baixar" (cópia pessoal em PDF) só existe depois da garantia — antes disso não aparece nada.
 */
export const NewEbook: React.FC = () => {
    const { user } = useAppContext();
    const { access } = useProductAccess();
    const state = access(EBOOK_PRODUCT);
    const open = ebookOpen(state.state);
    const [link, setLink] = useState<EbookLink | null>(null);

    const refresh = useCallback(
        () =>
            fetchLink()
                .then((l) => {
                    setLink(l);
                    return l;
                })
                .catch(() => null),
        [],
    );

    // link pronto antes do clique e renovado antes de vencer; sem link (garantia, falha), sem botão
    useEffect(() => {
        if (!open) return;
        refresh();
        const id = window.setInterval(refresh, 8 * 60_000);
        return () => window.clearInterval(id);
    }, [open, refresh]);

    const download = async () => {
        const fresh = linkFresh(link) ? link : await refresh();
        if (fresh) window.location.href = fresh.download; // anexo: baixa e a página fica
    };

    const until = state.expiresAt ? new Date(state.expiresAt).toLocaleDateString('pt-BR') : null;

    return (
        <NewPage className="narrow">
            <Product>
                <EbookCover width={240} className="cover" />
                <div className="info">
                    <p className="eyebrow">E-book · {EBOOK.pages} páginas</p>
                    <h1>{EBOOK.title}</h1>
                    <p className="sub">{EBOOK.subtitle}</p>
                    <p className="desc">{EBOOK.description}</p>
                    {!user ? null : open ? (
                        <>
                            <div className="acts">
                                <Link href={EBOOK_READ_PATH} className="btn gold">
                                    <BookOpen {...ICON} size={18} aria-hidden /> Ler
                                </Link>
                                {link && (
                                    <button type="button" className="btn line" onClick={download}>
                                        <Download {...ICON} size={18} aria-hidden /> Baixar
                                    </button>
                                )}
                            </div>
                            {until && <p className="note">Acesso até {until}</p>}
                        </>
                    ) : (
                        <p className="note">
                            {state.state === 'expired'
                                ? 'O seu acesso a este e-book terminou.'
                                : 'Este e-book não faz parte da sua conta.'}
                        </p>
                    )}
                </div>
            </Product>
        </NewPage>
    );
};

const Product = styled.div`
    display: grid;
    grid-template-columns: 240px minmax(0, 1fr);
    gap: 48px;
    align-items: center;
    padding-top: 24px;

    .eyebrow {
        margin: 0 0 12px;
        font-size: var(--r-label-size);
        font-weight: 500;
        letter-spacing: var(--r-label-track);
        text-transform: uppercase;
        color: var(--r-muted);
    }
    h1 {
        margin: 0;
        font-size: 30px;
        font-weight: 300;
        line-height: 1.2;
        letter-spacing: -0.01em;
    }
    .sub {
        margin: 10px 0 0;
        color: var(--r-muted);
    }
    .desc {
        margin: 24px 0 0;
        max-width: 52ch;
        font-size: 15.5px;
        line-height: 1.6;
    }
    .acts {
        display: flex;
        gap: 12px;
        margin-top: 32px;
    }
    .note {
        margin: 14px 0 0;
        font-size: 13px;
        color: var(--r-faint);
    }

    @media (max-width: 860px) {
        grid-template-columns: minmax(0, 1fr);
        gap: 28px;
        padding-top: 0;
        text-align: center;

        /* capa menor no celular: largura e escala juntas (o tamanho base vem inline) */
        .cover {
            width: 168px !important;
            font-size: 16.8px !important;
            margin: 0 auto;
        }
        h1 {
            font-size: 24px;
        }
        .desc {
            margin-left: auto;
            margin-right: auto;
        }
        .acts .btn {
            flex: 1;
        }
    }
`;

export default NewEbook;
