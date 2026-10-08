'use client';

import { css, Global } from '@emotion/react';
import styled from '@emotion/styled';
import { readFont, uiFont } from 'components/_melp/_deda/DedaReader/readerFonts';
import { auth } from 'config/firebase';
import { useTheme } from 'hooks/useTheme';
import { DEFAULT_TEXT_SCALE, readTextScale, saveTextScale, TEXT_SCALES } from 'libs/dedaReader';
import {
    EBOOK,
    EBOOK_BOOK_URL,
    EBOOK_MARKS_URL,
    EBOOK_PATH,
    EBOOK_POSITION_URL,
    EBOOK_PRODUCT,
    type EbookBook,
    type EbookBookmark,
    type EbookHighlight,
    type EbookPosition,
    ebookOpen,
    HIGHLIGHT_COLORS,
    type HighlightColor,
    markId,
    pageLayout,
    readLocalPosition,
    resumePosition,
    sanitizeChapter,
    saveLocalPosition,
    searchBook,
    smartQuotes,
} from 'libs/ebook';
import {
    ALargeSmall,
    Bookmark,
    ChevronLeft,
    ChevronRight,
    List,
    NotebookPen,
    Search,
    StickyNote,
    X,
} from 'lucide-react';
import { Literata } from 'next/font/google';
import Link from 'next/link';
import { useAppContext, useProductAccess } from 'providers';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ICON } from 'themes/newDesign';
import { NewPage } from './NewPage';

/*
 * Leitor do Guia Completo como o Apple Books (8-Out-2026): páginas (duas lado a lado no computador, uma no celular),
 * pela técnica de colunas do CSS — o livro inteiro corre em colunas da largura da página e a "virada" desloca a faixa.
 * Âncoras por deslocamento de caracteres no texto de cada capítulo: posição, marcadores e destaques sobrevivem à troca
 * de letra, tamanho e janela. Marcas por usuário no Worker (mettle-events, D1), com fila no aparelho se a rede falhar.
 */

type Load = { state: 'loading' } | { state: 'error'; noAccess: boolean } | { state: 'ready'; book: EbookBook };
type Theme = 'light' | 'sepia' | 'dark' | 'night';
type Panel = null | 'toc' | 'bm' | 'hl' | 'aa' | 'search';
type Anchor = { ci: number; o: number };
type Menu =
    | { kind: 'new'; x: number; y: number; ci: number; s: number; e: number; text: string }
    | { kind: 'mark'; x: number; y: number; id: string };
type Op = Record<string, unknown> & { op: string; id: string };

/** Serifa de livro (padrão) para o texto; a interface continua em Manrope. */
const bookSerif = Literata({ subsets: ['latin'], weight: ['400', '600'], style: ['normal', 'italic'] });

const FONT_KEY = 'ebookFont';
const THEME_KEY = 'ebookTheme'; // sepia | night (claro e escuro seguem o tema da Plataforma)
const OUTBOX_KEY = 'ebookOutbox';
const COLOR_NAME: Record<HighlightColor, string> = { yellow: 'Amarelo', green: 'Verde', blue: 'Azul', pink: 'Rosa' };

const store = {
    get: (k: string) => {
        try {
            return window.localStorage.getItem(k);
        } catch {
            return null;
        }
    },
    set: (k: string, v: string | null) => {
        try {
            if (v === null) window.localStorage.removeItem(k);
            else window.localStorage.setItem(k, v);
        } catch {
            // armazenamento bloqueado: vale só nesta visita
        }
    },
};

const fetchBook = async (): Promise<EbookBook> => {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch(EBOOK_BOOK_URL, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    if (!res.ok) throw new Error(String(res.status));
    return res.json();
};

const sendPosition = (save: string, p: EbookPosition) =>
    fetch(EBOOK_POSITION_URL, {
        method: 'POST',
        body: JSON.stringify({ t: save, c: p.c, y: p.y }),
        keepalive: true,
    }).catch(() => undefined);

/** Marcas: texto simples (sem preflight). Falha de rede ou do servidor fica na fila do aparelho e vai depois. */
const outbox = {
    read: (): Op[] => {
        try {
            return JSON.parse(store.get(OUTBOX_KEY) ?? '[]') ?? [];
        } catch {
            return [];
        }
    },
    write: (ops: Op[]) => store.set(OUTBOX_KEY, ops.length ? JSON.stringify(ops.slice(-500)) : null),
};
const sendOp = async (save: string, op: Op) => {
    try {
        const r = await fetch(EBOOK_MARKS_URL, { method: 'POST', body: JSON.stringify({ t: save, ...op }) });
        return r.status < 500 && r.status !== 401; // 204, 400, 404, 429: nada a repetir
    } catch {
        return false;
    }
};
let flushing: Promise<void> | null = null;
const flushOutbox = (save: string) => {
    flushing = (flushing ?? Promise.resolve()).then(async () => {
        const ops = outbox.read();
        if (!ops.length) return;
        const done: string[] = [];
        for (const op of ops) if (await sendOp(save, op)) done.push(JSON.stringify(op));
        outbox.write(outbox.read().filter((op) => !done.includes(JSON.stringify(op))));
    });
    return flushing;
};
/** Aplica a fila pendente sobre as marcas que vieram do servidor (o aparelho vê o que já fez). */
const withPending = (marks: { bookmarks: EbookBookmark[]; highlights: EbookHighlight[] }) => {
    let { bookmarks, highlights } = marks;
    for (const op of outbox.read()) {
        if (op.op === 'bm+' && !bookmarks.some((b) => b.id === op.id))
            bookmarks = [...bookmarks, op as unknown as EbookBookmark];
        if (op.op === 'bm-') bookmarks = bookmarks.filter((b) => b.id !== op.id);
        if (op.op === 'hl') highlights = [...highlights.filter((h) => h.id !== op.id), op as unknown as EbookHighlight];
        if (op.op === 'hl-') highlights = highlights.filter((h) => h.id !== op.id);
    }
    return { bookmarks, highlights };
};

// ---------- texto ↔ DOM ----------

const textNodes = (root: Node) => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const out: Text[] = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) out.push(n as Text);
    return out;
};
/** Deslocamento (caracteres) de um ponto do DOM dentro de `root`. */
const offsetIn = (root: Node, node: Node, off: number) => {
    const r = document.createRange();
    r.setStart(root, 0);
    r.setEnd(node, off);
    return r.toString().length;
};
const pointAt = (root: Node, offset: number) => {
    let n = 0;
    const nodes = textNodes(root);
    for (const t of nodes) {
        if (n + t.length > offset) return { node: t, off: Math.max(0, offset - n) };
        n += t.length;
    }
    const last = nodes[nodes.length - 1];
    return last ? { node: last, off: last.length } : null;
};
/** Pinta os destaques do capítulo como <mark> (o texto não muda: os deslocamentos continuam valendo). */
const paint = (prose: HTMLElement, highlights: EbookHighlight[]) => {
    for (const h of [...highlights].sort((a, b) => a.s - b.s)) {
        let n = 0;
        for (const t of textNodes(prose)) {
            const a = n;
            const len = t.length;
            n += len;
            if (a + len <= h.s || a >= h.e) continue;
            let node = t;
            const from = Math.max(h.s - a, 0);
            const to = Math.min(h.e - a, len);
            if (to < len) node.splitText(to);
            if (from > 0) node = node.splitText(from);
            const mark = document.createElement('mark');
            mark.className = `hl hl-${h.k}${h.n ? ' noted' : ''}`;
            mark.dataset.id = h.id;
            node.parentNode?.insertBefore(mark, node);
            mark.appendChild(node);
        }
    }
};
const caretAt = (x: number, y: number): Range | null => {
    const d = document as Document & {
        caretRangeFromPoint?: (x: number, y: number) => Range | null;
        caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
    };
    if (d.caretRangeFromPoint) return d.caretRangeFromPoint(x, y);
    const p = d.caretPositionFromPoint?.(x, y);
    if (!p) return null;
    const r = document.createRange();
    r.setStart(p.offsetNode, p.offset);
    return r;
};

// ---------- painéis ----------

const Popover: React.FC<{
    label: string;
    side: 'left' | 'right';
    onClose(): void;
    children: React.ReactNode;
}> = ({ label, side, onClose, children }) => {
    const box = useRef<HTMLDivElement>(null);
    useEffect(() => {
        box.current?.querySelector<HTMLElement>('input, [aria-current="true"], [aria-checked="true"], button')?.focus();
        const outside = (e: PointerEvent) => {
            const t = e.target as HTMLElement;
            if (!box.current?.contains(t) && !t.closest('.tg, .tr')) onClose();
        };
        document.addEventListener('pointerdown', outside);
        return () => document.removeEventListener('pointerdown', outside);
    }, [onClose]);
    return (
        <div className={`pop ${side}`} role="dialog" aria-label={label} ref={box}>
            <p className="pop-h">{label}</p>
            <div className="pop-b">{children}</div>
        </div>
    );
};

export const NewEbookReader: React.FC = () => {
    const { user } = useAppContext();
    const { access } = useProductAccess();
    const open = ebookOpen(access(EBOOK_PRODUCT).state);
    const { resolved, setPref } = useTheme();

    const [load, setLoad] = useState<Load>({ state: 'loading' });
    const [scale, setScale] = useState(DEFAULT_TEXT_SCALE);
    const [serif, setSerif] = useState(true);
    const [special, setSpecial] = useState<'sepia' | 'night' | null>(null);
    const [size, setSize] = useState({ w: 0, h: 0 });
    const [page, setPage] = useState(0);
    const [total, setTotal] = useState(1);
    const [starts, setStarts] = useState<number[]>([]);
    const [shown, setShown] = useState(false);
    const [jump, setJump] = useState(true); // sem deslizar ao abrir, ao retomar e ao saltar
    const [chrome, setChrome] = useState(true);
    const [panel, setPanel] = useState<Panel>(null);
    const [bookmarks, setBookmarks] = useState<EbookBookmark[]>([]);
    const [highlights, setHighlights] = useState<EbookHighlight[]>([]);
    const [menu, setMenu] = useState<Menu | null>(null);
    const [note, setNote] = useState<{ id: string; text: string } | null>(null);
    const [query, setQuery] = useState('');
    const [bmPages, setBmPages] = useState<Record<string, number>>({});

    const wrap = useRef<HTMLDivElement>(null);
    const flow = useRef<HTMLDivElement>(null);
    const anchor = useRef<Anchor | null>(null);
    const fraction = useRef<number | null>(null); // posição salva (fração do capítulo), convertida na primeira medida
    const last = useRef<EbookPosition | null>(null);
    const sentAt = useRef(0);
    const idle = useRef<ReturnType<typeof setTimeout>>();
    const touch = useRef<{ x: number; y: number; t: number } | null>(null);

    useEffect(() => {
        setScale(readTextScale());
        setSerif(store.get(FONT_KEY) !== 'sans');
        const t = store.get(THEME_KEY);
        setSpecial(t === 'sepia' || t === 'night' ? t : null);
    }, []);

    const book = load.state === 'ready' ? load.book : null;
    const chapters = useMemo(() => book?.chapters ?? [], [book]);
    const htmls = useMemo(() => {
        if (!chapters.length) return [];
        const parser = new DOMParser();
        return chapters.map((c) => {
            const doc = parser.parseFromString(sanitizeChapter(c.html, parser), 'text/html');
            for (const t of textNodes(doc.body)) t.data = smartQuotes(t.data);
            return doc.body.innerHTML;
        });
    }, [chapters]);
    const texts = useMemo(() => {
        if (!htmls.length) return [];
        const parser = new DOMParser();
        return htmls.map((h) => parser.parseFromString(h, 'text/html').body.textContent ?? '');
    }, [htmls]);

    const fetched = useRef(false); // uma ida só (o contexto do usuário reapresenta o mesmo login várias vezes)
    useEffect(() => {
        if (!user || !open || fetched.current) return;
        fetched.current = true;
        fetchBook()
            .then((b) => {
                const want = new URLSearchParams(window.location.search).get('c');
                const resume = resumePosition(b.chapters, readLocalPosition(), b.position);
                const asked = want ? b.chapters.findIndex((c) => c.slug === want) : -1;
                const start = asked >= 0 && asked !== resume.index ? { index: asked, y: 0 } : resume;
                anchor.current = { ci: start.index, o: 0 };
                fraction.current = start.y;
                const marks = withPending(b.marks ?? { bookmarks: [], highlights: [] });
                setBookmarks(marks.bookmarks);
                setHighlights(marks.highlights);
                setLoad({ state: 'ready', book: b });
                flushOutbox(b.save);
            })
            .catch((e: Error) => {
                fetched.current = false;
                setLoad({ state: 'error', noAccess: e.message === '403' });
            });
    }, [user, open]);

    // tamanho da janela de leitura
    useLayoutEffect(() => {
        const el = wrap.current;
        if (!el) return;
        const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
        ro.observe(el);
        setSize({ w: el.clientWidth, h: el.clientHeight });
        return () => ro.disconnect();
    }, [book]);

    const L = useMemo(() => pageLayout(size.w || 1, size.h || 1, scale / DEFAULT_TEXT_SCALE), [size, scale]);
    const step = L.pageW + L.gap;
    const per = L.spread ? 2 : 1;

    // o livro inteiro no DOM, uma vez (fora do React: os destaques mexem no texto), com os destaques pintados
    const hlRef = useRef(highlights);
    hlRef.current = highlights;
    useLayoutEffect(() => {
        const el = flow.current;
        if (!el || !chapters.length) return;
        el.innerHTML = chapters
            .map(
                (_, i) =>
                    `<section class="ch" data-i="${i}"><p class="eb"></p><h1></h1><div class="prose">${htmls[i]}</div></section>`,
            )
            .join('');
        el.querySelectorAll<HTMLElement>('section.ch').forEach((s, i) => {
            (s.querySelector('.eb') as HTMLElement).textContent = chapters[i].eyebrow;
            (s.querySelector('h1') as HTMLElement).textContent = chapters[i].title;
            paint(
                s.querySelector('.prose') as HTMLElement,
                hlRef.current.filter((h) => h.c === chapters[i].slug),
            );
        });
    }, [chapters, htmls]);

    const proseOf = (ci: number) =>
        flow.current?.querySelector<HTMLElement>(`section.ch[data-i="${ci}"] .prose`) ?? null;

    const repaint = (ci: number, list: EbookHighlight[]) => {
        const prose = proseOf(ci);
        if (!prose) return;
        prose.innerHTML = htmls[ci];
        paint(
            prose,
            list.filter((h) => h.c === chapters[ci].slug),
        );
    };

    /** Página (coluna) onde está o caractere `o` do capítulo `ci`. */
    const pageOf = useCallback(
        (a: Anchor) => {
            const el = flow.current;
            const prose = el?.querySelector<HTMLElement>(`section.ch[data-i="${a.ci}"] .prose`);
            if (!el || !prose) return 0;
            const base = el.getBoundingClientRect().left;
            const p = a.o > 0 ? pointAt(prose, a.o) : null;
            let x: number;
            if (p) {
                const r = document.createRange();
                r.setStart(p.node, p.off);
                r.setEnd(p.node, Math.min(p.off + 1, p.node.length));
                // palavra hifenizada na virada: vem também um pedaço no fim da coluna anterior; vale o último
                const rects = Array.from(r.getClientRects()).filter((c) => c.width > 0);
                const rect = rects[rects.length - 1] ?? r.getBoundingClientRect();
                x = rect.left - base;
            } else x = (prose.parentElement as HTMLElement).getBoundingClientRect().left - base;
            return Math.max(0, Math.floor((x + 2) / step));
        },
        [step],
    );
    const snap = useCallback((p: number) => (L.spread ? p - (p % 2) : p), [L.spread]);

    /** Primeiro caractere da página visível (lido na tela, pelo canto de cima da página). */
    const anchorNow = useCallback((): Anchor | null => {
        const w = wrap.current;
        if (!w) return null;
        const box = w.getBoundingClientRect();
        const x = box.left + L.margin + 3;
        for (let y = box.top + L.top + 4; y < box.top + L.top + L.pageH; y += 10) {
            const r = caretAt(x, y);
            const host =
                r?.startContainer.nodeType === 3 ? r.startContainer.parentElement : (r?.startContainer as Element);
            const sec = host?.closest?.('section.ch') as HTMLElement | null;
            if (!r || !sec) continue;
            const ci = Number(sec.dataset.i);
            const prose = sec.querySelector('.prose') as HTMLElement;
            if (!prose.contains(r.startContainer)) return { ci, o: 0 };
            return { ci, o: offsetIn(prose, r.startContainer, r.startOffset) };
        }
        return null;
    }, [L]);

    // paginação: mede o total e o início de cada capítulo e volta à âncora (letra, tamanho, janela ou fonte mudaram)
    const measure = useCallback(() => {
        const el = flow.current;
        if (!el || !chapters.length || !size.w) return;
        const base = el.getBoundingClientRect().left;
        const n = Math.max(1, Math.round((el.scrollWidth + L.gap) / step));
        setTotal(n);
        setStarts(
            Array.from(el.querySelectorAll<HTMLElement>('section.ch')).map((s) =>
                Math.max(0, Math.round((s.getBoundingClientRect().left - base) / step)),
            ),
        );
        const a = anchor.current;
        if (!a) return;
        if (fraction.current !== null) {
            // y vem arredondado em 4 casas (o servidor guarda assim): meio passo para frente fica dentro da página salva
            const len = texts[a.ci]?.length ?? 0;
            a.o = Math.min(len, Math.round((fraction.current + 0.00005) * len));
            fraction.current = null;
        }
        setJump(true);
        setPage(Math.min(snap(pageOf(a)), snap(n - 1)));
    }, [chapters.length, size.w, L.gap, step, texts, pageOf, snap]);

    useLayoutEffect(() => {
        if (!chapters.length || !size.w) return;
        measure();
        let alive = true;
        document.fonts.ready.then(() =>
            requestAnimationFrame(() => {
                if (!alive) return;
                measure();
                setShown(true);
            }),
        );
        return () => {
            alive = false;
        };
    }, [measure, chapters.length, size.w, serif, L]);

    // marcadores: página de cada um (para o botão do topo e a lista)
    useEffect(() => {
        if (!shown) return;
        const out: Record<string, number> = {};
        for (const b of bookmarks) {
            const ci = chapters.findIndex((c) => c.slug === b.c);
            if (ci >= 0) out[b.id] = pageOf({ ci, o: b.o });
        }
        setBmPages(out);
    }, [bookmarks, chapters, pageOf, shown, total]);

    const flush = useCallback(() => {
        if (book && last.current) {
            sendPosition(book.save, last.current);
            sentAt.current = Date.now();
        }
    }, [book]);

    // página nova: âncora e posição salva (aparelho sempre; servidor a cada 15 s e ao sair)
    useEffect(() => {
        if (!shown) return;
        // depois do deslizar (280 ms): no meio da animação o canto da página ainda mostra a anterior
        const id = setTimeout(() => {
            const a = anchorNow();
            if (!a) return;
            anchor.current = a;
            const len = texts[a.ci]?.length || 1;
            last.current = {
                c: chapters[a.ci].slug,
                y: Math.round((a.o / len) * 10000) / 10000,
                at: new Date().toISOString(),
            };
            saveLocalPosition(last.current);
            if (Date.now() - sentAt.current > 15_000) flush();
        }, 340);
        return () => clearTimeout(id);
    }, [page, shown, anchorNow, texts, chapters, flush]);

    useEffect(() => {
        const hide = () => document.visibilityState === 'hidden' && flush();
        document.addEventListener('visibilitychange', hide);
        window.addEventListener('pagehide', flush);
        return () => {
            flush();
            document.removeEventListener('visibilitychange', hide);
            window.removeEventListener('pagehide', flush);
        };
    }, [flush]);

    const go = useCallback(
        (p: number, slide = true) => {
            setMenu(null);
            setJump(!slide);
            setPage(Math.max(0, Math.min(snap(p), snap(total - 1))));
        },
        [snap, total],
    );
    const turn = useCallback((dir: 1 | -1) => go(page + dir * per), [go, page, per]);
    const goAnchor = (a: Anchor) => {
        setPanel(null);
        anchor.current = a;
        go(pageOf(a), false);
    };

    // teclado: setas, Page Up/Down, espaço; Esc fecha
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const t = e.target as HTMLElement;
            if (e.key === 'Escape') {
                setPanel(null);
                setMenu(null);
                setNote(null);
                return;
            }
            if (t.closest?.('input, textarea, [role="dialog"], [role="toolbar"]')) return;
            if (['ArrowRight', 'PageDown', ' '].includes(e.key)) {
                e.preventDefault();
                turn(1);
            }
            if (['ArrowLeft', 'PageUp'].includes(e.key)) {
                e.preventDefault();
                turn(-1);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [turn]);

    // a barra some durante a leitura e volta com o mouse ou um toque no centro
    const wake = useCallback(() => {
        setChrome(true);
        clearTimeout(idle.current);
        idle.current = setTimeout(() => setChrome(false), 2800);
    }, []);
    useEffect(() => {
        if (shown) wake();
        return () => clearTimeout(idle.current);
    }, [shown, wake]);
    const chromeOn = chrome || !!panel || !!menu || !!note;

    // seleção de texto: o menu de destaque aparece junto
    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        const onSel = () => {
            const sel = window.getSelection();
            if (!sel || sel.isCollapsed || !sel.rangeCount) return;
            const r = sel.getRangeAt(0);
            const c = r.commonAncestorContainer;
            const host = (c.nodeType === 3 ? c.parentElement : c) as Element | null;
            const prose = host?.closest('.prose') as HTMLElement | null;
            if (!prose || !flow.current?.contains(prose)) return;
            const ci = Number((prose.parentElement as HTMLElement).dataset.i);
            const s = offsetIn(prose, r.startContainer, r.startOffset);
            const e = offsetIn(prose, r.endContainer, r.endOffset);
            if (e - s < 1 || e - s > 20_000) return;
            const rect = r.getBoundingClientRect();
            setMenu({ kind: 'new', x: rect.left + rect.width / 2, y: rect.top, ci, s, e, text: r.toString() });
        };
        const later = () => {
            clearTimeout(timer);
            timer = setTimeout(onSel, 250);
        };
        document.addEventListener('selectionchange', later);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('selectionchange', later);
        };
    }, []);

    const send = (op: Op) => {
        if (!book) return;
        outbox.write([...outbox.read(), op]);
        flushOutbox(book.save);
    };

    const setHighlight = (h: EbookHighlight) => {
        const next = [...highlights.filter((x) => x.id !== h.id), h];
        setHighlights(next);
        repaint(
            chapters.findIndex((c) => c.slug === h.c),
            next,
        );
        send({ op: 'hl', ...h });
    };
    const removeHighlight = (id: string) => {
        const h = highlights.find((x) => x.id === id);
        if (!h) return;
        const next = highlights.filter((x) => x.id !== id);
        setHighlights(next);
        repaint(
            chapters.findIndex((c) => c.slug === h.c),
            next,
        );
        send({ op: 'hl-', id });
    };
    const fromMenu = (k: HighlightColor, withNote = false) => {
        if (!menu) return;
        if (menu.kind === 'new') {
            const h: EbookHighlight = {
                id: markId(),
                c: chapters[menu.ci].slug,
                s: menu.s,
                e: menu.e,
                k,
                n: '',
                x: menu.text.replace(/\s+/g, ' ').trim().slice(0, 300),
            };
            setHighlight(h);
            window.getSelection()?.removeAllRanges();
            if (withNote) setNote({ id: h.id, text: '' });
        } else {
            const h = highlights.find((x) => x.id === menu.id);
            if (h && h.k !== k) setHighlight({ ...h, k });
            if (withNote && h) setNote({ id: h.id, text: h.n });
        }
        setMenu(null);
    };

    const visible = [page, page + per - 1];
    const marked = bookmarks.find((b) => {
        const p = bmPages[b.id];
        return p !== undefined && p >= visible[0] && p <= visible[1];
    });
    const toggleBookmark = () => {
        if (marked) {
            setBookmarks((list) => list.filter((b) => b.id !== marked.id));
            send({ op: 'bm-', id: marked.id });
            return;
        }
        const a = anchorNow();
        if (!a) return;
        const b: EbookBookmark = {
            id: markId(),
            c: chapters[a.ci].slug,
            o: a.o,
            x: texts[a.ci]
                .slice(a.o, a.o + 140)
                .replace(/\s+/g, ' ')
                .trim(),
        };
        setBookmarks((list) => [...list, b]);
        send({ op: 'bm+', ...b });
    };

    // toque: deslizar vira a página; tocar nos lados vira; no centro mostra ou esconde a barra
    const onPointerDown = (e: React.PointerEvent) => {
        touch.current = { x: e.clientX, y: e.clientY, t: Date.now() };
    };
    const onPointerUp = (e: React.PointerEvent) => {
        const start = touch.current;
        touch.current = null;
        if (!start || (e.target as HTMLElement).closest('a, button, input, textarea, mark, .pop, .menu')) return;
        const dx = e.clientX - start.x;
        const dy = e.clientY - start.y;
        const selected = !window.getSelection()?.isCollapsed;
        const w = wrap.current?.clientWidth ?? 1;
        if (e.pointerType !== 'mouse') {
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5 && !selected) return turn(dx < 0 ? 1 : -1);
            if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && Date.now() - start.t < 350 && !selected) {
                if (e.clientX < w * 0.22) return turn(-1);
                if (e.clientX > w * 0.78) return turn(1);
                setChrome((v) => !v);
            }
            return;
        }
        // mouse: clique nas margens de fora vira a página
        if (Math.abs(dx) > 4 || selected) return;
        if (e.clientX < L.margin) turn(-1);
        else if (e.clientX > w - L.margin) turn(1);
    };
    const onFlowClick = (e: React.MouseEvent) => {
        const t = e.target as HTMLElement;
        const mark = t.closest('mark.hl') as HTMLElement | null;
        if (mark && window.getSelection()?.isCollapsed) {
            const rect = mark.getBoundingClientRect();
            setMenu({ kind: 'mark', x: rect.left + rect.width / 2, y: rect.top, id: mark.dataset.id as string });
            return;
        }
        const a = t.closest('a');
        if (!a) return;
        const slug = a.getAttribute('data-chapter');
        const id = a.getAttribute('data-anchor');
        if (slug) {
            e.preventDefault();
            const ci = chapters.findIndex((c) => c.slug === slug);
            if (ci >= 0) goAnchor({ ci, o: 0 });
        } else if (id) {
            e.preventDefault();
            const target = flow.current?.querySelector(`[id="${CSS.escape(id)}"]`);
            const sec = target?.closest('section.ch') as HTMLElement | null;
            const prose = sec?.querySelector('.prose') as HTMLElement | null;
            if (target && sec && prose) goAnchor({ ci: Number(sec.dataset.i), o: offsetIn(prose, target, 0) });
        }
    };

    const onScale = (v: number) => {
        setScale(v);
        saveTextScale(v);
    };
    const onSerif = (v: boolean) => {
        setSerif(v);
        store.set(FONT_KEY, v ? null : 'sans');
    };
    const theme: Theme = special ?? resolved;
    const onTheme = (t: Theme) => {
        const sp = t === 'sepia' || t === 'night' ? t : null;
        setSpecial(sp);
        store.set(THEME_KEY, sp);
        setPref(t === 'dark' || t === 'night' ? 'dark' : 'light');
    };
    const closePanel = useCallback(() => setPanel(null), []);

    const results = useMemo(() => (panel === 'search' ? searchBook(texts, query, 100) : []), [panel, texts, query]);

    if (load.state !== 'ready')
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

    const chapterAt = (p: number) => {
        let ci = 0;
        starts.forEach((s, i) => {
            if (s <= p) ci = i;
        });
        return ci;
    };
    const ciNow = chapterAt(page);
    const lastVisible = Math.min(total - 1, page + per - 1);
    const chapterEnd = (starts[chapterAt(lastVisible) + 1] ?? total) - 1;
    const left = Math.max(0, chapterEnd - lastVisible);
    const pageLabel = (p: number) => (p < total ? `${p + 1} de ${total}` : '');
    const hlMenu = menu?.kind === 'mark' ? highlights.find((h) => h.id === menu.id) : null;

    return (
        <NewPage className="lesson">
            <Global styles={readerGlobal} />
            <Wrap
                ref={wrap}
                className={`${uiFont.className} t-${theme}${chromeOn ? '' : ' calm'}${jump ? ' jump' : ''}${L.spread ? ' spread' : ' single'}`}
                style={
                    {
                        '--r-read-font': serif ? bookSerif.style.fontFamily : readFont.style.fontFamily,
                        '--pw': `${L.pageW}px`,
                        '--gap': `${L.gap}px`,
                        '--m': `${L.margin}px`,
                        '--top': `${L.top}px`,
                        '--bottom': `${L.bottom}px`,
                        '--ph': `${L.pageH}px`,
                        '--fs': `${L.font}px`,
                        '--fw': `${L.spread ? 2 * L.pageW + L.gap : L.pageW}px`,
                    } as React.CSSProperties
                }
                onMouseMove={(e) => (e.movementX || e.movementY ? wake() : undefined)}
                onPointerDown={onPointerDown}
                onPointerUp={onPointerUp}
            >
                <header className="tb">
                    <div className="grp">
                        <Link href={EBOOK_PATH} className="ib" aria-label="Fechar o livro">
                            <X {...ICON} />
                        </Link>
                        <span className="pill">
                            {(
                                [
                                    ['toc', 'Índice', <List key="t" {...ICON} />],
                                    ['bm', 'Marcadores', <Bookmark key="b" {...ICON} />],
                                    ['hl', 'Destaques e notas', <NotebookPen key="h" {...ICON} />],
                                ] as const
                            ).map(([key, label, icon]) => (
                                <button
                                    key={key}
                                    type="button"
                                    className="ib tg"
                                    aria-label={label}
                                    aria-haspopup="dialog"
                                    aria-expanded={panel === key}
                                    onClick={() => setPanel((p) => (p === key ? null : key))}
                                >
                                    {icon}
                                </button>
                            ))}
                        </span>
                    </div>
                    <p className="title">{EBOOK.title}</p>
                    <div className="grp">
                        <span className="pill">
                            <button
                                type="button"
                                className="ib tr"
                                aria-label="Aparência"
                                aria-haspopup="dialog"
                                aria-expanded={panel === 'aa'}
                                onClick={() => setPanel((p) => (p === 'aa' ? null : 'aa'))}
                            >
                                <ALargeSmall {...ICON} />
                            </button>
                            <button
                                type="button"
                                className="ib tr"
                                aria-label="Buscar no livro"
                                aria-haspopup="dialog"
                                aria-expanded={panel === 'search'}
                                onClick={() => setPanel((p) => (p === 'search' ? null : 'search'))}
                            >
                                <Search {...ICON} />
                            </button>
                        </span>
                        <button
                            type="button"
                            className={`ib bmk${marked ? ' on' : ''}`}
                            aria-label="Marcador desta página"
                            aria-pressed={!!marked}
                            onClick={toggleBookmark}
                        >
                            <Bookmark {...ICON} fill={marked ? 'currentColor' : 'none'} />
                        </button>
                    </div>
                </header>

                {panel === 'toc' && (
                    <Popover label="Índice" side="left" onClose={closePanel}>
                        <ol className="list">
                            {chapters.map((c, i) => (
                                <li key={c.slug}>
                                    <button
                                        type="button"
                                        aria-current={i === ciNow || undefined}
                                        onClick={() => goAnchor({ ci: i, o: 0 })}
                                    >
                                        <span className="t">{c.title}</span>
                                        <span className="pg">{(starts[i] ?? 0) + 1}</span>
                                    </button>
                                </li>
                            ))}
                        </ol>
                    </Popover>
                )}
                {panel === 'bm' && (
                    <Popover label="Marcadores" side="left" onClose={closePanel}>
                        {bookmarks.length ? (
                            <ol className="list">
                                {[...bookmarks]
                                    .sort((a, b) => (bmPages[a.id] ?? 0) - (bmPages[b.id] ?? 0))
                                    .map((b) => {
                                        const ci = chapters.findIndex((c) => c.slug === b.c);
                                        return (
                                            <li key={b.id}>
                                                <button type="button" onClick={() => goAnchor({ ci, o: b.o })}>
                                                    <span className="t">
                                                        <small>{chapters[ci]?.title}</small>
                                                        <span className="x">{b.x}</span>
                                                    </span>
                                                    <span className="pg">{(bmPages[b.id] ?? 0) + 1}</span>
                                                </button>
                                            </li>
                                        );
                                    })}
                            </ol>
                        ) : (
                            <p className="empty">Nenhum marcador</p>
                        )}
                    </Popover>
                )}
                {panel === 'hl' && (
                    <Popover label="Destaques e notas" side="left" onClose={closePanel}>
                        {highlights.length ? (
                            <ol className="list">
                                {highlights
                                    .map((h) => ({ h, ci: chapters.findIndex((c) => c.slug === h.c) }))
                                    .sort((a, b) => a.ci - b.ci || a.h.s - b.h.s)
                                    .map(({ h, ci }) => (
                                        <li key={h.id}>
                                            <button type="button" onClick={() => goAnchor({ ci, o: h.s })}>
                                                <span className="t">
                                                    <small>{chapters[ci]?.title}</small>
                                                    <span className={`x hlx hl-${h.k}`}>{h.x}</span>
                                                    {h.n && <span className="n">{h.n}</span>}
                                                </span>
                                            </button>
                                        </li>
                                    ))}
                            </ol>
                        ) : (
                            <p className="empty">Nenhum destaque</p>
                        )}
                    </Popover>
                )}
                {panel === 'aa' && (
                    <Popover label="Aparência" side="right" onClose={closePanel}>
                        <div className="aa">
                            <span className="row" role="radiogroup" aria-label="Tamanho do texto">
                                {TEXT_SCALES.map((v) => (
                                    <button
                                        key={v}
                                        type="button"
                                        role="radio"
                                        aria-checked={v === scale}
                                        aria-label={`${Math.round((v / DEFAULT_TEXT_SCALE) * 100)}%`}
                                        className="opt sz"
                                        style={{ fontSize: Math.round(14 * v * v) }}
                                        onClick={() => onScale(v)}
                                    >
                                        A
                                    </button>
                                ))}
                            </span>
                            <span className="row" role="radiogroup" aria-label="Letra">
                                <button
                                    type="button"
                                    role="radio"
                                    aria-checked={serif}
                                    className={`opt ${bookSerif.className}`}
                                    onClick={() => onSerif(true)}
                                >
                                    Serifa
                                </button>
                                <button
                                    type="button"
                                    role="radio"
                                    aria-checked={!serif}
                                    className="opt"
                                    onClick={() => onSerif(false)}
                                >
                                    Sem serifa
                                </button>
                            </span>
                            <span className="row" role="radiogroup" aria-label="Tema">
                                {(
                                    [
                                        ['light', 'Claro'],
                                        ['sepia', 'Sépia'],
                                        ['dark', 'Escuro'],
                                        ['night', 'Noite'],
                                    ] as const
                                ).map(([key, label]) => (
                                    <button
                                        key={key}
                                        type="button"
                                        role="radio"
                                        aria-checked={theme === key}
                                        className={`opt sw sw-${key}`}
                                        onClick={() => onTheme(key)}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </span>
                        </div>
                    </Popover>
                )}
                {panel === 'search' && (
                    <Popover label="Buscar" side="right" onClose={closePanel}>
                        <input
                            className="q"
                            type="search"
                            value={query}
                            placeholder="Buscar no livro"
                            aria-label="Buscar no livro"
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        {query.trim().length >= 2 && (
                            <ol className="list" aria-live="polite">
                                {results.map((r) => (
                                    <li key={`${r.i}-${r.at}`}>
                                        <button type="button" onClick={() => goAnchor({ ci: r.i, o: r.at })}>
                                            <span className="t">
                                                <small>{chapters[r.i].title}</small>
                                                <span className="x">
                                                    {r.before}
                                                    <b>{r.hit}</b>
                                                    {r.after}
                                                </span>
                                            </span>
                                        </button>
                                    </li>
                                ))}
                                {!results.length && <li className="empty">Nada encontrado</li>}
                            </ol>
                        )}
                    </Popover>
                )}

                <div className="stage">
                    <div
                        ref={flow}
                        className={`flow${shown ? ' shown' : ''}`}
                        lang="pt-BR"
                        style={{ transform: `translateX(${-page * step}px)` }}
                        onClick={onFlowClick}
                        onTransitionEnd={() => setJump(false)}
                    />
                </div>

                {L.spread && (
                    <>
                        <button
                            type="button"
                            className="side prev"
                            aria-label="Página anterior"
                            disabled={page === 0}
                            onClick={() => turn(-1)}
                        >
                            <ChevronLeft {...ICON} size={30} strokeWidth={1.25} />
                        </button>
                        <button
                            type="button"
                            className="side next"
                            aria-label="Próxima página"
                            disabled={page + per >= total}
                            onClick={() => turn(1)}
                        >
                            <ChevronRight {...ICON} size={30} strokeWidth={1.25} />
                        </button>
                    </>
                )}

                <footer className="ft">
                    <span className="pn p1">{pageLabel(page)}</span>
                    {L.spread && <span className="pn p2">{pageLabel(page + 1)}</span>}
                    {left > 0 && (
                        <span className="left">
                            {left === 1 ? '1 página restante no capítulo' : `${left} páginas restantes no capítulo`}
                        </span>
                    )}
                </footer>

                {menu && (
                    <div
                        className="menu"
                        role="toolbar"
                        aria-label="Destacar"
                        style={{ left: Math.max(8, menu.x - 130), top: Math.max(8, menu.y - 56) }}
                    >
                        {HIGHLIGHT_COLORS.map((k) => (
                            <button
                                key={k}
                                type="button"
                                className={`dot hl-${k}${hlMenu?.k === k ? ' on' : ''}`}
                                aria-label={COLOR_NAME[k]}
                                aria-pressed={hlMenu?.k === k}
                                onClick={() => fromMenu(k)}
                            />
                        ))}
                        <span className="sep" aria-hidden />
                        <button
                            type="button"
                            className="ib"
                            aria-label="Nota"
                            onClick={() => fromMenu(hlMenu?.k ?? 'yellow', true)}
                        >
                            <StickyNote {...ICON} size={18} />
                        </button>
                        {menu.kind === 'mark' ? (
                            <button
                                type="button"
                                className="txt"
                                onClick={() => {
                                    removeHighlight(menu.id);
                                    setMenu(null);
                                }}
                            >
                                Remover
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="txt"
                                onClick={() => {
                                    navigator.clipboard?.writeText(menu.text).catch(() => undefined);
                                    setMenu(null);
                                }}
                            >
                                Copiar
                            </button>
                        )}
                    </div>
                )}

                {note && (
                    <div className="pop note" role="dialog" aria-label="Nota">
                        <p className="pop-h">Nota</p>
                        <textarea
                            autoFocus
                            maxLength={2000}
                            value={note.text}
                            aria-label="Nota"
                            onChange={(e) => setNote({ ...note, text: e.target.value })}
                        />
                        <div className="acts">
                            <button type="button" className="btn line" onClick={() => setNote(null)}>
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="btn"
                                onClick={() => {
                                    const h = highlights.find((x) => x.id === note.id);
                                    if (h) setHighlight({ ...h, n: note.text.trim() });
                                    setNote(null);
                                }}
                            >
                                Salvar
                            </button>
                        </div>
                    </div>
                )}
            </Wrap>
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

/** Temas só do leitor: sépia (papel amarelado) e noite (preto, tinta clara). Contraste AA em texto e rótulos. */
const SEPIA = `
    --r-bg: #f3e9d2;
    --r-bg-rgb: 243, 233, 210;
    --r-sheet-head: #efe4cb;
    --r-text: #3a2e22;
    --r-muted: #5e4f3d;
    --r-faint: #66563f;
    --r-gold: #85592a;
    --r-gold-hi: #74501f;
    --r-gold-tint: rgba(133, 89, 42, 0.12);
    --r-line: rgba(70, 50, 25, 0.13);
    --r-line-strong: rgba(70, 50, 25, 0.3);
    --r-hover: rgba(70, 50, 25, 0.06);
    --r-card-shadow: rgba(70, 50, 25, 0.16);
    color-scheme: light;
`;
const NIGHT = `
    --r-bg: #000000;
    --r-bg-rgb: 0, 0, 0;
    --r-sheet-head: #1c1c1c;
    --r-text: #d9d4cb;
    --r-muted: #9c968c;
    --r-faint: #8f897f;
    --r-gold: #c49a68;
    --r-gold-hi: #d8b07f;
    --r-gold-tint: rgba(196, 154, 104, 0.16);
    --r-line: rgba(255, 255, 255, 0.12);
    --r-line-strong: rgba(255, 255, 255, 0.26);
    --r-hover: rgba(255, 255, 255, 0.07);
    --r-card-shadow: rgba(0, 0, 0, 0.6);
    color-scheme: dark;
`;

const readerGlobal = css`
    .hl-yellow {
        --hl: rgba(250, 204, 21, 0.38);
    }
    .hl-green {
        --hl: rgba(74, 190, 110, 0.32);
    }
    .hl-blue {
        --hl: rgba(80, 150, 240, 0.3);
    }
    .hl-pink {
        --hl: rgba(240, 100, 160, 0.3);
    }
`;

const Wrap = styled.div`
    &.t-sepia {
        ${SEPIA}
    }
    &.t-night {
        ${NIGHT}
    }
    position: relative;
    height: 100dvh;
    overflow: hidden;
    background: var(--r-bg);
    color: var(--r-text);
    touch-action: pinch-zoom; /* sem rolagem: deslizar vira a página */

    /* ---------- barra do topo ---------- */
    .tb {
        position: absolute;
        inset: 0 0 auto;
        z-index: 6;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
        align-items: center;
        gap: 12px;
        height: 60px;
        padding: 0 16px;
        transition: opacity 240ms ease;
    }
    &.calm .tb,
    &.calm .side {
        opacity: 0;
        pointer-events: none;
    }
    .tb .grp {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .tb .grp:last-child {
        justify-content: flex-end;
    }
    .tb .pill {
        display: inline-flex;
        padding: 2px;
        border-radius: 999px;
        background: var(--r-hover);
    }
    .tb .ib {
        width: 40px;
        height: 40px;
        color: var(--r-muted);
    }
    .tb .ib:hover,
    .tb .ib[aria-expanded='true'] {
        color: var(--r-text);
        background: var(--r-hover);
    }
    .tb .bmk.on {
        color: var(--r-gold-hi);
    }
    .tb .title {
        margin: 0;
        max-width: 46vw;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        font-size: 13px;
        font-weight: 600;
        color: var(--r-text);
    }

    /* ---------- painéis translúcidos ---------- */
    .pop {
        position: absolute;
        top: 64px;
        z-index: 7;
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        width: 320px;
        max-height: min(72vh, 640px);
        border: 1px solid var(--r-line);
        border-radius: 14px;
        background: color-mix(in srgb, var(--r-sheet-head) 84%, transparent);
        -webkit-backdrop-filter: blur(24px) saturate(1.4);
        backdrop-filter: blur(24px) saturate(1.4);
        box-shadow: 0 16px 40px var(--r-card-shadow);
        color: var(--r-text);
        -webkit-user-select: none;
        user-select: none;
    }
    .pop.left {
        left: 56px;
    }
    .pop.right {
        right: 16px;
    }
    .pop-h {
        margin: 0;
        padding: 12px 16px 10px;
        border-bottom: 1px solid var(--r-line);
        font-size: 12.5px;
        font-weight: 500;
        text-align: center;
        color: var(--r-muted);
    }
    .pop-b {
        overflow-y: auto;
        padding: 6px;
    }
    .pop .list {
        margin: 0;
        padding: 0;
        list-style: none;
    }
    .pop .list button {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        width: 100%;
        min-height: 40px;
        padding: 8px 10px;
        border: 0;
        border-radius: 8px;
        background: none;
        color: var(--r-text);
        font: inherit;
        font-size: 13.5px;
        line-height: 1.35;
        text-align: left;
        cursor: pointer;
    }
    .pop .list button:hover {
        background: var(--r-hover);
    }
    .pop .list button[aria-current] {
        color: var(--r-gold-hi);
        font-weight: 600;
    }
    .pop .t {
        display: grid;
        gap: 3px;
        min-width: 0;
    }
    .pop small {
        font-size: 11.5px;
        color: var(--r-muted);
    }
    .pop .x {
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
        font-family: var(--r-read-font), Georgia, serif;
    }
    .pop .x b {
        font-weight: 600;
        color: var(--r-gold-hi);
    }
    .pop .hlx {
        padding-left: 8px;
        border-left: 3px solid var(--hl);
    }
    .pop .n {
        font-size: 12.5px;
        font-style: italic;
        color: var(--r-muted);
    }
    .pop .pg {
        flex: none;
        font-size: 12.5px;
        font-variant-numeric: tabular-nums;
        color: var(--r-muted);
    }
    .pop .empty {
        margin: 0;
        padding: 48px 16px;
        text-align: center;
        font-size: 15px;
        color: var(--r-muted);
    }
    .pop .q {
        width: 100%;
        height: 40px;
        margin: 4px 0 6px;
        padding: 0 12px;
        border: 1px solid var(--r-line-strong);
        border-radius: 10px;
        background: transparent;
        color: var(--r-text);
        font: inherit;
        font-size: 14px;
    }
    .aa {
        display: grid;
        gap: 6px;
        padding: 4px;
    }
    .aa .row {
        display: flex;
        gap: 4px;
    }
    .aa .opt {
        flex: 1 1 0;
        min-width: 0;
        display: grid;
        place-items: center;
        min-height: 44px;
        padding: 0 6px;
        border: 0;
        border-radius: 10px;
        background: none;
        color: var(--r-muted);
        font-size: 13.5px;
        line-height: 1;
        cursor: pointer;
    }
    .aa .sz {
        font-family: var(--r-read-font), Georgia, serif;
    }
    .aa .opt[aria-checked='true'] {
        background: var(--r-gold-tint);
        color: var(--r-gold-hi);
    }
    .aa .sw {
        border: 1px solid var(--r-line);
        font-size: 12.5px;
    }
    .aa .sw-light,
    .aa .sw-light[aria-checked='true'] {
        background: #f7f3ec;
        color: #2a2622;
    }
    .aa .sw-sepia,
    .aa .sw-sepia[aria-checked='true'] {
        background: #f3e9d2;
        color: #3a2e22;
    }
    .aa .sw-dark,
    .aa .sw-dark[aria-checked='true'] {
        background: #2b2a29;
        color: #f2eee8;
    }
    .aa .sw-night,
    .aa .sw-night[aria-checked='true'] {
        background: #000;
        color: #d9d4cb;
    }
    .aa .sw[aria-checked='true'] {
        box-shadow: 0 0 0 2px var(--r-gold-hi);
    }

    /* ---------- as páginas ---------- */
    .stage {
        position: absolute;
        inset: 0;
        overflow: hidden;
    }
    .flow {
        position: absolute;
        left: var(--m);
        top: var(--top);
        width: var(--fw);
        height: var(--ph);
        column-width: var(--pw);
        column-gap: var(--gap);
        column-fill: auto;
        opacity: 0;
        transition: transform 280ms cubic-bezier(0.2, 0.7, 0.2, 1);
        font-family: var(--r-read-font), Georgia, serif;
        font-size: var(--fs);
        line-height: 1.45;
        color: var(--r-text);
        text-align: justify;
        hyphens: auto;
        -webkit-hyphens: auto;
        font-kerning: normal;
        text-rendering: optimizeLegibility;
        orphans: 2;
        widows: 2;
    }
    .flow.shown {
        opacity: 1;
    }
    &.jump .flow {
        transition: none;
    }
    @media (prefers-reduced-motion: reduce) {
        .flow,
        .tb,
        .side {
            transition: none;
        }
    }
    .flow section.ch {
        break-before: column;
        -webkit-column-break-before: always;
    }
    .flow section.ch:first-child {
        break-before: auto;
        -webkit-column-break-before: auto;
    }
    .flow .eb {
        margin: 2.2em 0 0.8em;
        font-family: var(--r-ui-font), system-ui, sans-serif;
        font-size: 11px;
        font-weight: 500;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        text-align: left;
        color: var(--r-muted);
    }
    .flow h1 {
        margin: 0 0 1.8em;
        font-size: 1.45em;
        font-weight: 400;
        line-height: 1.25;
        text-align: left;
        hyphens: manual;
        break-after: avoid;
    }
    .prose p {
        margin: 0;
    }
    .prose p + p {
        text-indent: 1.5em;
    }
    .prose h2,
    .prose h3,
    .prose h4 {
        margin: 1.4em 0 0.5em;
        font-size: 1.05em;
        font-weight: 600;
        line-height: 1.3;
        text-align: left;
        hyphens: manual;
        break-after: avoid;
    }
    .prose ul,
    .prose ol {
        margin: 0.6em 0;
        padding-left: 1.4em;
    }
    .prose li {
        margin: 0 0 0.3em;
    }
    .prose strong {
        font-weight: 600;
    }
    .prose blockquote {
        margin: 1em 0;
        padding: 0 0 0 1em;
        border-left: 1px solid var(--r-gold);
        color: var(--r-muted);
        font-style: italic;
        text-align: left;
    }
    .prose a {
        color: var(--r-gold-hi);
        text-decoration: underline;
        text-underline-offset: 3px;
    }
    .prose .mentira-open {
        margin: 1.8em 0 0.6em;
        break-inside: avoid;
    }
    .prose .mentira-open h3 {
        margin: 0.3em 0 0;
    }
    .prose .badge {
        font-family: var(--r-ui-font), system-ui, sans-serif;
        font-size: 11px;
        font-weight: 500;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--r-gold-hi);
    }
    .prose .planos {
        display: grid;
        gap: 10px;
        margin: 1em 0;
    }
    .prose .plano {
        display: grid;
        gap: 4px;
        padding: 14px 16px;
        border: 1px solid var(--r-line-strong);
        border-radius: 12px;
        color: var(--r-text);
        text-decoration: none;
        text-align: left;
        line-height: 1.4;
        break-inside: avoid;
    }
    .prose .plano-nome {
        font-weight: 600;
    }
    .prose .plano-desc,
    .prose .plano-btn {
        font-size: 0.85em;
    }
    .prose .plano-btn {
        color: var(--r-gold-hi);
    }
    mark.hl {
        background: var(--hl);
        color: inherit;
        border-radius: 2px;
        cursor: pointer;
    }
    mark.hl.noted {
        border-bottom: 1px dotted var(--r-text);
    }

    /* ---------- setas e rodapé ---------- */
    .side {
        position: absolute;
        top: 50%;
        z-index: 5;
        display: grid;
        place-items: center;
        width: 44px;
        height: 72px;
        margin-top: -36px;
        border: 0;
        border-radius: 10px;
        background: none;
        color: var(--r-muted);
        cursor: pointer;
        transition: opacity 240ms ease;
    }
    .side:hover:not(:disabled) {
        color: var(--r-text);
    }
    .side:disabled {
        opacity: 0.2;
        cursor: default;
    }
    .side.prev {
        left: calc(var(--m) / 2 - 22px);
    }
    .side.next {
        right: calc(var(--m) / 2 - 22px);
    }
    .ft {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: var(--bottom);
        font-size: 11.5px;
        font-weight: 500;
        color: var(--r-muted);
        font-variant-numeric: tabular-nums;
        pointer-events: none;
        -webkit-user-select: none;
        user-select: none;
    }
    .ft .pn,
    .ft .left {
        position: absolute;
        top: 42%;
    }
    .ft .p1 {
        left: var(--m);
        width: var(--pw);
        text-align: center;
    }
    .ft .p2 {
        left: calc(var(--m) + var(--pw) + var(--gap));
        width: var(--pw);
        text-align: center;
    }
    .ft .left {
        right: 24px;
        top: calc(42% + 18px);
    }

    /* ---------- menu de destaque e nota ---------- */
    .menu {
        position: fixed;
        z-index: 8;
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 8px;
        border: 1px solid var(--r-line);
        border-radius: 999px;
        background: color-mix(in srgb, var(--r-sheet-head) 90%, transparent);
        -webkit-backdrop-filter: blur(20px);
        backdrop-filter: blur(20px);
        box-shadow: 0 10px 28px var(--r-card-shadow);
        -webkit-user-select: none;
        user-select: none;
    }
    .menu .dot {
        width: 26px;
        height: 26px;
        padding: 0;
        border: 2px solid transparent;
        border-radius: 50%;
        background: var(--hl);
        cursor: pointer;
    }
    .menu .dot.on {
        border-color: var(--r-text);
    }
    .menu .sep {
        width: 1px;
        height: 22px;
        background: var(--r-line-strong);
    }
    .menu .ib {
        width: 36px;
        height: 36px;
        color: var(--r-text);
    }
    .menu .txt {
        min-height: 36px;
        padding: 0 10px;
        border: 0;
        border-radius: 999px;
        background: none;
        color: var(--r-text);
        font: inherit;
        font-size: 13px;
        cursor: pointer;
    }
    .menu .txt:hover {
        background: var(--r-hover);
    }
    .pop.note {
        left: 50%;
        top: 30%;
        width: min(420px, calc(100vw - 32px));
        transform: translateX(-50%);
        grid-template-rows: auto auto auto;
        padding-bottom: 12px;
    }
    .pop.note textarea {
        min-height: 120px;
        margin: 12px 12px 0;
        padding: 10px 12px;
        border: 1px solid var(--r-line-strong);
        border-radius: 10px;
        background: transparent;
        color: var(--r-text);
        font: inherit;
        font-size: 14px;
        resize: vertical;
    }
    .pop.note .acts {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        padding: 10px 12px 0;
    }

    /* ---------- uma página (celular, tablet em pé) ---------- */
    &.single .tb {
        display: flex;
        justify-content: space-between;
        height: 52px;
        padding: 0 6px;
        gap: 4px;
    }
    &.single .tb .title {
        display: none;
    }
    &.single .tb .grp {
        gap: 2px;
    }
    &.single .tb .ib {
        width: 38px;
        height: 38px;
    }
    &.single .pop.left,
    &.single .pop.right {
        left: 8px;
        right: 8px;
        width: auto;
        top: 56px;
    }
    &.single .ft .p1 {
        width: auto;
        text-align: left;
    }
    &.single .ft .left {
        top: 42%;
        right: var(--m);
    }
`;

export default NewEbookReader;
