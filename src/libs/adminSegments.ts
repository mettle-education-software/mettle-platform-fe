// Painel de administração: lista de alunos por segmento (7-Out-2026; só o dono vê a escolha).
// Imerso e Masterclass vêm das roles do Firebase (servidor: /admin/v2/users?segment=). O e-book só existe no Worker
// mettle-events (compradores por e-mail): "E-book sem Imerso" = no_imerso do servidor ∩ e-mails dos compradores.

export type AdminSegment = 'imerso' | 'masterclass_no_imerso' | 'ebook_no_imerso';

export const ADMIN_SEGMENTS: { key: AdminSegment; label: string; server: string; ebook?: boolean }[] = [
    { key: 'imerso', label: 'Imerso', server: 'imerso' },
    { key: 'masterclass_no_imerso', label: 'Masterclass sem Imerso', server: 'masterclass_no_imerso' },
    { key: 'ebook_no_imerso', label: 'E-book sem Imerso', server: 'no_imerso', ebook: true },
];

export const EBOOK_BUYERS_URL = 'https://events.mettle.com.br/plataforma/admin/ebook-buyers';

const norm = (email?: string | null) => (email ?? '').trim().toLowerCase();

/** Só os usuários cujo e-mail está entre os compradores (comparação sem maiúsculas nem espaços). */
export const onlyBuyers = <T extends { email?: string | null }>(users: T[], buyers: readonly string[]) => {
    const set = new Set(buyers.map(norm));
    return users.filter((u) => set.has(norm(u.email)));
};
