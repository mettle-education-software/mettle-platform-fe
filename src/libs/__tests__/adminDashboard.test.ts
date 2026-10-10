import { changeLabel, dayMonth, readDashboard, stateLabel } from '../adminDashboard';

const full = {
    acessos: {
        imerso: { ativo: 120, leitura: 30, carencia: 4, aConfirmar: 7 },
        masterclass: { ativo: 200, leitura: 5 },
        ebook: { ativo: 12, leitura: 1 },
        lixeira: 2,
    },
    estudo: { hoje: 41, d7: 88, d30: 101, base: 120, pausados: 6 },
    estudoPorDia: [
        { date: '2026-10-09', alunos: 40 },
        { date: 'ontem', alunos: 3 },
    ],
    compras30d: 9,
    vencendo: [
        { uid: 'u1', name: 'Ana', product: 'imerso', origin: 'compra', validUntil: '2026-10-20', inCarencia: false },
        { uid: 'u2', name: 'Bia', product: 'outro', origin: 'compra', validUntil: null },
    ],
    semAcesso: [{ uid: 'u3', name: 'Caio', lastAccess: '2026-09-20T10:00:00Z', dias: 20, semana: 8 }],
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

test('resposta nova conferida (linhas inválidas fora); a rota antiga no mesmo endereço não vale', () => {
    const d = readDashboard(full)!;
    expect(d.acessos.imerso).toEqual({ ativo: 120, leitura: 30, carencia: 4, aConfirmar: 7 });
    expect(d.estudo.d7).toBe(88);
    expect(d.estudoPorDia).toEqual([{ date: '2026-10-09', alunos: 40 }]);
    expect(d.vencendo.map((v) => v.uid)).toEqual(['u1']);
    expect(d.semAcesso[0]).toEqual({
        uid: 'u3',
        name: 'Caio',
        lastAccess: '2026-09-20T10:00:00Z',
        dias: 20,
        semana: 8,
    });
    expect(changeLabel(d.eventos[0])).toBe('Imerso: Leitura → Total');
    expect(readDashboard({ usersCount: 10, businessCount: 2 })).toBeNull();
    expect(readDashboard(undefined)).toBeNull();
    // campo que falta é null (a tela mostra "—"), nunca zero; dia sem número fica fora do gráfico
    const partial = readDashboard({
        acessos: { imerso: { ativo: 5 } },
        estudo: {},
        estudoPorDia: [{ date: '2026-10-09' }],
    })!;
    expect(partial.acessos.imerso).toEqual({ ativo: 5, leitura: null, carencia: null, aConfirmar: null });
    expect(partial.acessos.masterclass.ativo).toBeNull();
    expect(partial.estudo.hoje).toBeNull();
    expect(partial.compras30d).toBeNull();
    expect(partial.estudoPorDia).toEqual([]);
});

test('rótulos curtos', () => {
    expect(stateLabel('ativo')).toBe('Total');
    expect(stateLabel(null)).toBe('Sem acesso');
    expect(dayMonth('2026-10-09')).toBe('09/10');
});
