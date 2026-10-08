'use client';

import styled from '@emotion/styled';
import { ReaderProse } from 'components/_melp/_deda/DedaReader/ReaderProse';
import { LinkType } from 'interfaces';
import { IMERSO_CTA, inlineCtaIndex, isSlidesLink, showCtaBar, showImersoCta, supportHref } from 'libs/masterclass';
import { IMERSO_PRODUCT } from 'libs/productAccess';
import { ArrowRight, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useProductAccess } from 'providers';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ICON } from 'themes/newDesign';
import { SlideViewer } from './SlideViewer';

const INLINE_KEY = 'mc-imerso-inline';

/**
 * Aba Texto da Masterclass (plataforma nova): o resumo como vem do conteúdo, com (1) o link "aqui" dos slides abrindo o
 * leitor da Plataforma e (2) a camada do Imerso — cartão depois da Regra 6, bloco final e barra fina a partir de 60% —,
 * nunca para quem já tem o Imerso. Textos em libs/masterclass (IMERSO_CTA).
 */
export const MasterclassSummary: React.FC<{
    doc: { nodeType: string; content: { nodeType: string; content?: unknown[] }[] };
    links?: LinkType;
    title: string;
    active: boolean;
}> = ({ doc, links, title, active }) => {
    const pathname = usePathname() ?? '';
    const { access } = useProductAccess();
    const [preview] = useState(() => typeof window !== 'undefined' && /[?&]imerso-cta\b/.test(window.location.search));
    const cta = showImersoCta(access(IMERSO_PRODUCT).state, preview);
    const [slides, setSlides] = useState(false);

    // cartão (a) como um nó a mais no documento; o texto em si não muda
    const shown = useMemo(() => {
        const at = cta ? inlineCtaIndex(doc.content) : -1;
        if (at < 0) return doc;
        const node = { nodeType: 'embedded-entry-block', data: { target: { sys: { id: INLINE_KEY } } }, content: [] };
        return { ...doc, content: [...doc.content.slice(0, at), node, ...doc.content.slice(at)] };
    }, [doc, cta]);

    // barra (c): a partir de 60% do texto, até o bloco final aparecer
    const rootRef = useRef<HTMLDivElement>(null);
    const closingRef = useRef<HTMLElement>(null);
    const [progress, setProgress] = useState(0);
    const [closingVisible, setClosingVisible] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    useEffect(() => {
        const root = rootRef.current;
        if (!cta || !active || !root) return;
        const scroller = root.closest('.main') ?? window;
        const onScroll = () => {
            const r = root.getBoundingClientRect();
            setProgress(r.height ? (window.innerHeight - r.top) / r.height : 0);
        };
        onScroll();
        scroller.addEventListener('scroll', onScroll, { passive: true });
        const io = new IntersectionObserver(([e]) => setClosingVisible(e.isIntersecting));
        if (closingRef.current) io.observe(closingRef.current);
        return () => {
            scroller.removeEventListener('scroll', onScroll);
            io.disconnect();
        };
    }, [cta, active]);

    const inline = (
        <aside className="mc-card" aria-label={IMERSO_CTA.inline.eyebrow}>
            <p className="eyebrow">{IMERSO_CTA.inline.eyebrow}</p>
            <h4>{IMERSO_CTA.inline.title}</h4>
            <p>{IMERSO_CTA.inline.text}</p>
            <a className="lnk gold" href={IMERSO_CTA.salesUrl} target="_blank" rel="noopener noreferrer">
                {IMERSO_CTA.inline.link}
                <ArrowRight {...ICON} size={16} aria-hidden />
            </a>
        </aside>
    );

    return (
        <Box ref={rootRef}>
            <ReaderProse
                rawContent={shown as never}
                links={links}
                lang="pt"
                blocks={{ [INLINE_KEY]: inline }}
                onLink={(uri) => {
                    if (!isSlidesLink(uri)) return false;
                    setSlides(true);
                    return true;
                }}
            />
            {cta && (
                <section className="mc-close" ref={closingRef} aria-label={IMERSO_CTA.closing.eyebrow}>
                    <p className="eyebrow">{IMERSO_CTA.closing.eyebrow}</p>
                    <h3>{IMERSO_CTA.closing.title}</h3>
                    <dl>
                        {IMERSO_CTA.closing.blocks.map((b) => (
                            <div key={b.name}>
                                <dt>{b.name}</dt>
                                <dd>{b.text}</dd>
                            </div>
                        ))}
                    </dl>
                    <p className="who">{IMERSO_CTA.closing.forWho}</p>
                    <div className="acts">
                        <a className="btn gold" href={IMERSO_CTA.salesUrl} target="_blank" rel="noopener noreferrer">
                            {IMERSO_CTA.closing.primary}
                            <ArrowRight {...ICON} size={16} className="arrow" aria-hidden />
                        </a>
                        <Link className="btn line" href={supportHref(pathname)}>
                            {IMERSO_CTA.closing.secondary}
                        </Link>
                    </div>
                </section>
            )}
            {cta && active && showCtaBar(progress, closingVisible, dismissed) && (
                <div className="mc-bar" role="complementary" aria-label={IMERSO_CTA.bar.link}>
                    <a href={IMERSO_CTA.salesUrl} target="_blank" rel="noopener noreferrer">
                        <span className="q">{IMERSO_CTA.bar.text}</span>
                        <span className="go">
                            {IMERSO_CTA.bar.link}
                            <ArrowRight {...ICON} size={16} aria-hidden />
                        </span>
                    </a>
                    <button
                        type="button"
                        className="ib"
                        aria-label={IMERSO_CTA.bar.dismiss}
                        onClick={() => setDismissed(true)}
                    >
                        <X {...ICON} size={18} />
                    </button>
                </div>
            )}
            {slides && <SlideViewer title={title} onClose={() => setSlides(false)} />}
        </Box>
    );
};

const Box = styled.div`
    .mc-card,
    .mc-close {
        font-family: var(--r-ui-font, system-ui), system-ui, sans-serif;
        border: 1px solid var(--r-line);
        border-radius: var(--r-radius);
        background: var(--r-surf);
    }
    .mc-card {
        margin: 1.6em 0 1.8em;
        padding: 20px 22px;
        border-left: 2px solid var(--r-gold);
        font-size: calc(15.5px * var(--r-scale, 1));
        line-height: 1.55;
    }
    .mc-card h4 {
        margin: 6px 0 6px;
        font-size: 1.15em;
        font-weight: 600;
        line-height: 1.3;
    }
    .mc-card p:not(.eyebrow) {
        margin: 0 0 12px;
        white-space: normal;
        color: var(--r-muted);
    }
    .prose .mc-card a {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-weight: 500;
        text-decoration: none;
    }

    .mc-close {
        max-width: var(--r-col);
        margin: 2.4em auto 0;
        padding: 28px 28px 26px;
        font-size: calc(15.5px * var(--r-scale, 1));
        line-height: 1.55;
    }
    .mc-close h3 {
        margin: 8px 0 18px;
        font-size: 1.45em;
        font-weight: 600;
        line-height: 1.25;
        color: var(--r-text);
    }
    .mc-close dl {
        display: grid;
        gap: 10px;
        margin: 0 0 18px;
    }
    .mc-close dl div {
        display: grid;
        grid-template-columns: 56px minmax(0, 1fr);
        gap: 12px;
    }
    .mc-close dt {
        font-weight: 600;
        letter-spacing: 0.06em;
        color: var(--r-gold-hi);
    }
    .mc-close dd {
        margin: 0;
        color: var(--r-text);
    }
    .mc-close .who {
        margin: 0 0 22px;
        padding-top: 16px;
        border-top: 1px solid var(--r-line);
        color: var(--r-muted);
    }
    .mc-close .acts {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
    }

    .mc-bar {
        position: sticky;
        bottom: calc(16px + env(safe-area-inset-bottom));
        z-index: 5;
        display: flex;
        align-items: center;
        gap: 4px;
        max-width: var(--r-col);
        margin: 24px auto 0;
        padding: 4px 4px 4px 18px;
        border: 1px solid var(--r-line);
        border-radius: 999px;
        background: color-mix(in srgb, var(--r-sheet-head) 88%, transparent);
        -webkit-backdrop-filter: blur(20px) saturate(1.4);
        backdrop-filter: blur(20px) saturate(1.4);
        box-shadow: 0 8px 28px var(--r-card-shadow);
        font-size: 13.5px;
        animation: mc-bar-in 220ms ease-out;
    }
    .mc-bar a {
        flex: 1;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 4px 10px;
        min-height: 40px;
        color: var(--r-text);
        text-decoration: none;
    }
    .mc-bar .go {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: var(--r-gold-hi);
        font-weight: 600;
    }
    .mc-bar .ib {
        width: 40px;
        height: 40px;
        color: var(--r-muted);
    }
    @keyframes mc-bar-in {
        from {
            opacity: 0;
            transform: translateY(8px);
        }
    }
    @media (prefers-reduced-motion: reduce) {
        .mc-bar {
            animation: none;
        }
    }
    @media (max-width: 767px) {
        .mc-close {
            padding: 22px 18px 20px;
        }
        .mc-close .acts .btn {
            flex: 1 1 100%;
        }
        .mc-bar {
            font-size: 13px;
        }
    }
`;

export default MasterclassSummary;
