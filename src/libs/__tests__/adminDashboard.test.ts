import {
    changeLabel,
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
        contas: 5210,
        imerso: { total: 1500, ativo: 1250, leitura: 250 },
        masterclassSemImerso: { total: 300, ativo: 280, leitura: 20 },
        ebookSemImerso: { total: 40, ativo: 39, leitura: 1 },
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
    expect([d.vencendoTotal, d.semAcessoTotal, d.renovaramImerso]).toEqual([64, 210, 77]);
    expect(changeLabel(d.eventos[0])).toBe('Imerso: Leitura → Total');
    expect(readDashboard({ usersCount: 10, businessCount: 2 })).toBeNull();
    expect(readDashboard(undefined)).toBeNull();
});

test('campo que falta é null (a tela mostra "—"), nunca zero', () => {
    const d = readDashboard({ base: { imerso: { total: 5 } }, eventos: [] })!;
    expect(d.base.imerso).toEqual({ total: 5, ativo: null, leitura: null });
    expect(d.base.contas).toBeNull();
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
    expect(stateLabel('ativo')).toBe('Total');
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
