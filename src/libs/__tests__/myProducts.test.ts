import { longDate, planLabel, productLines } from '../myProducts';

const today = '2026-10-10';

test('data longa em português, sem fuso', () => {
    expect(longDate('2027-03-12')).toBe('12 de março de 2027');
    expect(longDate('2026-01-01T00:00:00.000Z')).toBe('1 de janeiro de 2026');
    expect(longDate(null)).toBeNull();
    expect(longDate('amanhã')).toBeNull();
});

test('linha 2 pela origem: plano da compra (MELP avulso = 3 anos), vitalício, cortesia, parceiro, equipe', () => {
    expect(planLabel('compra', 'Mensal')).toBe('Plano mensal');
    expect(planLabel('compra', 'Anual')).toBe('Plano anual');
    expect(planLabel('compra', '2 anos')).toBe('Plano 2 anos');
    expect(planLabel('compra', '3 anos')).toBe('Plano 3 anos');
    expect(planLabel('compra', 'MELP')).toBe('Plano 3 anos');
    expect(planLabel('compra', 'Bianual')).toBe('Plano 2 anos');
    expect(planLabel('compra', 'Trianual')).toBe('Plano 3 anos');
    expect(planLabel('compra', 'Vitalício')).toBe('Vitalício');
    expect(planLabel('vitalicio', null)).toBe('Vitalício');
    expect(planLabel('cortesia', null)).toBe('Cortesia');
    expect(planLabel('parceiro', 'Sem prazo')).toBe('Parceiro');
    expect(planLabel('equipe', null)).toBe('Equipe');
    expect(planLabel(null, null)).toBeNull();
    expect(planLabel('compra', null)).toBeNull();
});

test('ativo com data: válido até; faltando até 60 dias, o aviso; sem prazo; data a confirmar não aparece', () => {
    const lines = productLines(
        [
            {
                product: 'imerso',
                state: 'ativo',
                origin: 'compra',
                plan: 'Anual',
                validUntil: '2027-03-12',
                firstPurchase: '2024-03-12',
            },
            { product: 'masterclass', state: 'ativo', origin: 'compra', plan: 'Mensal', validUntil: '2026-11-09' },
            { product: 'ebook', state: 'ativo', origin: 'compra', plan: null, dateToConfirm: true, validUntil: null },
        ],
        today,
    );
    expect(lines).toEqual([
        {
            key: 'imerso',
            name: 'Programa Imerso',
            pill: 'Ativo',
            plan: 'Plano anual · desde 12 de março de 2024',
            term: 'Válido até 12 de março de 2027',
            soon: null,
            renew: null,
        },
        {
            key: 'masterclass',
            name: 'Masterclass',
            pill: 'Ativo',
            plan: 'Plano mensal',
            term: 'Válido até 9 de novembro de 2026',
            soon: ' · faltam 30 dias',
            renew: null,
        },
        { key: 'ebook', name: 'E-book', pill: 'Ativo', plan: null, term: null, soon: null, renew: null },
    ]);
    const forever = productLines([{ product: 'imerso', state: 'ativo', origin: 'vitalicio' }], today)[0];
    expect([forever.plan, forever.term]).toEqual(['Vitalício', 'Sem prazo']);
    expect(productLines([{ product: 'imerso', state: 'ativo', origin: 'equipe' }], today)[0].term).toBe('Sem prazo');
    expect(
        productLines([{ product: 'imerso', state: 'ativo', origin: 'compra', validUntil: '2026-10-11' }], today)[0]
            .soon,
    ).toBe(' · falta 1 dia');
});

test('carência: venceu, acesso total até o fim da carência, com Renovar', () => {
    const [row] = productLines(
        [
            {
                product: 'imerso',
                state: 'ativo',
                origin: 'compra',
                plan: 'Anual',
                validUntil: '2026-10-05',
                graceUntil: '2026-10-19',
            },
        ],
        today,
    );
    expect(row.term).toBe('Seu plano venceu em 5 de outubro de 2026. Acesso total até 19 de outubro de 2026.');
    expect(row.pill).toBe('Ativo');
    expect(row.renew).toContain('programa-imerso');
});

test('leitura: acesso encerrado, ainda navega, Renovar; sem acesso não aparece; nada fora do modelo', () => {
    const lines = productLines(
        [
            { product: 'imerso', state: 'leitura', origin: 'cortesia', validUntil: '2026-09-30' },
            { product: 'masterclass', state: 'none' },
            {
                product: 'ebook',
                state: 'leitura',
                origin: 'compra',
                validUntil: '2026-08-01',
                graceUntil: '2026-08-15',
            },
            { product: 'outro', state: 'ativo' },
        ],
        today,
    );
    expect(lines.map((l) => [l.name, l.pill, l.term])).toEqual([
        ['Programa Imerso', 'Leitura', 'Acesso encerrado em 30 de setembro de 2026. Você ainda pode navegar.'],
        ['E-book', 'Leitura', 'Acesso encerrado em 15 de agosto de 2026. Você ainda pode navegar.'],
    ]);
    expect(lines[1].renew).toContain('masterclass');
    expect(productLines(undefined, today)).toEqual([]);
});

test('Leitura antes do prazo não anuncia data futura; venceu e ainda Ativo: aviso e Renovar', () => {
    const [early] = productLines(
        [
            {
                product: 'imerso',
                state: 'leitura',
                origin: 'compra',
                validUntil: '2027-01-01',
                leituraSince: '2026-10-08',
            },
        ],
        today,
    );
    expect(early.term).toBe('Acesso encerrado em 8 de outubro de 2026. Você ainda pode navegar.');
    const [lapsed] = productLines(
        [{ product: 'masterclass', state: 'ativo', origin: 'compra', validUntil: '2026-10-09' }],
        today,
    );
    expect(lapsed.term).toBe('Seu plano venceu em 9 de outubro de 2026.');
    expect(lapsed.renew).toContain('masterclass');
});
