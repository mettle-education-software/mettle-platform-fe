import {
    changeLabel,
    duePeople,
    duePeopleCount,
    productList,
    count,
    dayMonth,
    hoursMinutes,
    inRange,
    presetRange,
    programTimeLabel,
    readDashboard,
    stateLabel,
    validRange,
} from '../adminDashboard';

const full = {
    base: {
        contas: { total: 5210, ativo: 1700, leitura: 400, semProduto: 3110 },
        imerso: { total: 1500, ativo: 1250, leitura: 250 },
        masterclass: { total: 300, ativo: 280, leitura: 20 },
        ebook: { total: 40, ativo: 39, leitura: 1 },
    },
    combinacoes: {
        imerso: 900,
        masterclass: 120,
        ebook: 10,
        'imerso+masterclass': 500,
        'imerso+ebook': 60,
        'masterclass+ebook': 15,
        'imerso+masterclass+ebook': 40,
    },
    periodo: {
        from: '2026-09-11',
        to: '2026-10-10',
        gravacoes: { total: 812, segundos: 7_384 },
        dedasConcluidos: 640,
        estudoAtivoMin: 12_345,
        estudoPassivoMin: 59,
        alunosEstudaram: 990,
        compras: { novas: 31, renovacoes: 12 },
    },
    estudoPorDia: [
        { date: '2026-10-09', alunos: 40 },
        { date: 'ontem', alunos: 3 },
    ],
    planosImerso: {
        mensal: 400,
        anual: 600,
        doisAnos: 0,
        tresAnos: 100,
        vitalicio: 90,
        cortesia: 50,
        parceiro: 10,
        aConfirmar: 0,
    },
    tempoPrograma: [
        { min: null, max: null, alunos: 80 },
        { min: 1, max: 3, alunos: 300 },
        { min: 24, max: null, alunos: 120 },
        { min: 4, max: 6 },
    ],
    renovaramImerso: 77,
    vencendo: [
        { uid: 'u1', name: 'Ana', product: 'imerso', origin: 'compra', validUntil: '2026-10-20', inCarencia: false },
        { uid: 'u2', name: 'Bia', product: 'outro', origin: 'compra', validUntil: null },
    ],
    vencendoTotal: 64,
    vencendoPessoas: 41,
    semAcesso: [{ uid: 'u3', name: 'Caio', lastAccess: '2026-09-20T10:00:00Z', dias: 20, semana: 8 }],
    semAcessoTotal: 210,
    eventos: [
        {
            at: '2026-10-10T12:00:00Z',
            uid: 'u1',
            name: 'Ana',
            product: 'imerso',
            from: 'leitura',
            to: 'ativo',
            origin: 'cortesia',
            by: 'André',
        },
    ],
    usersCount: 999,
};

test('resposta conferida (linhas inválidas fora); a rota antiga no mesmo endereço não vale', () => {
    const d = readDashboard(full)!;
    expect(d.base.imerso).toEqual({ total: 1500, ativo: 1250, leitura: 250 });
    expect(d.base.contas).toEqual({ total: 5210, ativo: 1700, leitura: 400, semProduto: 3110 });
    expect(d.base.masterclass.total).toBe(300);
    expect(d.combinacoes?.map((c) => c.label)).toEqual([
        'Só Imerso',
        'Só Masterclass',
        'Só E-book',
        'Imerso + Masterclass',
        'Imerso + E-book',
        'Masterclass + E-book',
        'Imerso + Masterclass + E-book',
    ]);
    expect(d.periodo.gravacoes).toEqual({ total: 812, segundos: 7384 });
    expect(d.periodo.compras).toEqual({ novas: 31, renovacoes: 12 });
    expect(d.estudoPorDia).toEqual([{ date: '2026-10-09', alunos: 40 }]);
    // "A confirmar" só com alguém; a ordem é a do André
    expect(d.planosImerso?.map((p) => p.label)).toEqual([
        'Mensal',
        'Anual',
        '3 anos',
        'Vitalício',
        'Cortesia',
        'Parceiro',
    ]);
    expect(
        readDashboard({ ...full, planosImerso: { ...full.planosImerso, aConfirmar: 3 } })!.planosImerso?.at(-1),
    ).toEqual({ label: 'A confirmar', alunos: 3 });
    // "2 anos" só com alguém, entre Anual e 3 anos
    expect(
        readDashboard({ ...full, planosImerso: { ...full.planosImerso, doisAnos: 7 } })!.planosImerso?.map(
            (p) => p.label,
        ),
    ).toEqual(['Mensal', 'Anual', '2 anos', '3 anos', 'Vitalício', 'Cortesia', 'Parceiro']);
    expect(d.tempoPrograma).toEqual([
        { label: 'Não começou', alunos: 80 },
        { label: '1–3 meses', alunos: 300 },
        { label: '24+ meses', alunos: 120 },
    ]);
    expect(d.vencendo.map((v) => v.uid)).toEqual(['u1']);
    expect([d.vencendoTotal, d.vencendoPessoas, d.semAcessoTotal, d.renovaramImerso]).toEqual([64, 41, 210, 77]);
    expect(changeLabel(d.eventos[0])).toBe('Imerso: Leitura → Ativo');
    expect(readDashboard({ usersCount: 10, businessCount: 2 })).toBeNull();
    expect(readDashboard(undefined)).toBeNull();
});

test('campo que falta é null (a tela mostra "—"), nunca zero', () => {
    const d = readDashboard({ base: { imerso: { total: 5 } }, eventos: [] })!;
    expect(d.base.imerso).toEqual({ total: 5, ativo: null, leitura: null });
    expect(d.base.contas).toEqual({ total: null, ativo: null, leitura: null, semProduto: null });
    expect(d.combinacoes).toBeNull();
    expect(d.periodo.estudoAtivoMin).toBeNull();
    expect(d.planosImerso).toBeNull();
    expect(d.tempoPrograma).toBeNull();
    // sem o período, a série (fixa em 30 dias na rota anterior) não vale
    expect(d.estudoPorDia).toBeNull();
    expect(d.renovaramImerso).toBeNull();
    expect(d.vencendoTotal).toBeNull();
    expect(count(null)).toBe('—');
    expect(hoursMinutes(null)).toBe('—');
});

test('formatos: milhar, "Xh Ym", faixas do tempo de programa, eixo', () => {
    expect(count(5210)).toBe('5.210');
    expect(hoursMinutes(12_345)).toBe('205h 45m');
    expect(hoursMinutes(59)).toBe('0h 59m');
    expect(hoursMinutes(7384 / 60)).toBe('2h 3m');
    expect(programTimeLabel(null, null)).toBe('Não começou');
    expect(programTimeLabel(4, 6)).toBe('4–6 meses');
    expect(programTimeLabel(24, null)).toBe('24+ meses');
    expect(stateLabel('ativo')).toBe('Ativo');
    expect(stateLabel(null)).toBe('Sem acesso');
    expect(dayMonth('2026-10-09')).toBe('09/10');
});

test('período: prontos contam hoje (Brasília); De/Até só valem em ordem e até hoje', () => {
    const today = '2026-10-10';
    expect(presetRange('hoje', today)).toEqual({ from: today, to: today });
    expect(presetRange('7d', today)).toEqual({ from: '2026-10-04', to: today });
    expect(presetRange('30d', today)).toEqual({ from: '2026-09-11', to: today });
    expect(presetRange('12m', today)).toEqual({ from: '2025-10-11', to: today });
    expect(validRange({ from: '2026-10-01', to: '2026-10-10' }, today)).toBe(true);
    expect(validRange({ from: '2026-10-11', to: '2026-10-10' }, today)).toBe(false);
    expect(validRange({ from: '2026-10-01', to: '2026-10-11' }, today)).toBe(false);
    expect(validRange({ from: '', to: '2026-10-10' }, today)).toBe(false);
    // até 2 anos para trás: data digitada errada não pede o histórico inteiro
    expect(validRange({ from: '2024-10-10', to: today }, today)).toBe(true);
    expect(validRange({ from: '0001-01-01', to: today }, today)).toBe(false);
    expect(
        inRange(
            [
                { date: '2026-10-09', alunos: 1 },
                { date: '2026-10-10', alunos: 2 },
            ],
            { from: today, to: today },
        ),
    ).toEqual([{ date: '2026-10-10', alunos: 2 }]);
});

test('vencem: uma linha por pessoa (produtos juntos, data mais cedo, carência até quando); contagem de pessoas', () => {
    const row = (uid: string, name: string, product: 'imerso' | 'masterclass' | 'ebook', validUntil: string) => ({
        uid,
        name,
        product,
        origin: 'compra' as const,
        validUntil,
        inCarencia: false,
        graceUntil: null as string | null,
    });
    const rows = [
        row('a', 'Ana', 'masterclass', '2026-10-26'),
        // carência: o fim antigo do produto (2024) não vale; vale até quando vai a carência
        { ...row('b', 'Bia', 'imerso', '2024-05-12'), inCarencia: true, graceUntil: '2026-10-11' },
        row('a', 'Ana', 'ebook', '2026-10-25'),
        row('c', 'Cris', 'masterclass', '2026-10-12'),
        { ...row('c', 'Cris', 'imerso', '2024-09-15'), inCarencia: true, graceUntil: '2026-10-13' },
        // carência sem o fim (servidor antigo): sem data
        { ...row('d', 'Duda', 'imerso', '2024-01-01'), inCarencia: true },
    ];
    expect(duePeople(rows)).toEqual([
        { uid: 'd', name: 'Duda', products: ['imerso'], validUntil: null, inCarencia: true, graceUntil: null },
        { uid: 'b', name: 'Bia', products: ['imerso'], validUntil: null, inCarencia: true, graceUntil: '2026-10-11' },
        {
            uid: 'c',
            name: 'Cris',
            products: ['masterclass', 'imerso'],
            validUntil: '2026-10-12',
            inCarencia: true,
            graceUntil: '2026-10-13',
        },
        {
            uid: 'a',
            name: 'Ana',
            products: ['masterclass', 'ebook'],
            validUntil: '2026-10-25',
            inCarencia: false,
            graceUntil: null,
        },
    ]);
    expect(productList(['masterclass', 'ebook'])).toBe('Masterclass e E-book');
    expect(productList(['imerso', 'masterclass', 'ebook'])).toBe('Imerso, Masterclass e E-book');
    // lista inteira: pessoas exatas; lista cortada pelo servidor: "N+"
    expect(duePeopleCount({ vencendo: rows, vencendoTotal: 6, vencendoPessoas: null })).toBe('4');
    expect(duePeopleCount({ vencendo: rows, vencendoTotal: 64, vencendoPessoas: null })).toBe('4+');
    expect(duePeopleCount({ vencendo: rows, vencendoTotal: null, vencendoPessoas: null })).toBeNull();
    // com o total de pessoas do servidor, exato
    expect(duePeopleCount({ vencendo: rows, vencendoTotal: 64, vencendoPessoas: 41 })).toBe('41');
});
