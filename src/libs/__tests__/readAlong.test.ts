import {
    alignUrlFor,
    blockAt,
    blocksOf,
    isUsableAlignment,
    lineRects,
    MARK_EM,
    markBox,
    ReadAlongMode,
    wordAt,
    wordsAndGaps,
    wordSpans,
    wordsOfDocument,
} from '../readAlong';

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

describe('marca do read-along centrada na palavra', () => {
    it.each([14.4, 18, 23.4, 26])('folga igual em cima e embaixo (fonte %spx)', (size) => {
        const font = { size, ascent: size * 0.95, cap: size * 0.7 };
        const rect = { left: 100, top: 40, width: 60 };
        const b = markBox(rect, { left: 10, top: 20 }, font);
        const baseline = rect.top + font.ascent - 20;
        const capTop = baseline - font.cap;
        const above = capTop - b.top;
        const below = b.top + b.height - baseline;
        expect(above).toBeCloseTo(below, 6);
        expect(above).toBeGreaterThan(0);
        expect(b.width).toBeGreaterThan(rect.width);
        expect(b.height).toBeCloseTo(MARK_EM * size, 6);
    });
});

// Frases reais do DEDA35 (Change). `runs` = nós de texto na ordem renderizada; "\n" entre parágrafos.
const show = (runs: string[], mode: ReadAlongMode) => {
    const { words, gaps } = wordsAndGaps(runs);
    return blocksOf(words, gaps, mode).map(([s, e]) => words.slice(s, e + 1).join(' '));
};

describe('blocos do read-along (Phrase e Sentence)', () => {
    it('wordsAndGaps segue a tokenização e guarda o texto entre as palavras, inclusive entre nós', () => {
        const { words, gaps } = wordsAndGaps(['Here', "'s the end.", '\n', '[', 'Applause', ']']);
        expect(words).toEqual(
            wordsOfDocument(doc as never)
                .slice(12, 16)
                .concat('Applause'),
        );
        expect(gaps).toEqual(['', ' ', ' ', '.\n[', ']']);
    });

    it('pontuação corta o bloco; "So," sozinho vai junto com o seguinte', () => {
        const runs = [
            'You know, at every stage of our lives, we make decisions that will profoundly influence the lives of ' +
                'the people we’re going to become. So, young people pay good money to get tattoos removed.',
        ];
        expect(show(runs, 'phrase')).toEqual([
            'You know',
            'at every stage of our lives',
            'we make decisions',
            'that will profoundly influence the lives',
            'of the people we’re going to become',
            'So young people pay good money',
            'to get tattoos removed',
        ]);
        expect(show(runs, 'sentence')).toHaveLength(2);
    });

    it('frase longa sem vírgula: pedaços de 4–7, começando por conjunção/preposição, sem terminar em artigo', () => {
        const runs = [
            'We asked half of them to predict for us how much their values would change in the next ten years and ' +
                'the others to tell us how much their values had changed in the last ten years.',
        ];
        const blocks = show(runs, 'phrase');
        expect(blocks).toEqual([
            'We asked half of them',
            'to predict for us',
            'how much their values would change',
            'in the next ten years',
            'and the others to tell us',
            'how much their values had changed',
            'in the last ten years',
        ]);
        blocks.forEach((b) => expect(b.split(' ').length).toBeLessThanOrEqual(7));
        expect(show(runs, 'sentence')).toHaveLength(1);
    });

    it('aspas: abrir aspas corta o bloco; "?" seguido de minúscula não termina a sentença', () => {
        const runs = [
            'We call this “The End of History Illusion.” To give you an idea. ',
            'We ask half of them to tell us, "Do you think that that will change over the next ten years?" and half ' +
                'of them to tell us.',
        ];
        expect(show(runs, 'phrase').slice(0, 3)).toEqual([
            'We call this',
            'The End of History Illusion',
            'To give you an idea',
        ]);
        expect(show(runs, 'sentence')).toEqual([
            'We call this The End of History Illusion',
            'To give you an idea',
            'We ask half of them to tell us Do you think that that will change over the next ten years and half of ' +
                'them to tell us',
        ]);
    });

    it('números ficam com o substantivo; "1.5" e "Mr." não terminam sentença; hífen não é corte', () => {
        expect(
            show(['People said they would pay 129 dollars for that ticket and yet only 80 dollars today.'], 'phrase'),
        ).toEqual(['People said they would pay', '129 dollars for that ticket', 'and yet only 80 dollars today']);
        expect(show(['It grew 1.5 times, Mr. Smith said. It bedevils our decision-making.'], 'sentence')).toEqual([
            'It grew 1 5 times Mr Smith said',
            'It bedevils our decision making',
        ]);
        expect(show(["Here['s] three values – everybody here holds all of them."], 'phrase')).toEqual([
            "Here 's three values",
            'everybody here holds all of them',
        ]);
    });

    it('"[Applause]" em parágrafo próprio é um bloco só; Word = uma palavra por bloco', () => {
        const runs = ['The one constant in our life is change. Thank you!', '\n', '[', 'Applause', ']'];
        expect(show(runs, 'phrase').slice(-2)).toEqual(['Thank you', 'Applause']);
        expect(show(runs, 'sentence').slice(-1)).toEqual(['Applause']);
        expect(show(runs, 'word')).toHaveLength(11);
    });

    it('blockAt acha o bloco da palavra atual', () => {
        const blocks: [number, number][] = [
            [0, 1],
            [2, 6],
            [7, 7],
        ];
        expect([0, 1, 2, 6, 7, 8, -1].map((i) => blockAt(blocks, i))).toEqual([0, 0, 1, 1, 2, -1, -1]);
    });

    it('lineRects: uma faixa por linha visual', () => {
        const r = (left: number, top: number, width: number) => ({ left, top, width, height: 20 });
        expect(lineRects([r(10, 0, 30), r(45, 1, 20), r(0, 30, 25), r(30, 30, 0)], 8)).toEqual([
            { left: 10, top: 0, width: 55, height: 20 },
            { left: 0, top: 30, width: 25, height: 20 },
        ]);
    });
});
