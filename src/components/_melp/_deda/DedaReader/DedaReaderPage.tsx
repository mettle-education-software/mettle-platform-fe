'use client';

import { Global } from '@emotion/react';
import { ExpandMore, Menu as MenuIcon, MenuBookOutlined } from '@mui/icons-material';
import { Drawer } from 'antd';
import { DedaQuote, DedaReview, RichTextRenderer } from 'components';
import { DedaHeaderBackdrop } from 'components/_melp/_deda/DedaHeaderBackdrop/DedaHeaderBackdrop';
import { LinKnowledge } from 'components/_melp/_deda/DedaNotes/LinKnowledge/LinKnowledge';
import { MyRecordings } from 'components/_melp/_deda/DedaRecorder/MyRecordings';
import { useDeviceSize } from 'hooks';
import { useDeda } from 'hooks/queries/dedaQueries';
import { DedaNotesQueryResponse } from 'interfaces';
import { handleLogout } from 'libs';
import { contentfulImage, HEADER_GRADIENT } from 'libs/dedaHeader';
import { writeDayToday } from 'libs/dedaReader';
import { useRouter } from 'next/navigation';
import { useMelpContext } from 'providers';
import React, { useEffect, useState } from 'react';
import { font as uiFont } from 'themes/font';
import { DedaReaderStudy, readFont } from './DedaReaderStudy';
import { ReaderProse } from './ReaderProse';
import { DrawerBody, readerTokens, Shell } from './readerStyles';

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
    onClassic(): void;
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

/** Aba DEDA Notes: cabeçalho expandido (recolhe ao rolar), sub-abas e o conteúdo. */
const NotesTab = ({
    dedaId,
    title,
    headerImages,
    isMobile,
}: {
    dedaId: string;
    title?: string;
    headerImages: HeaderImage[];
    isMobile: boolean;
}) => {
    const [section, setSection] = useState<NotesSection>('introduction');
    return (
        <>
            <section className="hero" aria-label={title}>
                <DedaHeaderBackdrop images={headerImages} gradient={HEADER_GRADIENT} />
                {!isMobile && (
                    <div className="hero-in">
                        <h1>{title}</h1>
                        <div className="quote">
                            <DedaQuote dedaId={dedaId} />
                        </div>
                    </div>
                )}
            </section>
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
            {section === 'linknowledge' ? (
                <div className="lk">
                    <LinKnowledge dedaId={dedaId} />
                </div>
            ) : (
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
    tabs,
    activeTab,
    onTab,
    onClassic,
}) => {
    const router = useRouter();
    const isMobile = useDeviceSize() === 'mobile';
    const { melpSummary } = useMelpContext();
    const [menuOpen, setMenuOpen] = useState(false);
    const [glossaryOpen, setGlossaryOpen] = useState(false);
    const [tabsOpen, setTabsOpen] = useState(false);
    const [timerSlot, setTimerSlot] = useState<HTMLSpanElement | null>(null);

    // Notas de contexto (ContextNote, fora da árvore) no escuro do leitor enquanto a página nova está aberta.
    useEffect(() => {
        document.body.classList.add('deda-reader-shell-on');
        return () => document.body.classList.remove('deda-reader-shell-on');
    }, []);

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
    };

    const body = (() => {
        switch (activeTab) {
            case 'dedaActivity':
                return <DedaReaderStudy dedaId={dedaId} timerSlot={timerSlot} />;
            case 'dedaReview':
                return (
                    <main className="scroll" tabIndex={-1} key={activeTab}>
                        <div className="tabpage r-review">
                            <DedaReview dedaId={dedaId} />
                        </div>
                    </main>
                );
            case 'dedaRecordings':
                return (
                    <main className="scroll" tabIndex={-1} key={activeTab}>
                        <div className="tabpage r-recs">
                            <MyRecordings dedaId={dedaId} dedaTitle={title} coverSrc={coverUrl} />
                        </div>
                    </main>
                );
            default:
                return (
                    <main className="scroll" tabIndex={-1} key={activeTab}>
                        <NotesTab dedaId={dedaId} title={title} headerImages={headerImages} isMobile={isMobile} />
                    </main>
                );
        }
    })();

    return (
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
                <button type="button" className="ib" aria-label="Menu" onClick={() => setMenuOpen(true)}>
                    <MenuIcon />
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
                            {title}
                            {isMobile && <ExpandMore fontSize="small" aria-hidden />}
                        </b>
                        {weekDay && <small>{weekDay}</small>}
                    </span>
                </button>
                {!isMobile && (
                    <nav className="tabs" aria-label="DEDA sections">
                        {tabButtons()}
                    </nav>
                )}
                <span className="sp" />
                {/* cronômetro do estudo (DedaReaderStudy) entra aqui */}
                <span ref={setTimerSlot} style={{ display: 'contents' }} />
                {study &&
                    (isMobile ? (
                        <button
                            type="button"
                            className="ib"
                            aria-label="Glossary"
                            onClick={() => setGlossaryOpen(true)}
                        >
                            <MenuBookOutlined />
                        </button>
                    ) : (
                        <button type="button" className="btn line" onClick={() => setGlossaryOpen(true)}>
                            <MenuBookOutlined aria-hidden />
                            Glossary
                        </button>
                    ))}
                {!isMobile && (
                    <button type="button" className="lnk" onClick={onClassic}>
                        Classic view
                    </button>
                )}
            </header>

            {body}

            <Drawer
                {...drawerProps}
                open={menuOpen}
                onClose={() => setMenuOpen(false)}
                placement="left"
                width={290}
                title="Menu"
            >
                <DrawerBody>
                    <div className="menu">
                        <button type="button" onClick={() => router.push('/')}>
                            Início
                        </button>
                        <button type="button" aria-current="page" onClick={() => router.push('/imerso')}>
                            IMERSO
                        </button>
                        <button type="button" onClick={() => router.push('/settings')}>
                            Ajustes
                        </button>
                        <button type="button" onClick={() => handleLogout()}>
                            Sair
                        </button>
                    </div>
                </DrawerBody>
            </Drawer>

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
                title={[title, weekDay].filter(Boolean).join(' · ')}
            >
                <DrawerBody>
                    <div className="menu">{tabButtons()}</div>
                    <div className="menu">
                        <hr />
                        <button type="button" onClick={onClassic}>
                            Classic view
                        </button>
                    </div>
                </DrawerBody>
            </Drawer>
        </Shell>
    );
};

export default DedaReaderPage;
