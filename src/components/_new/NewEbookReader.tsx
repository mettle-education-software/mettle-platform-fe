'use client';

import styled from '@emotion/styled';
import { Drawer } from 'antd';
import { TextSize } from 'components/_melp/_deda/DedaReader/TextSize';
import { readFont, uiFont } from 'components/_melp/_deda/DedaReader/readerFonts';
import { auth } from 'config/firebase';
import { useDeviceSize } from 'hooks/useDeviceSize';
import { readTextScale, saveTextScale } from 'libs/dedaReader';
import {
    EBOOK,
    EBOOK_BOOK_URL,
    EBOOK_PATH,
    EBOOK_POSITION_URL,
    EBOOK_PRODUCT,
    type EbookBook,
    type EbookPosition,
    ebookOpen,
    readLocalPosition,
    resumePosition,
    sanitizeChapter,
    saveLocalPosition,
} from 'libs/ebook';
import { ArrowRight, ChevronLeft, ChevronRight, List, X } from 'lucide-react';
import Link from 'next/link';
import { useAppContext, useProductAccess } from 'providers';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ICON, UI_FONT_VAR } from 'themes/newDesign';
import { NewPage } from './NewPage';

type Load = { state: 'loading' } | { state: 'error'; noAccess: boolean } | { state: 'ready'; book: EbookBook };

/** O livro inteiro numa ida (≈200 KB): o Worker confere o acesso do aluno; nada fica público. */
const fetchBook = async (): Promise<EbookBook> => {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch(EBOOK_BOOK_URL, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    if (!res.ok) throw new Error(String(res.status));
    return res.json();
};

/** Posição no Worker (outros aparelhos). Texto simples: sem preflight; keepalive para valer ao fechar a aba. */
const sendPosition = (save: string, p: EbookPosition) =>
    fetch(EBOOK_POSITION_URL, {
        method: 'POST',
        body: JSON.stringify({ t: save, c: p.c, y: p.y }),
        keepalive: true,
    }).catch(() => undefined);

/**
 * Leitor do Guia Completo dentro da Plataforma (edição web): uma rolagem só (a da casca), barra fina que some ao
 * descer e volta ao subir, índice em gaveta, "Aa" (a mesma preferência do DEDA), anterior/próximo e retomada do
 * ponto onde parou — no aparelho (localStorage) e entre aparelhos (Worker, por usuário).
 */
export const NewEbookReader: React.FC = () => {
    const { user } = useAppContext();
    const { access } = useProductAccess();
    const open = ebookOpen(access(EBOOK_PRODUCT).state);
    const isMobile = useDeviceSize() === 'mobile';

    const [load, setLoad] = useState<Load>({ state: 'loading' });
    const [index, setIndex] = useState(0);
    const [scale, setScale] = useState(1);
    const [toc, setToc] = useState(false);
    const [progress, setProgress] = useState(0);

    const root = useRef<HTMLDivElement>(null);
    const pendingY = useRef(0); // fração a restaurar quando o capítulo pintar
    const last = useRef<EbookPosition | null>(null);
    const sentAt = useRef(0);

    useEffect(() => setScale(readTextScale()), []);

    useEffect(() => {
        if (!user || !open) return;
        fetchBook()
            .then((book) => {
                const want = new URLSearchParams(window.location.search).get('c');
                const resume = resumePosition(book.chapters, readLocalPosition(), book.position);
                const asked = want ? book.chapters.findIndex((c) => c.slug === want) : -1;
                const start = asked >= 0 && asked !== resume.index ? { index: asked, y: 0 } : resume;
                pendingY.current = start.y;
                setIndex(start.index);
                setLoad({ state: 'ready', book });
            })
            .catch((e: Error) => setLoad({ state: 'error', noAccess: e.message === '403' }));
    }, [user, open]);

    const book = load.state === 'ready' ? load.book : null;
    const chapters = book?.chapters ?? [];
    const chapter = chapters[index];
    const html = useMemo(() => (chapter ? sanitizeChapter(chapter.html, new DOMParser()) : ''), [chapter]);

    const scroller = () => root.current?.closest('.main') as HTMLElement | null;

    // capítulo pintado (ou letra trocada): vai para a posição pedida — retomada, mesmo ponto — ou para o topo
    useLayoutEffect(() => {
        const main = scroller();
        if (!main || !html) return;
        main.scrollTop = pendingY.current * Math.max(0, main.scrollHeight - main.clientHeight);
        pendingY.current = 0;
    }, [html, scale]);

    const flush = useCallback(() => {
        if (book && last.current) {
            sendPosition(book.save, last.current);
            sentAt.current = Date.now();
        }
    }, [book]);

    // rolagem: progresso, posição salva (aparelho sempre; servidor a cada 15 s e ao sair)
    useEffect(() => {
        const main = scroller();
        if (!main || !chapter) return;
        const onScroll = () => {
            const max = main.scrollHeight - main.clientHeight;
            const y = max > 0 ? Math.min(1, main.scrollTop / max) : 0;
            setProgress((index + y) / chapters.length);
            last.current = { c: chapter.slug, y: Math.round(y * 10000) / 10000, at: new Date().toISOString() };
            saveLocalPosition(last.current);
            if (Date.now() - sentAt.current > 15_000) flush();
        };
        onScroll();
        main.addEventListener('scroll', onScroll, { passive: true });
        return () => main.removeEventListener('scroll', onScroll);
    }, [chapter, index, chapters.length, flush]);

    useEffect(() => {
        const hide = () => document.visibilityState === 'hidden' && flush();
        document.addEventListener('visibilitychange', hide);
        window.addEventListener('pagehide', flush);
        return () => {
            flush(); // saiu do leitor pela Plataforma
            document.removeEventListener('visibilitychange', hide);
            window.removeEventListener('pagehide', flush);
        };
    }, [flush]);

    const go = (i: number) => {
        if (i < 0 || i >= chapters.length) return;
        flush();
        pendingY.current = 0;
        setToc(false);
        setIndex(i);
    };

    const onScale = (value: number) => {
        const main = scroller();
        // o texto muda de tamanho e o leitor fica no mesmo ponto do capítulo
        if (main) pendingY.current = main.scrollTop / Math.max(1, main.scrollHeight - main.clientHeight);
        setScale(value);
        saveTextScale(value);
    };

    // links do livro: âncora e capítulo ficam no leitor (os externos já saem em nova aba)
    const onProseClick = (event: React.MouseEvent) => {
        const a = (event.target as HTMLElement).closest('a');
        if (!a) return;
        const chapterSlug = a.getAttribute('data-chapter');
        const anchor = a.getAttribute('data-anchor');
        if (chapterSlug) {
            event.preventDefault();
            go(chapters.findIndex((c) => c.slug === chapterSlug));
        } else if (anchor) {
            event.preventDefault();
            document.getElementById(anchor)?.scrollIntoView({ block: 'start', behavior: 'smooth' });
        }
    };

    if (load.state !== 'ready' || !chapter)
        return (
            <NewPage className="narrow">
                {(load.state === 'error' || !open) && user ? (
                    <State role="status">
                        <p>
                            {!open || (load.state === 'error' && load.noAccess)
                                ? 'Este e-book não faz parte da sua conta.'
                                : 'Não foi possível abrir o e-book agora. Tente de novo em instantes.'}
                        </p>
                        <Link href={EBOOK_PATH} className="btn line">
                            {EBOOK.title}
                        </Link>
                    </State>
                ) : null}
            </NewPage>
        );

    const previous = chapters[index - 1];
    const next = chapters[index + 1];

    const parts = chapters.reduce<{ part: string; items: { i: number; eyebrow: string; title: string }[] }[]>(
        (acc, c, i) => {
            const group = acc[acc.length - 1]?.part === c.part ? acc[acc.length - 1] : null;
            const item = { i, eyebrow: c.eyebrow, title: c.title };
            if (group) group.items.push(item);
            else acc.push({ part: c.part, items: [item] });
            return acc;
        },
        [],
    );

    return (
        <NewPage className="lesson">
            <Wrap
                ref={root}
                className={uiFont.className}
                style={{ '--r-scale': scale, '--r-read-font': readFont.style.fontFamily } as React.CSSProperties}
            >
                <header className="bar">
                    <button type="button" className="ib" aria-label="Índice" onClick={() => setToc(true)}>
                        <List {...ICON} />
                    </button>
                    <span className="sp" />
                    <TextSize scale={scale} onScale={onScale} />
                    <button
                        type="button"
                        className="ib"
                        aria-label="Capítulo anterior"
                        title={previous?.title}
                        disabled={!previous}
                        onClick={() => go(index - 1)}
                    >
                        <ChevronLeft {...ICON} />
                    </button>
                    <button
                        type="button"
                        className="ib"
                        aria-label="Próximo capítulo"
                        title={next?.title}
                        disabled={!next}
                        onClick={() => go(index + 1)}
                    >
                        <ChevronRight {...ICON} />
                    </button>
                    <span className="prog" style={{ transform: `scaleX(${progress})` }} aria-hidden />
                </header>

                <article className="page" lang="pt-BR">
                    <p className="eyebrow">{chapter.eyebrow}</p>
                    <h1>{chapter.title}</h1>
                    {/* HTML do livro limpo por sanitizeChapter (só tags de texto, sem scripts, estilos nem eventos) */}
                    <div className="prose" onClick={onProseClick} dangerouslySetInnerHTML={{ __html: html }} />
                    {next && (
                        <div className="after">
                            <button type="button" className="btn line" onClick={() => go(index + 1)}>
                                <span className="lbl">
                                    <small>Próximo</small>
                                    <span>{next.title}</span>
                                </span>
                                <ArrowRight {...ICON} size={16} className="arrow" aria-hidden />
                            </button>
                        </div>
                    )}
                </article>
            </Wrap>

            <Drawer
                rootClassName={`ui-new-drawer ${uiFont.className}`}
                rootStyle={UI_FONT_VAR}
                closeIcon={<X {...ICON} aria-label="Fechar" />}
                open={toc}
                onClose={() => setToc(false)}
                placement={isMobile ? 'bottom' : 'left'}
                height="82%"
                width={400}
                title="Índice"
            >
                <Toc>
                    {parts.map((group) => (
                        <section key={group.part}>
                            <h3>{group.part}</h3>
                            <ol>
                                {group.items.map((item) => (
                                    <li key={item.i}>
                                        <button
                                            type="button"
                                            aria-current={item.i === index || undefined}
                                            onClick={() => go(item.i)}
                                        >
                                            {item.eyebrow !== group.part && <small>{item.eyebrow}</small>}
                                            <span>{item.title}</span>
                                        </button>
                                    </li>
                                ))}
                            </ol>
                        </section>
                    ))}
                </Toc>
            </Drawer>
        </NewPage>
    );
};

const State = styled.div`
    display: grid;
    justify-items: center;
    gap: 16px;
    padding-top: 64px;
    text-align: center;
    color: var(--r-muted);
`;

const Wrap = styled.div`
    /* barra fina, sempre presa no topo da rolagem da casca */
    .bar {
        position: sticky;
        top: 0;
        z-index: 3;
        display: flex;
        align-items: center;
        gap: 2px;
        height: 52px;
        padding: 0 12px;
        background: var(--r-bg);
    }
    .bar .sp {
        flex: 1;
    }
    .bar .ib {
        color: var(--r-muted);
    }
    .bar .ib:hover:not(:disabled) {
        color: var(--r-text);
    }
    .bar .ib:disabled {
        opacity: 0.3;
        cursor: default;
        background: none;
    }
    .prog {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 1px;
        background: var(--r-gold);
        opacity: 0.7;
        transform-origin: left;
        transition: transform 120ms linear;
    }

    .tsize {
        position: relative;
        display: inline-flex;
    }
    .tsize .panel {
        position: absolute;
        right: 0;
        top: calc(100% + 6px);
        z-index: 5;
        display: flex;
        padding: 6px;
        border: 1px solid var(--r-line);
        border-radius: 14px;
        background: var(--r-sheet-head);
        box-shadow: 0 10px 30px var(--r-card-shadow);
    }
    .tsize .panel button {
        display: grid;
        place-items: center;
        width: 44px;
        height: 44px;
        padding: 0;
        border: 0;
        border-radius: 10px;
        background: none;
        color: var(--r-muted);
        font-family: var(--r-read-font), system-ui, sans-serif;
        line-height: 1;
        cursor: pointer;
    }
    .tsize .panel button:hover {
        color: var(--r-text);
    }
    .tsize .panel button[aria-checked='true'] {
        background: var(--r-gold-tint);
        color: var(--r-gold-hi);
    }

    /* página: a mesma coluna e a mesma tipografia da página do DEDA */
    --r-read-size: calc(20px * var(--r-scale, 1));
    --r-read-line: 1.7;
    .page {
        max-width: calc(33.5 * var(--r-read-size));
        margin: 0 auto;
        padding: 28px 32px 96px;
    }
    .eyebrow {
        margin: 0 0 12px;
        font-size: var(--r-label-size);
        font-weight: 500;
        letter-spacing: var(--r-label-track);
        text-transform: uppercase;
        color: var(--r-gold-hi);
    }
    h1 {
        margin: 0 0 1.4em;
        font-size: calc(30px * var(--r-scale, 1));
        font-weight: 300;
        line-height: 1.22;
        letter-spacing: -0.01em;
        color: var(--r-text);
    }
    .prose {
        font-family: var(--r-read-font), system-ui, sans-serif;
        font-size: var(--r-read-size);
        line-height: var(--r-read-line);
        color: var(--r-text);
        overflow-wrap: break-word;
    }
    .prose p {
        margin: 0 0 1.15em;
    }
    .prose h2,
    .prose h3,
    .prose h4 {
        margin: 1.6em 0 0.6em;
        font-size: 1.15em;
        font-weight: 600;
        line-height: 1.3;
        scroll-margin-top: 64px;
    }
    .prose ul,
    .prose ol {
        margin: 0 0 1.15em;
        padding-left: 1.4em;
    }
    .prose li {
        margin: 0 0 0.4em;
    }
    .prose strong {
        font-weight: 600;
    }
    .prose blockquote {
        margin: 1.4em 0;
        padding: 0 0 0 1.1em;
        border-left: 1px solid var(--r-gold);
        color: var(--r-muted);
        font-style: italic;
    }
    .prose a {
        color: var(--r-gold-hi);
        text-decoration: underline;
        text-underline-offset: 3px;
    }
    /* "Mentira nº NN" */
    .prose .mentira-open {
        margin: 2.4em 0 0.9em;
        scroll-margin-top: 64px;
    }
    .prose .mentira-open h3 {
        margin: 0.35em 0 0;
    }
    .prose .badge {
        font-family: var(--r-ui-font), system-ui, sans-serif;
        font-size: var(--r-label-size);
        font-weight: 500;
        letter-spacing: var(--r-label-track);
        text-transform: uppercase;
        color: var(--r-gold-hi);
    }
    /* planos do Próximo Passo */
    .prose .planos {
        display: grid;
        gap: 12px;
        margin: 1.4em 0;
    }
    .prose .plano {
        display: grid;
        gap: 4px;
        padding: 16px 18px;
        border: 1px solid var(--r-line-strong);
        border-radius: var(--r-radius);
        color: var(--r-text);
        text-decoration: none;
        line-height: 1.45;
        transition: border-color var(--r-ease);
    }
    .prose .plano:hover {
        border-color: var(--r-gold-hi);
    }
    .prose .plano-nome {
        font-weight: 600;
    }
    .prose .plano-desc {
        font-size: 0.85em;
        color: var(--r-muted);
    }
    .prose .plano-btn {
        font-size: 0.85em;
        color: var(--r-gold-hi);
    }

    .after {
        margin-top: 48px;
        padding-top: 24px;
        border-top: 1px solid var(--r-line);
    }
    .after .btn {
        width: 100%;
        justify-content: space-between;
        min-height: 64px;
        padding: 12px 20px;
        text-align: left;
    }
    .after .lbl {
        display: grid;
        gap: 2px;
        min-width: 0;
    }
    .after small {
        font-size: var(--r-label-size);
        letter-spacing: var(--r-label-track);
        text-transform: uppercase;
        color: var(--r-muted);
    }
    .after .lbl span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    @media (max-width: 860px) {
        --r-read-size: calc(18px * var(--r-scale, 1));
        --r-read-line: 1.66;
        .bar {
            padding: 0 4px;
        }
        .page {
            padding: 16px 20px 72px;
        }
        h1 {
            font-size: calc(25px * var(--r-scale, 1));
        }
    }
`;

const Toc = styled.nav`
    padding: 0 12px 24px;

    section + section {
        margin-top: 20px;
    }
    h3 {
        margin: 8px 0 6px;
        padding: 0 12px;
        font-size: var(--r-label-size);
        font-weight: 500;
        letter-spacing: var(--r-label-track);
        text-transform: uppercase;
        color: var(--r-muted);
    }
    ol {
        margin: 0;
        padding: 0;
        list-style: none;
    }
    button {
        display: grid;
        gap: 2px;
        width: 100%;
        min-height: 44px;
        padding: 9px 12px;
        border: 0;
        border-radius: 10px;
        background: none;
        color: var(--r-text);
        font: inherit;
        font-size: 14.5px;
        line-height: 1.4;
        text-align: left;
        cursor: pointer;
    }
    button:hover {
        background: var(--r-hover);
    }
    button[aria-current] {
        background: var(--r-gold-tint);
        color: var(--r-gold-hi);
    }
    small {
        font-size: 11.5px;
        color: var(--r-muted);
    }
`;

export default NewEbookReader;
