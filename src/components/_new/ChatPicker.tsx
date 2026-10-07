'use client';

import { EMOJI_GROUPS, readRecentEmoji } from 'libs/emoji';
import { Clock3, Smile, Sticker } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { getStickers, type StickerPack } from 'services/chatService';

/**
 * Painel do Mettle Chat acima do campo de mensagem: emojis (recentes + grupos, nativos) e figurinhas (pacotes do
 * manifesto no R2, servidos pelo Worker). Abre no lugar onde o teclado ficaria, como no WhatsApp.
 */
export const ChatPicker: React.FC<{
    tab: 'emoji' | 'sticker';
    onTab: (t: 'emoji' | 'sticker') => void;
    onEmoji: (e: string) => void;
    onSticker: (id: string, url: string) => void;
}> = ({ tab, onTab, onEmoji, onSticker }) => {
    const [recent] = useState(readRecentEmoji);
    const [packs, setPacks] = useState<StickerPack[] | null>(null);
    const grid = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (tab !== 'sticker' || packs) return;
        getStickers()
            .then((r) => setPacks(r.packs))
            .catch(() => setPacks([]));
    }, [tab, packs]);

    const jump = (id: string) => grid.current?.querySelector(`[data-g="${id}"]`)?.scrollIntoView({ block: 'start' });
    const stickers = packs?.flatMap((p) => p.stickers) ?? [];

    return (
        <div className="picker">
            <div className="ptabs" role="tablist">
                <button
                    type="button"
                    role="tab"
                    aria-selected={tab === 'emoji'}
                    aria-label="Emojis"
                    onClick={() => onTab('emoji')}
                >
                    <Smile size={20} strokeWidth={1.6} />
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={tab === 'sticker'}
                    aria-label="Figurinhas"
                    onClick={() => onTab('sticker')}
                >
                    <Sticker size={20} strokeWidth={1.6} />
                </button>
                {tab === 'emoji' && (
                    <span className="cats">
                        {recent.length > 0 && (
                            <button type="button" aria-label="Recentes" onClick={() => jump('recent')}>
                                <Clock3 size={17} strokeWidth={1.6} />
                            </button>
                        )}
                        {EMOJI_GROUPS.map((g) => (
                            <button key={g.id} type="button" aria-label={g.id} onClick={() => jump(g.id)}>
                                {g.icon}
                            </button>
                        ))}
                    </span>
                )}
            </div>
            {tab === 'emoji' ? (
                <div className="pgrid emo" ref={grid}>
                    {recent.length > 0 && (
                        <>
                            <span className="gh" data-g="recent" />
                            {recent.map((e) => (
                                <button key={'r' + e} type="button" onClick={() => onEmoji(e)}>
                                    {e}
                                </button>
                            ))}
                        </>
                    )}
                    {EMOJI_GROUPS.map((g) => (
                        <React.Fragment key={g.id}>
                            <span className="gh" data-g={g.id} />
                            {g.list.map((e) => (
                                <button key={g.id + e} type="button" onClick={() => onEmoji(e)}>
                                    {e}
                                </button>
                            ))}
                        </React.Fragment>
                    ))}
                </div>
            ) : packs && stickers.length === 0 ? (
                <div className="pempty" aria-hidden>
                    <Sticker size={40} strokeWidth={1.2} />
                </div>
            ) : (
                <div className="pgrid stk">
                    {stickers.map((s) => (
                        <button key={s.id} type="button" aria-label="Figurinha" onClick={() => onSticker(s.id, s.url)}>
                            <img src={s.url} alt="" loading="lazy" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
