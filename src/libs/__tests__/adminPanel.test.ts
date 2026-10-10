import {
    accessBadge,
    accessDetail,
    accountRow,
    accountsCsv,
    accountsParams,
    ADMIN_NAV,
    adminPanelPath,
    brl,
    contasPath,
    lastAccessLabel,
    levelLabel,
    ltvCell,
    metricLabel,
    programLabel,
    programText,
    queryFromUrl,
    readSummary,
} from '../adminPanel';

const sort = { key: 'name' as const, dir: 'asc' as const };

test('endereços: Contas, uma conta aberta e os filtros do Início', () => {
    expect(adminPanelPath('a b')).toBe('/admin/contas?conta=a%20b');
    expect(adminPanelPath(null)).toBe('/admin/contas');
    expect(contasPath({ product: 'imerso', state: 'ativo', sort: 'expiry', dir: 'asc' })).toBe(
        '/admin/contas?product=imerso&state=ativo&sort=expiry',
    );
    expect(contasPath({})).toBe('/admin/contas');
    // a conta aberta mantém os filtros; estado sem produto e o padrão (nome, crescente, 25) ficam de fora
    expect(contasPath({ product: 'ebook', state: 'leitura', sort: 'name', dir: 'desc', conta: 'x' })).toBe(
        '/admin/contas?product=ebook&state=leitura&dir=desc&conta=x',
    );
    expect(contasPath({ state: 'leitura', sort: 'name', dir: 'asc', pageSize: 25 })).toBe('/admin/contas');
    expect(
        contasPath({ origin: 'aconfirmar', situacao: 'vence30', todas: true, pageSize: 100, sort: 'ltv', dir: 'desc' }),
    ).toBe('/admin/contas?origin=aconfirmar&situacao=vence30&scope=todas&sort=ltv&dir=desc&pageSize=100');
    // Lixeira descarta os filtros
    expect(contasPath({ product: 'imerso', situacao: 'carencia', lixeira: true, conta: 'x' })).toBe(
        '/admin/contas?lixeira=1&conta=x',
    );
    // ida e volta pelo endereço
    expect(queryFromUrl(new URLSearchParams('product=imerso&state=ativo&sort=expiry'))).toMatchObject({
        product: 'imerso',
        state: 'ativo',
        sort: 'expiry',
        dir: 'asc',
        trash: false,
    });
});

test('menu do Admin: exatamente quatro, os dois últimos só do dono', () => {
    expect(ADMIN_NAV.map((item) => [item.label, !!item.owner])).toEqual([
        ['Início', false],
        ['Contas', false],
        ['Leaderboard', true],
        ['Gestão de Leituras', true],
    ]);
});

test('filtros do endereço: só valores conhecidos; estado só com produto; arquivadas; tamanho; lixeira; busca não', () => {
    const q = (s: string) => queryFromUrl(new URLSearchParams(s));
    expect(
        q(
            'product=imerso&state=leitura&origin=parceiro&situacao=nuncaEntrou&scope=todas&sort=lastAccess&dir=desc&pageSize=50&q=ana&lixeira=1',
        ),
    ).toEqual({
        product: 'imerso',
        state: 'leitura',
        origin: 'parceiro',
        situacao: 'nuncaEntrou',
        todas: true,
        sort: 'lastAccess',
        dir: 'desc',
        pageSize: 50,
        trash: true,
    });
    expect(q('product=x&state=leitura&origin=y&situacao=z&scope=tudo&sort=nope&pageSize=30')).toEqual({
        product: undefined,
        state: undefined,
        origin: undefined,
        situacao: undefined,
        todas: false,
        sort: 'name',
        dir: 'asc',
        pageSize: 25,
        trash: false,
    });
    expect(queryFromUrl(null)).toMatchObject({ sort: 'name', dir: 'asc', pageSize: 25 });
});

test('parâmetros da lista: estado só com produto, busca aparada, escopo, página e tamanho', () => {
    expect(accountsParams({ state: 'leitura', q: '  ana ', sort, page: 2, pageSize: 50 })).toEqual({
        scope: 'contas',
        q: 'ana',
        sort: 'name',
        dir: 'asc',
        page: 2,
        pageSize: 50,
    });
    expect(
        accountsParams({
            product: 'ebook',
            state: 'none',
            origin: 'vitalicio',
            situacao: 'semProduto',
            todas: true,
            sort: { key: 'ltv', dir: 'desc' },
            page: 1,
            pageSize: 25,
        }),
    ).toEqual({
        product: 'ebook',
        state: 'none',
        origin: 'vitalicio',
        situacao: 'semProduto',
        scope: 'todas',
        sort: 'ltv',
        dir: 'desc',
        page: 1,
        pageSize: 25,
    });
});

test('linha da lista conferida: produto sem dado vira "none"; programa em camelCase ou snake_case; LTV', () => {
    const row = accountRow({
        uid: 'u1',
        name: 'Ana',
        email: 'ana@x.test',
        phone: '+5511912345678',
        team: true,
        access: {
            imerso: {
                state: 'leitura',
                origin: 'compra',
                plan: 'Anual',
                validUntil: '2026-09-01',
                dateToConfirm: false,
            },
        },
        program: {
            melp_status: 'DEDA_STARTED',
            current_deda_week: 12,
            remaining_pauses: 2,
            remaining_resets: 3,
            level: 'boost',
        },
        lastAccess: '2026-10-09T12:00:00Z',
        hasLogin: true,
        loginRecriado: true,
        inTrash: false,
        ltv: { total: 1994, compras: 2, dias: 742 },
        overall: 85.37,
        dedaRun: 77,
        leaderboardPos: 12,
        status: 'ACTIVE',
        lastPurchase: '2026-04-22',
    })!;
    expect(row).toMatchObject({
        phone: '+5511912345678',
        team: true,
        ltv: { total: 1994, compras: 2, dias: 742 },
        loginRecriado: true,
        overall: 85.37,
        dedaRun: 77,
        leaderboardPos: 12,
    });
    expect(row.access?.imerso).toMatchObject({ state: 'leitura', plan: 'Anual' });
    expect(row.access?.masterclass).toEqual({
        state: 'none',
        origin: null,
        plan: null,
        validUntil: null,
        graceUntil: null,
        dateToConfirm: false,
    });
    expect(row.program).toEqual({
        melpStatus: 'DEDA_STARTED',
        lampWeek: 12,
        remainingPauses: 2,
        remainingResets: 3,
        level: 'boost',
    });
    expect(accountRow({ name: 'sem uid' })).toBeNull();
    expect(accountRow({ uid: 'u2' })).toMatchObject({
        team: false,
        ltv: null,
        access: null,
        lastAccess: null,
        loginRecriado: false,
        overall: null,
        dedaRun: null,
        leaderboardPos: null,
    });
    // nível desconhecido não entra
    expect(
        accountRow({ uid: 'u3', program: { melpStatus: 'DEDA_STARTED', level: 'hard' } })?.program?.level,
    ).toBeNull();
});

test('rótulos: programa, último acesso, selo (nunca "Total") e a linha miúda do produto', () => {
    const p = (melpStatus: string, lampWeek: number | null = null) => ({
        melpStatus,
        lampWeek,
        remainingPauses: null,
        remainingResets: null,
    });
    // "Programa (em semanas)": só o número
    expect(programLabel(p('DEDA_STARTED', 12))).toBe('12');
    expect(programLabel(p('DEDA_PAUSED', 30))).toBe('Pausado');
    expect(programLabel(p('MELP_BEGIN'))).toBe('Não começou');
    expect(programLabel(null)).toBe('—');
    expect(lastAccessLabel('2026-10-10T02:30:00Z')).toBe('09/10/2026');
    expect(lastAccessLabel(null)).toBe('nunca entrou');
    // login recriado: entrou antes, o histórico se perdeu
    expect(lastAccessLabel(null, true)).toBe('sem registro');
    expect(lastAccessLabel('2026-10-10T02:30:00Z', true)).toBe('09/10/2026');

    const access = (fields: object) => ({
        state: 'ativo' as const,
        origin: null,
        plan: null,
        validUntil: null,
        graceUntil: null,
        dateToConfirm: false,
        ...fields,
    });
    expect(accessBadge(access({}))).toBe('Ativo');
    expect(accessBadge(access({ state: 'leitura' }))).toBe('Leitura');
    expect(accessBadge(access({ state: 'none' }))).toBeNull();
    expect(accessBadge(undefined)).toBeNull();
    expect(accessDetail(access({ origin: 'compra', plan: 'Anual', validUntil: '2027-04-22' }))).toBe(
        'Anual · até 22/04/2027',
    );
    expect(accessDetail(access({ origin: 'parceiro' }))).toBe('Parceiro');
    expect(accessDetail(access({ origin: 'compra', plan: 'Vitalício', validUntil: '2099-01-01' }))).toBe('Vitalício');
    expect(accessDetail(access({ origin: 'vitalicio' }))).toBe('Vitalício');
    // plano "vitalício" só vale na compra (como o servidor); cortesia mostra o prazo
    expect(accessDetail(access({ origin: 'cortesia', plan: 'Vitalício', validUntil: '2026-11-01' }))).toBe(
        'Cortesia · até 01/11/2026',
    );
    expect(accessDetail(access({ origin: 'cortesia', validUntil: '2026-11-01' }))).toBe('Cortesia · até 01/11/2026');
    // data a confirmar: sem "até"; sem origem e sem prazo: nada
    expect(
        accessDetail(access({ origin: 'compra', plan: 'Anual', validUntil: '2027-01-01', dateToConfirm: true })),
    ).toBe('Anual');
    // carência: o fim dela, nunca o prazo antigo; passada a carência, volta o prazo
    const grace = access({ origin: 'compra', plan: 'Anual', validUntil: '2024-05-12', graceUntil: '2026-10-11' });
    expect(accessDetail(grace, '2026-10-10')).toBe('Anual · carência até 11/10/2026');
    expect(accessDetail(grace, '2026-10-12')).toBe('Anual · até 12/05/2024');
    expect(accessDetail(access({}))).toBeNull();
    expect(accessDetail(access({ state: 'none', origin: 'compra' }))).toBeNull();
    // Masterclass e E-book: sem a palavra do plano (só "até"); fora de compra, a origem
    expect(accessDetail(access({ origin: 'compra', plan: 'Anual', validUntil: '2027-04-22' }), undefined, false)).toBe(
        'até 22/04/2027',
    );
    expect(accessDetail(access({ origin: 'equipe' }), undefined, false)).toBe('Equipe');
    expect(accessDetail(grace, '2026-10-10', false)).toBe('carência até 11/10/2026');
    expect(brl(1994)).toMatch(/^R\$\s1\.994,00$/);
    expect(brl(null)).toBe('—');
});

test('resumo de auditoria: números conferidos; ausente vira null', () => {
    expect(
        readSummary({
            contas: 424,
            imerso: { ativo: 76, leitura: 146 },
            masterclass: { ativo: 45, leitura: 205 },
            ebook: { ativo: 18, leitura: 3 },
            semProduto: 1,
            lixeira: null,
            arquivadas: 7,
        }),
    ).toEqual({
        contas: 424,
        imerso: { ativo: 76, leitura: 146 },
        masterclass: { ativo: 45, leitura: 205 },
        ebook: { ativo: 18, leitura: 3 },
        semProduto: 1,
        lixeira: null,
        arquivadas: 7,
    });
    expect(readSummary(undefined)).toBeNull();
    expect(readSummary({ contas: '424' })).toMatchObject({ contas: null, imerso: { ativo: null, leitura: null } });
});

test('CSV: ";" e vírgula decimal (Excel em português), aspas e nada de fórmula vinda de dado', () => {
    const row = accountRow({
        uid: 'u1',
        name: '=HYPERLINK("x")',
        email: 'ana@x.test',
        phone: '+5511912345678',
        access: { imerso: { state: 'ativo', origin: 'compra', plan: 'Anual', validUntil: '2027-04-22' } },
        lastAccess: null,
        ltv: { total: 997.5, compras: 1 },
    })!;
    const [header, line, ...rest] = accountsCsv([row]).split('\r\n');
    expect(rest).toEqual([]);
    expect(header.split(';')[0]).toBe('uid');
    // tab e CR no começo também são gatilho de fórmula (OWASP)
    const tab = accountRow({ uid: 'u2', name: '\t=1+1', email: '\r@x' })!;
    expect(accountsCsv([tab]).split('\r\n')[1].split(';').slice(0, 3)).toEqual(['u2', "'\t=1+1", `"'\r@x"`]);
    expect(line).toBe(
        `u1;"'=HYPERLINK(""x"")";ana@x.test;'+5511912345678;;Ativo;Anual · até 22/04/2027;;;;;—;;;;;nunca entrou;997,50;1;;`,
    );
    expect(header.split(';').slice(11)).toEqual([
        'programa_semanas',
        'nivel',
        'overall',
        'deda_run',
        'leaderboard',
        'ultimo_acesso',
        'ltv_total',
        'ltv_compras',
        'ltv_dias',
        'na_lixeira',
    ]);
});

test('LTV: dinheiro e "compras · dias"; compra sem compra achada = "—", R$ 0,00 só para quem não paga', () => {
    const acc = (origin: string) => ({
        imerso: { state: 'ativo', origin, plan: null, validUntil: null, graceUntil: null, dateToConfirm: false },
        masterclass: {
            state: 'none',
            origin: null,
            plan: null,
            validUntil: null,
            graceUntil: null,
            dateToConfirm: false,
        },
        ebook: { state: 'none', origin: null, plan: null, validUntil: null, graceUntil: null, dateToConfirm: false },
    });
    const cell = (ltv: object | null, origin = 'compra') => ltvCell({ ltv, access: acc(origin) } as never);
    const paid = cell({ total: 1363, compras: 3, dias: 742 });
    expect(paid.money).toMatch(/^R\$\s1\.363,00$/);
    expect(paid.line).toBe('3 compras · 742 dias');
    expect(cell({ total: 997, compras: 1, dias: 1 }).line).toBe('1 compra · 1 dia');
    // compra sem compra achada na conciliação: "—", nunca "R$ 0,00 · 0 compras"
    expect(cell({ total: 0, compras: 0, dias: 30 })).toEqual({ money: '—', line: '30 dias' });
    // quem não paga (cortesia, parceiro, equipe): R$ 0,00 é o certo
    expect(cell({ total: 0, compras: 0, dias: 120 }, 'cortesia').money).toMatch(/^R\$\s0,00$/);
    expect(cell({ total: 0, compras: 0, dias: null }, 'equipe')).toEqual({
        money: expect.stringMatching(/0,00$/),
        line: null,
    });
    expect(cell(null)).toEqual({ money: '—', line: null });
    // origem desconhecida (a confirmar) com cortesia: não é grátis — "—"
    const mixed = {
        ltv: { total: 0, compras: 0, dias: 10 },
        access: {
            ...acc('cortesia'),
            imerso: {
                state: 'ativo',
                origin: null,
                plan: null,
                validUntil: null,
                graceUntil: null,
                dateToConfirm: false,
            },
            masterclass: {
                state: 'ativo',
                origin: 'cortesia',
                plan: null,
                validUntil: null,
                graceUntil: null,
                dateToConfirm: false,
            },
        },
    };
    expect(ltvCell(mixed as never).money).toBe('—');
    // total sem a contagem de compras: o dinheiro aparece (sem "N compras")
    expect(cell({ total: 997, compras: null, dias: 5 })).toEqual({
        money: expect.stringMatching(/997,00$/),
        line: '5 dias',
    });
});

test('métricas, nível e o programa por extenso', () => {
    expect(metricLabel.overall(85.37)).toBe('85,4%');
    expect(metricLabel.overall(null)).toBe('—');
    expect(metricLabel.dedaRun(77)).toBe('77');
    expect(metricLabel.leaderboardPos(12)).toBe('12º');
    expect(metricLabel.leaderboardPos(null)).toBe('—');
    expect(levelLabel('turbo')).toBe('Turbo');
    expect(levelLabel(null)).toBeNull();
    const prog = (melpStatus: string, lampWeek: number | null, level: 'flow' | 'boost' | null) => ({
        melpStatus,
        lampWeek,
        remainingPauses: null,
        remainingResets: null,
        level,
    });
    expect(programText(prog('DEDA_STARTED', 12, 'boost'))).toBe('Semana 12 · Boost');
    expect(programText(prog('DEDA_PAUSED', 30, 'flow'))).toBe('Pausado · Flow');
    // antes do início, sem nível
    expect(programText(prog('MELP_BEGIN', null, 'flow'))).toBe('Não começou');
});

test('filtro de nível no endereço e na consulta', () => {
    const url = queryFromUrl(new URLSearchParams('level=turbo&sort=dedaRun&dir=desc'));
    expect(url).toMatchObject({ level: 'turbo', sort: 'dedaRun', dir: 'desc' });
    expect(queryFromUrl(new URLSearchParams('level=hard')).level).toBeUndefined();
    expect(contasPath({ level: 'boost', sort: 'overall' })).toBe('/admin/contas?level=boost&sort=overall');
    expect(
        accountsParams({ level: 'flow', sort: { key: 'leaderboardPos', dir: 'asc' }, page: 1, pageSize: 25 }),
    ).toMatchObject({ level: 'flow', sort: 'leaderboardPos' });
});
