import { AsYouType, isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js/min';

/** Campos do perfil, na ordem da tela (duas colunas no computador); um formulário só, um Salvar. */
export const PROFILE_FIELDS = [
    { key: 'first_name', label: 'Nome', maxLength: 60 },
    { key: 'last_name', label: 'Sobrenome', maxLength: 60 },
    { key: 'username', label: '@username', maxLength: 20 },
    { key: 'instagram', label: 'Instagram', maxLength: 31 },
    { key: 'birth_date', label: 'Nascimento', maxLength: 10 },
    { key: 'phone', label: 'WhatsApp', maxLength: 25 },
    { key: 'city', label: 'Cidade', maxLength: 80 },
    { key: 'state', label: 'Estado', maxLength: 80 },
    { key: 'country', label: 'País', maxLength: 80 },
] as const;

export type ProfileField = (typeof PROFILE_FIELDS)[number]['key'];
export type Profile = Record<ProfileField, string | null> & {
    user_uid: string;
    email?: string;
    phone_number?: string | null;
    photoURL?: string | null;
    profile_updated_at?: string | null;
};
export type ProfileValues = Record<ProfileField, string>;

// ---------- telefone (alunos no mundo todo: sem "+", Brasil) ----------

export const PHONE_PLACEHOLDER = '+55 11 91234-5678';
export const PHONE_HINT = 'Com o código do país, se não for do Brasil.';
const country = (value: string) => (value.trim().startsWith('+') ? undefined : 'BR');

/** `a` sai de `b` só apagando caracteres (backspace, recorte). */
const erased = (a: string, b: string) => {
    let i = 0;
    for (const char of b) if (char === a[i]) i++;
    return a.length < b.length && i === a.length;
};

/**
 * Enquanto digita no fim (ou cola), o formato do país. Apagando, ou digitando no meio, o texto fica como está (a
 * máscara voltaria ou o cursor pularia para o fim).
 */
export const typePhone = (next: string, previous: string, atEnd = true) =>
    !atEnd || erased(next, previous) ? next : new AsYouType(country(next)).input(next);

/** E.164 (+5511912345678) de um número válido; '' se vazio; null se não é um telefone. */
export const phoneE164 = (raw: string): string | null => {
    const value = raw.trim();
    if (!value) return '';
    try {
        return isValidPhoneNumber(value, country(value)) ? parsePhoneNumber(value, country(value)).number : null;
    } catch {
        return null;
    }
};

/** Telefone salvo no formato internacional (+55 11 91234 5678); o que não é número aparece como veio. */
export const phoneDisplay = (saved?: string | null) => {
    if (!saved) return '';
    try {
        return parsePhoneNumber(saved, country(saved)).formatInternational();
    } catch {
        return saved;
    }
};

// ---------- valores do formulário ----------

/** O que cada campo mostra a partir do salvo (telefone formatado). */
export const fieldValue = (field: ProfileField, saved?: string | null) =>
    field === 'phone' ? phoneDisplay(saved) : (saved ?? '');

/** Forma comparável: o telefone pelo número (E.164), o resto sem espaços nas pontas. */
const comparable = (field: ProfileField, value: string) =>
    field === 'phone' ? (phoneE164(value) ?? value.trim()) : value.trim();

/** Mesmo valor (mesmo número em outro formato também é). */
export const sameValue = (field: ProfileField, a: string, b: string) => comparable(field, a) === comparable(field, b);

/** Campo mudou em relação ao salvo. */
export const fieldChanged = (field: ProfileField, value: string, saved?: string | null) =>
    !sameValue(field, value, fieldValue(field, saved));

/** Corpo do PATCH com só os campos alterados: vazio vira null; telefone em E.164. */
export const profilePatch = (changes: Partial<ProfileValues>) =>
    Object.fromEntries(
        Object.entries(changes).map(([field, value]) => [
            field,
            (field === 'phone' ? phoneE164(value ?? '') : (value ?? '').trim()) || null,
        ]),
    ) as Partial<Record<ProfileField, string | null>>;

/** Recusas do servidor que são do @username (a frase vai embaixo dele); a do servidor, ou esta. */
export const USERNAME_ERRORS: Record<string, string> = {
    username_taken: 'Este @username já está em uso.',
    username_reserved: 'Este @username é reservado.',
    username_cooldown: 'O @username foi trocado há pouco. Tente mais tarde.',
};
export const serverCode = (error: unknown) => {
    const code = (error as { response?: { data?: { code?: unknown } } })?.response?.data?.code;
    return typeof code === 'string' ? code : undefined;
};

const reserved = new Set([
    'admin',
    'administrator',
    'administrador',
    'mettle',
    'suporte',
    'support',
    'root',
    'system',
    'api',
    'www',
    'help',
    'contato',
    'moderator',
    'moderador',
]);

export function validateProfileField(field: ProfileField, raw: string, today = new Date()): string | undefined {
    const value = raw.trim();
    const length = [...value].length;
    if (field === 'first_name' || field === 'last_name') {
        if (!value || length > 60) return 'Use de 1 a 60 caracteres.';
        if (/[\p{Cc}\p{Cf}<>]/u.test(value)) return 'Informe um nome válido.';
    } else if (field === 'username') {
        if (!/^[a-z0-9._]{3,20}$/.test(value))
            return 'Use de 3 a 20 letras minúsculas, números, pontos ou sublinhados.';
        if (reserved.has(value)) return 'Este username é reservado.';
    } else if (field === 'instagram') {
        const handle = value.replace(/^@/, '');
        if (
            value &&
            (!/^[A-Za-z0-9._]{1,30}$/.test(handle) ||
                handle.startsWith('.') ||
                handle.endsWith('.') ||
                handle.includes('..'))
        )
            return 'Informe um @handle válido, sem URL.';
    } else if (field === 'phone') {
        if (phoneE164(value) === null) return 'Telefone inválido. Fora do Brasil, comece com + e o código do país.';
    } else if (field === 'birth_date' && value) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'Informe uma data válida.';
        const birth = new Date(`${value}T00:00:00Z`);
        if (Number.isNaN(birth.getTime()) || birth.toISOString().slice(0, 10) !== value)
            return 'Informe uma data válida.';
        const localToday = new Date(
            `${new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(today)}T00:00:00Z`,
        );
        let age = localToday.getUTCFullYear() - birth.getUTCFullYear();
        if (
            localToday.getUTCMonth() < birth.getUTCMonth() ||
            (localToday.getUTCMonth() === birth.getUTCMonth() && localToday.getUTCDate() < birth.getUTCDate())
        )
            age--;
        if (age < 10 || age > 100) return 'A idade deve estar entre 10 e 100 anos.';
    } else {
        if (length > 80) return 'Use até 80 caracteres.';
        if (/[\p{Cc}\p{Cf}]/u.test(value)) return 'Informe um local válido.';
    }
    return undefined;
}

export function validateProfileImage(file: Pick<File, 'type' | 'size'>): string | undefined {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return 'Escolha uma foto JPG, PNG ou WebP.';
    if (file.size > 5 * 1024 * 1024) return 'A foto deve ter no máximo 5 MB.';
    if (!file.size) return 'A foto está vazia.';
    return undefined;
}

/**
 * Frase do erro: a do servidor só quando é uma recusa nossa ({ code, message }, em português); rota ainda não publicada
 * (404 do gateway) e falhas de infraestrutura têm frase própria, curta.
 */
export function profileError(error: unknown): string {
    const response = (error as { response?: { status?: number; data?: { code?: unknown; message?: unknown } } })
        ?.response;
    const { code, message } = response?.data ?? {};
    if (typeof code === 'string' && typeof message === 'string') return message;
    if (response?.status === 404) return 'Ainda não é possível salvar. Tente mais tarde.';
    return 'Não foi possível salvar. Tente novamente.';
}

/** Área escolhida no recorte, em pixels da foto original (react-easy-crop, croppedAreaPixels). */
export type CropArea = { x: number; y: number; width: number; height: number };

/** Lado da foto final: o da área escolhida, no máximo 1024 px. */
export const cropSide = (area: CropArea) => Math.max(1, Math.min(1024, Math.round(area.width)));

/** Recorta a área escolhida (redonda na tela, quadrada no arquivo) em JPEG de até 1024 px. */
export async function cropProfileImage(source: string, area: CropArea): Promise<File> {
    const image = new Image();
    image.src = source;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = cropSide(area);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Não foi possível recortar a foto.');
    context.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
            (result) => (result ? resolve(result) : reject(new Error('Não foi possível recortar a foto.'))),
            'image/jpeg',
            0.9,
        ),
    );
    return new File([blob], 'profile.jpg', { type: 'image/jpeg' });
}
