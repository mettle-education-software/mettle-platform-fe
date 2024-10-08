import { useMutation } from '@tanstack/react-query';
import { auth } from 'config/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useAppContext, useNotificationsContext } from 'providers';
import { accountService } from 'services';

export const useRecoverUnauthenticatedPassword = () => {
    const { showNotification } = useNotificationsContext();

    return useMutation({
        mutationFn: (emailAddress: string) => accountService.post('/passwords/v2/forgot', { email: emailAddress }),
        onSuccess: () => {
            showNotification(
                'success',
                'E-mail enviado!',
                'Caso sua conta exista, um e-mail foi enviado para você com instruções para recuperar a senha.',
            );
        },
    });
};

export const useResetUnauthenticatedPassword = () => {
    const { showNotification } = useNotificationsContext();

    return useMutation({
        mutationFn: (dto: { userUid: string; token: string; newPassword: string }) =>
            accountService.post('/passwords/v2/forgot/reset', dto),
        onSuccess: () => {
            showNotification('success', 'Senha atualizada!', 'Senha atualizada com sucesso.');
        },
        onError: () => {
            showNotification(
                'error',
                'Erro',
                'Parece que algo deu errado. Tente recuperar a senha mais uma vez ou tente novamente mais tarde',
            );
        },
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
            window.location.reload();
        },
        onError: () => {
            showNotification('error', 'Erro', 'Parece que algo deu errado. Tente novamente mais tarde');
        },
    });
};

export const useImpersonate = () => {
    const { showNotification } = useNotificationsContext();

    return useMutation({
        mutationFn: (userUid: string) => accountService.post(`/impersonate/add/${userUid}`),
        onSuccess: () => {
            showNotification('success', 'Usuário alterado!', 'Acessando como outro usuário.');
            window.location.reload();
        },
        onError: (error) => {
            showNotification('error', 'Erro', error.message || 'Algo deu errado');
        },
    });
};

export const useStopImpersonating = () => {
    const { showNotification } = useNotificationsContext();

    return useMutation({
        mutationFn: () => accountService.post('/impersonate/remove'),
        onSuccess: () => {
            showNotification('success', 'Usuário alterado!', 'Voltando ao seu usuário.');
            window.location.reload();
        },
    });
};
