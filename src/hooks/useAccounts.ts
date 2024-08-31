import { useMutation, useQuery } from '@tanstack/react-query';
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
