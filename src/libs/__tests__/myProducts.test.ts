import { graceNotices, longDate, planLabel, productLines } from '../myProducts';

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

test('linha 2 numa só: plano/origem · desde · válido até (ou sem prazo); aviso só quando faltam até 60 dias', () => {
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
            details: 'Plano anual · desde 12 de março de 2024 · válido até 12 de março de 2027',
            alert: null,
            soon: false,
            renew: null,
        },
        {
            key: 'masterclass',
            name: 'Masterclass',
            pill: 'Ativo',
            details: 'Plano mensal · válido até 9 de novembro de 2026',
            alert: 'Faltam 30 dias',
            soon: true,
            renew: null,
        },
        // data a confirmar: nada de prazo (nem "a confirmar") para o aluno
        { key: 'ebook', name: 'E-book', pill: 'Ativo', details: null, alert: null, soon: false, renew: null },
    ]);
    expect(productLines([{ product: 'imerso', state: 'ativo', origin: 'vitalicio' }], today)[0].details).toBe(
        'Vitalício · sem prazo',
    );
    expect(productLines([{ product: 'imerso', state: 'ativo', origin: 'equipe' }], today)[0].details).toBe(
        'Equipe · sem prazo',
    );
    expect(
        productLines([{ product: 'imerso', state: 'ativo', origin: 'compra', validUntil: '2026-10-11' }], today)[0]
            .alert,
    ).toBe('Falta 1 dia');
});

test('carência: selo Carência, aviso e Renovar', () => {
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
    expect(row.pill).toBe('Carência');
    expect(row.details).toBe('Plano anual');
    expect(row.alert).toBe('Seu plano venceu em 5 de outubro de 2026. Acesso total até 19 de outubro de 2026.');
    expect(row.renew).toContain('programa-imerso');
});

test('leitura: aviso de encerramento e Renovar; sem acesso não aparece; nada fora do modelo', () => {
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
    expect(lines.map((l) => [l.name, l.pill, l.details, l.alert])).toEqual([
        [
            'Programa Imerso',
            'Leitura',
            'Cortesia',
            'Acesso encerrado em 30 de setembro de 2026. Você ainda pode navegar.',
        ],
        // navegar é só do Imerso: Masterclass e E-book em Leitura ficam trancados (PF2-05)
        ['E-book', 'Leitura', null, 'Acesso encerrado em 15 de agosto de 2026. Renove para voltar a ler.'],
    ]);
    // Renovar = o checkout do próprio produto, com a campanha de renovação
    expect(lines[0].renew).toContain('programa-imerso');
    expect(lines[1].renew).toContain('e-book-guia-completo');
    expect(lines.every((l) => l.renew?.endsWith('utm_campaign=renovacao'))).toBe(true);
    expect(productLines(undefined, today)).toEqual([]);
});

test('Leitura: "encerrado em" só pela validade já passada (nunca a data de entrada em Leitura); venceu e ainda Ativo: aviso e Renovar', () => {
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
    // validade no futuro e leituraSince no passado: sem data (leituraSince não é fim de acesso)
    expect(early.alert).toBe('Acesso em Leitura. Você ainda pode navegar.');
    // a âncora da carga é segunda (12-Out): data futura nunca no passado (PF2-04)
    const [anchored, mc] = productLines(
        [
            { product: 'imerso', state: 'leitura', origin: 'compra', validUntil: null, leituraSince: '2026-10-12' },
            { product: 'masterclass', state: 'leitura', origin: 'compra', leituraSince: '2026-10-12' },
        ],
        today,
    );
    expect(anchored.alert).toBe('Acesso em Leitura. Você ainda pode navegar.');
    expect(mc.alert).toBe('Acesso em Leitura. Renove para voltar a assistir.');
    const [lapsed] = productLines(
        [{ product: 'masterclass', state: 'ativo', origin: 'compra', validUntil: '2026-10-09' }],
        today,
    );
    expect(lapsed.alert).toBe('Seu plano venceu em 9 de outubro de 2026.');
    expect(lapsed.renew).toContain('masterclass');
});

test('carência (aviso do Início e do /imerso): só Ativo com o prazo vencido e a carência valendo; nome fora do Imerso', () => {
    const rows = [
        { product: 'imerso', state: 'ativo', origin: 'compra', validUntil: '2024-05-12', graceUntil: '2026-10-11' },
        {
            product: 'masterclass',
            state: 'ativo',
            origin: 'compra',
            validUntil: '2026-10-01',
            graceUntil: '2026-10-15',
        },
        // carência acabou, ainda não venceu, ou em Leitura: nada
        { product: 'ebook', state: 'ativo', origin: 'compra', validUntil: '2026-09-01', graceUntil: '2026-09-15' },
        { product: 'outro', state: 'ativo', validUntil: '2026-09-01', graceUntil: '2026-10-15' },
    ];
    expect(graceNotices(rows, {}, today)).toEqual([
        {
            key: 'imerso',
            text: 'Seu plano venceu em 12 de maio de 2024. Acesso total até 11 de outubro de 2026.',
            name: 'Programa Imerso',
            renew: expect.stringContaining('http'),
        },
        {
            key: 'masterclass',
            name: 'Masterclass',
            text: 'Masterclass: seu plano venceu em 1 de outubro de 2026. Acesso total até 15 de outubro de 2026.',
            renew: expect.stringContaining('masterclass'),
        },
    ]);
    expect(graceNotices(rows, { en: true, only: 'imerso' }, today).map((n) => n.text)).toEqual([
        'Your plan expired on May 12, 2024. Full access until October 11, 2026.',
    ]);
    expect(graceNotices(rows, {}, '2026-10-16')).toEqual([]);
    expect(graceNotices(undefined)).toEqual([]);
});
