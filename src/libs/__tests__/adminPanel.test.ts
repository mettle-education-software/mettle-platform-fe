import type { HistoryStudent } from '../adminHistory';
import {
    accessBadge,
    accountRow,
    accountsParams,
    ADMIN_NAV,
    adminPanelPath,
    contasPath,
    lastAccessLabel,
    programLabel,
    queryFromUrl,
    snapshotPage,
} from '../adminPanel';

const sort = { key: 'name' as const, dir: 'asc' as const };

test('endereços: Contas, uma conta aberta e os filtros do Início', () => {
    expect(adminPanelPath('a b')).toBe('/admin/contas?conta=a%20b');
    expect(adminPanelPath(null)).toBe('/admin/contas');
    expect(contasPath({ product: 'imerso', state: 'ativo', sort: 'expiry', dir: 'asc' })).toBe(
        '/admin/contas?product=imerso&state=ativo&sort=expiry',
    );
    expect(contasPath({})).toBe('/admin/contas');
    // a conta aberta mantém os filtros; estado sem produto e ordem padrão ficam de fora; Lixeira descarta os filtros
    expect(contasPath({ product: 'ebook', state: 'leitura', sort: 'name', dir: 'desc', conta: 'x' })).toBe(
        '/admin/contas?product=ebook&state=leitura&dir=desc&conta=x',
    );
    expect(contasPath({ state: 'leitura', sort: 'name', dir: 'asc' })).toBe('/admin/contas');
    expect(contasPath({ product: 'imerso', lixeira: true, conta: 'x' })).toBe('/admin/contas?lixeira=1&conta=x');
    // ida e volta pelo endereço
    const back = queryFromUrl(new URLSearchParams('product=imerso&state=ativo&sort=expiry'));
    expect(back).toMatchObject({
        product: 'imerso',
        state: 'ativo',
        sort: { key: 'expiry', dir: 'asc' },
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

test('filtros do endereço: só valores conhecidos; estado só com produto; lixeira', () => {
    const q = (s: string) => queryFromUrl(new URLSearchParams(s));
    expect(q('product=imerso&state=leitura&sort=lastAccess&dir=desc&q=ana&lixeira=1')).toEqual({
        product: 'imerso',
        state: 'leitura',
        q: 'ana',
        sort: { key: 'lastAccess', dir: 'desc' },
        trash: true,
    });
    expect(q('product=x&state=leitura&sort=nope')).toEqual({
        product: undefined,
        state: undefined,
        q: undefined,
        sort: { key: 'name', dir: 'asc' },
        trash: false,
    });
    expect(queryFromUrl(null).sort).toEqual(sort);
});

test('parâmetros da lista: estado só com produto, busca aparada, página e tamanho', () => {
    expect(accountsParams({ state: 'leitura', q: '  ana ', sort, page: 2 })).toEqual({
        q: 'ana',
        sort: 'name',
        dir: 'asc',
        page: 2,
        pageSize: 25,
    });
    expect(accountsParams({ product: 'ebook', state: 'none', sort, page: 1 })).toMatchObject({
        product: 'ebook',
        state: 'none',
    });
});

test('linha da lista conferida: produto sem dado vira "none"; programa em camelCase ou snake_case', () => {
    const row = accountRow({
        uid: 'u1',
        name: 'Ana',
        email: 'ana@x.test',
        access: { imerso: { state: 'leitura', origin: 'compra', validUntil: '2026-09-01', dateToConfirm: false } },
        program: { melp_status: 'DEDA_STARTED', current_deda_week: 12, remaining_pauses: 2, remaining_resets: 3 },
        lastAccess: '2026-10-09T12:00:00Z',
        hasLogin: true,
        inTrash: false,
    })!;
    expect(row.access?.imerso.state).toBe('leitura');
    expect(row.access?.masterclass).toEqual({ state: 'none', origin: null, validUntil: null, dateToConfirm: false });
    expect(row.program).toEqual({ melpStatus: 'DEDA_STARTED', lampWeek: 12, remainingPauses: 2, remainingResets: 3 });
    expect(accountRow({ name: 'sem uid' })).toBeNull();
    expect(programLabel(row.program)).toBe('Em andamento · sem. 12');
    expect(programLabel(null)).toBe('—');
    expect(accessBadge(row.access?.imerso)).toBe('Leitura');
    expect(accessBadge(row.access?.masterclass)).toBeNull();
    expect(lastAccessLabel('2026-10-10T02:30:00Z')).toBe('09/10/2026');
    expect(lastAccessLabel(null)).toBe('—');
});

test('retrato noturno no formato da lista: busca sem acento, ordem por nome e páginas de 25', () => {
    const student = (i: number, name: string): HistoryStudent => ({
        uid: `u${i}`,
        name,
        email: `${i}@x.test`,
        status: 'DEDA_STARTED',
        clock: 'calendar',
        startedAt: null,
        lampWeek: i,
        pausesUsed: 0,
        pausesLeft: 3,
        resetsUsed: 0,
        resetsLeft: 2,
        pausedSince: null,
        lastPauseFrom: null,
        lastPauseTo: null,
        lastResetAt: null,
        events: [],
    });
    const many = Array.from({ length: 30 }, (_, i) => student(i, `Aluno ${String(i).padStart(2, '0')}`));
    const page2 = snapshotPage(many, { sort, page: 2 });
    expect(page2).toMatchObject({ total: 30, snapshot: true });
    expect(page2.rows).toHaveLength(5);
    expect(page2.rows[0]).toMatchObject({ uid: 'u25', access: null, program: { remainingPauses: 3 } });
    const found = snapshotPage([student(1, 'José'), student(2, 'Ana')], { q: 'jose', sort, page: 1 });
    expect(found.rows.map((r) => r.name)).toEqual(['José']);
    const desc = snapshotPage([student(1, 'Ana'), student(2, 'Bia')], { sort: { key: 'name', dir: 'desc' }, page: 1 });
    expect(desc.rows.map((r) => r.name)).toEqual(['Bia', 'Ana']);
});
