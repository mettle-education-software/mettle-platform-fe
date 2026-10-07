'use client';

import styled from '@emotion/styled';
import { Drawer } from 'antd';
import { LessonVideo } from 'components';
import { ReaderProse } from 'components/_melp/_deda/DedaReader/ReaderProse';
import { TextSize } from 'components/_melp/_deda/DedaReader/TextSize';
import { readFont, uiFont } from 'components/_melp/_deda/DedaReader/readerFonts';
import { useGetHpecResources } from 'hooks/queries/hpecQueries';
import useGetLessonContent from 'hooks/queries/useGetLessonContent';
import { useDeviceSize } from 'hooks/useDeviceSize';
import { fileTypes, saveFile } from 'libs';
import { readTextScale, saveTextScale } from 'libs/dedaReader';
import { WATCHED_AT } from 'libs/hpecTrail';
import {
    CourseModule,
    fileSizeLabel,
    isModuleOpen,
    lessonIdFromPath,
    lessonNeighbours,
    lockedModuleOf,
    lockedNotes,
    readLessonRailCollapsed,
    readOpenModules,
    saveLessonRailCollapsed,
    saveOpenModules,
} from 'libs/newDesign';
import {
    ArrowRight,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Download,
    File,
    FileArchive,
    FileImage,
    FileSpreadsheet,
    FileText,
    List,
    Lock,
    PanelLeftClose,
    PanelLeftOpen,
    Presentation,
    X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ICON, UI_FONT_VAR, ui } from 'themes/newDesign';
import { NewPage } from './NewPage';

/* ---------- textos da interface (Imerso em inglês; cursos gerais em português, como hoje) ---------- */

const TEXTS = {
    en: {
        video: 'Video',
        summary: 'Summary',
        resources: 'Resources',
        lessons: 'Lessons',
        previous: 'Previous lesson',
        next: 'Next lesson',
        nextUp: 'Next',
        unlocked: (n: number, total: number) => `${n} of ${total} lessons unlocked`,
        lessonOf: (n: number, total: number) => `Lesson ${n} of ${total}`,
        locked: 'This lesson is not available yet',
        missing: 'This lesson does not exist',
        missingHint: 'It may have moved. Pick a lesson from the list.',
        goLatest: 'Go to the latest lesson',
        goFirst: 'Go to the first lesson',
        noVideo: 'This lesson has no video',
        noSummary: 'This lesson has no text',
        download: 'Download',
        close: 'Close',
    },
    pt: {
        video: 'Vídeo',
        summary: 'Texto',
        resources: 'Material',
        lessons: 'Aulas',
        previous: 'Aula anterior',
        next: 'Próxima aula',
        nextUp: 'A seguir',
        unlocked: (n: number, total: number) => `${n} de ${total} aulas liberadas`,
        lessonOf: (n: number, total: number) => `Aula ${n} de ${total}`,
        locked: 'Esta aula ainda não está disponível',
        missing: 'Esta aula não existe',
        missingHint: 'Ela pode ter mudado de lugar. Escolha uma aula na lista.',
        goLatest: 'Ir para a aula mais recente',
        goFirst: 'Ir para a primeira aula',
        noVideo: 'Esta aula não tem vídeo',
        noSummary: 'Esta aula não tem texto',
        download: 'Baixar',
        close: 'Fechar',
    },
} as const;

type Lang = keyof typeof TEXTS;
type Tab = 'video' | 'summary' | 'resources';

/* ---------- estilos ---------- */

const Wrap = styled.div`
    ${ui};
    /* anel de foco explícito (um estilo global de links vence o :focus-visible geral); por dentro, para o trilho
       (overflow) não cortar */
    a:focus-visible {
        outline: 2px solid var(--r-gold-hi);
        outline-offset: -2px;
    }
    display: grid;
    grid-template-columns: 300px minmax(0, 1fr);
    min-height: 100%;
    transition: grid-template-columns var(--r-ease);

    &.norail {
        grid-template-columns: 0 minmax(0, 1fr);
    }
    &.norail .rail {
        visibility: hidden;
        opacity: 0;
    }

    /* ---------- trilho de aulas ---------- */
    .rail {
        position: sticky;
        top: 0;
        align-self: start;
        height: 100vh;
        height: 100dvh;
        overflow-y: auto;
        overflow-x: hidden;
        border-right: 1px solid var(--r-line);
        background: var(--r-bg2);
        scrollbar-width: thin;
        scrollbar-color: var(--r-track) transparent;
        transition:
            opacity var(--r-ease),
            visibility var(--r-ease);
    }
    .rhead {
        padding: 28px 24px 18px;
    }
    .rhead h2 {
        margin-top: 6px;
        font-size: 17px;
        font-weight: 500;
        letter-spacing: 0.01em;
    }
    .prog {
        margin-top: 14px;
    }
    .prog small {
        display: block;
        font-size: 12.5px;
        letter-spacing: 0.01em;
        color: var(--r-muted);
    }
    .prog span {
        display: block;
        height: 2px;
        margin-top: 8px;
        border-radius: 1px;
        background: var(--r-track);
        overflow: hidden;
    }
    .prog i {
        display: block;
        height: 100%;
        background: var(--r-gold);
        transition: width 400ms ease;
    }
    .mods {
        padding: 0 0 24px;
    }
    .mod {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        min-height: 44px;
        margin: 6px 0 0;
        padding: 0 20px 0 24px;
        border: 0;
        background: none;
        font-size: var(--r-label-size);
        font-weight: 500;
        letter-spacing: var(--r-label-track);
        text-transform: uppercase;
        line-height: 1.4;
        text-align: left;
        color: var(--r-muted);
        cursor: pointer;
    }
    .mod:hover {
        color: var(--r-text);
    }
    .mod > span {
        flex: 1 1 auto;
        min-width: 0;
    }
    .mod svg {
        flex: none;
        transition: transform var(--r-ease);
    }
    .mod[aria-expanded='false'] svg {
        transform: rotate(-90deg);
    }
    /* trancado: cadeado + uma linha discreta (o texto de liberação só quando muda) */
    .lockd {
        display: grid;
        grid-template-columns: 14px minmax(0, 1fr);
        gap: 2px 10px;
        align-items: center;
        margin: 0;
        padding: 10px 24px;
        font-size: 13.5px;
        line-height: 1.35;
        color: var(--r-faint);
    }
    .lockd small {
        grid-column: 2;
        font-size: 12px;
        letter-spacing: 0.01em;
    }
    .mods ul {
        list-style: none;
        margin: 0;
        padding: 0;
    }
    .mods li a {
        position: relative;
        display: grid;
        grid-template-columns: 24px minmax(0, 1fr);
        gap: 10px;
        align-items: center;
        min-height: 44px;
        padding: 8px 24px 8px 22px;
        border-left: 2px solid transparent;
        color: var(--r-muted);
        font-size: 14px;
        line-height: 1.35;
        text-decoration: none;
        transition:
            color var(--r-ease),
            background-color var(--r-ease);
    }
    .mods li a:hover {
        color: var(--r-text);
        background: var(--r-hover);
    }
    .mods li a[aria-current='page'] {
        color: var(--r-text);
        border-left-color: var(--r-gold);
        background: var(--r-gold-tint);
    }
    .mods li a .n {
        font-size: 12px;
        font-variant-numeric: tabular-nums;
        color: var(--r-muted);
        text-align: right;
    }
    .mods li a[aria-current='page'] .n {
        color: var(--r-text);
    }
    .mods li.skel {
        height: 44px;
        margin: 0 24px;
        border-radius: 8px;
        background: var(--r-surf);
        opacity: 0.6;
    }

    /* ---------- conteúdo ---------- */
    /* coluna central: título, abas e texto na MESMA largura de leitura (--r-col), centrada na área à direita da lista; o vídeo
       pode ser mais largo (até a largura do corpo) */
    .body {
        min-width: 0;
        width: 100%;
        max-width: 1040px;
        margin: 0 auto;
        padding: 20px 40px 72px;
    }
    .body .lh,
    .body .tabs,
    .body #lesson-summary,
    .body #lesson-resources {
        max-width: var(--r-col);
        margin-left: auto;
        margin-right: auto;
    }
    /* na aba Video o cabeçalho tem a largura e a borda esquerda do vídeo (o resumo e os recursos seguem a coluna de leitura) */
    .body[data-tab='video'] .lh,
    .body[data-tab='video'] .tabs {
        max-width: none;
    }
    /* troca de aula: o miolo novo entra com um esmaecer curto; enquanto chega, o anterior fica esmaecido */
    .swap {
        animation: r-lesson-in 160ms ease-out;
        transition: opacity 120ms ease;
    }
    .swap.stale {
        opacity: 0.5;
        pointer-events: none;
    }
    @keyframes r-lesson-in {
        from {
            opacity: 0.4;
        }
    }
    .lh {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 0 0 18px;
    }
    .lh .ib {
        margin-left: -12px;
        color: var(--r-muted);
    }
    .lh .ib:hover {
        color: var(--r-text);
    }
    .lh .ttl {
        flex: 1 1 auto;
        min-width: 0;
    }
    .lh .eyebrow {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    /* "módulo" cede (reticências); "Lesson n of N" nunca é cortado */
    .lh .eyebrow.eb {
        display: flex;
    }
    .lh .eb-lead {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .lh .eb-tail {
        flex: none;
        white-space: pre;
    }
    .lh h1 {
        margin-top: 4px;
        font-size: 22px;
        overflow-wrap: anywhere;
    }
    .lh .pn {
        display: flex;
        flex: none;
        gap: 2px;
        margin-right: -12px;
    }
    .lh .pn .ib {
        margin: 0;
    }
    .lh .pn .ib:disabled {
        opacity: 0.3;
        cursor: default;
        background: none;
    }

    .lh .hd-tabs {
        display: none;
    }
    /* computador largo: as abas sobem para a linha do título (tira ~70 px entre o título e o vídeo). Aqui o limite é 1280 px, não
       1024: ao lado da barra lateral e da lista de aulas, 1024 deixaria o título espremido */
    @media (min-width: 1280px) {
        .lh .hd-tabs {
            display: block;
            flex: none;
        }
        .lh .hd-tabs .seg {
            margin: 0;
        }
        .tabs .seg {
            display: none;
        }
        .tabs:not(:has(.tools)) {
            display: none;
        }
        .body .tabs {
            justify-content: flex-end;
        }
    }
    /* abas + "Aa" na mesma linha */
    .tabs {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin: 0 0 24px;
    }
    .tabs .seg {
        flex: 0 1 auto;
        margin: 0;
    }
    .tabs .tools {
        flex: none;
        display: flex;
        align-items: center;
        margin-right: -10px;
    }
    .tabs .tools .ib {
        color: var(--r-muted);
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

    /* vídeo (o componente atual, com os mesmos eventos de progresso) */
    .video {
        margin: 0 0 24px;
    }
    .video iframe {
        display: block;
        border-radius: var(--r-radius);
        background: var(--r-video-bg);
    }
    .video h5 {
        display: none;
    }
    .video .ant-skeleton {
        aspect-ratio: 16 / 9;
    }

    /* leitura: a mesma coluna e a mesma tipografia da página do DEDA */
    --r-read-size: calc(20px * var(--r-scale, 1));
    --r-read-line: 1.7;
    --r-read-measure: 33.5em;
    --r-col: calc(33.5 * var(--r-read-size));
    .prose {
        font-family: var(--r-read-font), system-ui, sans-serif;
        font-size: var(--r-read-size);
        line-height: var(--r-read-line);
        color: var(--r-text);
        max-width: var(--r-read-measure);
        margin: 0 auto;
        text-align: left;
        overflow-wrap: break-word;
    }
    .prose p {
        margin: 0 0 1.15em;
        white-space: break-spaces;
    }
    .prose h2,
    .prose h3,
    .prose h4 {
        color: var(--r-text);
        margin: 1.2em 0 0.5em;
        font-size: 1.15em;
        line-height: 1.3;
        font-weight: 600;
    }
    .prose ul,
    .prose ol {
        margin: 0 0 1.15em;
        padding-left: 1.4em;
    }
    .prose a {
        color: var(--r-gold-hi);
        text-decoration: underline;
    }
    .prose .embed {
        display: block;
        max-width: 100%;
        height: auto;
        margin: 1em auto;
        border-radius: var(--r-radius);
    }
    .prose .term {
        cursor: pointer;
        text-decoration: underline dotted;
        text-decoration-thickness: 1.5px;
        text-underline-offset: 5px;
        text-decoration-color: var(--r-gold-hi);
        border-radius: 2px;
    }
    .prose .term:hover,
    .prose .term[aria-expanded='true'] {
        background: var(--r-gold-tint);
    }
    .inote {
        position: relative;
        margin: -0.3em 0 1.3em;
        padding: 14px 48px 14px 18px;
        border: 1px solid var(--r-line);
        border-left: 1px solid var(--r-gold);
        background: var(--r-surf);
        border-radius: var(--r-radius);
        font-size: calc(15.5px * var(--r-scale, 1));
        line-height: 1.55;
    }
    .inote h4 {
        margin: 0 0 4px;
        font-size: calc(15px * var(--r-scale, 1));
        font-weight: 600;
    }
    .inote h4 small {
        margin-left: 8px;
        font-size: var(--r-label-size);
        font-weight: 500;
        letter-spacing: var(--r-label-track);
        text-transform: uppercase;
        color: var(--r-muted);
    }
    .inote p {
        margin: 0 0 0.6em;
    }
    .inote p:last-of-type {
        margin: 0;
    }
    .inote .inote-img {
        width: 100%;
        height: auto;
        border-radius: 8px;
        margin: 6px 0 10px;
    }
    .inote .inote-x {
        position: absolute;
        right: 2px;
        top: 2px;
        color: var(--r-muted);
    }

    /* resources: lista limpa */
    .res {
        list-style: none;
        margin: 0;
        padding: 0;
        max-width: 640px;
        border-top: 1px solid var(--r-line);
    }
    .res li {
        border-bottom: 1px solid var(--r-line);
    }
    .res button {
        display: grid;
        grid-template-columns: 24px minmax(0, 1fr) 24px;
        gap: 16px;
        align-items: center;
        width: 100%;
        min-height: 60px;
        padding: 10px 4px;
        border: 0;
        background: none;
        color: var(--r-text);
        text-align: left;
        font: inherit;
        cursor: pointer;
        border-radius: 8px;
    }
    .res button:hover {
        background: var(--r-hover);
    }
    .res button > svg:first-of-type {
        color: var(--r-gold-hi);
    }
    .res button > svg:last-of-type {
        color: var(--r-faint);
        transition: color var(--r-ease);
    }
    .res button:hover > svg:last-of-type {
        color: var(--r-text);
    }
    .res b {
        display: block;
        font-size: 14.5px;
        font-weight: 500;
        line-height: 1.35;
    }
    .res small {
        display: block;
        margin-top: 2px;
        font-size: 12.5px;
        letter-spacing: 0.01em;
        color: var(--r-muted);
    }

    /* estados curtos: aula trancada, inexistente, sem vídeo/texto */
    .state {
        display: grid;
        justify-items: start;
        gap: 10px;
        max-width: 36em;
        padding: 40px 0;
    }
    .state svg {
        color: var(--r-faint);
    }
    .state h1 {
        font-size: 22px;
    }
    .state p {
        font-size: 14.5px;
        line-height: 1.5;
        color: var(--r-muted);
    }
    .state .btn {
        margin-top: 8px;
    }
    .empty {
        padding: 24px 0;
        font-size: 14.5px;
        color: var(--r-muted);
    }

    /* próxima aula ao fim do conteúdo */
    .after {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: flex-end;
        gap: 12px 16px;
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid var(--r-line);
    }
    .after .btn {
        max-width: 100%;
    }
    /* "concluída" à esquerda, próxima aula à direita */
    .after .done-toggle {
        margin-right: auto;
    }
    .after .done-toggle[aria-pressed='true'] {
        border-color: transparent;
        background: var(--r-gold-tint);
        color: var(--r-gold-hi);
    }
    .after .btn span {
        overflow: hidden;
        text-overflow: ellipsis;
    }

    /* ---------- celular: lista numa folha; conteúdo em coluna com o vídeo no topo ---------- */
    @media (max-width: 860px) {
        grid-template-columns: minmax(0, 1fr);
        --r-read-size: calc(18px * var(--r-scale, 1));
        --r-read-line: 1.66;

        .rail {
            display: none;
        }
        .body {
            padding: 12px 20px 48px;
        }
        .lh {
            margin-bottom: 14px;
        }
        .lh h1 {
            font-size: 19px;
        }
        .tabs {
            margin-bottom: 20px;
        }
        .video {
            margin: 0 -20px 18px;
        }
        .video iframe {
            border-radius: 0;
        }
        .res button {
            gap: 12px;
        }
        .after {
            margin-top: 32px;
        }
        .after .btn {
            width: 100%;
        }
    }
`;

/* ---------- troca de aula no lugar ---------- */

/**
 * Link entre aulas do mesmo curso: troca a aula no lugar (history.pushState, que o roteador do Next acompanha —
 * endereço, voltar/avançar e recarregar seguem iguais), sem remontar a página: trilho, cabeçalho e casca ficam e só o
 * miolo troca. Ctrl/⌘/Shift/clique do meio: comportamento normal do link.
 */
const LessonLink: React.FC<Omit<React.ComponentProps<typeof Link>, 'href'> & { href: string }> = ({
    href,
    onClick,
    ...rest
}) => {
    return (
        <Link
            {...rest}
            href={href}
            prefetch={false}
            onClick={(event) => {
                onClick?.(event);
                if (event.defaultPrevented || event.button !== 0) return;
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                event.preventDefault();
                if (href !== window.location.pathname) window.history.pushState(null, '', href);
            }}
        />
    );
};

/* ---------- lista de aulas (trilho no computador, folha no celular) ---------- */

const RailList: React.FC<{
    t: (typeof TEXTS)[Lang];
    course: { eyebrow?: string; title: string };
    modules: CourseModule[];
    loading: boolean;
    lessonId: string;
    progress?: { unlocked: number; total: number };
    onPick?: () => void;
}> = ({ t, course, modules, loading, lessonId, progress, onPick }) => {
    const currentModuleId = modules.find((m) => m.lessons.some((l) => l.id === lessonId))?.id;
    const notes = lockedNotes(modules);
    // Lido antes da primeira pintura (sem piscar): o que o aluno abriu/fechou neste aparelho.
    const [saved, setSaved] = useState<Record<string, boolean>>({});
    useLayoutEffect(() => setSaved(readOpenModules()), []);
    const toggle = (id: string) =>
        setSaved((previous) => {
            const next = { ...previous, [id]: !isModuleOpen(previous, id, currentModuleId) };
            saveOpenModules(next);
            return next;
        });
    let n = 0;
    return (
        <>
            <div className="rhead">
                {course.eyebrow && <p className="eyebrow">{course.eyebrow}</p>}
                <h2>{course.title}</h2>
                {progress && progress.total > 0 && (
                    <div className="prog" aria-label={t.unlocked(progress.unlocked, progress.total)}>
                        <small>{t.unlocked(progress.unlocked, progress.total)}</small>
                        <span aria-hidden>
                            <i style={{ width: `${Math.round((progress.unlocked / progress.total) * 100)}%` }} />
                        </span>
                    </div>
                )}
            </div>
            <nav className="mods" aria-label={t.lessons} aria-busy={loading || undefined}>
                {loading && (
                    <ul>
                        {[0, 1, 2, 3, 4].map((i) => (
                            <li key={i} className="skel" aria-hidden />
                        ))}
                    </ul>
                )}
                {modules.map((m, i) => {
                    if (m.locked)
                        return (
                            <p key={m.id} className="lockd">
                                <Lock {...ICON} size={14} aria-label="Locked" />
                                <span>{m.title}</span>
                                {notes[i] && <small>{notes[i]}</small>}
                            </p>
                        );
                    const open = isModuleOpen(saved, m.id, currentModuleId);
                    const first = n;
                    n += m.lessons.length;
                    return (
                        <React.Fragment key={m.id}>
                            <button
                                type="button"
                                className="mod"
                                aria-expanded={open}
                                aria-controls={open ? `mod-${m.id}` : undefined}
                                onClick={() => toggle(m.id)}
                            >
                                <span>{m.title}</span>
                                <ChevronDown {...ICON} size={16} aria-hidden />
                            </button>
                            {open && (
                                <ul id={`mod-${m.id}`}>
                                    {m.lessons.map((l, j) => (
                                        <li key={l.id}>
                                            <LessonLink
                                                href={l.href}
                                                aria-current={l.id === lessonId ? 'page' : undefined}
                                                onClick={onPick}
                                            >
                                                <span className="n" aria-hidden>
                                                    {first + j + 1}
                                                </span>
                                                <span>{l.title}</span>
                                            </LessonLink>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </React.Fragment>
                    );
                })}
            </nav>
        </>
    );
};

const resourceIcon = (contentType: string) => {
    if (contentType === 'application/pdf' || /word|text\//.test(contentType)) return FileText;
    if (contentType.startsWith('image/')) return FileImage;
    if (/zip|rar|octet/.test(contentType)) return FileArchive;
    if (/presentation|powerpoint/.test(contentType)) return Presentation;
    if (/sheet|excel/.test(contentType)) return FileSpreadsheet;
    return File;
};

/* ---------- molde ---------- */

export interface NewLessonProps {
    course: { eyebrow?: string; title: string };
    modules: CourseModule[];
    modulesLoading: boolean;
    lessonId: string;
    progress?: { unlocked: number; total: number };
    lang: Lang;
    /** Imerso expirado: o conteúdo dá lugar ao convite (a mesma peça das três abas atuais). */
    lockedContent?: React.ReactNode;
    /** Vídeo assistido (90% ou fim): o curso decide o que fazer (HPEC: marca a aula como concluída). */
    onWatched?: (lessonId: string) => void;
    /** Controle "concluída" da aula (HPEC), ao lado da próxima aula. */
    doneToggle?: (lessonId: string) => React.ReactNode;
}

/**
 * Molde de aula dos Cursos (HPEC, Masterclass e os próximos): trilho de aulas à esquerda (recolhível) + conteúdo
 * ao centro com medida de linha; no celular, lista numa folha e conteúdo em coluna com o vídeo no topo. Só
 * apresentação: mesmos hooks, mesmas chamadas e os mesmos eventos de progresso do vídeo (LessonVideo).
 */
export const NewLesson: React.FC<NewLessonProps> = ({
    course,
    modules,
    modulesLoading,
    lessonId: routeLessonId,
    progress,
    lang,
    lockedContent,
    onWatched,
    doneToggle,
}) => {
    const t = TEXTS[lang];
    const isMobile = useDeviceSize() === 'mobile';
    // A aula vem do endereço: a troca de aula (LessonLink) muda só o endereço, e a página não remonta.
    const lessonId = lessonIdFromPath(usePathname(), routeLessonId);
    const { data: lessonData, previousData, loading } = useGetLessonContent(lessonId);
    const { data: resData, previousData: previousRes } = useGetHpecResources(lessonId);
    // Enquanto a aula nova chega, a anterior continua na tela (esmaecida), sem quadro vazio.
    const data = lessonData ?? (loading ? previousData : undefined);
    const switching = !lessonData && loading && !!previousData;

    // Preferências lidas já no primeiro quadro (antes: lidas depois de pintar, o trilho "pulava").
    const [railCollapsed, setRailCollapsed] = useState(
        () => typeof window !== 'undefined' && readLessonRailCollapsed(),
    );
    const [sheet, setSheet] = useState(false);
    const [tab, setTab] = useState<Tab>('video');
    // Cada aula abre no vídeo (a vista principal): a escolha Vídeo/Resumo vale só dentro da aula atual.
    useEffect(() => setTab('video'), [lessonId]);
    const [scale, setScale] = useState(() => (typeof window !== 'undefined' ? readTextScale() : 1));
    const wrapRef = useRef<HTMLDivElement>(null);
    const firstLesson = useRef(lessonId);
    // "?play" (vindo do "Agora" da home do IMERSO): a aula de entrada já toca; as seguintes, não
    const [playOnOpen] = useState(() => typeof window !== 'undefined' && /[?&]play\b/.test(window.location.search));
    useEffect(() => {
        setSheet(false);
        // aula nova: volta ao topo (a troca no lugar não passa pelo roteador, que faria isso)
        if (lessonId !== firstLesson.current) wrapRef.current?.closest('.main')?.scrollTo({ top: 0 });
    }, [lessonId]);

    const lesson = data?.singleLessonCollection?.items[0];
    // aula na tela (a anterior, enquanto a nova chega): o vídeo só troca quando a nova estiver pronta
    const shownId = lesson?.lessonId ?? lessonId;
    const files =
        (resData ?? (switching ? previousRes : undefined))?.singleLessonCollection?.items[0]?.lessonResourcesCollection
            .items ?? [];
    const hasVideo = !!lesson?.lessonVideoEmbedUrl;
    const hasResources = files.length > 0;
    const { current, previous, next, position, total } = lessonNeighbours(modules, lessonId);
    const lockedModule = lockedModuleOf(modules, lessonId);
    const open = modules.filter((m) => !m.locked).flatMap((m) => m.lessons);
    const latest = open[open.length - 1];

    // a aba de vídeo só existe no computador e só quando a aula tem vídeo; a de resources só quando há arquivos
    const tabs: Tab[] = [
        ...(hasVideo && !isMobile ? (['video'] as Tab[]) : []),
        'summary',
        ...(hasResources ? (['resources'] as Tab[]) : []),
    ];
    const active: Tab = tabs.includes(tab) ? tab : 'summary';

    const onScale = (value: number) => {
        setScale(value);
        saveTextScale(value);
    };
    const toggleRail = () =>
        setRailCollapsed((previousValue) => {
            saveLessonRailCollapsed(!previousValue);
            return !previousValue;
        });

    // celular: módulo e posição (o nome do curso está na folha); trilho recolhido: curso · módulo · aula n de N
    // "curso · módulo" (cede espaço, com reticências) + "aula n de N" (nunca é cortado)
    const eyebrowLead = (isMobile ? [current?.module.title] : [railCollapsed && course.title, current?.module.title])
        .filter(Boolean)
        .join(' · ');
    const eyebrowTail = current ? (isMobile ? `${position}/${total}` : t.lessonOf(position, total)) : '';
    const eyebrow = [eyebrowLead, eyebrowTail].filter(Boolean).join(' · ');

    const list = (
        <RailList
            t={t}
            course={course}
            modules={modules}
            loading={modulesLoading}
            lessonId={lessonId}
            progress={progress}
            onPick={() => setSheet(false)}
        />
    );

    // Abas do curso: a partir de 1024 px ficam na linha do título (cabeçalho); abaixo, sob o título/vídeo (corpo). Os dois
    // lugares existem no DOM e o CSS esconde um deles (display: none sai da árvore de acessibilidade e do foco).
    const tabsEl = (
        <div className="seg" role="tablist" aria-label={course.title}>
            {tabs.map((key) => (
                <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={key === active}
                    aria-controls={`lesson-${key}`}
                    onClick={() => setTab(key)}
                >
                    {t[key]}
                </button>
            ))}
        </div>
    );

    const header = (
        <header className="lh">
            {isMobile ? (
                <button type="button" className="ib" aria-label={t.lessons} onClick={() => setSheet(true)}>
                    <List {...ICON} />
                </button>
            ) : (
                <button
                    type="button"
                    className="ib"
                    aria-label={t.lessons}
                    aria-expanded={!railCollapsed}
                    onClick={toggleRail}
                >
                    {railCollapsed ? <PanelLeftOpen {...ICON} /> : <PanelLeftClose {...ICON} />}
                </button>
            )}
            <div className="ttl">
                {eyebrow && (
                    <p className="eyebrow eb" aria-label={eyebrow}>
                        {eyebrowLead && <span className="eb-lead">{eyebrowLead}</span>}
                        {eyebrowTail && (
                            <span className="eb-tail">{eyebrowLead ? ` · ${eyebrowTail}` : eyebrowTail}</span>
                        )}
                    </p>
                )}
                <h1>{(switching ? current?.title : lesson?.lessonTitle) ?? current?.title ?? ' '}</h1>
            </div>
            {!isMobile && tabs.length > 0 && <div className="hd-tabs">{tabsEl}</div>}
            <nav className="pn" aria-label={t.lessons}>
                {previous ? (
                    <LessonLink href={previous.href} className="ib" aria-label={t.previous} title={previous.title}>
                        <ChevronLeft {...ICON} />
                    </LessonLink>
                ) : (
                    <button type="button" className="ib" aria-label={t.previous} disabled>
                        <ChevronLeft {...ICON} />
                    </button>
                )}
                {next ? (
                    <LessonLink href={next.href} className="ib" aria-label={t.next} title={next.title}>
                        <ChevronRight {...ICON} />
                    </LessonLink>
                ) : (
                    <button type="button" className="ib" aria-label={t.next} disabled>
                        <ChevronRight {...ICON} />
                    </button>
                )}
            </nav>
        </header>
    );

    let body: React.ReactNode;
    if (lockedContent) {
        body = lockedContent;
    } else if (lockedModule) {
        body = (
            <div className="state" role="status">
                <Lock {...ICON} size={28} aria-hidden />
                <h1>{t.locked}</h1>
                <p>{lockedModule.locked}</p>
                {latest && (
                    <LessonLink href={latest.href} className="btn line">
                        {t.goLatest}
                    </LessonLink>
                )}
            </div>
        );
    } else if (!modulesLoading && !loading && !lesson) {
        body = (
            <div className="state" role="status">
                <h1>{t.missing}</h1>
                <p>{t.missingHint}</p>
                {open[0] && (
                    <LessonLink href={open[0].href} className="btn line">
                        {t.goFirst}
                    </LessonLink>
                )}
            </div>
        );
    } else {
        body = (
            <>
                {isMobile && hasVideo && (
                    <div className="video">
                        <LessonVideo
                            key={shownId}
                            lessonId={shownId}
                            onWatched={onWatched && (() => onWatched(shownId))}
                            watchedAt={WATCHED_AT}
                            autoplay={playOnOpen && shownId === firstLesson.current}
                        />
                    </div>
                )}
                <div className="tabs">
                    {tabsEl}
                    {active === 'summary' && (
                        <div className="tools">
                            <TextSize scale={scale} onScale={onScale} />
                        </div>
                    )}
                </div>
                {hasVideo && !isMobile && (
                    <div id="lesson-video" role="tabpanel" className="video" hidden={active !== 'video'}>
                        <LessonVideo
                            key={shownId}
                            lessonId={shownId}
                            onWatched={onWatched && (() => onWatched(shownId))}
                            watchedAt={WATCHED_AT}
                            autoplay={playOnOpen && shownId === firstLesson.current}
                        />
                    </div>
                )}
                <div id="lesson-summary" role="tabpanel" hidden={active !== 'summary'}>
                    {lesson?.lessonContent?.json ? (
                        <ReaderProse
                            rawContent={lesson.lessonContent.json}
                            links={lesson.lessonContent.links}
                            lang={lang}
                        />
                    ) : (
                        !loading && <p className="empty">{t.noSummary}</p>
                    )}
                </div>
                {hasResources && (
                    <div id="lesson-resources" role="tabpanel" hidden={active !== 'resources'}>
                        <ul className="res">
                            {files.map((file) => {
                                const Icon = resourceIcon(file.contentType);
                                return (
                                    <li key={file.url}>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                saveFile(
                                                    file.url,
                                                    file.title,
                                                    file.contentType as keyof typeof fileTypes,
                                                )
                                            }
                                            aria-label={`${t.download}: ${file.title}`}
                                        >
                                            <Icon {...ICON} aria-hidden />
                                            <span>
                                                <b>{file.title}</b>
                                                <small>
                                                    {fileTypes[file.contentType as keyof typeof fileTypes] ??
                                                        file.contentType}
                                                    {' · '}
                                                    {fileSizeLabel(file.size)}
                                                </small>
                                            </span>
                                            <Download {...ICON} aria-hidden />
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
                {(next || doneToggle) && (
                    <div className="after">
                        {doneToggle?.(shownId)}
                        {next && (
                            <LessonLink href={next.href} className="btn line" title={next.title}>
                                {t.nextUp}: <span>{next.title}</span>
                                <ArrowRight {...ICON} size={16} className="arrow" aria-hidden />
                            </LessonLink>
                        )}
                    </div>
                )}
            </>
        );
    }

    return (
        <NewPage className="wide lesson">
            <Wrap
                ref={wrapRef}
                className={`${uiFont.className}${!isMobile && railCollapsed ? ' norail' : ''}`}
                style={{ '--r-scale': scale, '--r-read-font': readFont.style.fontFamily } as React.CSSProperties}
            >
                {!isMobile && (
                    <aside className="rail" aria-label={t.lessons} aria-hidden={railCollapsed || undefined}>
                        {list}
                    </aside>
                )}
                <div className="body" data-tab={active} aria-busy={switching || undefined}>
                    {header}
                    {/* key: o miolo da aula nova entra com o esmaecer curto; a casca e o trilho ficam */}
                    <div className={switching ? 'swap stale' : 'swap'} key={lesson?.lessonId ?? 'none'}>
                        {body}
                    </div>
                </div>
            </Wrap>
            {isMobile && (
                <Drawer
                    rootClassName={`ui-new-drawer ${uiFont.className}`}
                    rootStyle={UI_FONT_VAR}
                    closeIcon={<X {...ICON} aria-label={t.close} />}
                    open={sheet}
                    onClose={() => setSheet(false)}
                    placement="bottom"
                    height="82%"
                    title={t.lessons}
                >
                    <Wrap style={{ '--r-scale': scale } as React.CSSProperties}>
                        <div className="sheet">{list}</div>
                    </Wrap>
                </Drawer>
            )}
        </NewPage>
    );
};

export default NewLesson;
