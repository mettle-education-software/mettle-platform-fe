export const PROFILE_FIELDS = [
    { key: 'first_name', label: 'Nome', maxLength: 60 },
    { key: 'last_name', label: 'Sobrenome', maxLength: 60 },
    { key: 'username', label: '@username', maxLength: 20 },
    { key: 'instagram', label: 'Instagram', maxLength: 31 },
    { key: 'birth_date', label: 'Nascimento', maxLength: 10 },
    { key: 'city', label: 'Cidade', maxLength: 80 },
    { key: 'state', label: 'Estado', maxLength: 80 },
    { key: 'country', label: 'País', maxLength: 80 },
] as const;

export type ProfileField = (typeof PROFILE_FIELDS)[number]['key'];
export type Profile = Record<ProfileField, string | null> & {
    user_uid: string;
    email?: string;
    phone?: string | null;
    phone_number?: string | null;
    photoURL?: string | null;
    profile_updated_at?: string | null;
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

/** Mesmo recorte central usado na prévia com object-fit: cover. */
export function squareCrop(width: number, height: number, zoom = 1) {
    const side = Math.min(width, height) / Math.max(1, zoom);
    return { x: (width - side) / 2, y: (height - side) / 2, side };
}

export async function cropProfileImage(image: HTMLImageElement, zoom: number): Promise<File> {
    const crop = squareCrop(image.naturalWidth, image.naturalHeight, zoom);
    if (!crop.side) throw new Error('Foto inválida.');
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = Math.min(1024, Math.round(crop.side));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Não foi possível recortar a foto.');
    context.drawImage(image, crop.x, crop.y, crop.side, crop.side, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
            (result) => (result ? resolve(result) : reject(new Error('Não foi possível recortar a foto.'))),
            'image/jpeg',
            0.9,
        ),
    );
    return new File([blob], 'profile.jpg', { type: 'image/jpeg' });
}
