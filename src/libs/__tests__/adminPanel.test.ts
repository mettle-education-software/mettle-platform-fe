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
    programLabel,
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

test('filtros do endereço: só valores conhecidos; estado só com produto; arquivadas; tamanho; lixeira', () => {
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
        q: 'ana',
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
        q: undefined,
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
        program: { melp_status: 'DEDA_STARTED', current_deda_week: 12, remaining_pauses: 2, remaining_resets: 3 },
        lastAccess: '2026-10-09T12:00:00Z',
        hasLogin: true,
        inTrash: false,
        ltv: { total: 1994, compras: 2 },
        status: 'ACTIVE',
        lastPurchase: '2026-04-22',
    })!;
    expect(row).toMatchObject({ phone: '+5511912345678', team: true, ltv: { total: 1994, compras: 2 } });
    expect(row.access?.imerso).toMatchObject({ state: 'leitura', plan: 'Anual' });
    expect(row.access?.masterclass).toEqual({
        state: 'none',
        origin: null,
        plan: null,
        validUntil: null,
        graceUntil: null,
        dateToConfirm: false,
    });
    expect(row.program).toEqual({ melpStatus: 'DEDA_STARTED', lampWeek: 12, remainingPauses: 2, remainingResets: 3 });
    expect(accountRow({ name: 'sem uid' })).toBeNull();
    expect(accountRow({ uid: 'u2' })).toMatchObject({ team: false, ltv: null, access: null, lastAccess: null });
});

test('rótulos: programa, último acesso, selo (nunca "Total") e a linha miúda do produto', () => {
    const p = (melpStatus: string, lampWeek: number | null = null) => ({
        melpStatus,
        lampWeek,
        remainingPauses: null,
        remainingResets: null,
    });
    expect(programLabel(p('DEDA_STARTED', 12))).toBe('Sem. 12');
    expect(programLabel(p('DEDA_PAUSED', 30))).toBe('Pausado');
    expect(programLabel(p('MELP_BEGIN'))).toBe('Não começou');
    expect(programLabel(null)).toBe('—');
    expect(lastAccessLabel('2026-10-10T02:30:00Z')).toBe('09/10/2026');
    expect(lastAccessLabel(null)).toBe('nunca entrou');

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

test('CSV: cabeçalho, uma linha por conta, aspas e nada de fórmula vinda de dado', () => {
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
    expect(header.split(',')[0]).toBe('uid');
    expect(line).toBe(
        `u1,"'=HYPERLINK(""x"")",ana@x.test,'+5511912345678,,Ativo,Anual · até 22/04/2027,,,,,—,nunca entrou,997.5,1,`,
    );
});
