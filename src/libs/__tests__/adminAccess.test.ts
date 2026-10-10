import {
    AccessRow,
    accessBadges,
    accessBody,
    accessLabel,
    actorLabel,
    brDay,
    canExtend,
    draftOf,
    grantOptions,
    isDirty,
    serverProblem,
    termKind,
    termProblem,
} from '../adminAccess';

const row = (patch: Partial<AccessRow> = {}): AccessRow => ({
    product: 'imerso',
    state: 'ativo',
    origin: 'compra',
    plan: null,
    validUntil: '2027-08-07',
    dateToConfirm: false,
    graceUntil: '2027-08-21',
    leituraSince: null,
    updatedAt: '2026-10-10T12:00:00Z',
    updatedBy: 'admin',
    ...patch,
});

describe('prazo por origem', () => {
    it('Compra tem data; Cortesia, meses; Vitalício, Parceiro e Equipe, nenhum; sem origem, nada', () => {
        expect(termKind('compra')).toBe('date');
        expect(termKind('cortesia')).toBe('months');
        expect(['vitalicio', 'parceiro', 'equipe'].map((o) => termKind(o as never))).toEqual(['none', 'none', 'none']);
        expect(termKind(null)).toBeNull();
    });

    it('cortesia: Imerso 1/3/6/12; Masterclass e E-book só 1 mês', () => {
        expect(grantOptions('imerso')).toEqual([1, 3, 6, 12]);
        expect(grantOptions('masterclass')).toEqual([1]);
        expect(grantOptions('ebook')).toEqual([1]);
    });

    it('estender: só o Imerso ativo com prazo (Compra ou Cortesia)', () => {
        expect(canExtend(row())).toBe(true);
        expect(canExtend(row({ origin: 'cortesia' }))).toBe(true);
        expect(canExtend(row({ state: 'leitura' }))).toBe(false);
        expect(canExtend(row({ origin: 'parceiro', validUntil: null }))).toBe(false);
        expect(canExtend(row({ origin: null }))).toBe(false);
        expect(canExtend(row({ product: 'masterclass' }))).toBe(false);
    });
});

describe('PUT do rascunho', () => {
    it('sem acesso: nada escolhido (nem Ativo nem Leitura) e sem origem não grava', () => {
        const none = row({ state: 'none', origin: null, validUntil: null });
        expect(draftOf(none).state).toBeNull();
        expect(accessBody(draftOf(none), none)).toBeNull();
        expect(accessBody({ ...draftOf(none), origin: 'parceiro' }, none)).toBeNull();
        expect(accessBody({ state: 'ativo', origin: 'parceiro', term: { kind: 'keep' } }, none)).toEqual({
            state: 'ativo',
            origin: 'parceiro',
        });
        // nada escolhido ainda não é mudança (o Salvar não aparece); escolher Ativo é
        expect(isDirty(draftOf(none), none)).toBe(false);
        expect(isDirty({ ...draftOf(none), state: 'ativo' }, none)).toBe(true);
    });

    it('igual ao servidor: nada a salvar; só o estado: estado e origem (o prazo fica)', () => {
        const r = row();
        expect(isDirty(draftOf(r), r)).toBe(false);
        const leitura = { ...draftOf(r), state: 'leitura' as const };
        expect(isDirty(leitura, r)).toBe(true);
        expect(accessBody(leitura, r)).toEqual({ state: 'leitura', origin: 'compra' });
    });

    it('Compra: data escolhida ou vazia (data a confirmar)', () => {
        const r = row();
        expect(accessBody({ ...draftOf(r), term: { kind: 'date', value: '2028-01-31' } }, r)).toEqual({
            state: 'ativo',
            origin: 'compra',
            validUntil: '2028-01-31',
        });
        expect(accessBody({ ...draftOf(r), term: { kind: 'date', value: '' } }, r)).toEqual({
            state: 'ativo',
            origin: 'compra',
            validUntil: null,
        });
    });

    it('Vitalício, Parceiro e Equipe: nunca mandam prazo', () => {
        const r = row();
        for (const origin of ['vitalicio', 'parceiro', 'equipe'] as const)
            expect(accessBody({ state: 'ativo', origin, term: { kind: 'date', value: '2028-01-31' } }, r)).toEqual({
                state: 'ativo',
                origin,
            });
    });

    it('Cortesia do Imerso que começa agora exige os meses; em curso, mantém ou estende', () => {
        const r = row();
        expect(accessBody({ state: 'ativo', origin: 'cortesia', term: { kind: 'keep' } }, r)).toBeNull();
        expect(accessBody({ state: 'ativo', origin: 'cortesia', term: { kind: 'grant', months: 3 } }, r)).toEqual({
            state: 'ativo',
            origin: 'cortesia',
            grantMonths: 3,
        });
        const running = row({ origin: 'cortesia', validUntil: '2027-01-10', graceUntil: null });
        expect(accessBody({ ...draftOf(running), term: { kind: 'extend', months: 6 } }, running)).toEqual({
            state: 'ativo',
            origin: 'cortesia',
            extendMonths: 6,
        });
        expect(accessBody({ ...draftOf(running), state: 'leitura' }, running)).toEqual({
            state: 'leitura',
            origin: 'cortesia',
        });
    });

    it('Cortesia de Masterclass e E-book sem meses: o servidor dá 1 mês', () => {
        const none = row({ product: 'ebook', state: 'none', origin: null, validUntil: null });
        expect(accessBody({ state: 'ativo', origin: 'cortesia', term: { kind: 'keep' } }, none)).toEqual({
            state: 'ativo',
            origin: 'cortesia',
        });
    });
});

describe('prazo vencido (o servidor recusaria com ALREADY_EXPIRED)', () => {
    const today = '2026-10-10';

    it('cortesia vencida em Leitura → Ativo sem prazo novo: não grava e diz o que falta', () => {
        const ended = row({ state: 'leitura', origin: 'cortesia', validUntil: '2026-09-30', graceUntil: null });
        const draft = { ...draftOf(ended), state: 'ativo' as const };
        expect(termProblem(draft, ended, today)).toBe('Prazo vencido: escolha um prazo novo.');
        expect(accessBody(draft, ended, today)).toBeNull();
        // com os meses escolhidos, grava
        expect(accessBody({ ...draft, term: { kind: 'grant', months: 1 } }, ended, today)).toEqual({
            state: 'ativo',
            origin: 'cortesia',
            grantMonths: 1,
        });
        // em Leitura, o prazo velho não importa (e nada mudou: Salvar desligado)
        expect(accessBody(draftOf(ended), ended, today)).toEqual({ state: 'leitura', origin: 'cortesia' });
        expect(isDirty(draftOf(ended), ended)).toBe(false);
    });

    it('Compra: vale a carência de 14 dias; data escolhida no passado também', () => {
        const inGrace = row({ validUntil: '2026-10-01', graceUntil: '2026-10-15' });
        expect(termProblem({ ...draftOf(inGrace), state: 'ativo' }, inGrace, today)).toBeNull();
        const lapsed = row({ state: 'leitura', validUntil: '2026-09-01', graceUntil: '2026-09-15' });
        expect(termProblem({ ...draftOf(lapsed), state: 'ativo' }, lapsed, today)).toBe(
            'Prazo vencido: escolha um prazo novo.',
        );
        const old = {
            ...draftOf(lapsed),
            state: 'ativo' as const,
            term: { kind: 'date' as const, value: '2026-09-20' },
        };
        expect(termProblem(old, lapsed, today)).toBe('Data já vencida: escolha uma data futura.');
        const recent = { ...old, term: { kind: 'date' as const, value: '2026-10-01' } }; // +14 = 15/10
        expect(termProblem(recent, lapsed, today)).toBeNull();
        expect(termProblem({ ...old, state: 'leitura' }, lapsed, today)).toBeNull();
    });
});

describe('selos, registro e textos', () => {
    it('data a confirmar (ativo) e cortesia até …', () => {
        expect(accessBadges(row({ dateToConfirm: true, validUntil: null }))).toEqual(['data a confirmar']);
        expect(accessBadges(row({ state: 'leitura', dateToConfirm: true }))).toEqual([]);
        expect(accessBadges(row({ origin: 'cortesia', validUntil: '2027-01-10' }))).toEqual([
            'cortesia até 10/01/2027',
        ]);
        expect(accessBadges(row(), '2026-10-10')).toEqual([]);
        // carência: o prazo passou e ela ainda vale; antes do prazo ou depois dela, nada
        const grace = row({ origin: 'compra', validUntil: '2024-05-12', graceUntil: '2026-10-11' });
        expect(accessBadges(grace, '2026-10-10')).toEqual(['carência até 11/10/2026']);
        expect(accessBadges(grace, '2026-10-12')).toEqual([]);
        expect(accessBadges({ ...grace, validUntil: '2026-10-30' }, '2026-10-10')).toEqual([]);
        expect(accessBadges({ ...grace, state: 'leitura' }, '2026-10-10')).toEqual([]);
    });

    it('antes e depois de cada mudança', () => {
        expect(accessLabel(null)).toBe('Sem acesso');
        expect(accessLabel({ state: 'ativo', origin: 'cortesia', valid_until: '2027-01-10' })).toBe(
            'Ativo · Cortesia até 10/01/2027',
        );
        expect(accessLabel({ state: 'ativo', origin: 'compra', date_to_confirm: true })).toBe(
            'Ativo · Compra, data a confirmar',
        );
        expect(accessLabel({ state: 'leitura', origin: null })).toBe('Leitura · origem a confirmar');
        expect(accessLabel({ state: 'ativo', origin: 'vitalicio' })).toBe('Ativo · Vitalício');
    });

    it('quem mudou: nome, rotina/carga/compra, ou equipe', () => {
        const event = { id: 1, product: 'imerso' as const, at: '', reason: null, before: null, after: null };
        expect(actorLabel({ ...event, actor: 'uid-x', actorName: 'André Floriano' })).toBe('André Floriano');
        expect(actorLabel({ ...event, actor: 'carga', actorName: null })).toBe('Carga inicial');
        expect(actorLabel({ ...event, actor: 'rotina', actorName: null })).toBe('Rotina diária');
        expect(actorLabel({ ...event, actor: 'hook:herospark', actorName: null })).toBe('Compra (HeroSpark)');
        expect(actorLabel({ ...event, actor: 'uid-y', actorName: null })).toBe('Equipe');
    });

    it('data civil sem fuso; recusa do servidor com a frase dele', () => {
        expect(brDay('2027-08-07')).toBe('07/08/2027');
        expect(brDay(null)).toBe('—');
        expect(serverProblem({ response: { status: 400, data: { code: 'NO_TERM', message: 'Sem prazo.' } } })).toBe(
            'Sem prazo.',
        );
        expect(serverProblem({ response: { status: 403, data: {} } })).toBe('Sem permissão para esta ação.');
        expect(serverProblem(new Error('rede'))).toBe('Não foi possível gravar. Tente de novo.');
        expect(
            serverProblem({ response: { status: 409, data: { code: 'CLAIMS_TOO_LARGE', message: 'x' } } }),
        ).toContain('Não dá para ver como este aluno');
    });
});
