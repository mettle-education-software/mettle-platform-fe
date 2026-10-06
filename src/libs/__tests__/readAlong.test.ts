import { alignUrlFor, isUsableAlignment, wordAt, wordSpans, wordsOfDocument } from '../readAlong';

// Mesma forma do rich text do Contentful: marcas e links dividem o texto em nós; "\n" vira <br> no ReaderProse.
const doc = {
    nodeType: 'document',
    content: [
        {
            nodeType: 'paragraph',
            content: [
                { nodeType: 'text', value: 'You know, at every stage of our lives – we’re 18-year-olds… ' },
                { nodeType: 'text', value: 'Here' },
                { nodeType: 'text', value: "'s the end.\nThank you!" },
            ],
        },
        {
            nodeType: 'paragraph',
            content: [
                { nodeType: 'text', value: '[' },
                { nodeType: 'entry-hyperlink', content: [{ nodeType: 'text', value: 'Applause' }] },
                { nodeType: 'text', value: ']' },
            ],
        },
    ],
};

describe('tokenização (igual ao align.py: por nó de texto, letras/dígitos/apóstrofo)', () => {
    it('palavras na ordem do texto, pontuação fora, apóstrofos dentro', () => {
        expect(wordsOfDocument(doc as never)).toEqual(
            ['You', 'know', 'at', 'every', 'stage', 'of', 'our', 'lives', 'we’re', '18', 'year', 'olds'].concat([
                'Here',
                "'s",
                'the',
                'end',
                'Thank',
                'you',
                'Applause',
            ]),
        );
    });

    it('wordSpans dá os mesmos tokens que wordsOfDocument (o front marca o que o JSON cronometrou)', () => {
        const text = 'Middle-aged people… rush; 129 dollars!';
        expect(wordSpans(text).map(([s, e]) => text.slice(s, e))).toEqual(
            wordsOfDocument({ nodeType: 'text', value: text }),
        );
        expect(wordSpans(' – … ')).toEqual([]);
    });
});

describe('wordAt (busca binária)', () => {
    const words: [number, number][] = [
        [1000, 1200],
        [1200, 1500],
        [1500, 1600],
        [5000, 5400],
    ];
    it('palavra cujo início já passou', () => {
        expect(wordAt(words, 0)).toBe(-1);
        expect(wordAt(words, 1000)).toBe(0);
        expect(wordAt(words, 1350)).toBe(1);
        expect(wordAt(words, 1599)).toBe(2);
        expect(wordAt(words, 5000)).toBe(3);
        expect(wordAt(words, 9e9)).toBe(-1);
    });
    it('numa pausa longa o destaque some', () => {
        expect(wordAt(words, 2700)).toBe(2);
        expect(wordAt(words, 3000)).toBe(-1);
    });
});

describe('alignUrlFor e isUsableAlignment', () => {
    const audio = 'https://mirror.example/media/4osU1/265dbde7f0820dc3d30201b1437e22f8/Change.mp3';
    it('só para áudio servido pelo espelho', () => {
        expect(alignUrlFor(audio, 'DEDA35')).toBe('https://mirror.example/align/DEDA35.json?v=1');
        expect(alignUrlFor('https://downloads.ctfassets.net/x/Change.mp3', 'DEDA35')).toBeNull();
        expect(alignUrlFor(audio, '../x')).toBeNull();
        expect(alignUrlFor('', 'DEDA35')).toBeNull();
    });
    it('contagem, asset e ordem conferem; senão nada é destacado', () => {
        const a = {
            dedaId: 'DEDA35',
            audioAssetId: '4osU1',
            durationMs: 9,
            version: 1,
            words: [
                [0, 1],
                [1, 2],
            ],
        };
        expect(isUsableAlignment(a, 'DEDA35', audio, 2)).toBe(true);
        expect(isUsableAlignment(a, 'DEDA35', audio, 3)).toBe(false);
        expect(isUsableAlignment({ ...a, audioAssetId: 'outro' }, 'DEDA35', audio, 2)).toBe(false);
        expect(
            isUsableAlignment(
                {
                    ...a,
                    words: [
                        [5, 6],
                        [1, 2],
                    ],
                },
                'DEDA35',
                audio,
                2,
            ),
        ).toBe(false);
        expect(isUsableAlignment(null, 'DEDA35', audio, 2)).toBe(false);
    });
});
