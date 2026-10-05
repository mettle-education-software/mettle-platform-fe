'use client';

import { documentToReactComponents, Options } from '@contentful/rich-text-react-renderer';
import { BLOCKS, Document, INLINES, MARKS, Node } from '@contentful/rich-text-types';
import { LinkType } from 'interfaces';
import { ContextNoteData, findContextNote } from 'libs/contextNotes';
import Image from 'next/image';
import React, { ReactNode, useState } from 'react';

interface Props {
    rawContent?: Document;
    links?: LinkType;
    lang?: string;
}

/** Ids das notas de contexto (entry-hyperlink) dentro de um bloco. */
const noteIdsIn = (node: Node): string[] =>
    node.nodeType === INLINES.ENTRY_HYPERLINK
        ? [node.data?.target?.sys?.id].filter((id): id is string => typeof id === 'string')
        : ((node as { content?: Node[] }).content ?? []).flatMap(noteIdsIn);

const InlineNote = ({ note, onClose }: { note: ContextNoteData; onClose(): void }) => (
    <aside className="inote" role="note" aria-label={note.term} lang="en">
        <h4>
            {note.term}
            <small>Context note</small>
        </h4>
        {note.image && (
            <Image
                src={note.image.src}
                width={note.image.width}
                height={note.image.height}
                alt={note.image.alt}
                className="inote-img"
            />
        )}
        {note.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
        ))}
        <button type="button" className="ib inote-x" aria-label="Close note" onClick={onClose}>
            ×
        </button>
    </aside>
);

/**
 * Texto do passo como vem do conteúdo (nada é alterado nem reordenado), na tipografia do leitor. Termo com nota de
 * contexto abre a nota logo abaixo do parágrafo; o mesmo termo (ou o ×) fecha.
 */
export const ReaderProse = ({ rawContent, links, lang = 'en' }: Props) => {
    const [openId, setOpenId] = useState<string | null>(null);
    if (!rawContent) return null;

    const assets = new Map<string, { url: string; title?: string }>();
    links?.assets?.block?.forEach((asset: { sys: { id: string }; url: string; title?: string }) =>
        assets.set(asset.sys.id, asset),
    );
    const withNote = (node: Node, block: ReactNode) => {
        const note = openId && noteIdsIn(node).includes(openId) ? findContextNote(openId, links) : null;
        return note ? (
            <>
                {block}
                <InlineNote note={note} onClose={() => setOpenId(null)} />
            </>
        ) : (
            block
        );
    };

    const options: Options = {
        renderMark: {
            [MARKS.BOLD]: (text) => <strong>{text}</strong>,
            [MARKS.ITALIC]: (text) => <em>{text}</em>,
        },
        renderNode: {
            [BLOCKS.PARAGRAPH]: (node, children) => withNote(node, <p>{children}</p>),
            [BLOCKS.HEADING_1]: (node, children) => withNote(node, <h2>{children}</h2>),
            [BLOCKS.HEADING_2]: (node, children) => withNote(node, <h2>{children}</h2>),
            [BLOCKS.HEADING_3]: (node, children) => withNote(node, <h3>{children}</h3>),
            [BLOCKS.HEADING_4]: (node, children) => withNote(node, <h4>{children}</h4>),
            [BLOCKS.HEADING_5]: (node, children) => withNote(node, <h4>{children}</h4>),
            [BLOCKS.HEADING_6]: (node, children) => withNote(node, <h4>{children}</h4>),
            [BLOCKS.UL_LIST]: (node, children) => <ul>{children}</ul>,
            [BLOCKS.OL_LIST]: (node, children) => <ol>{children}</ol>,
            [BLOCKS.EMBEDDED_ASSET]: (node) => {
                const asset = assets.get(node.data?.target?.sys?.id);
                return asset ? (
                    <Image
                        className="embed"
                        src={asset.url}
                        width={600}
                        height={400}
                        alt={asset.title || 'Embed text image'}
                    />
                ) : null;
            },
            [INLINES.ENTRY_HYPERLINK]: (node, children) => {
                const id = node.data?.target?.sys?.id;
                if (!findContextNote(id, links)) return <>{children}</>;
                const toggle = () => setOpenId((current) => (current === id ? null : id));
                // span (não button): quebra linha como texto e mantém a pontuação vizinha colada, como em ContextNote.
                return (
                    <span
                        className="term"
                        role="button"
                        tabIndex={0}
                        aria-expanded={openId === id}
                        onClick={toggle}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                toggle();
                            }
                        }}
                    >
                        {children}
                    </span>
                );
            },
            // Só http(s)/mailto viram link; qualquer outro esquema fica como texto.
            [INLINES.HYPERLINK]: (node, children) =>
                /^(https?:|mailto:)/i.test(String(node.data?.uri ?? '')) ? (
                    <a href={node.data.uri} target="_blank" rel="noopener noreferrer">
                        {children}
                    </a>
                ) : (
                    <>{children}</>
                ),
        },
    };

    return (
        <article className="prose" lang={lang}>
            {documentToReactComponents(rawContent, options)}
        </article>
    );
};
