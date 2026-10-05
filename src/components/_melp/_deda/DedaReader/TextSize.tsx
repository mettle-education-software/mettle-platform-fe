'use client';

import { DEFAULT_TEXT_SCALE, TEXT_SCALES } from 'libs/dedaReader';
import { ALargeSmall } from 'lucide-react';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { readFont } from './readerFonts';
import { ArticleTools, ICON } from './readerStyles';

/** Tamanho do texto da página nova do DEDA; null fora dela (página atual: nada de "Aa"). */
export const TextSizeContext = createContext<{ scale: number; onScale(scale: number): void } | null>(null);

/**
 * "Aa" da barra do topo: tamanho do texto de leitura (Introduction, Glossary, passos 2, 4 e 5, notas de contexto e
 * o artigo do LinKnowledge). A preferência fica no aparelho e vale por variável CSS (--r-scale, em readerStyles).
 */
export const TextSize = ({ scale, onScale }: { scale: number; onScale(scale: number): void }) => {
    const [open, setOpen] = useState(false);
    const box = useRef<HTMLSpanElement>(null);
    const sizes = useRef<(HTMLButtonElement | null)[]>([]);
    useEffect(() => {
        if (!open) return;
        const outside = (event: PointerEvent) => !box.current?.contains(event.target as Node) && setOpen(false);
        const escape = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
        document.addEventListener('pointerdown', outside);
        document.addEventListener('keydown', escape);
        return () => {
            document.removeEventListener('pointerdown', outside);
            document.removeEventListener('keydown', escape);
        };
    }, [open]);
    const step = (event: React.KeyboardEvent, by: number) => {
        event.preventDefault();
        const next = Math.min(TEXT_SCALES.length - 1, Math.max(0, TEXT_SCALES.indexOf(scale as never) + by));
        onScale(TEXT_SCALES[next]);
        sizes.current[next]?.focus();
    };
    return (
        <span className="tsize" ref={box}>
            <button
                type="button"
                className="ib"
                aria-label="Text size"
                aria-haspopup="true"
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
            >
                <ALargeSmall {...ICON} aria-hidden />
            </button>
            {open && (
                <span className="panel" role="radiogroup" aria-label="Text size">
                    {TEXT_SCALES.map((value, i) => (
                        <button
                            key={value}
                            ref={(el) => {
                                sizes.current[i] = el;
                            }}
                            type="button"
                            role="radio"
                            aria-checked={value === scale}
                            aria-label={`${Math.round((value / DEFAULT_TEXT_SCALE) * 100)}%${value === DEFAULT_TEXT_SCALE ? ', default' : ''}`}
                            tabIndex={value === scale ? 0 : -1}
                            style={{ fontSize: Math.round(15 * value * value) }}
                            onClick={() => onScale(value)}
                            onKeyDown={(event) => {
                                if (event.key === 'ArrowRight' || event.key === 'ArrowUp') step(event, 1);
                                if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') step(event, -1);
                            }}
                        >
                            A
                        </button>
                    ))}
                </span>
            )}
        </span>
    );
};

/**
 * O mesmo "Aa" no cabeçalho do leitor de artigo do LinKnowledge (popup fora da casca): o aluno muda o tamanho sem
 * fechar o artigo. Mesma preferência; não aparece na página atual.
 */
export const ArticleTextSize = () => {
    const textSize = useContext(TextSizeContext);
    if (!textSize) return null;
    return (
        <ArticleTools
            className="reader-theme-dark"
            style={{ '--r-read-font': readFont.style.fontFamily } as React.CSSProperties}
        >
            <TextSize {...textSize} />
        </ArticleTools>
    );
};
