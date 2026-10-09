'use client';

import { Global } from '@emotion/react';
import { Drawer, Menu } from 'antd';
import { DedaQuote, Logo, RichTextRenderer } from 'components';
import { LinKnowledge } from 'components/_melp/_deda/DedaNotes/LinKnowledge/LinKnowledge';
import { ContextNoteBody, ContextNoteHost } from 'components/atoms/ContextNote/ContextNote';
import { useDeviceSize } from 'hooks';
import { useDeda } from 'hooks/queries/dedaQueries';
import { useLogoTheme } from 'hooks/useTheme';
import { DedaNotesQueryResponse } from 'interfaces';
import { ContextNoteData } from 'libs/contextNotes';
import { contentfulImage } from 'libs/dedaHeader';
import { DEFAULT_TEXT_SCALE, hasReviews, readTextScale, saveTextScale, writeDayToday } from 'libs/dedaReader';
import { openShellMenu } from 'libs/newDesign';
import {
    BookOpen,
    ChevronDown,
    ChevronLeft,
    Headset,
    House,
    LogOut,
    Menu as MenuIcon,
    Quote,
    Settings,
    X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMelpContext } from 'providers';
import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { font as platformFont } from 'themes/font';
import { DedaReaderStudy } from './DedaReaderStudy';
import { ReaderProse } from './ReaderProse';
import { ReaderRecordings } from './ReaderRecordings';
import { ReaderReview } from './ReaderReview';
import { TextSize, TextSizeContext } from './TextSize';
import { readFont, uiFont } from './readerFonts';
import { DrawerBody, ICON, readerTokens, Shell } from './readerStyles';

export interface ReaderTab {
    key: string;
    label: string;
}

type HeaderImage = { url: string; width?: number | null } | null | undefined;

interface Props {
    dedaId: string;
    title?: string;
    coverUrl?: string;
    /** Cabeçalho: imagem própria e, sem ela, a do card (as mesmas candidatas da página atual). */
    headerImages: HeaderImage[];
    tabs: ReaderTab[];
    activeTab: string;
    onTab(key: string): void;
    /** "Classic view": só para a equipe (useDedaReader.canSwitch); ausente = sem o link. */
    onClassic?: () => void;
}

const NOTES_SECTIONS = [
    { key: 'introduction', label: 'Introduction' },
    { key: 'glossary', label: 'Glossary' },
    { key: 'linknowledge', label: 'LinKnowledge' },
] as const;
type NotesSection = (typeof NOTES_SECTIONS)[number]['key'];

/** Introdução / Glossário: o mesmo conteúdo e as mesmas notas de contexto da página atual, na leitura do leitor. */
const NotesText = ({ dedaId, section }: { dedaId: string; section: 'introduction' | 'glossary' }) => {
    const { data } = useDeda<DedaNotesQueryResponse>('deda-notes', dedaId);
    const item = data?.dedaContentCollection?.items[0];
    const content = section === 'introduction' ? item?.dedaNotesIntroductionContent : item?.dedaNotesGlossaryContent;
    if (!item) return <p className="rt hint">Loading…</p>;
    if (!content?.json) return null;
    return (
        // A Introdução é em português; o resto da interface, em inglês.
        <div className="rt" lang={section === 'introduction' ? 'pt-BR' : 'en'}>
            <RichTextRenderer rawContent={content.json} links={content.links} />
        </div>
    );
};

/** Aba DEDA Notes: sub-abas logo abaixo da barra do topo e o conteúdo (sem cabeçalho de imagem: o espaço é do texto). */
const NotesTab = ({ dedaId }: { dedaId: string }) => {
    const [section, setSection] = useState<NotesSection>('introduction');
    // O LinKnowledge monta em segundo plano logo depois da aba abrir (consultas e imagens prontas) e só aparece/some:
    // trocar de sub-aba não remonta nada, então não pisca.
    const [warm, setWarm] = useState(false);
    useEffect(() => {
        const id = window.setTimeout(() => setWarm(true), 700);
        return () => window.clearTimeout(id);
    }, []);
    const lkOn = section === 'linknowledge';
    return (
        <>
            <div className="subnav">
                <div className="seg" role="group" aria-label="DEDA Notes">
                    {NOTES_SECTIONS.map((s) => (
                        <button
                            key={s.key}
                            type="button"
                            aria-pressed={section === s.key}
                            onClick={() => setSection(s.key)}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>
            {(lkOn || warm) && (
                // LinKnowledge entra sem alteração, inclusive a fonte da Plataforma.
                <div
                    className={`lk ${platformFont.className}${lkOn ? '' : ' off'}`}
                    aria-hidden={lkOn ? undefined : true}
                >
                    <LinKnowledge dedaId={dedaId} />
                </div>
            )}
            {!lkOn && (
                <div className="notes">
                    <NotesText dedaId={dedaId} section={section} />
                </div>
            )}
        </>
    );
};

/**
 * Página nova do DEDA inteira (só para as contas de libs/dedaReader): uma casca — a faixa do modo de estudo, com as
 * abas — em todas as abas. A faixa nunca remonta; só o corpo troca. O conteúdo de cada aba vem dos componentes atuais.
 */
export const DedaReaderPage: React.FC<Props> = ({
    dedaId,
    title,
    coverUrl,
    headerImages,
    tabs: allTabs,
    activeTab,
    onTab,
    onClassic,
}) => {
    const router = useRouter();
    const logoTheme = useLogoTheme();
    const isMobile = useDeviceSize() === 'mobile';
    const { melpSummary } = useMelpContext();
    // Aba Review só com revisão liberada (libs/dedaReader.hasReviews). Até o resumo chegar, a barra de abas fica
    // invisível (mesmo espaço), para não piscar.
    const reviews = hasReviews(melpSummary?.unlocked_dedas, dedaId);
    const tabs = allTabs.filter((tab) => tab.key !== 'dedaReview' || reviews);
    useEffect(() => {
        if (reviews === false && activeTab === 'dedaReview') onTab(allTabs[0].key);
    }, [reviews, activeTab, onTab, allTabs]);
    const [glossaryOpen, setGlossaryOpen] = useState(false);
    const [tabsOpen, setTabsOpen] = useState(false);
    const [quoteOpen, setQuoteOpen] = useState(false);
    // Uma camada só: a nota de contexto aberta de dentro da citação troca o conteúdo da mesma folha ("‹" volta);
    // X, toque fora ou Esc fecham tudo de uma vez.
    const [quoteNote, setQuoteNote] = useState<ContextNoteData | null>(null);
    const [timerSlot, setTimerSlot] = useState<HTMLSpanElement | null>(null);

    // Notas de contexto (ContextNote, fora da árvore) no escuro do leitor enquanto a página nova está aberta.
    useEffect(() => {
        document.body.classList.add('deda-reader-shell-on');
        document.body.style.setProperty('--r-ui-font', uiFont.style.fontFamily);
        return () => document.body.classList.remove('deda-reader-shell-on');
    }, []);

    // Tamanho do texto: lido do aparelho e aplicado antes da primeira pintura (não pisca). Fica no <html> para valer
    // também nas gavetas e no leitor de artigo, que abrem fora da árvore; sai junto com a página nova.
    const [textScale, setTextScale] = useState(DEFAULT_TEXT_SCALE);
    useLayoutEffect(() => {
        const saved = readTextScale();
        setTextScale(saved);
        document.documentElement.style.setProperty('--r-scale', String(saved));
        return () => {
            document.documentElement.style.removeProperty('--r-scale');
        };
    }, []);
    const textSize = useMemo(
        () => ({
            scale: textScale,
            onScale: (scale: number) => {
                setTextScale(scale);
                saveTextScale(scale);
                document.documentElement.style.setProperty('--r-scale', String(scale));
            },
        }),
        [textScale],
    );

    const notes = useDeda<DedaNotesQueryResponse>('deda-notes', dedaId);
    const glossary = notes.data?.dedaContentCollection?.items[0]?.dedaNotesGlossaryContent;

    const isTodaysDeda = melpSummary?.unlocked_dedas[melpSummary?.unlocked_dedas.length - 1] === dedaId;
    const weekDay = isTodaysDeda ? `Week ${melpSummary?.current_deda_week} · Day ${writeDayToday()}` : '';
    const thumb = contentfulImage(coverUrl, { w: 96, h: 96, fit: 'fill', fm: 'webp' });
    const stripImage = headerImages.find((image) => image?.url)?.url;
    const stripBg = contentfulImage(stripImage, { w: 1600, fm: 'webp', q: 60 });
    const study = activeTab === 'dedaActivity';

    const tabButtons = () =>
        tabs.map((tab) => (
            <button
                key={tab.key}
                type="button"
                aria-current={tab.key === activeTab ? 'page' : undefined}
                onClick={() => {
                    setTabsOpen(false);
                    if (tab.key !== activeTab) onTab(tab.key);
                }}
            >
                {tab.label}
            </button>
        ));

    const drawerProps = {
        rootClassName: `deda-reader-drawer reader-theme-dark ${uiFont.className}`,
        rootStyle: { '--r-read-font': readFont.style.fontFamily } as React.CSSProperties,
        closeIcon: <X {...ICON} aria-label="Close" />,
    };

    const body = (() => {
        switch (activeTab) {
            case 'dedaActivity':
                return <DedaReaderStudy dedaId={dedaId} timerSlot={timerSlot} />;
            case 'dedaReview':
                return (
                    <main className="scroll" tabIndex={-1} key={activeTab}>
                        <div className="tabpage">
                            <ReaderReview dedaId={dedaId} />
                        </div>
                    </main>
                );
            case 'dedaRecordings':
                return (
                    <main className="scroll" tabIndex={-1} key={activeTab}>
                        <div className="tabpage">
                            <ReaderRecordings dedaId={dedaId} />
                        </div>
                    </main>
                );
            default:
                return (
                    <main className="scroll" tabIndex={-1} key={activeTab}>
                        <NotesTab dedaId={dedaId} />
                    </main>
                );
        }
    })();

    return (
        <TextSizeContext.Provider value={textSize}>
            <Shell
                className={`deda-reader ${uiFont.className}`}
                data-reader-theme="dark"
                style={{ '--r-read-font': readFont.style.fontFamily } as React.CSSProperties}
            >
                <Global styles={readerTokens} />
                <header className="strip">
                    {/* eslint-disable-next-line @next/next/no-img-element -- fundo decorativo */}
                    {stripBg && <img className="bg" src={stripBg} alt="" aria-hidden />}
                    <span className="shade" aria-hidden />
                    <button type="button" className="ib" aria-label="Menu" onClick={openShellMenu}>
                        <MenuIcon {...ICON} />
                    </button>
                    <button
                        type="button"
                        className="idb"
                        onClick={() => (isMobile ? setTabsOpen(true) : onTab(tabs[0].key))}
                        aria-haspopup={isMobile ? 'dialog' : undefined}
                        aria-label={isMobile ? `${title ?? 'DEDA'}. Open sections` : `Back to ${tabs[0].label}`}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element -- miniatura do Contentful */}
                        {thumb && <img src={thumb} alt="" />}
                        <span>
                            <b>
                                <span>{title}</span>
                                {isMobile && <ChevronDown {...ICON} size={16} aria-hidden />}
                            </b>
                            {weekDay && <small>{weekDay}</small>}
                        </span>
                    </button>
                    {!isMobile && (
                        <nav
                            className="tabs"
                            aria-label="DEDA sections"
                            style={reviews === undefined ? { visibility: 'hidden' } : undefined}
                        >
                            {tabButtons()}
                        </nav>
                    )}
                    <span className="sp" />
                    {/* cronômetro do estudo (DedaReaderStudy) entra aqui */}
                    <span ref={setTimerSlot} style={{ display: 'contents' }} />
                    {(study || activeTab === tabs[0].key) && <TextSize {...textSize} />}
                    {!study && activeTab === tabs[0].key && (
                        <button
                            type="button"
                            className="ib"
                            aria-label="Quote"
                            aria-haspopup="dialog"
                            onClick={() => setQuoteOpen(true)}
                        >
                            <Quote {...ICON} />
                        </button>
                    )}
                    {study &&
                        (isMobile ? (
                            <button
                                type="button"
                                className="ib"
                                aria-label="Glossary"
                                onClick={() => setGlossaryOpen(true)}
                            >
                                <BookOpen {...ICON} />
                            </button>
                        ) : (
                            <button type="button" className="btn ghost" onClick={() => setGlossaryOpen(true)}>
                                <BookOpen {...ICON} aria-hidden />
                                Glossary
                            </button>
                        ))}
                    {!isMobile && onClassic && (
                        <button type="button" className="lnk" onClick={onClassic}>
                            Classic view
                        </button>
                    )}
                </header>

                {body}

                <Drawer
                    {...drawerProps}
                    open={glossaryOpen}
                    onClose={() => setGlossaryOpen(false)}
                    placement={isMobile ? 'bottom' : 'right'}
                    width={isMobile ? undefined : 420}
                    height={isMobile ? '86%' : undefined}
                    title="Glossary"
                >
                    <DrawerBody className="glossary">
                        {glossary ? (
                            <ReaderProse rawContent={glossary.json} links={glossary.links as never} />
                        ) : (
                            <p className="hint">Loading…</p>
                        )}
                    </DrawerBody>
                </Drawer>

                <Drawer
                    {...drawerProps}
                    open={tabsOpen}
                    onClose={() => setTabsOpen(false)}
                    placement="bottom"
                    height="auto"
                    title={
                        <span className="sheet-title">
                            <b>{title}</b>
                            {weekDay && <small>{weekDay}</small>}
                        </span>
                    }
                >
                    <DrawerBody>
                        <div className="menu">{tabButtons()}</div>
                        {onClassic && (
                            <div className="menu">
                                <hr />
                                <button type="button" onClick={onClassic}>
                                    Classic view
                                </button>
                            </div>
                        )}
                    </DrawerBody>
                </Drawer>

                <Drawer
                    {...drawerProps}
                    open={quoteOpen}
                    onClose={() => setQuoteOpen(false)}
                    placement={isMobile ? 'bottom' : 'right'}
                    width={isMobile ? undefined : 420}
                    height={isMobile ? 'auto' : undefined}
                    afterOpenChange={(open) => !open && setQuoteNote(null)}
                    title={
                        quoteNote ? (
                            <span className="sheet-back" lang="en">
                                <button
                                    type="button"
                                    className="ib"
                                    aria-label="Back to the quote"
                                    onClick={() => setQuoteNote(null)}
                                >
                                    <ChevronLeft {...ICON} aria-hidden />
                                </button>
                                {quoteNote.term}
                            </span>
                        ) : (
                            'Quote'
                        )
                    }
                >
                    {/* a citação continua montada (não recarrega ao voltar); a nota entra no lugar dela */}
                    <DrawerBody className="quote" hidden={!!quoteNote}>
                        <ContextNoteHost.Provider value={setQuoteNote}>
                            <DedaQuote dedaId={dedaId} />
                        </ContextNoteHost.Provider>
                    </DrawerBody>
                    {quoteNote && (
                        <DrawerBody className="note" key={quoteNote.id}>
                            <ContextNoteBody note={quoteNote} />
                        </DrawerBody>
                    )}
                </Drawer>
            </Shell>
        </TextSizeContext.Provider>
    );
};

export default DedaReaderPage;
