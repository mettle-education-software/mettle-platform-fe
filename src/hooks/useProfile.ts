import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { auth } from 'config/firebase';
import { Profile, ProfileField } from 'libs/profile';
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
                data: { userRecord: Profile[]; fbData: { photoURL?: string; phoneNumber?: string; email?: string } };
            }>('/me');
            const record = data.data.userRecord[0];
            if (!record || record.user_uid !== user?.uid) throw new Error('Perfil indisponível para esta sessão.');
            return {
                ...record,
                birth_date: record.birth_date?.slice(0, 10) ?? null,
                photoURL: data.data.fbData.photoURL ?? null,
                phone: record.phone ?? record.phone_number ?? data.data.fbData.phoneNumber,
                email: record.email ?? data.data.fbData.email,
            };
        },
        enabled: enabled && !!user?.uid,
        staleTime: 60_000,
    });
}

export function useSaveProfile() {
    const { user } = useAppContext();
    const client = useQueryClient();
    return useMutation({
        mutationFn: async ({ field, value }: { field: ProfileField; value: string }) => {
            if (!user?.uid) throw new Error('Sessão indisponível.');
            const { data } = await accountService.patch<Partial<Profile>, { data: Profile }>(
                `/${user.uid}/profile-data`,
                { [field]: value.trim() || null },
            );
            return { uid: user.uid, profile: { ...data.data, birth_date: data.data.birth_date?.slice(0, 10) ?? null } };
        },
        onMutate: () => client.cancelQueries({ queryKey: profileKey(user?.uid) }),
        onSuccess: ({ profile: data, uid }, { field }) => {
            client.setQueryData<Profile>(profileKey(uid), (previous) =>
                previous
                    ? {
                          ...previous,
                          [field]: data[field],
                          profile_updated_at: data.profile_updated_at,
                      }
                    : data,
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
