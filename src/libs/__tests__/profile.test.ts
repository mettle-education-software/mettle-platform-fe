/** @jest-environment node */
import {
    fieldChanged,
    phoneDisplay,
    phoneE164,
    profileError,
    profilePatch,
    squareCrop,
    typePhone,
    validateProfileField,
    validateProfileImage,
} from '../profile';

const today = new Date('2026-10-09T12:00:00Z');

test.each(['first_name', 'last_name'] as const)('%s valida tamanho depois de trim', (field) => {
    expect(validateProfileField(field, '   ')).toBeDefined();
    expect(validateProfileField(field, 'a'.repeat(61))).toBeDefined();
    expect(validateProfileField(field, '  André da Silva  ')).toBeUndefined();
});

test.each([
    'ab',
    'Name',
    '@nome',
    'nome-novo',
    'nome com espaço',
    'a'.repeat(21),
    'admin',
    'mettle',
    'suporte',
    'moderador',
])('username inválido: %s', (value) => {
    expect(validateProfileField('username', value)).toBeDefined();
});

test.each(['ana.silva', 'a_b', 'nome123'])('username válido: %s', (value) => {
    expect(validateProfileField('username', value)).toBeUndefined();
});

test.each(['https://instagram.com/ana', '@', '.ana', 'ana.', 'a..b', 'a'.repeat(31)])(
    'Instagram inválido: %s',
    (value) => {
        expect(validateProfileField('instagram', value)).toBeDefined();
    },
);

test.each(['', '@ana.silva', 'ana_silva', 'Ana123'])('Instagram válido: %s', (value) => {
    expect(validateProfileField('instagram', value)).toBeUndefined();
});

test.each([
    ['2016-10-09', true],
    ['2016-10-10', false],
    ['1926-10-09', true],
    ['1925-10-10', true],
    ['1925-10-09', false],
    ['2026-10-10', false],
    ['2020-02-30', false],
    ['2010-02-29', false],
    ['2000-02-29', true],
    ['', true],
    ['10/09/2016', false],
])('idade/data %s válida=%s', (value, valid) => {
    expect(validateProfileField('birth_date', value, today) === undefined).toBe(valid);
});

test.each(['city', 'state', 'country'] as const)('%s pode ser apagado e aceita até 80 caracteres', (field) => {
    expect(validateProfileField(field, '')).toBeUndefined();
    expect(validateProfileField(field, 'x'.repeat(80))).toBeUndefined();
    expect(validateProfileField(field, 'x'.repeat(81))).toBeDefined();
});

test.each(['image/jpeg', 'image/png', 'image/webp'])('foto %s aceita até 5 MB', (type) => {
    expect(validateProfileImage({ type, size: 5 * 1024 * 1024 })).toBeUndefined();
    expect(validateProfileImage({ type, size: 5 * 1024 * 1024 + 1 })).toBeDefined();
    expect(validateProfileImage({ type, size: 0 })).toBeDefined();
});

test('rejeita formatos fora da lista', () => {
    expect(validateProfileImage({ type: 'image/gif', size: 100 })).toBeDefined();
    expect(validateProfileImage({ type: 'image/svg+xml', size: 100 })).toBeDefined();
});

test('recorte quadrado central corresponde à prévia, inclusive com zoom', () => {
    expect(squareCrop(1600, 900)).toEqual({ x: 350, y: 0, side: 900 });
    expect(squareCrop(900, 1600)).toEqual({ x: 0, y: 350, side: 900 });
    expect(squareCrop(1600, 900, 2)).toEqual({ x: 575, y: 225, side: 450 });
});

test('conserva mensagens claras do servidor (conflito e limite) e trata falhas de rede', () => {
    expect(profileError({ response: { data: { code: 'username_taken', message: 'Username indisponível.' } } })).toBe(
        'Username indisponível.',
    );
    expect(profileError({ response: { data: { code: 'username_cooldown', message: 'Aguarde 30 dias.' } } })).toBe(
        'Aguarde 30 dias.',
    );
    expect(profileError(new Error('Network error'))).toContain('Tente novamente');
    // rota ainda não publicada (404 do gateway, mensagem técnica em inglês): frase curta em português
    expect(profileError({ response: { status: 404, data: { message: 'Not Found: /accounts/x/profile-data' } } })).toBe(
        'Ainda não é possível salvar. Tente mais tarde.',
    );
    expect(profileError({ response: { status: 500, data: { message: 'Internal Server Error' } } })).toBe(
        'Não foi possível salvar. Tente novamente.',
    );
    expect(
        profileError({
            response: { status: 404, data: { code: 'profile_not_found', message: 'Perfil não encontrado.' } },
        }),
    ).toBe('Perfil não encontrado.');
});

test('valida aniversário no fuso de Brasília e rejeita caracteres de controle', () => {
    expect(validateProfileField('birth_date', '2016-10-10', new Date('2026-10-10T01:00:00Z'))).toBeDefined();
    expect(validateProfileField('first_name', '<André>')).toBeDefined();
    expect(validateProfileField('city', 'São\u200BPaulo')).toBeDefined();
});

describe('telefone (mundo todo; sem "+", Brasil)', () => {
    test('formata enquanto digita; apagar não traz a máscara de volta; colar formata', () => {
        expect(typePhone('11912345678', '1191234567')).toBe('(11) 91234-5678');
        expect(typePhone('+447911123456', '')).toBe('+44 7911 123456');
        expect(typePhone('(11) 91234-567', '(11) 91234-5678')).toBe('(11) 91234-567');
        expect(typePhone('+447911123456', '+55 11 91234 5678')).toBe('+44 7911 123456');
        // digitando no meio, o texto fica como está (o cursor não pula para o fim)
        expect(typePhone('(11) 991234-5678', '(11) 91234-5678', false)).toBe('(11) 991234-5678');
    });
    test('E.164 só de número válido; vazio é vazio; exibição internacional', () => {
        expect(phoneE164('(11) 91234-5678')).toBe('+5511912345678');
        expect(phoneE164('+1 212 555 0123')).toBe('+12125550123');
        expect(phoneE164('  ')).toBe('');
        expect(phoneE164('123')).toBeNull();
        expect(validateProfileField('phone', '123')).toContain('Telefone inválido');
        expect(validateProfileField('phone', '')).toBeUndefined();
        expect(validateProfileField('phone', '+351 912 345 678')).toBeUndefined();
        expect(phoneDisplay('+5511912345678')).toBe('+55 11 91234 5678');
        expect(phoneDisplay('não é número')).toBe('não é número');
        expect(phoneDisplay(null)).toBe('');
    });
    test('mesmo número em outro formato não é mudança; PATCH com E.164 e vazio como null', () => {
        expect(fieldChanged('phone', '+55 (11) 91234-5678', '+5511912345678')).toBe(false);
        expect(fieldChanged('phone', '(11) 91234-5679', '+5511912345678')).toBe(true);
        expect(fieldChanged('city', ' Lisboa ', 'Lisboa')).toBe(false);
        expect(profilePatch({ phone: '(11) 91234-5678', city: ' ', first_name: ' Ana ' })).toEqual({
            phone: '+5511912345678',
            city: null,
            first_name: 'Ana',
        });
    });
});
