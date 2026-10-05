'use client';

import { Info } from 'lucide-react';
import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { ICON } from './readerStyles';

/**
 * ⓘ ao lado de um rótulo: a explicação fica guardada aqui (toque ou teclado abre; tocar fora, Esc ou o próprio ⓘ
 * fecha). O balão abre para baixo, alinhado à linha do rótulo (o contêiner com position: relative), sem cobri-lo;
 * quando não cabe embaixo (fim da área de rolagem, atrás da barra fixa, pé da tela), abre para cima — e, se também
 * não couber em cima, rola até ficar inteiro à vista. Nunca fica escondido.
 */
export const InfoTip = ({ text, label }: { text: string; label: string }) => {
    const [open, setOpen] = useState(false);
    const box = useRef<HTMLSpanElement>(null);
    const tip = useRef<HTMLSpanElement>(null);
    const [up, setUp] = useState(false);
    const id = useId();
    useLayoutEffect(() => {
        const el = tip.current;
        if (!open || !el) return setUp(false);
        // Limites visíveis: a área de rolagem em que o ⓘ está (a barra fixa fica logo abaixo dela) ou a tela.
        const area = el.closest('.scroll, .ant-drawer-body')?.getBoundingClientRect();
        const top = Math.max(area?.top ?? 0, 0);
        const bottom = Math.min(area?.bottom ?? window.innerHeight, window.innerHeight);
        const box = el.getBoundingClientRect();
        // Na barra fixa do pé da tela, abre para cima por padrão: não cobre os botões logo abaixo.
        if (box.bottom <= bottom - 8 && !el.closest('.dock')) return;
        const line = el.offsetParent?.getBoundingClientRect();
        if (line && line.top - box.height - 10 >= top + 8) setUp(true);
        else el.scrollIntoView({ block: 'nearest' });
    }, [open]);
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
            <span id={id} ref={tip} role="status" className={up ? 'tip up' : 'tip'} hidden={!open}>
                {open && text}
            </span>
        </span>
    );
};
