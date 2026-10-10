import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { auth } from 'config/firebase';
import type { MyAccessRow } from 'libs/myProducts';
import { Profile, profilePatch, ProfileValues } from 'libs/profile';
import { useAppContext } from 'providers';
import { accountService } from 'services';

const profileKey = (uid?: string) => ['account-profile', uid];

/** Perfil e rodapé compartilham uma consulta por usuário. */
export function useProfile(enabled = true) {
    const { user } = useAppContext();
    return useQuery({
        queryKey: profileKey(user?.uid),
        queryFn: async () => {
            const { data } = await accountService.get<{
                data: {
                    userRecord: Profile[];
                    fbData: { photoURL?: string; phoneNumber?: string; email?: string };
                    accessDetails?: MyAccessRow[];
                };
            }>('/me');
            const record = data.data.userRecord[0];
            if (!record || record.user_uid !== user?.uid) throw new Error('Perfil indisponível para esta sessão.');
            return {
                ...record,
                birth_date: record.birth_date?.slice(0, 10) ?? null,
                photoURL: data.data.fbData.photoURL ?? null,
                phone: record.phone ?? record.phone_number ?? data.data.fbData.phoneNumber ?? null,
                email: record.email ?? data.data.fbData.email,
                // "Meus produtos": só do modelo de acesso (nunca do catálogo em cache)
                accessDetails: Array.isArray(data.data.accessDetails) ? data.data.accessDetails : null,
            };
        },
        enabled: enabled && !!user?.uid,
        staleTime: 60_000,
    });
}

/** Um PATCH com todos os campos alterados; o cache recebe o que o servidor devolveu (nomes já normalizados). */
export function useSaveProfile() {
    const { user } = useAppContext();
    const client = useQueryClient();
    return useMutation({
        mutationFn: async (changes: Partial<ProfileValues>) => {
            if (!user?.uid) throw new Error('Sessão indisponível.');
            const body = profilePatch(changes);
            const { data } = await accountService.patch<typeof body, { data: Profile }>(
                `/${user.uid}/profile-data`,
                body,
            );
            // o que o servidor não devolver vale como enviado (ex.: telefone, enquanto a resposta não o inclui)
            const saved = Object.fromEntries(
                Object.entries(body).map(([field, value]) => [
                    field,
                    field in data.data ? data.data[field as keyof Profile] : value,
                ]),
            ) as Partial<Profile>;
            if (saved.birth_date) saved.birth_date = saved.birth_date.slice(0, 10);
            return { uid: user.uid, saved, updatedAt: data.data.profile_updated_at ?? null };
        },
        onMutate: () => client.cancelQueries({ queryKey: profileKey(user?.uid) }),
        onSuccess: async ({ saved, updatedAt, uid }) => {
            // um GET em voo (começado durante o PATCH) não pode voltar depois e desfazer o "Salvo"
            await client.cancelQueries({ queryKey: profileKey(uid) });
            client.setQueryData<Profile>(profileKey(uid), (previous) =>
                previous ? { ...previous, ...saved, profile_updated_at: updatedAt } : previous,
            );
        },
    });
}

export function useSaveProfilePhoto() {
    const { user } = useAppContext();
    const client = useQueryClient();
    return useMutation({
        mutationFn: async (file: File) => {
            if (!user?.uid) throw new Error('Sessão indisponível.');
            const body = new FormData();
            body.append('profileImage', file);
            const { data } = await accountService.put<FormData, { photoURL: string }>(`/${user.uid}/profile`, body);
            return { photoURL: data.photoURL, uid: user.uid };
        },
        onMutate: () => client.cancelQueries({ queryKey: profileKey(user?.uid) }),
        onSuccess: async ({ photoURL, uid }) => {
            await client.cancelQueries({ queryKey: profileKey(uid) });
            client.setQueryData<Profile>(profileKey(uid), (previous) =>
                previous ? { ...previous, photoURL } : previous,
            );
            // O servidor atualiza o Firebase. Atualiza também o token usado no Chat/Comunidade.
            const current = auth.currentUser;
            if (current && current.uid === uid) {
                try {
                    await current.reload();
                    await current.getIdToken(true);
                } catch {
                    // Foto já salva; a próxima renovação do token recebe a imagem atualizada.
                }
            }
        },
    });
}
