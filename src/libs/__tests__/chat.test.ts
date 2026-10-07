import {
    bigEmoji,
    chatRows,
    contextPrefill,
    dayLabel,
    fileName,
    linkParts,
    mergeMessages,
    nameHue,
    quoteText,
    unreadStart,
    waveform,
    type ChatMessage,
} from '../chat';

const msg = (id: number, at: number, mine: boolean, name = 'Pedro', extra: Partial<ChatMessage> = {}): ChatMessage => ({
    id,
    at,
    mine,
    text: String(id),
    from: mine ? null : { name, avatar: null },
    files: [],
    ...extra,
});

describe('mergeMessages', () => {
    it('junta por id, em ordem, pendentes no fim', () => {
        const pending = msg(-1, 50, true, '', { pending: 'sending' });
        const out = mergeMessages(
            [msg(2, 20, true), pending],
            [msg(1, 10, false), msg(2, 20, true), msg(3, 30, false)],
        );
        expect(out.map((m) => m.id)).toEqual([1, 2, 3, -1]);
    });
});

describe('chatRows', () => {
    const base = new Date(2026, 9, 7, 12).getTime() / 1000;
    it('agrupa por remetente e quebra no dia, no remetente e após 5 min', () => {
        const rows = chatRows(
            [
                msg(1, base, false),
                msg(2, base + 60, false),
                msg(3, base + 120, false, 'André'),
                msg(4, base + 900, false, 'André'),
                msg(5, base + 86400, true),
            ],
            (base + 86400) * 1000,
        );
        const m = rows.filter((r) => r.type === 'msg') as Extract<
            ReturnType<typeof chatRows>[number],
            { type: 'msg' }
        >[];
        expect(m.map((r) => [r.first, r.last])).toEqual([
            [true, false],
            [false, true],
            [true, true],
            [true, true],
            [true, true],
        ]);
        expect(rows.filter((r) => r.type === 'day').map((r) => (r as { label: string }).label)).toEqual([
            'Ontem',
            'Hoje',
        ]);
    });
});

describe('dayLabel', () => {
    it('data por extenso fora de hoje/ontem; ano só se for outro', () => {
        const now = new Date(2026, 9, 7, 12).getTime();
        expect(dayLabel(new Date(2026, 8, 3, 12).getTime() / 1000, now)).toBe('3 de setembro');
        expect(dayLabel(new Date(2025, 8, 3, 12).getTime() / 1000, now)).toBe('3 de setembro de 2025');
    });
});

describe('contextPrefill', () => {
    const origin = 'https://plataforma.mettle.com.br';
    it('aceita só links da própria Plataforma', () => {
        expect(contextPrefill('/imerso/deda/socrates', origin)).toBe(`${origin}/imerso/deda/socrates\n`);
        expect(contextPrefill(`${origin}/course/x`, origin)).toBe(`${origin}/course/x\n`);
        expect(contextPrefill('https://evil.example/x', origin)).toBe('');
        expect(contextPrefill('javascript:alert(1)', origin)).toBe('');
        expect(contextPrefill(null, origin)).toBe('');
    });
});

describe('linkParts', () => {
    it('separa links do texto sem levar a pontuação final', () => {
        expect(linkParts('veja https://a.com/x. ok')).toEqual([
            { text: 'veja ' },
            { text: 'https://a.com/x', href: 'https://a.com/x' },
            { text: '. ok' },
        ]);
        expect(linkParts('sem link')).toEqual([{ text: 'sem link' }]);
    });
});

describe('WhatsApp: emoji grande, cor do nome, onda, não lidas', () => {
    it('só 1 a 3 emojis viram emoji grande', () => {
        expect(bigEmoji('👍')).toBe(true);
        expect(bigEmoji('😂😂😂')).toBe(true);
        expect(bigEmoji('❤️ 👍')).toBe(true);
        expect(bigEmoji('🇧🇷')).toBe(true);
        expect(bigEmoji('😂😂😂😂')).toBe(false);
        expect(bigEmoji('ok 👍')).toBe(false);
        expect(bigEmoji('123')).toBe(false);
        expect(bigEmoji('')).toBe(false);
    });
    it('cor do nome é estável por nome', () => {
        expect(nameHue('André Floriano')).toBe(nameHue('André Floriano'));
        expect(typeof nameHue('Pedro')).toBe('number');
    });
    it('onda determinística, 36 barras entre 0,2 e 1', () => {
        const w = waveform(11714);
        expect(w).toEqual(waveform(11714));
        expect(w).toHaveLength(36);
        expect(Math.min(...w)).toBeGreaterThanOrEqual(0.2);
        expect(Math.max(...w)).toBeLessThanOrEqual(1);
        expect(waveform(1)).not.toEqual(w);
    });
    it('faixa de não lidas antes da N-ésima mensagem da equipe, do fim para trás', () => {
        const ms = [msg(1, 1, false), msg(2, 2, true), msg(3, 3, false), msg(4, 4, true), msg(5, 5, false)];
        expect(unreadStart(ms, 2)).toBe(3);
        expect(unreadStart(ms, 1)).toBe(5);
        expect(unreadStart(ms, 0)).toBeNull();
        expect(unreadStart(ms, 9)).toBeNull();
    });
    it('citação e nome de arquivo', () => {
        expect(quoteText({ text: '', kind: 'image' })).toBe('📷 Foto');
        expect(quoteText({ text: 'oi', kind: 'image' })).toBe('oi');
        expect(
            fileName('https://chat.mettle.com.br/rails/active_storage/blobs/redirect/abc/Guia%20Final.pdf', 'pdf'),
        ).toBe('Guia Final.pdf');
        expect(fileName('blob:https://x/123', 'pdf')).toBe('arquivo.pdf');
    });
});
