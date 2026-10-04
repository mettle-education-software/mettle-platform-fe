'use client';

import styled from '@emotion/styled';
import { Drawer, Typography } from 'antd';
import Image from 'next/image';
import { ReactNode, useRef, useState } from 'react';
import { ContextNoteData } from '../../../libs/contextNotes';

const { Paragraph } = Typography;

// <span role="button">, não <button>: o botão é uma caixa indivisível e deixava a vírgula ou o parêntese vizinho
// sozinho na outra linha; o span quebra linha como texto comum e mantém a pontuação colada.
const Trigger = styled.span`
    cursor: pointer;
    text-decoration: underline dotted;
    text-decoration-thickness: 1.5px;
    text-underline-offset: 4px;

    &:hover {
        text-decoration-style: solid;
    }

    &:focus-visible {
        outline: 2px solid currentColor;
        outline-offset: 3px;
        border-radius: 2px;
    }
`;

const NoteImage = styled(Image)`
    width: 100%;
    height: auto;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
`;

// Computador (>= 900 px): painel à direita; celular: folha de baixo. Decidido ao abrir.
const isDesktop = () => window.matchMedia('(min-width: 900px)').matches;

export const ContextNote = ({ note, children }: { note: ContextNoteData; children: ReactNode }) => {
    const [open, setOpen] = useState(false);
    const placement = useRef<'right' | 'bottom'>('right');
    const content = useRef<HTMLDivElement>(null);

    const show = () => {
        placement.current = isDesktop() ? 'right' : 'bottom';
        // onOpen: ponto único para o evento de uso (nota, DEDA) — o projeto ainda não tem analytics.
        setOpen(true);
    };

    return (
        <>
            <Trigger
                role="button"
                tabIndex={0}
                aria-haspopup="dialog"
                aria-expanded={open}
                onClick={show}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        show();
                    }
                }}
            >
                {children}
            </Trigger>
            <Drawer
                open={open}
                onClose={() => setOpen(false)}
                title={<span lang="en">{note.term}</span>}
                afterOpenChange={(o) => o && content.current?.focus()}
                placement={placement.current}
                width={placement.current === 'right' ? 400 : undefined}
                height={placement.current === 'bottom' ? '70vh' : undefined}
                rootClassName="context-note-drawer"
                styles={{ mask: { background: 'rgba(0, 0, 0, 0.15)' } }}
                aria-label={note.term}
            >
                {/* Interface e notas são em inglês; a Introdução ao redor é em português. */}
                <div lang="en" ref={content} tabIndex={-1} style={{ outline: 'none' }}>
                    {note.image && (
                        <NoteImage
                            src={note.image.src}
                            width={note.image.width}
                            height={note.image.height}
                            alt={note.image.alt}
                        />
                    )}
                    {note.paragraphs.map((p, i) => (
                        <Paragraph key={i}>{p}</Paragraph>
                    ))}
                </div>
            </Drawer>
        </>
    );
};
