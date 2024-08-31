import { useMutation } from '@tanstack/react-query';
import { auth } from 'config/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useAppContext, useNotificationsContext } from 'providers';
import { accountService } from 'services';

export const useRecoverUnauthenticatedPassword = () => {
    return useMutation({
        mutationFn: (emailAddress: string) => accountService.post('/passwords/v2/forgot', { email: emailAddress }),
    });
};

export const useResetUnauthenticatedPassword = () => {
    return useMutation({
        mutationFn: (dto: { userUid: string; token: string; newPassword: string }) =>
            accountService.post('/passwords/v2/forgot/reset', dto),
    });
};

export const useUpdatePassword = () => {
    const { user } = useAppContext();
    const userUid = user?.uid as string;
    const userEmail = user?.email as string;
    const { showNotification } = useNotificationsContext();

    return useMutation({
        mutationFn: (password: string) => accountService.post(`/users/${userUid}/password`, { password }),
        onSuccess: async (_, password) => {
            showNotification('success', 'Senha atualizada!', 'Senha atualizada com sucesso.');
            await signInWithEmailAndPassword(auth, userEmail, password);
        },
        onError: () => {
            showNotification('error', 'Erro', 'Parece que algo deu errado. Tente novamente mais tarde');
        },
    });
};
