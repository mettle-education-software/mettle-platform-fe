'use client';

import { Info } from 'lucide-react';
import React, { useEffect, useId, useRef, useState } from 'react';
import { ICON } from './readerStyles';

/**
 * ⓘ ao lado de um rótulo: a explicação fica guardada aqui (toque ou teclado abre; tocar fora, Esc ou o próprio ⓘ
 * fecha). O balão abre para baixo, alinhado à linha do rótulo (o contêiner com position: relative), sem cobri-lo.
 */
export const InfoTip = ({ text, label }: { text: string; label: string }) => {
    const [open, setOpen] = useState(false);
    const box = useRef<HTMLSpanElement>(null);
    const id = useId();
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
    return (
        <span className="info" ref={box}>
            <button
                type="button"
                aria-label={label}
                aria-expanded={open}
                aria-controls={id}
                onClick={() => setOpen((v) => !v)}
            >
                <Info {...ICON} size={15} aria-hidden />
            </button>
            {/* role=status: o leitor de tela anuncia o texto ao abrir */}
            <span id={id} role="status" className="tip" hidden={!open}>
                {open && text}
            </span>
        </span>
    );
};
