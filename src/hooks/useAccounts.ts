import { useMutation } from '@tanstack/react-query';
import { accountService } from 'services';

export const useRecoverUnauthenticatedPassword = () => {
    return useMutation({
        mutationFn: (emailAddress: string) =>
            accountService.post('recover-unauthenticated-password', { email: emailAddress }),
    });
};
