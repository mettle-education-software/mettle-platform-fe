import { type CMessage, mentionParts, mentionQuery, mergeC, toChat } from '../comunidade';

const msg = (over: Partial<CMessage>): CMessage => ({
    id: 1,
    at: 100,
    uid: 'a',
    name: 'Ana',
    text: 'oi',
    kind: 'text',
    media: null,
    reply: null,
    mentions: [],
    reactions: {},
    deleted: null,
    ...over,
});

describe('comunidade', () => {
    it('separa as menções dos nomes mencionados (o mais longo primeiro)', () => {
        expect(mentionParts('oi @Ana Lu e @Ana', ['Ana', 'Ana Lu'])).toEqual([
            { text: 'oi ' },
            { text: '@Ana Lu', mention: true },
            { text: ' e ' },
            { text: '@Ana', mention: true },
        ]);
        expect(mentionParts('sem nada', [])).toEqual([{ text: 'sem nada' }]);
        expect(mentionParts('@a.b', ['a.b'])).toEqual([{ text: '@a.b', mention: true }]);
    });
    it('reconhece o @ sendo digitado antes do cursor', () => {
        expect(mentionQuery('olá @an', 7)).toEqual({ start: 4, q: 'an' });
        expect(mentionQuery('@', 1)).toEqual({ start: 0, q: '' });
        expect(mentionQuery('email@x', 7)).toBeNull();
        expect(mentionQuery('@ana ', 5)).toBeNull();
    });
    it('junta por id e deixa as pendentes no fim', () => {
        const out = mergeC(
            [msg({ id: -1, pending: 'sending' }), msg({ id: 2 })],
            [msg({ id: 1 }), msg({ id: 2, text: 'novo' })],
        );
        expect(out.map((m) => m.id)).toEqual([1, 2, -1]);
        expect(out[1].text).toBe('novo');
    });
    it('no formato do Mettle Chat: minha, figurinha, citação apagada', () => {
        const c = toChat(
            msg({
                uid: 'eu',
                kind: 'sticker',
                media: { url: 'u', size: null, ext: 'webp' },
                reply: { id: 9, uid: 'x', name: 'X', text: '', kind: 'text', deleted: true },
            }),
            'eu',
        );
        expect(c.mine).toBe(true);
        expect(c.sticker).toBe(true);
        expect(c.files[0].kind).toBe('image');
        expect(c.reply?.text).toBe('Mensagem apagada');
    });
});
